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
  get,
  getModelSchemaRef,
  param,
  response
} from '@loopback/rest';
import {
  Candidate
} from '../models';
import {AdministrationRepository, CandidateRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN, ROLES.COMMITTEE], voters: [basicAuthorization]})
export class AdministrationCandidateController {
  constructor(
    @repository(AdministrationRepository) protected administrationRepository: AdministrationRepository,
    @repository(CandidateRepository) protected candidateRepository: CandidateRepository,
  ) { }

  @get('/administrations/{id}/candidates', {
    responses: {
      '200': {
        description: 'Array of Administration has many Candidate',
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
    return this.administrationRepository.candidates(id).find(filter);
  }

  @get('/administrations/{id}/candidates/count')
  @response(200, {
    description: 'Administration.Candidate Count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.path.number('id') id: number,
    @param.where(Candidate) where?: Where<Candidate>,
  ): Promise<Count> {
    return this.candidateRepository.count({
      ...where,
      administrationId: id,
    });
  }
}
