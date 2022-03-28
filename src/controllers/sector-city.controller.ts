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
  City, Sector
} from '../models';
import {SectorRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class SectorCityController {
  constructor(
    @repository(SectorRepository) protected sectorRepository: SectorRepository,
  ) { }

  @authorize.skip()
  @get('/sectors/{id}/cities', {
    responses: {
      '200': {
        description: 'Array of Sector has many City',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(City)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<City>,
  ): Promise<City[]> {
    return this.sectorRepository.cities(id).find(filter);
  }

  @post('/sectors/{id}/cities', {
    responses: {
      '200': {
        description: 'Sector model instance',
        content: {'application/json': {schema: getModelSchemaRef(City)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Sector.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(City, {
            title: 'NewCityInSector',
            exclude: ['id'],
            optional: ['sectorId']
          }),
        },
      },
    }) city: Omit<City, 'id'>,
  ): Promise<City> {
    return this.sectorRepository.cities(id).create(city);
  }

  @patch('/sectors/{id}/cities', {
    responses: {
      '200': {
        description: 'Sector.City PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(City, {partial: true}),
        },
      },
    })
    city: Partial<City>,
    @param.query.object('where', getWhereSchemaFor(City)) where?: Where<City>,
  ): Promise<Count> {
    return this.sectorRepository.cities(id).patch(city, where);
  }

  @del('/sectors/{id}/cities', {
    responses: {
      '200': {
        description: 'Sector.City DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(City)) where?: Where<City>,
  ): Promise<Count> {
    return this.sectorRepository.cities(id).delete(where);
  }
}
