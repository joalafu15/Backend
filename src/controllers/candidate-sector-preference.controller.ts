import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  Filter,
  repository
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  post,
  requestBody
} from '@loopback/rest';
import {
  Sector,
  SectorPreference
} from '../models';
import {CandidateRepository, SectorPreferenceRepository, SectorRepository, SettingRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';
import {CandidateController} from './candidate.controller';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
export class CandidateSectorPreferenceController {
  constructor(
    @repository(CandidateRepository) protected candidateRepository: CandidateRepository,
    @repository(SectorPreferenceRepository) protected sectorPreferenceRepository: SectorPreferenceRepository,
    @repository(SectorRepository) protected sectorRepository: SectorRepository,
    @repository(SettingRepository) protected settingRepository: SettingRepository,
    @inject('controllers.CandidateController') protected candidateController: CandidateController,
  ) { }

  /**
   * The following section is a workaround requested by Saad.
   *
   * This will be removed and migrated to its own table for versatility,
   * but at a later moment.
   */
  // TODO: Remove this workaround and its imports
  @get('/candidates/{id}/available-sectors', {
    responses: {
      '200': {
        description: 'Array of Sectors available for the Candidate associated Job Position',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Sector)},
          },
        },
      },
    },
  })
  async availableSectors(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Sector>,
  ): Promise<Sector[]> {
    const candidate = await this.candidateRepository.findById(id, {fields: ['jobPositionId']});
    if (!candidate) throw new HttpErrors.NotFound();
    const updatedFilter = {
      ...filter,
      where: {
        ...filter?.where,
        [`jobPosition_${candidate.jobPositionId}`]: true
      },
      fields: {
        ...filter?.fields,
        jobPosition_1: false,
        jobPosition_2: false,
        jobPosition_3: false,
        jobPosition_4: false,
      }
    };
    return this.sectorRepository.find(updatedFilter);
  }
  // End of workaround section

  @get('/candidates/{id}/sector-preferences', {
    responses: {
      '200': {
        description: 'Array of Candidate has many SectorPreference',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(SectorPreference)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<SectorPreference>,
  ): Promise<SectorPreference[]> {
    return this.candidateRepository.sectorPreferences(id).find(filter);
  }

  @post('/candidates/{id}/sector-preferences', {
    responses: {
      '200': {
        description: 'Array of Candidate has many SectorPreference',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(SectorPreference)},
          },
        },
      },
    },
  })
  async set(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'The input for candidate\'s sector preferences with the sector ids in order',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['choices'],
            properties: {
              choices: {
                type: 'array',
                itemType: 'number'
              }
            },
          },
        },
      },
    }) request: {choices: number[]},
  ): Promise<SectorPreference[]> {
    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id, {fields: ['submittedSectorPreferencesAt']});
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedSectorPreferencesAt) throw new HttpErrors.BadRequest("Candidate has already submitted their sector preferences");

    const preferences = await this.sectorPreferenceRepository.setPreferences(id, request.choices);
    if (preferences.length > 0) {
      await this.candidateController.markSectorPreferencesAsSubmitted(id);
      // Mark phase one as submitted after setting sector preferences
      await this.candidateController.markPhaseOneAsSubmitted(id);
    }
    return preferences;
  }
}
