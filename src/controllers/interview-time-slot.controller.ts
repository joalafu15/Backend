import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  Request,
  requestBody,
  Response,
  response,
  RestBindings
} from '@loopback/rest';
import {unlink} from 'fs';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {InterviewTimeSlot} from '../models';
import {InterviewTimeSlotRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';
import {FileUploadHandler} from '../types';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class InterviewTimeSlotController {
  constructor(
    @repository(InterviewTimeSlotRepository)
    public interviewTimeSlotRepository: InterviewTimeSlotRepository,
    @inject(FILE_UPLOAD_SERVICE) private fileHandler: FileUploadHandler,
  ) { }

  @post('/interview-time-slots')
  @response(200, {
    description: 'InterviewTimeSlot model instance',
    content: {'application/json': {schema: getModelSchemaRef(InterviewTimeSlot)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InterviewTimeSlot, {
            title: 'NewInterviewTimeSlot',
            exclude: ['id'],
          }),
        },
      },
    })
    interviewTimeSlot: Omit<InterviewTimeSlot, 'id'>,
  ): Promise<InterviewTimeSlot> {
    return this.interviewTimeSlotRepository.create(interviewTimeSlot);
  }

  @get('/interview-time-slots/count')
  @response(200, {
    description: 'InterviewTimeSlot model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(InterviewTimeSlot) where?: Where<InterviewTimeSlot>,
  ): Promise<Count> {
    return this.interviewTimeSlotRepository.count(where);
  }

  @get('/interview-time-slots')
  @response(200, {
    description: 'Array of InterviewTimeSlot model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(InterviewTimeSlot, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(InterviewTimeSlot) filter?: Filter<InterviewTimeSlot>,
  ): Promise<InterviewTimeSlot[]> {
    return this.interviewTimeSlotRepository.find(filter);
  }

  @patch('/interview-time-slots')
  @response(200, {
    description: 'InterviewTimeSlot PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InterviewTimeSlot, {partial: true}),
        },
      },
    })
    interviewTimeSlot: InterviewTimeSlot,
    @param.where(InterviewTimeSlot) where?: Where<InterviewTimeSlot>,
  ): Promise<Count> {
    return this.interviewTimeSlotRepository.updateAll(interviewTimeSlot, where);
  }

  @get('/interview-time-slots/{id}')
  @response(200, {
    description: 'InterviewTimeSlot model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(InterviewTimeSlot, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(InterviewTimeSlot, {exclude: 'where'}) filter?: FilterExcludingWhere<InterviewTimeSlot>
  ): Promise<InterviewTimeSlot> {
    return this.interviewTimeSlotRepository.findById(id, filter);
  }

  @patch('/interview-time-slots/{id}')
  @response(204, {
    description: 'InterviewTimeSlot PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InterviewTimeSlot, {partial: true}),
        },
      },
    })
    interviewTimeSlot: InterviewTimeSlot,
  ): Promise<void> {
    await this.interviewTimeSlotRepository.updateById(id, interviewTimeSlot);
  }

  @put('/interview-time-slots/{id}')
  @response(204, {
    description: 'InterviewTimeSlot PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() interviewTimeSlot: InterviewTimeSlot,
  ): Promise<void> {
    await this.interviewTimeSlotRepository.replaceById(id, interviewTimeSlot);
  }

  @del('/interview-time-slots/{id}')
  @response(204, {
    description: 'InterviewTimeSlot DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.interviewTimeSlotRepository.deleteById(id);
  }

  @post('/interview-time-slots/bulk-upload')
  @response(200, {
    description: 'Bulk upload time slots to be imported',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: "number",
            },
            failures: {
              type: "number",
            },
          },
        },
      },
    },
  })
  async bulkUpload(
    @requestBody.file()
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.fileHandler(request, response, async (err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        const uploadedFiles = request.files;

        const filter = (f: globalThis.Express.Multer.File) => {
          // Parse only these file mime-types
          if ([
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ].includes(f.mimetype)) {
            return true;
          }
          // Remove the rejected file
          unlink(f.path, () => null);
          return false;
        }
        const mapper = (f: globalThis.Express.Multer.File) => f.path;

        let files: string[] = [];
        if (Array.isArray(uploadedFiles)) {
          files = uploadedFiles.filter(filter).map(mapper);
        } else {
          for (const filename in uploadedFiles) {
            files.push(...uploadedFiles[filename].filter(filter).map(mapper));
          }
        }
        if (files.length === 0) reject(new HttpErrors.BadRequest('Invalid file'));
        else {
          const imported = await this.interviewTimeSlotRepository.bulkImportFromFiles(files);
          resolve(imported);
        }
      });
    });
  }
}
