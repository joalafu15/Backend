import {Entity, hasMany, model, property} from '@loopback/repository';
import {Candidate} from './candidate.model';
import {City} from './city.model';
import {SectorPreference} from './sector-preference.model';
import {School} from './school.model';

@model()
export class Sector extends Entity {
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

  @hasMany(() => City)
  cities: City[];

  @property({
    type: 'number',
  })
  administrationId?: number;

  /**
   * The following section is a workaround requested by Saad.
   *
   * This will be removed and migrated to its own table for versatility,
   * but at a later moment.
   */
  // TODO: Remove this workaround and restore the database seed to the pre-workaround version
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

  // End of workaround section
  @hasMany(() => School)
  schools: School[];
  @hasMany(() => Candidate, {through: {model: () => SectorPreference}})
  candidates: Candidate[];

  constructor(data?: Partial<Sector>) {
    super(data);
  }
}

export interface SectorRelations {
  // describe navigational properties here
}

export type SectorWithRelations = Sector & SectorRelations;
