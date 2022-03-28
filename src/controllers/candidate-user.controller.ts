import {authenticate} from '@loopback/authentication';
import {User} from '@loopback/authentication-jwt';
import {authorize} from '@loopback/authorization';
import {
  repository
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef, param
} from '@loopback/rest';
import {Candidate} from '../models';
import {CandidateRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
@authenticate('jwt')
export class CandidateUserController {
  constructor(
    @repository(CandidateRepository)
    public candidateRepository: CandidateRepository,
  ) { }

  @get('/candidates/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to Candidate',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(User)},
          },
        },
      },
    },
  })
  async getUser(
    @param.path.string('id') id: typeof Candidate.prototype.id,
  ): Promise<User> {
    return this.candidateRepository.user(id);
  }
}
