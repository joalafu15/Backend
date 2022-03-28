import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
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
  param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {
  InterviewLocation, JobPosition
} from '../models';
import {JobPositionRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class JobPositionInterviewLocationController {
  constructor(
    @repository(JobPositionRepository) protected jobPositionRepository: JobPositionRepository,
  ) { }

  @authorize.skip()
  @get('/job-positions/{id}/interview-locations', {
    responses: {
      '200': {
        description: 'Array of JobPosition has many InterviewLocation',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(InterviewLocation)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<InterviewLocation>,
  ): Promise<InterviewLocation[]> {
    return this.jobPositionRepository.interviewLocations(id).find(filter);
  }

  @post('/job-positions/{id}/interview-locations', {
    responses: {
      '200': {
        description: 'JobPosition model instance',
        content: {'application/json': {schema: getModelSchemaRef(InterviewLocation)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof JobPosition.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InterviewLocation, {
            title: 'NewInterviewLocationInJobPosition',
            exclude: ['id'],
            optional: ['jobPositionId']
          }),
        },
      },
    }) interviewLocation: Omit<InterviewLocation, 'id'>,
  ): Promise<InterviewLocation> {
    return this.jobPositionRepository.interviewLocations(id).create(interviewLocation);
  }

  @patch('/job-positions/{id}/interview-locations', {
    responses: {
      '200': {
        description: 'JobPosition.InterviewLocation PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InterviewLocation, {partial: true}),
        },
      },
    })
    interviewLocation: Partial<InterviewLocation>,
    @param.query.object('where', getWhereSchemaFor(InterviewLocation)) where?: Where<InterviewLocation>,
  ): Promise<Count> {
    return this.jobPositionRepository.interviewLocations(id).patch(interviewLocation, where);
  }

  @del('/job-positions/{id}/interview-locations', {
    responses: {
      '200': {
        description: 'JobPosition.InterviewLocation DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(InterviewLocation)) where?: Where<InterviewLocation>,
  ): Promise<Count> {
    return this.jobPositionRepository.interviewLocations(id).delete(where);
  }
}
