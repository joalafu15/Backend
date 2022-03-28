import {Entity, hasMany, model, property} from '@loopback/repository';
import {Candidate} from './candidate.model';
import {InterviewLocation} from './interview-location.model';

@model()
export class JobPosition extends Entity {
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
  title: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  description?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  terms?: string;

  @property({
    type: 'number',
    default: 0,
    mysql: {
      dataType: 'double',
    },
  })
  basicSalary?: number;

  @property({
    type: 'number',
    default: 0,
    mysql: {
      dataType: 'double',
    },
  })
  housing?: number;

  @property({
    type: 'number',
    default: 0,
    mysql: {
      dataType: 'double',
    },
  })
  transportation?: number;

  @property({
    type: 'number',
    default: 0,
    mysql: {
      dataType: 'double',
    },
  })
  totalSalary?: number;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  salaryDescription?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  contractDuration?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  expectedJoiningDate?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  vacationDays?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  contractPeriod?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  salaryNotice?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  offerNotice?: string;

  @property({
    type: 'number',
    default: 0,
    mysql: {
      dataType: 'double',
    },
  })
  gosi?: number;

  @property({
    type: 'number',
    default: 0,
    mysql: {
      dataType: 'double',
    },
  })
  netSalary?: number;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  medicalInsurance?: string;

  @property({
    type: 'string',
    mysql: {
      dataType: 'text',
    },
  })
  subject?: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt?: string;

  @property({
    type: 'string',
  })
  updatedAt?: string;

  @hasMany(() => Candidate)
  candidates: Candidate[];

  @hasMany(() => InterviewLocation)
  interviewLocations: InterviewLocation[];

  constructor(data?: Partial<JobPosition>) {
    super(data);
  }
}

export interface JobPositionRelations {
  // describe navigational properties here
}

export type JobPositionWithRelations = JobPosition & JobPositionRelations;
