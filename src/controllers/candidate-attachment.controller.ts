import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  HttpErrors,
  oas,
  param,
  post,
  Request,
  requestBody,
  Response,
  RestBindings
} from '@loopback/rest';
import {unlink} from 'fs';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {
  Attachment, Candidate
} from '../models';
import {AttachmentRepository, CandidateRepository, SettingRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';
import {FileUploadHandler} from '../types';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
export class CandidateAttachmentController {
  constructor(
    @repository(CandidateRepository) public candidateRepository: CandidateRepository,
    @repository(AttachmentRepository) protected attachmentRepository: AttachmentRepository,
    @repository(SettingRepository) protected settingRepository: SettingRepository,
    @inject(FILE_UPLOAD_SERVICE) private fileHandler: FileUploadHandler,
  ) { }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @get('/candidates/{id}/attachments', {
    responses: {
      '200': {
        description: 'Array of Candidate has many Attachment',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Attachment)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Attachment>,
  ): Promise<Attachment[]> {
    return this.candidateRepository.attachments(id).find(filter);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @get('/candidates/{id}/attachments/{filename}')
  @oas.response.file()
  async download(
    @param.path.string('id') id: string,
    @param.path.string('filename') filename: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    const attachment = await this.attachmentRepository.findOne({where: {candidateId: id, filename}});
    if (!attachment) {
      throw new HttpErrors.BadRequest(`Invalid file name: ${filename}`);
    }
    response.download(attachment.path, attachment.filename);
    return response;
  }

  @post('/candidates/{id}/attachments/{type}', {
    responses: {
      '200': {
        description: 'Candidate model instance',
        content: {'application/json': {schema: getModelSchemaRef(Attachment)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Candidate.prototype.id,
    @param.path.string('type') type: typeof Attachment.prototype.type,
    @requestBody.file({required: true})
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Attachment> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();

    // Phase one files
    if (['national-id-card', 'degree-certificate', 'qiyas-score'].includes(type)) {
      const phaseOneLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase1');
      if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');
      if (candidate.submittedAttachmentsAt) throw new HttpErrors.BadRequest('Candidate has already submitted the attachments');
    }

    return new Promise<Attachment>((resolve, reject) => {
      this.fileHandler(request, response, async (err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        // TODO: validate `type` to assure the user will only upload the proper attachments types

        const uploadedFiles = request.files;

        // Validate file size
        const sizeFilter = (file: globalThis.Express.Multer.File) => {
          const fileIsInvalid = file.size === 0 || file.size > 10000000;
          if (fileIsInvalid) {
            unlink(file.path, () => null); // Remove unwanted files from storage
          }
          return fileIsInvalid;
        };
        if (Array.isArray(uploadedFiles) && uploadedFiles.find(sizeFilter)) {
          reject(new HttpErrors.BadRequest('File must not be empty and its size should not be greater than 10mb'));
          return;
        }

        // Validate file type
        const typeFilter = (file: globalThis.Express.Multer.File) => {
          const allowedFileTypes = type === 'contract'
            ? [
              'image/jpeg',
              'image/png',
              'image/tiff',
              'application/pdf',
              'application/zip',
              'application/vnd.rar',
              'application/x-7z-compressed',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ] : [
              'image/jpeg',
              'image/png',
              'image/tiff',
              'application/pdf',
            ];
          const fileIsInvalid = !allowedFileTypes.includes(file.mimetype);
          if (fileIsInvalid) {
            unlink(file.path, () => null); // Remove unwanted files from storage
          }
          return fileIsInvalid;
        };
        if (Array.isArray(uploadedFiles) && uploadedFiles.find(typeFilter)) {
          reject(new HttpErrors.BadRequest('File type sent is not accepted'));
          return;
        }

        type UploadedFile = {path: string, filename: string};
        const mapper = (f: globalThis.Express.Multer.File): UploadedFile => ({
          path: f.path,
          filename: f.originalname
        });

        let files: UploadedFile[] = [];
        if (Array.isArray(uploadedFiles)) {
          files = uploadedFiles.map(mapper);
        } else {
          for (const filename in uploadedFiles) {
            files.push(...uploadedFiles[filename].map(mapper));
          }
        }

        if (files.length != 1) reject(); // TODO: throw proper error when having no valid files to parse
        else {
          let attachment = await this.attachmentRepository.findOne({
            where: {
              type,
              candidateId: id
            }
          });
          if (!attachment) {
            attachment = await this.attachmentRepository.create({
              type,
              candidateId: id,
              ...files[0]
            });
          } else {
            unlink(attachment.path, () => null);
            attachment.path = files[0].path;
            attachment.filename = files[0].filename;
            await this.attachmentRepository.update(attachment);
          }
          if (type === 'contract') {
            candidate.contractDocumentId = attachment.id;
            candidate.contractValidated = undefined;
            candidate.contractValidatedAt = undefined;
            await this.candidateRepository.update(candidate);
          }
          resolve(attachment);
        }
      });
    });
  }

  @del('/candidates/{id}/attachments', {
    responses: {
      '200': {
        description: 'Candidate.Attachment DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Attachment)) where?: Where<Attachment>,
  ): Promise<Count> {
    return this.candidateRepository.attachments(id).delete(where);
  }
}
