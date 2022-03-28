import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response
} from '@loopback/rest';
import {Sector} from '../models';
import {SectorRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class SectorController {
  constructor(
    @repository(SectorRepository)
    public sectorRepository: SectorRepository,
  ) { }

  @post('/sectors')
  @response(200, {
    description: 'Sector model instance',
    content: {'application/json': {schema: getModelSchemaRef(Sector)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Sector, {
            title: 'NewSector',
            exclude: ['id'],
          }),
        },
      },
    })
    sector: Omit<Sector, 'id'>,
  ): Promise<Sector> {
    return this.sectorRepository.create(sector);
  }

  @get('/sectors/count')
  @response(200, {
    description: 'Sector model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Sector) where?: Where<Sector>,
  ): Promise<Count> {
    return this.sectorRepository.count(where);
  }

  @authorize.skip()
  @get('/sectors')
  @response(200, {
    description: 'Array of Sector model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Sector, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Sector) filter?: Filter<Sector>,
  ): Promise<Sector[]> {
    return this.sectorRepository.find(filter);
  }

  @patch('/sectors')
  @response(200, {
    description: 'Sector PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Sector, {partial: true}),
        },
      },
    })
    sector: Sector,
    @param.where(Sector) where?: Where<Sector>,
  ): Promise<Count> {
    return this.sectorRepository.updateAll(sector, where);
  }

  @authorize.skip()
  @get('/sectors/{id}')
  @response(200, {
    description: 'Sector model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Sector, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Sector, {exclude: 'where'}) filter?: FilterExcludingWhere<Sector>
  ): Promise<Sector> {
    return this.sectorRepository.findById(id, filter);
  }

  @patch('/sectors/{id}')
  @response(204, {
    description: 'Sector PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Sector, {partial: true}),
        },
      },
    })
    sector: Sector,
  ): Promise<void> {
    await this.sectorRepository.updateById(id, sector);
  }

  @put('/sectors/{id}')
  @response(204, {
    description: 'Sector PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() sector: Sector,
  ): Promise<void> {
    await this.sectorRepository.replaceById(id, sector);
  }

  @del('/sectors/{id}')
  @response(204, {
    description: 'Sector DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.sectorRepository.deleteById(id);
  }
}
