import {User} from '@loopback/authentication-jwt';
import {belongsTo, Entity, hasMany, hasOne, model, property} from '@loopback/repository';
import {Attachment} from './attachment.model';
import {InterviewTimeSlot} from './interview-time-slot.model';
import {JobPosition} from './job-position.model';
import {Message} from './message.model';
import {SchoolPreference} from './school-preference.model';
import {School} from './school.model';
import {SectorPreference} from './sector-preference.model';
import {Sector} from './sector.model';

@model()
export class Candidate extends Entity {
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
  fullName: string;

  @property({
    type: 'string',
  })
  birthdate?: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  nationalIdNumber: string;

  @property({
    type: 'string',
  })
  studyType?: string;

  @property({
    type: 'string',
  })
  qualificationClass?: string;

  @property({
    type: 'string',
  })
  specialization?: string;

  @property({
    type: 'string',
  })
  educationalInstitute?: string;

  @property({
    type: 'number',
    mysql: {
      dataType: 'double',
    },
  })
  gpa?: number;

  @property({
    type: 'number',
    mysql: {
      dataType: 'double',
    },
  })
  gpaMax?: number;

  @property({
    type: 'number',
    mysql: {
      dataType: 'double',
    },
  })
  qiyasScore?: number;

  @property({
    type: 'number',
    mysql: {
      dataType: 'double',
    },
  })
  qiyasSubjectScore?: number;

  @property({
    type: 'boolean',
  })
  hasTakenQiyas?: boolean;

  @property({
    type: 'string',
  })
  graduationDate?: string;

  @property({
    type: 'string',
  })
  city: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  phoneNumber: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'boolean',
    default: null,
  })
  jobTermsAccepted?: boolean;

  @property({
    type: 'boolean',
    default: null,
  })
  jobOfferAccepted?: boolean;

  @property({
    type: 'date',
    default: null,
  })
  acceptedTermsAt?: string;

  @property({
    type: 'date',
    default: null,
  })
  acceptedOfferAt?: string;

  @property({
    type: 'date',
    default: null,
  })
  submittedInformationAt?: string;

  @property({
    type: 'date',
    default: null,
  })
  submittedAttachmentsAt?: string;

  @property({
    type: 'date',
    default: null,
  })
  submittedSectorPreferencesAt?: string;

  @property({
    type: 'date',
    default: null,
  })
  submittedPhaseOneAt?: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt?: string;

  @property({
    type: 'string'
  })
  updatedAt?: string;

  @property({
    type: 'date',
    default: null,
  })
  submittedInterViewTimeSlotAt?: string;

  @property({
    type: 'date',
    default: null,
  })
  submittedPhaseTwoAt?: string;

  @property({
    type: 'boolean',
    default: null,
  })
  conductedInterview?: boolean;

  @property({
    type: 'date',
    default: null,
  })
  conductedInterviewAt?: string;

  @property({
    type: 'boolean',
    default: null,
  })
  passedInterview?: boolean;

  @property({
    type: 'date',
    default: null,
  })
  passedInterviewAt?: string;

  @property({
    type: 'string'
  })
  interviewNotes?: string;

  @property({
    type: 'boolean',
    default: null,
  })
  filesMatched?: boolean;

  @property({
    type: 'date',
    default: null,
  })
  filesMatchedAt?: string;

  @property({
    type: 'string'
  })
  medicalExaminationDirections?: string;

  @property({
    type: 'string'
  })
  medicalExaminationLocation?: string;

  @property({
    type: 'date',
    default: null,
  })
  medicalExaminationConductedAt?: string;

  @property({
    type: 'boolean',
    default: null,
  })
  medicalExaminationPassed?: boolean;

  @property({
    type: 'date',
    default: null,
  })
  medicalExaminationPassedAt?: string;

  @property({
    type: 'string'
  })
  medicalExaminationNotes?: string;

  @property({
    type: 'date',
    default: null,
  })
  submittedSchoolPreferenceAt?: string;

  @belongsTo(() => Sector, {name: 'sector'})
  qualifiedSectorId?: number;

  @property({
    type: 'boolean',
    default: null,
  })
  contractValidated?: boolean;

  @property({
    type: 'date',
    default: null,
  })
  contractValidatedAt?: string;

  @property({
    type: 'string'
  })
  finalDirection?: string;

  @property({
    type: 'boolean',
    default: null,
  })
  isPaused?: boolean;

  @property({
    type: 'string'
  })
  pausedMessage?: string;

  @property({
    type: 'date',
    default: null,
  })
  pausedAt?: string;

  @property({
    type: 'boolean',
    default: null,
  })
  isDisqualified?: boolean;

  @property({
    type: 'date',
    default: null,
  })
  disqualifiedAt?: string;

  @property({
    type: 'string'
  })
  disqualifiedMessage?: string;

  @property({
    type: 'date',
    default: null,
  })
  lastLogin?: string;

  @belongsTo(() => Attachment)
  contractDocumentId?: string;

  @belongsTo(() => InterviewTimeSlot, {name: 'interviewTimeSlot'})
  chosenInterviewTimeSlotId: number;

  @hasOne(() => Attachment)
  medicalExaminationDocument: Attachment;

  @belongsTo(() => School, {name: 'school'})
  qualifiedSchoolId?: number;

  @belongsTo(() => JobPosition)
  jobPositionId?: number;

  @belongsTo(() => User)
  userId?: string;

  @hasMany(() => Attachment)
  attachments?: Attachment[];

  @hasMany(() => Message)
  messages?: Message[];

  @hasMany(() => SectorPreference)
  sectorPreferences?: SectorPreference[];


  @property({
    type: 'number',
  })
  administrationId?: number;

  @property({
    type: 'date',
    default: null,
  })
  qualifiedAt?: string;

  @property({
    type: 'string',
    default: null,
  })
  matchingIdentification?: string;

  @property({
    type: 'date',
    default: null,
  })
  processedAt?: string;

  @property({
    type: 'string',
    default: null,
  })
  group?: string;

  @property({
    type: 'string',
    default: null,
  })
  contractUrl?: string;

  @hasMany(() => SchoolPreference)
  schoolPreferences: SchoolPreference[];

  constructor(data?: Partial<Candidate>) {
    super(data);
  }
}

export interface CandidateRelations {
  // describe navigational properties here
  jobPosition?: JobPosition;
  sector?: Sector;
  school?: School;
}

export type CandidateWithRelations = Candidate & CandidateRelations;
