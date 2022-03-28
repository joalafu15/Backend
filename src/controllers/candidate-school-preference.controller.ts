import {inject} from '@loopback/core';
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
  getModelSchemaRef, getWhereSchemaFor, HttpErrors, param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {
  School,
  SchoolPreference
} from '../models';
import {CandidateRepository, SchoolPreferenceRepository, SchoolRepository, SettingRepository} from '../repositories';
import {CandidateController} from './candidate.controller';

export class CandidateSchoolPreferenceController {
  constructor(
    @repository(CandidateRepository) protected candidateRepository: CandidateRepository,
    @repository(SchoolRepository) protected schoolRepository: SchoolRepository,
    @repository(SettingRepository) protected settingRepository: SettingRepository,
    @repository(SchoolPreferenceRepository) protected schoolPreferenceRepository: SchoolPreferenceRepository,
    @inject('controllers.CandidateController') protected candidateController: CandidateController,
  ) { }

  @get('/candidates/{id}/available-schools', {
    responses: {
      '200': {
        description: 'Array of Schools available for the Candidate associated Job Position',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(School)},
          },
        },
      },
    },
  })
  async availableSchools(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<School>,
  ): Promise<School[]> {
    const candidate = await this.candidateRepository.findById(id, {fields: ['jobPositionId']});
    if (!candidate) throw new HttpErrors.NotFound();
    const updatedFilter = {
      ...filter,
      where: {
        ...filter?.where,
        [`jobPosition_${candidate.jobPositionId}`]: true,
        [`sectorId`]: candidate.qualifiedSectorId,
      },
      fields: {
        ...filter?.fields,
        jobPosition_1: false,
        jobPosition_2: false,
        jobPosition_3: false,
        jobPosition_4: false,
      }
    };
    return this.schoolRepository.find(updatedFilter);
  }

  @get('/candidates/{id}/school-preferences', {
    responses: {
      '200': {
        description: 'Array of Candidate has many SchoolPreference',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(SchoolPreference)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<SchoolPreference>,
  ): Promise<SchoolPreference[]> {
    return this.candidateRepository.schoolPreferences(id).find(filter);
  }

  @post('candidates/{id}/school-preferences', {
    responses: {
      '200': {
        description: 'Array of Candidate has many SchoolPreferences',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(SchoolPreference)},
          },
        },
      },
    },
  })
  async set(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'The input for candidate\'s school preferences with the sector ids in order',
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
  ): Promise<SchoolPreference[]> {
    const phaseThreeLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase3');
    if (phaseThreeLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id, {fields: ['submittedSchoolPreferenceAt']});
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedSchoolPreferenceAt) throw new HttpErrors.BadRequest("Candidate has already submitted their school preferences");

    const preferences = await this.schoolPreferenceRepository.setPreferences(id, request.choices);
    if (preferences.length > 0) {
      await this.candidateController.markSchoolPreferencesAsSubmitted(id);
    }
    return preferences;
  }


  @patch('/candidates/{id}/school-preferences', {
    responses: {
      '200': {
        description: 'Candidate.SchoolPreference PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SchoolPreference, {partial: true}),
        },
      },
    })
    schoolPreference: Partial<SchoolPreference>,
    @param.query.object('where', getWhereSchemaFor(SchoolPreference)) where?: Where<SchoolPreference>,
  ): Promise<Count> {
    return this.candidateRepository.schoolPreferences(id).patch(schoolPreference, where);
  }

  @del('/candidates/{id}/school-preferences', {
    responses: {
      '200': {
        description: 'Candidate.SchoolPreference DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(SchoolPreference)) where?: Where<SchoolPreference>,
  ): Promise<Count> {
    return this.candidateRepository.schoolPreferences(id).delete(where);
  }
}
