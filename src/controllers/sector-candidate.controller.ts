import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Filter, repository} from '@loopback/repository';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {Candidate} from '../models';
import {SectorRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class SectorCandidateController {
  constructor(
    @repository(SectorRepository) protected sectorRepository: SectorRepository,
  ) { }

  @get('/sectors/{id}/candidates', {
    responses: {
      '200': {
        description: 'Array of Sector has many Candidate through SectorPreference',
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
    return this.sectorRepository.candidates(id).find(filter);
  }
}
