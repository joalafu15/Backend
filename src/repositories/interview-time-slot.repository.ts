import {Getter, inject, service} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {unlink} from 'fs';
import {CandidateRepository} from '.';
import {DbDataSource} from '../datasources';
import {Candidate, InterviewTimeSlot, InterviewTimeSlotRelations} from '../models';
import {XlsxParserService} from '../services';
import {AdministrationRepository} from './administration.repository';

export class InterviewTimeSlotRepository extends DefaultCrudRepository<
  InterviewTimeSlot,
  typeof InterviewTimeSlot.prototype.id,
  InterviewTimeSlotRelations
  > {
  public readonly candidates: HasManyRepositoryFactory<Candidate, typeof InterviewTimeSlot.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject('repository.AdministrationRepository') protected administrationRepository: AdministrationRepository,
    @repository.getter('CandidateRepository') protected candidateRepositoryGetter: Getter<CandidateRepository>,
    @service(XlsxParserService) protected xlsxParserService: XlsxParserService,
  ) {
    super(InterviewTimeSlot, dataSource);
    this.candidates = this.createHasManyRepositoryFactoryFor('candidates', candidateRepositoryGetter,);
  }

  public async bulkImportFromFiles(files: string[]): Promise<{success: number, failures?: number, failedEntries?: Partial<InterviewTimeSlot>[]}> {
    const promises: Promise<unknown>[] = [];

    let success = 0;
    let failures = 0;
    const failedEntries: Partial<InterviewTimeSlot>[] = [];
    const existingAdministrationCache: unknown[] = [];
    for (const filePath of files) {
      const parsedEntries = this.xlsxParserService.parseInterviewTimeSlots(filePath);

      for (const index in parsedEntries) {
        if (!existingAdministrationCache.includes(parsedEntries[index].administrationID)) {
          if (await this.administrationRepository.count({id: parsedEntries[index].administrationID})) {
            existingAdministrationCache.push(parsedEntries[index].administrationID)
          } else {
            failures++;
            failedEntries.push(parsedEntries[index]);
            continue;
          }
        }
        promises.push(
          new Promise(resolve => {
            this.create(new InterviewTimeSlot(parsedEntries[index]))
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
}
