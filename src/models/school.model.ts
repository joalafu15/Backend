import {Entity, model, property} from '@loopback/repository';

@model()
export class School extends Entity {
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
  cityId?: number;

  @property({
    type: 'boolean',
    default: null,
  })
  jobPosition_1?: boolean;

  @property({
    type: 'boolean',
    default: null,
  })
  jobPosition_2?: boolean;

  @property({
    type: 'boolean',
    default: null,
  })
  jobPosition_3?: boolean;

  @property({
    type: 'boolean',
    default: null,
  })
  jobPosition_4?: boolean;

  @property({
    type: 'number',
  })
  sectorId?: number;

  @property({
    type: 'string',
  })
  schoolManagerName?: string;

  @property({
    type: 'string',
  })
  schoolManagerNationalIdNumber?: string;

  @property({
    type: 'string',
  })
  schoolManagerPhoneNumber?: string;

  @property({
    type: 'string',
  })
  schoolManagerEmail?: string;

  constructor(data?: Partial<School>) {
    super(data);
  }
}

export interface SchoolRelations {
  // describe navigational properties here
}

export type SchoolWithRelations = School & SchoolRelations;
