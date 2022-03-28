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
  response,
  Response,
  RestBindings
} from '@loopback/rest';
import {unlink} from 'fs';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {JobPosition} from '../models';
import {JobPositionRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';
import {FileUploadHandler} from '../types';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class JobPositionController {
  constructor(
    @repository(JobPositionRepository)
    public jobPositionRepository: JobPositionRepository,
    @inject(FILE_UPLOAD_SERVICE) private fileHandler: FileUploadHandler,
  ) { }

  @post('/job-positions')
  @response(200, {
    description: 'JobPosition model instance',
    content: {'application/json': {schema: getModelSchemaRef(JobPosition)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(JobPosition, {
            title: 'NewJobPosition',
            exclude: ['id', 'createdAt', 'updatedAt'],
          }),
        },
      },
    })
    jobPosition: JobPosition,
  ): Promise<JobPosition> {
    return this.jobPositionRepository.create(jobPosition);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @get('/job-positions/count')
  @response(200, {
    description: 'JobPosition model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(JobPosition) where?: Where<JobPosition>,
  ): Promise<Count> {
    return this.jobPositionRepository.count(where);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @get('/job-positions')
  @response(200, {
    description: 'Array of JobPosition model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(JobPosition, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(JobPosition) filter?: Filter<JobPosition>,
  ): Promise<JobPosition[]> {
    return this.jobPositionRepository.find(filter);
  }

  @patch('/job-positions')
  @response(200, {
    description: 'JobPosition PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(JobPosition, {partial: true}),
        },
      },
    })
    jobPosition: JobPosition,
    @param.where(JobPosition) where?: Where<JobPosition>,
  ): Promise<Count> {
    return this.jobPositionRepository.updateAll(jobPosition, where);
  }

  @get('/job-positions/{id}')
  @response(200, {
    description: 'JobPosition model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(JobPosition, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(JobPosition, {exclude: 'where'}) filter?: FilterExcludingWhere<JobPosition>
  ): Promise<JobPosition> {
    return this.jobPositionRepository.findById(id, filter);
  }

  @patch('/job-positions/{id}')
  @response(204, {
    description: 'JobPosition PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(JobPosition, {partial: true}),
        },
      },
    })
    jobPosition: JobPosition,
  ): Promise<void> {
    await this.jobPositionRepository.updateById(id, jobPosition);
  }

  @put('/job-positions/{id}')
  @response(204, {
    description: 'JobPosition PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() jobPosition: JobPosition,
  ): Promise<void> {
    await this.jobPositionRepository.replaceById(id, jobPosition);
  }

  @del('/job-positions/{id}')
  @response(204, {
    description: 'JobPosition DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.jobPositionRepository.deleteById(id);
  }

  @authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
  @post('/job-positions/bulk-upload')
  @response(200, {
    description: 'Bulk upload job positions to be imported and updated',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            imported: {
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
          const imported = await this.jobPositionRepository.bulkImportFromFiles(files);
          resolve({imported});
        }
      });
    });
  }
}
