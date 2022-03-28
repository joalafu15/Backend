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
  City,
  School
} from '../models';
import {CityRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class CitySchoolController {
  constructor(
    @repository(CityRepository) protected cityRepository: CityRepository,
  ) { }

  @authorize.skip()
  @get('/cities/{id}/schools', {
    responses: {
      '200': {
        description: 'Array of City has many School',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(School)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<School>,
  ): Promise<School[]> {
    return this.cityRepository.schools(id).find(filter);
  }

  @post('/cities/{id}/schools', {
    responses: {
      '200': {
        description: 'City model instance',
        content: {'application/json': {schema: getModelSchemaRef(School)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof City.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(School, {
            title: 'NewSchoolInCity',
            exclude: ['id'],
            optional: ['cityId']
          }),
        },
      },
    }) school: Omit<School, 'id'>,
  ): Promise<School> {
    return this.cityRepository.schools(id).create(school);
  }

  @patch('/cities/{id}/schools', {
    responses: {
      '200': {
        description: 'City.School PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(School, {partial: true}),
        },
      },
    })
    school: Partial<School>,
    @param.query.object('where', getWhereSchemaFor(School)) where?: Where<School>,
  ): Promise<Count> {
    return this.cityRepository.schools(id).patch(school, where);
  }

  @del('/cities/{id}/schools', {
    responses: {
      '200': {
        description: 'City.School DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(School)) where?: Where<School>,
  ): Promise<Count> {
    return this.cityRepository.schools(id).delete(where);
  }
}
