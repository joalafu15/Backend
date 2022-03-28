import {Entity, model, property} from '@loopback/repository';

@model()
export class InterviewLocation extends Entity {
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
  name: string;

  @property({
    type: 'string',
  })
  name_en?: string;

  @property({
    type: 'string',
    required: true,
  })
  googleUrl: string;

  @property({
    type: 'string',
  })
  jobPositionId?: string;

  constructor(data?: Partial<InterviewLocation>) {
    super(data);
  }
}

export interface InterviewLocationRelations {
  // describe navigational properties here
}

export type InterviewLocationWithRelations = InterviewLocation & InterviewLocationRelations;
