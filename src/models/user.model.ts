import {Entity, hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from './user-credentials.model';

@model()
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuid'
  })
  id: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
    index: {
      unique: true,
    },
  })
  username?: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  email: string;

  @property({
    type: 'string',
    index: {
      unique: true,
    },
  })
  resetKey: string;

  @property({
    type: 'date',
  })
  resetTimestamp: string;

  @property({
    type: 'number',
  })
  resetCount: number;

  @hasOne(() => UserCredentials)
  userCredentials: UserCredentials;

  @property({
    type: 'array',
    itemType: 'string',
  })
  roles?: string[];

  @property({
    type: 'number',
  })
  administrationId?: number;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
