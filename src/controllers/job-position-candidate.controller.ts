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
  Candidate, JobPosition
} from '../models';
import {JobPositionRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class JobPositionCandidateController {
  constructor(
    @repository(JobPositionRepository) protected jobPositionRepository: JobPositionRepository,
  ) { }

  @get('/job-positions/{id}/candidates', {
    responses: {
      '200': {
        description: 'Array of JobPosition has many Candidate',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Candidate)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Candidate>,
  ): Promise<Candidate[]> {
    return this.jobPositionRepository.candidates(id).find(filter);
  }

  @post('/job-positions/{id}/candidates', {
    responses: {
      '200': {
        description: 'JobPosition model instance',
        content: {'application/json': {schema: getModelSchemaRef(Candidate)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof JobPosition.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Candidate, {
            title: 'NewCandidateInJobPosition',
            exclude: ['id'],
            optional: ['jobPositionId']
          }),
        },
      },
    }) candidate: Omit<Candidate, 'id'>,
  ): Promise<Candidate> {
    return this.jobPositionRepository.candidates(id).create(candidate);
  }

  @patch('/job-positions/{id}/candidates', {
    responses: {
      '200': {
        description: 'JobPosition.Candidate PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Candidate, {partial: true}),
        },
      },
    })
    candidate: Partial<Candidate>,
    @param.query.object('where', getWhereSchemaFor(Candidate)) where?: Where<Candidate>,
  ): Promise<Count> {
    return this.jobPositionRepository.candidates(id).patch(candidate, where);
  }

  @del('/job-positions/{id}/candidates', {
    responses: {
      '200': {
        description: 'JobPosition.Candidate DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Candidate)) where?: Where<Candidate>,
  ): Promise<Count> {
    return this.jobPositionRepository.candidates(id).delete(where);
  }
}
