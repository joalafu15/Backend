import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    hiddenProperties: ["path"]
  }
})
export class Attachment extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuid'
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      type: 'string',
      enum: [
        'national-id-card',
        'degree-certificate',
        'qiyas-score',
      ],
    },
  })
  type: string;

  @property({
    type: 'string',
    required: true,
  })
  filename: string;

  @property({
    type: 'string',
    required: true,
  })
  path: string;

  @property({
    type: 'string',
  })
  candidateId?: string;

  constructor(data?: Partial<Attachment>) {
    super(data);
  }
}

export interface AttachmentRelations {
  // describe navigational properties here
}

export type AttachmentWithRelations = Attachment & AttachmentRelations;
