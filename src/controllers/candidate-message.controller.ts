import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {
  Filter,
  repository
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param
} from '@loopback/rest';
import {Message} from '../models';
import {CandidateRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN, ROLES.CANDIDATE], voters: [basicAuthorization]})
export class CandidateMessageController {
  constructor(
    @repository(CandidateRepository) protected candidateRepository: CandidateRepository,
  ) { }

  @get('/candidates/{id}/messages', {
    responses: {
      '200': {
        description: 'Array of Candidate has many Message',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Message)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Message>,
  ): Promise<Message[]> {
    return this.candidateRepository.messages(id).find(filter);
  }
}
