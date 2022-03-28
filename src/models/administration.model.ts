import {Entity, hasMany, model, property} from '@loopback/repository';
import {Sector} from './sector.model';
import {Candidate} from './candidate.model';

@model()
export class Administration extends Entity {
  @property({
    type: 'number',
    id: true,
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

  @hasMany(() => Sector)
  sectors: Sector[];

  @hasMany(() => Candidate)
  candidates: Candidate[];

  constructor(data?: Partial<Administration>) {
    super(data);
  }
}

export interface AdministrationRelations {
  // describe navigational properties here
}

export type AdministrationWithRelations = Administration & AdministrationRelations;
