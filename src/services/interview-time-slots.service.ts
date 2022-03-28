import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {InterviewTimeSlot} from '../models';
import {InterviewTimeSlotRepository} from '../repositories';

export class InterviewTimeSlotService {
  constructor(
    @repository('InterviewTimeSlotRepository') protected interviewTimeSlotRepository: InterviewTimeSlotRepository,
  ) { }

  public async getInterviewSlotBeforeSaving(interviewSlotId: number): Promise<InterviewTimeSlot> {
    const interviewSlot = await this.interviewTimeSlotRepository.findById(interviewSlotId);
    if (!interviewSlot || interviewSlot.currentCandidatesCount >= interviewSlot.maxCandidatesCapacity || new Date(interviewSlot.endDateTime) < new Date()) {
      throw new HttpErrors.Forbidden('interview slot not availabel');
    }
    return interviewSlot;
  }

  public async updateInterViewSlot(interviewTimeSlot: InterviewTimeSlot) {
    return this.interviewTimeSlotRepository.update(interviewTimeSlot);
  }
}
