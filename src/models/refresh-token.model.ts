import {belongsTo, Entity, model, property} from '@loopback/repository';
import {User} from './user.model';

@model()
export class RefreshToken extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuid',
  })
  id: string;

  @belongsTo(() => User)
  userId: string;

  @property({
    type: 'string',
    required: true,
  })
  refreshToken: string;

  constructor(data?: Partial<RefreshToken>) {
    super(data);
  }
}

export interface RefreshTokenRelations {
  // describe navigational properties here
}

export type RefereshTokenWithRelations = RefreshToken & RefreshTokenRelations;
