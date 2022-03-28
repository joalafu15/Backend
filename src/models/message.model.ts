import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Candidate} from './candidate.model';

@model()
export class Message extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuid'
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
    required: true,
  })
  message: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  viewedAt?: string;

  @belongsTo(() => Candidate)
  candidateId: string;

  constructor(data?: Partial<Message>) {
    super(data);
  }
}

export interface MessageRelations {
  // describe navigational properties here
}

export type MessageWithRelations = Message & MessageRelations;
