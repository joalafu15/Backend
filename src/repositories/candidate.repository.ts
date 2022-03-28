import {Getter, inject, service} from '@loopback/core';
import {
  BelongsToAccessor,
  Count,
  DataObject,
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  repository,
  Where
} from '@loopback/repository';
import {genSalt, hash} from 'bcryptjs';
import {unlink} from 'fs';
import _ from 'lodash';
import {hrtime} from 'process';
import {DbDataSource} from '../datasources';
import {
  Attachment,
  Candidate,
  CandidateRelations, InterviewTimeSlot, JobPosition, Message,
  School,
  SchoolPreference, Sector, SectorPreference,
  User
} from '../models';
import {
  AttachmentRepository, InterviewTimeSlotRepository, JobPositionRepository,
  MessageRepository,
  SectorPreferenceRepository,
  SectorRepository,
  UserRepository
} from '../repositories';
import {CandidateService, UserServiceCredentials as Credentials, XlsxParserService} from '../services';
import {SchoolPreferenceRepository} from './school-preference.repository';
import {SchoolRepository} from './school.repository';

export class CandidateRepository extends DefaultCrudRepository<
  Candidate,
  typeof Candidate.prototype.id,
  CandidateRelations
  > {

  public readonly user: BelongsToAccessor<User, typeof Candidate.prototype.id>;

  public readonly jobPosition: BelongsToAccessor<JobPosition, typeof Candidate.prototype.id>;

  public readonly interviewTimeSlot: BelongsToAccessor<InterviewTimeSlot, typeof Candidate.prototype.id>;

  public readonly attachments: HasManyRepositoryFactory<Attachment, typeof Candidate.prototype.id>;

  public readonly messages: HasManyRepositoryFactory<Message, typeof Candidate.prototype.id>;

  public readonly sectorPreferences: HasManyRepositoryFactory<SectorPreference, typeof Candidate.prototype.id>;

  public readonly sector: BelongsToAccessor<Sector, typeof Candidate.prototype.id>;

  public readonly schoolPreferences: HasManyRepositoryFactory<SchoolPreference, typeof Candidate.prototype.id>;

  public readonly school: BelongsToAccessor<School, typeof Candidate.prototype.id>;

  public readonly contractDocument: BelongsToAccessor<Attachment, typeof Candidate.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
    @repository('UserRepository') protected userRepository: UserRepository,
    @inject('repository.SectorRepository') protected sectorRepository: SectorRepository,
    @repository('JobPositionRepository') protected jobPositionRepository: JobPositionRepository,
    @service(CandidateService) protected candidateService: CandidateService,
    @service(XlsxParserService) protected xlsxParserService: XlsxParserService,
    @repository.getter('JobPositionRepository') protected jobPositionRepositoryGetter: Getter<JobPositionRepository>,
    @repository.getter('InterviewTimeSlotRepository') protected interviewTimeSlotRepositoryGetter: Getter<InterviewTimeSlotRepository>,
    @repository.getter('AttachmentRepository') protected attachmentRepositoryGetter: Getter<AttachmentRepository>,
    @repository.getter('MessageRepository') protected messageRepositoryGetter: Getter<MessageRepository>,
    @repository.getter('SectorPreferenceRepository') protected sectorPreferenceRepositoryGetter: Getter<SectorPreferenceRepository>,
    @repository.getter('SectorRepository') protected sectorRepositoryGetter: Getter<SectorRepository>,
    @repository.getter('SchoolPreferenceRepository') protected schoolPreferenceRepositoryGetter: Getter<SchoolPreferenceRepository>,
    @repository.getter('SchoolRepository') protected schoolRepositoryGetter: Getter<SchoolRepository>,
  ) {
    super(Candidate, dataSource);
    this.contractDocument = this.createBelongsToAccessorFor('contractDocument', attachmentRepositoryGetter,);
    this.registerInclusionResolver('contractDocument', this.contractDocument.inclusionResolver);
    this.school = this.createBelongsToAccessorFor('school', schoolRepositoryGetter,);
    this.registerInclusionResolver('school', this.school.inclusionResolver);
    this.schoolPreferences = this.createHasManyRepositoryFactoryFor('schoolPreferences', schoolPreferenceRepositoryGetter,);
    this.registerInclusionResolver('schoolPreferences', this.schoolPreferences.inclusionResolver);
    this.sector = this.createBelongsToAccessorFor('sector', sectorRepositoryGetter,);
    this.registerInclusionResolver('sector', this.sector.inclusionResolver);
    this.sectorPreferences = this.createHasManyRepositoryFactoryFor('sectorPreferences', sectorPreferenceRepositoryGetter,);
    this.registerInclusionResolver('sectorPreferences', this.sectorPreferences.inclusionResolver);
    this.messages = this.createHasManyRepositoryFactoryFor('messages', messageRepositoryGetter,);
    this.registerInclusionResolver('messages', this.messages.inclusionResolver);
    this.jobPosition = this.createBelongsToAccessorFor('jobPosition', jobPositionRepositoryGetter,);
    this.registerInclusionResolver('jobPosition', this.jobPosition.inclusionResolver);
    this.interviewTimeSlot = this.createBelongsToAccessorFor('interviewTimeSlot', interviewTimeSlotRepositoryGetter,);
    this.registerInclusionResolver('interviewTimeSlot', this.interviewTimeSlot.inclusionResolver);
    this.attachments = this.createHasManyRepositoryFactoryFor('attachments', attachmentRepositoryGetter,);
    this.registerInclusionResolver('attachments', this.attachments.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);

    // Update the updatedAt on persist
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data.updatedAt = hrtime.bigint();
    });
  }

  public async updateAll(data: DataObject<Candidate>, where?: Where<Candidate>): Promise<Count> {
    const {fullName, email, userId} = await this.findById(data.id, {fields: ["fullName", "email", "userId"]});
    if (userId && (data.fullName || data.email)) {
      await this.userRepository.updateById(userId, {
        name: data.fullName || fullName,
        email: data.email || email,
      })
    }
    return super.updateAll(data, where);
  }

  public findByNationalId(nationalIdNumber: string): Promise<Candidate | null> {
    return this.findOne({where: {nationalIdNumber}});
  }

  public async createCandidateUser(candidateId: string, credentials: Credentials): Promise<User | null> {
    const candidate = await this.findById(candidateId);
    if (!candidate || candidate.userId) {
      return null;
    }

    // Create user
    const password = await hash(credentials.password, await genSalt());
    const savedUser = await this.userRepository.create(
      {
        ..._.omit(credentials, 'password'),
        name: candidate.fullName,
        roles: ['candidate']
      },
    );
    await this.userRepository.userCredentials(savedUser.id).create({password});

    // Update candidate records
    candidate.userId = savedUser.id;
    await this.update(candidate);

    return savedUser;
  }

  public async bulkImportFromFiles(files: string[]): Promise<{success: number, failures?: number, failedEntries?: Partial<Candidate>[]}> {
    const promises: Promise<unknown>[] = [];

    let success = 0;
    let failures = 0;
    const failedEntries: Partial<Candidate>[] = [];
    const existingJobPositionsCache: unknown[] = [];
    for (const filePath of files) {
      const parsedEntries = this.xlsxParserService.parseCandidatesAndJobPositions(filePath);

      for (const index in parsedEntries) {
        if (!existingJobPositionsCache.includes(parsedEntries[index].jobPositionId)) {
          if (await this.jobPositionRepository.count({id: parsedEntries[index].jobPositionId})) {
            existingJobPositionsCache.push(parsedEntries[index].jobPositionId)
          } else {
            failures++;
            failedEntries.push(parsedEntries[index]);
            continue;
          }
        }
        promises.push(
          new Promise(resolve => {
            this.create(new Candidate(parsedEntries[index]))
              .then(() => {
                success++;
                resolve(true);
              })
              .catch(() => {
                failures++;
                failedEntries.push(parsedEntries[index]);
                resolve(true);
              })
          })
        );
      }
      unlink(filePath, () => null); // Remove the file used for import
    }

    await Promise.all(promises);
    if (failures > 0) {
      return {success, failures: failedEntries.length, failedEntries};
    }
    return {success};
  }

  public async bulkUpdateFromFiles(files: string[]): Promise<number> {
    try {
      const promises: Promise<void>[] = [];
      for (const filePath of files) {
        const parsedEntries: Array<{[key: string]: unknown}> = this.xlsxParserService.parseCandidateUpdate(filePath);
        for (const data of parsedEntries) {
          const candidate: any = await this.findByNationalId(data['nationalIdNumber'] as string);
          if (candidate) {
            Object.keys(data).forEach((key: string) => {
              candidate[key] = data[key as string];
            })
            if (data.qualifiedSectorId) {
              const sector = await this.sectorRepository.findById(data.qualifiedSectorId as number);
              if (sector?.administrationId) {
                candidate.administrationId = sector.administrationId
              }
            }
            promises.push(this.update(candidate as Candidate));
          }
        }
        unlink(filePath, () => null);
      }


      const result = await Promise.all(promises);
      return result.length;
    } catch (error) {
      console.log(error);
      return 0;
    }
  }

  public async bulkAssignmentFromFiles(files: string[]): Promise<number> {
    try {
      const promises: Promise<void>[] = [];
      for (const filePath of files) {
        const parsedEntries: Array<{[key: string]: unknown}> = this.xlsxParserService.parseCandidateUpdate(filePath);
        for (const data of parsedEntries) {
          const candidate: any = await this.findByNationalId(data['nationalIdNumber'] as string);
          if (candidate) {
            Object.keys(data).forEach((key: string) => {
              candidate[key] = data[key as string];
            })
            if (data.qualifiedSectorId) {
              candidate.qualifiedSectorId = data.qualifiedSectorId;
              candidate.qualifiedAt = new Date().toString();
              const sector = await this.sectorRepository.findById(data.qualifiedSectorId as number);
              if (sector?.administrationId) {
                candidate.administrationId = sector.administrationId
              }
            }
            promises.push(this.update(candidate as Candidate));
          }
        }
        unlink(filePath, () => null);
      }

      const result = await Promise.all(promises);
      return result.length;
    } catch (error) {
      console.log(error);
      return 0;
    }
  }

  public async getCandidateReport(): Promise<{[key: string]: number}> {
    const totalRegisteredPromise = super.count({userId: {neq: undefined}});
    const totalTermsAcceptedPromise = super.count({jobTermsAccepted: true});
    const totalOfferAcceptedPromise = super.count({jobOfferAccepted: true});
    // TODO: optimize this to use count() instead of find() due to the massive amount of candidates
    const totalCandidates = await super.find({
      where: {
        fullName: {neq: undefined},
        nationalIdNumber: {neq: undefined},
        phoneNumber: {neq: undefined},
      }
    })
    const totalCompletedInformationPromise = {
      count: (await Promise.all(totalCandidates.map(candidate => this.candidateService.computeCandidateProperties(candidate)))).filter(candidate => !candidate.canEditInformation && !candidate.canUploadDocument).length
    }
    const totalCompletedSectorPreferencesPromise = super.count({jobOfferAccepted: true});
    const [totalRegistered,
      totalTermsAccepted,
      totalOfferAccepted,
      totalCompletedInformation,
      totalCompletedSectorPreferences] = await Promise.all([
        totalRegisteredPromise, totalTermsAcceptedPromise,
        totalOfferAcceptedPromise, totalCompletedInformationPromise, totalCompletedSectorPreferencesPromise])
    return {
      totalRegistered: totalRegistered.count,
      totalTermsAccepted: totalTermsAccepted.count,
      totalOfferAccepted: totalOfferAccepted.count,
      totalCompletedInformation: totalCompletedInformation.count,
      totalCompletedSectorPreferences: totalCompletedSectorPreferences.count
    }
  }
}
