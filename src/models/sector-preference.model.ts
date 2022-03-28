import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Sector} from './sector.model';

@model()
export class SectorPreference extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuid'
  })
  id?: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      range: [1, 10],
      errorMessage: 'Choice must be between 1 and 10',
    },
  })
  choice: number;

  @belongsTo(() => Sector)
  sectorId?: number;

  @property({
    type: 'string',
  })
  candidateId?: string;

  constructor(data?: Partial<SectorPreference>) {
    super(data);
  }
}

export interface SectorPreferenceRelations {
  // describe navigational properties here
}

export type SectorPreferenceWithRelations = SectorPreference & SectorPreferenceRelations;
