import {Getter, inject, service} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {hrtime} from 'process';
import {unlink} from 'fs';
import {DbDataSource} from '../datasources';
import {Candidate, InterviewLocation, JobPosition, JobPositionRelations} from '../models';
import {XlsxParserService} from '../services';
import {CandidateRepository} from './candidate.repository';
import {InterviewLocationRepository} from './interview-location.repository';

export class JobPositionRepository extends DefaultCrudRepository<
  JobPosition,
  typeof JobPosition.prototype.id,
  JobPositionRelations
> {

  public readonly candidates: HasManyRepositoryFactory<Candidate, typeof JobPosition.prototype.id>;

  public readonly interviewLocations: HasManyRepositoryFactory<InterviewLocation, typeof JobPosition.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @service(XlsxParserService) protected xlsxParserService: XlsxParserService,
    @repository.getter('CandidateRepository') protected candidateRepositoryGetter: Getter<CandidateRepository>,
    @repository.getter('InterviewLocationRepository') protected interviewLocationRepositoryGetter: Getter<InterviewLocationRepository>,
  ) {
    super(JobPosition, dataSource);
    this.interviewLocations = this.createHasManyRepositoryFactoryFor('interviewLocations', interviewLocationRepositoryGetter,);
    this.candidates = this.createHasManyRepositoryFactoryFor('candidates', candidateRepositoryGetter,);
    this.registerInclusionResolver('candidates', this.candidates.inclusionResolver);

    // Update the updatedAt on persist
    (this.modelClass as any).observe('persist', async (ctx: any) => {
      ctx.data.updatedAt = hrtime.bigint();
    });
  }

  public findByTitle(title: string): Promise<JobPosition | null> {
    return this.findOne({where: {title}});
  }

  public async bulkImportFromFiles(files: string[]): Promise<number> {
    const promises: Promise<JobPosition | void>[] = [];
    files.forEach(async filePath => {
      const parsedEntries = this.xlsxParserService.parseJobPositions(filePath);
      for (const index in parsedEntries) {
        promises.push((async () => {
          const {count} = await this.count({id: parsedEntries[index].id});
          if (count > 0) {
            const {id, ...data} = parsedEntries[index];
            return this.updateById(id, data);
          }
          return this.create(new JobPosition(parsedEntries[index]));
        })());
      }
      unlink(filePath, () => null); // Remove the file used for import
    });

    const result = await Promise.all(promises);
    return result.length;
  }
}
