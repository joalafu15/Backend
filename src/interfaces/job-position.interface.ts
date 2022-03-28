import {JobPosition} from '../models';

export type JobPositionFlags = {
  jobTermsAccepted?: boolean;
  jobOfferAccepted?: boolean;
};

export type JobPositionWithFlags = JobPosition | JobPositionFlags;
