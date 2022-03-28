import {Entity, model, property} from '@loopback/repository';

@model()
export class Setting extends Entity {
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
  setting: string;

  @property({
    type: 'string',
    required: true,
    mysql: {
      dataType: 'text',
    },
  })
  value: string;

  @property({
    type: 'boolean',
    required: true,
  })
  active: boolean;

  constructor(data?: Partial<Setting>) {
    super(data);
  }
}

export interface SettingRelations {
  // describe navigational properties here
}

export type SettingWithRelations = Setting & SettingRelations;
