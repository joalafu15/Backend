import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  SchoolPreference,
  School,
} from '../models';
import {SchoolPreferenceRepository} from '../repositories';

export class SchoolPreferenceSchoolController {
  constructor(
    @repository(SchoolPreferenceRepository)
    public schoolPreferenceRepository: SchoolPreferenceRepository,
  ) { }

  @get('/school-preferences/{id}/school', {
    responses: {
      '200': {
        description: 'School belonging to SchoolPreference',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(School)},
          },
        },
      },
    },
  })
  async getSchool(
    @param.path.string('id') id: typeof SchoolPreference.prototype.id,
  ): Promise<School> {
    return this.schoolPreferenceRepository.school(id);
  }
}
