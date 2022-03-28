import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
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
  param,
  patch,
  post,
  put,
  requestBody,
  response
} from '@loopback/rest';
import {InterviewLocation} from '../models';
import {InterviewLocationRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class InterviewLocationController {
  constructor(
    @repository(InterviewLocationRepository)
    public interviewLocationRepository: InterviewLocationRepository,
  ) { }

  @post('/interview-locations')
  @response(200, {
    description: 'InterviewLocation model instance',
    content: {'application/json': {schema: getModelSchemaRef(InterviewLocation)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InterviewLocation, {
            title: 'NewInterviewLocation',
            exclude: ['id'],
          }),
        },
      },
    })
    interviewLocation: Omit<InterviewLocation, 'id'>,
  ): Promise<InterviewLocation> {
    return this.interviewLocationRepository.create(interviewLocation);
  }

  @get('/interview-locations/count')
  @response(200, {
    description: 'InterviewLocation model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(InterviewLocation) where?: Where<InterviewLocation>,
  ): Promise<Count> {
    return this.interviewLocationRepository.count(where);
  }

  @authorize.skip()
  @get('/interview-locations')
  @response(200, {
    description: 'Array of InterviewLocation model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(InterviewLocation, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(InterviewLocation) filter?: Filter<InterviewLocation>,
  ): Promise<InterviewLocation[]> {
    return this.interviewLocationRepository.find(filter);
  }

  @patch('/interview-locations')
  @response(200, {
    description: 'InterviewLocation PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InterviewLocation, {partial: true}),
        },
      },
    })
    interviewLocation: InterviewLocation,
    @param.where(InterviewLocation) where?: Where<InterviewLocation>,
  ): Promise<Count> {
    return this.interviewLocationRepository.updateAll(interviewLocation, where);
  }

  @authorize.skip()
  @get('/interview-locations/{id}')
  @response(200, {
    description: 'InterviewLocation model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(InterviewLocation, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(InterviewLocation, {exclude: 'where'}) filter?: FilterExcludingWhere<InterviewLocation>
  ): Promise<InterviewLocation> {
    return this.interviewLocationRepository.findById(id, filter);
  }

  @patch('/interview-locations/{id}')
  @response(204, {
    description: 'InterviewLocation PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InterviewLocation, {partial: true}),
        },
      },
    })
    interviewLocation: InterviewLocation,
  ): Promise<void> {
    await this.interviewLocationRepository.updateById(id, interviewLocation);
  }

  @put('/interview-locations/{id}')
  @response(204, {
    description: 'InterviewLocation PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() interviewLocation: InterviewLocation,
  ): Promise<void> {
    await this.interviewLocationRepository.replaceById(id, interviewLocation);
  }

  @del('/interview-locations/{id}')
  @response(204, {
    description: 'InterviewLocation DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.interviewLocationRepository.deleteById(id);
  }
}
