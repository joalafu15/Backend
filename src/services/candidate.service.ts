import {repository} from '@loopback/repository';
import {CandidateDetails} from '../interfaces';
import {Candidate, InterviewTimeSlot} from '../models';
import {AttachmentRepository, InterviewTimeSlotRepository} from '../repositories';

export class CandidateService {
  constructor(
    @repository('AttachmentRepository') protected attachmentRepository: AttachmentRepository,
    @repository('InterviewTimeSlotRepository') protected interviewTimeSlotRepository: InterviewTimeSlotRepository,
  ) { }

  public async computeCandidateProperties(candidate: Candidate): Promise<CandidateDetails> {
    if (candidate.jobTermsAccepted === false || candidate.jobOfferAccepted === false || candidate.hasTakenQiyas === false) {
      // If they rejected either terms or offer, all should be false.
      return {
        ...candidate,
        canAcceptTerms: false,
        canAcceptOffer: false,
        canEditInformation: false,
        canUploadDocument: false,
        canSelectRegion: false,
        canBookInterview: false,
        canSelectSchool: false
      }
    }
    return {
      ...candidate,
      canAcceptTerms: candidate.jobTermsAccepted == null && !candidate.acceptedTermsAt,
      canAcceptOffer: candidate.jobOfferAccepted == null && !candidate.acceptedOfferAt,
      canEditInformation: !candidate.submittedInformationAt,
      canUploadDocument: !candidate.submittedAttachmentsAt,
      canSelectRegion: false, // Hardcoded for the time being as it is from another stage
      canBookInterview: false, // Hardcoded for the time being as it is from another stage
      canSelectSchool: false // Hardcoded for the time being as it is from another stage
    }
  }

  public async canCandidateUploadDocument(candidateId: string | undefined): Promise<boolean> {
    const attachments = await this.attachmentRepository.find({where: {candidateId}});
    const requiredType = ['national-id-card', 'degree-certificate', 'qiyas-score'];
    return attachments.filter(file => file && requiredType.includes(file.type)).length !== requiredType.length
  }

  public canCandidateEditInformation(candidate: Candidate): boolean {
    return !(candidate.fullName && candidate.nationalIdNumber && candidate.phoneNumber)
  }

  public async getUserTimeSlots(candidate: Candidate): Promise<InterviewTimeSlot[]> {
    if (candidate.chosenInterviewTimeSlotId) {
      return await this.interviewTimeSlotRepository.find({
        where: {
          id: candidate.chosenInterviewTimeSlotId
        }
      })
    }
    const interviewSlots = await this.interviewTimeSlotRepository.find({
      where: {
        administrationID: candidate.administrationId,
        endDateTime: {gte: new Date().toISOString()}
      }
    })
    return interviewSlots.filter(is => is.currentCandidatesCount < is.maxCandidatesCapacity);
  }
}
