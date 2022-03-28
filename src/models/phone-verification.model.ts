import {Entity, model, property} from '@loopback/repository';

@model()
export class PhoneVerification extends Entity {
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
  sessionInfo: string;

  @property({
    type: 'string',
    required: true,
  })
  candidateId: string;


  constructor(data?: Partial<PhoneVerification>) {
    super(data);
  }
}

export interface PhoneVerificationRelations {
  // describe navigational properties here
}

export type PhoneVerificationWithRelations = PhoneVerification & PhoneVerificationRelations;
