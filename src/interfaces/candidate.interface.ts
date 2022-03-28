import {
  SchemaObject
} from '@loopback/rest';
import {Candidate} from '../models';

type UpdateJobAcceptanceSchema = {
  accept: boolean
}
type CandidateComputedSchema = {
  canAcceptTerms: boolean,
  canAcceptOffer: boolean,
  canEditInformation: boolean,
  canUploadDocument: boolean,
  canSelectRegion: boolean,
  canBookInterview: boolean,
  canSelectSchool: boolean
}

export type UpdateJobTerms = UpdateJobAcceptanceSchema;
export type UpdateJobOffer = UpdateJobAcceptanceSchema;
export type CandidateDetails = CandidateComputedSchema & Partial<Candidate>;
const UpdateJobAcceptanceSchema: SchemaObject = {
  type: 'object',
  required: ['accept'],
  properties: {
    accept: {
      type: 'boolean'
    }
  }
}

export const UpdateJobTermRequestBody = {
  description: 'The input of job-terms function',
  required: true,
  content: {
    'application/json': {schema: UpdateJobAcceptanceSchema},
  },
}

export const UpdateJobOfferRequestBody = {
  description: 'The input of job-offer function',
  required: true,
  content: {
    'application/json': {schema: UpdateJobAcceptanceSchema},
  },
}
