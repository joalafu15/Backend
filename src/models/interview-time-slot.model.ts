import {Entity, hasMany, model, property} from '@loopback/repository';
import {Candidate} from '.';

@model()
export class InterviewTimeSlot extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  administrationID: number;

  @property({
    type: 'string',
  })
  googleMapsLink: string;

  @property({
    type: 'string',
  })
  locationName: string;

  @property({
    type: 'date',
  })
  startDateTime: string;

  @property({
    type: 'date',
  })
  endDateTime: string;

  @property({
    type: 'number',
  })
  maxCandidatesCapacity: number;

  @property({
    type: 'number',
  })
  currentCandidatesCount: number;

  @hasMany(() => Candidate, {keyTo: 'chosenInterviewTimeSlotId'})
  candidates: Candidate[];

  constructor(data?: Partial<InterviewTimeSlot>) {
    super(data);
  }
}

export interface InterviewTimeSlotRelations {
  // describe navigational properties here
}

export type InterviewTimeSlotWithRelations = InterviewTimeSlot & InterviewTimeSlotRelations;
