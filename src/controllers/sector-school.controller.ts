import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Sector,
  School,
} from '../models';
import {SectorRepository} from '../repositories';

export class SectorSchoolController {
  constructor(
    @repository(SectorRepository) protected sectorRepository: SectorRepository,
  ) { }

  @get('/sectors/{id}/schools', {
    responses: {
      '200': {
        description: 'Array of Sector has many School',
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
    return this.sectorRepository.schools(id).find(filter);
  }

  @post('/sectors/{id}/schools', {
    responses: {
      '200': {
        description: 'Sector model instance',
        content: {'application/json': {schema: getModelSchemaRef(School)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Sector.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(School, {
            title: 'NewSchoolInSector',
            exclude: ['id'],
            optional: ['sectorId']
          }),
        },
      },
    }) school: Omit<School, 'id'>,
  ): Promise<School> {
    return this.sectorRepository.schools(id).create(school);
  }

  @patch('/sectors/{id}/schools', {
    responses: {
      '200': {
        description: 'Sector.School PATCH success count',
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
    return this.sectorRepository.schools(id).patch(school, where);
  }

  @del('/sectors/{id}/schools', {
    responses: {
      '200': {
        description: 'Sector.School DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(School)) where?: Where<School>,
  ): Promise<Count> {
    return this.sectorRepository.schools(id).delete(where);
  }
}
