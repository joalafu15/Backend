import {Entity, model, property, hasMany} from '@loopback/repository';
import {School} from './school.model';

@model()
export class City extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
  })
  name_en?: string;

  @property({
    type: 'number',
  })
  sectorId?: number;

  @hasMany(() => School)
  schools: School[];

  constructor(data?: Partial<City>) {
    super(data);
  }
}

export interface CityRelations {
  // describe navigational properties here
}

export type CityWithRelations = City & CityRelations;
