import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {
  repository
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef, param
} from '@loopback/rest';
import {JobPositionWithFlags} from '../interfaces';
import {
  Candidate,
  JobPosition
} from '../models';
import {CandidateRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN, ROLES.CANDIDATE], voters: [basicAuthorization]})
export class CandidateJobPositionController {
  constructor(
    @repository(CandidateRepository)
    public candidateRepository: CandidateRepository,
  ) { }

  @get('/candidates/{id}/job-position', {
    responses: {
      '200': {
        description: 'JobPosition belonging to Candidate',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(JobPosition)},
          },
        },
      },
    },
  })
  async getJobPosition(
    @param.path.string('id') id: typeof Candidate.prototype.id,
  ): Promise<JobPositionWithFlags> {
    const candidateWithJob = await this.candidateRepository.findById(id, {include: ['jobPosition']});
    const jobPositionWithFlags: JobPositionWithFlags = {
      ...candidateWithJob.jobPosition,
      jobTermsAccepted: candidateWithJob.jobTermsAccepted,
      jobOfferAccepted: candidateWithJob.jobOfferAccepted
    }
    return jobPositionWithFlags;
  }
}
