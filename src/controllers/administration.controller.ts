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
import {Administration} from '../models';
import {AdministrationRepository} from '../repositories';
import {basicAuthorization, ROLES} from '../services';

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class AdministrationController {
  constructor(
    @repository(AdministrationRepository)
    public administrationRepository: AdministrationRepository,
  ) { }

  @post('/administrations')
  @response(200, {
    description: 'Administration model instance',
    content: {'application/json': {schema: getModelSchemaRef(Administration)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Administration, {
            title: 'NewAdministration',
            exclude: ['id'],
          }),
        },
      },
    })
    administration: Omit<Administration, 'id'>,
  ): Promise<Administration> {
    return this.administrationRepository.create(administration);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @get('/administrations/count')
  @response(200, {
    description: 'Administration model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Administration) where?: Where<Administration>,
  ): Promise<Count> {
    return this.administrationRepository.count(where);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @get('/administrations')
  @response(200, {
    description: 'Array of Administration model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Administration, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Administration) filter?: Filter<Administration>,
  ): Promise<Administration[]> {
    return this.administrationRepository.find(filter);
  }

  @patch('/administrations')
  @response(200, {
    description: 'Administration PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Administration, {partial: true}),
        },
      },
    })
    administration: Administration,
    @param.where(Administration) where?: Where<Administration>,
  ): Promise<Count> {
    return this.administrationRepository.updateAll(administration, where);
  }

  @get('/administrations/{id}')
  @response(200, {
    description: 'Administration model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Administration, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Administration, {exclude: 'where'}) filter?: FilterExcludingWhere<Administration>
  ): Promise<Administration> {
    return this.administrationRepository.findById(id, filter);
  }

  @patch('/administrations/{id}')
  @response(204, {
    description: 'Administration PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Administration, {partial: true}),
        },
      },
    })
    administration: Administration,
  ): Promise<void> {
    await this.administrationRepository.updateById(id, administration);
  }

  @put('/administrations/{id}')
  @response(204, {
    description: 'Administration PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() administration: Administration,
  ): Promise<void> {
    await this.administrationRepository.replaceById(id, administration);
  }

  @del('/administrations/{id}')
  @response(204, {
    description: 'Administration DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.administrationRepository.deleteById(id);
  }
}
