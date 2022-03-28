import {Entity, model, property, belongsTo} from '@loopback/repository';
import {School} from './school.model';

@model()
export class SchoolPreference extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuid',
  })
  id?: string;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      minLength: 1,
      errorMessage: 'Choice must be bigger than 1',
    },
  })
  choice: number;


  @property({
    type: 'string',
  })
  candidateId?: string;

  @belongsTo(() => School)
  schoolId: number;

  constructor(data?: Partial<SchoolPreference>) {
    super(data);
  }
}

export interface SchoolPreferenceRelations {
  // describe navigational properties here
}

export type SchoolPreferenceWithRelations = SchoolPreference &
  SchoolPreferenceRelations;
