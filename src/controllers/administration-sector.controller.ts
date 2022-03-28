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
  Administration,
  Sector
} from '../models';
import {AdministrationRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class AdministrationSectorController {
  constructor(
    @repository(AdministrationRepository) protected administrationRepository: AdministrationRepository,
  ) { }

  @get('/administrations/{id}/sectors', {
    responses: {
      '200': {
        description: 'Array of Administration has many Sector',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Sector)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Sector>,
  ): Promise<Sector[]> {
    return this.administrationRepository.sectors(id).find(filter);
  }

  @post('/administrations/{id}/sectors', {
    responses: {
      '200': {
        description: 'Administration model instance',
        content: {'application/json': {schema: getModelSchemaRef(Sector)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Administration.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Sector, {
            title: 'NewSectorInAdministration',
            exclude: ['id'],
            optional: ['administrationId']
          }),
        },
      },
    }) sector: Omit<Sector, 'id'>,
  ): Promise<Sector> {
    return this.administrationRepository.sectors(id).create(sector);
  }

  @patch('/administrations/{id}/sectors', {
    responses: {
      '200': {
        description: 'Administration.Sector PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Sector, {partial: true}),
        },
      },
    })
    sector: Partial<Sector>,
    @param.query.object('where', getWhereSchemaFor(Sector)) where?: Where<Sector>,
  ): Promise<Count> {
    return this.administrationRepository.sectors(id).patch(sector, where);
  }

  @del('/administrations/{id}/sectors', {
    responses: {
      '200': {
        description: 'Administration.Sector DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Sector)) where?: Where<Sector>,
  ): Promise<Count> {
    return this.administrationRepository.sectors(id).delete(where);
  }
}
