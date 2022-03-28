import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Administration, AdministrationRelations, Sector, Candidate} from '../models';
import {SectorRepository} from './sector.repository';
import {CandidateRepository} from './candidate.repository';

export class AdministrationRepository extends DefaultCrudRepository<
  Administration,
  typeof Administration.prototype.id,
  AdministrationRelations
> {

  public readonly sectors: HasManyRepositoryFactory<Sector, typeof Administration.prototype.id>;

  public readonly candidates: HasManyRepositoryFactory<Candidate, typeof Administration.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('SectorRepository') protected sectorRepositoryGetter: Getter<SectorRepository>, @repository.getter('CandidateRepository') protected candidateRepositoryGetter: Getter<CandidateRepository>,
  ) {
    super(Administration, dataSource);
    this.candidates = this.createHasManyRepositoryFactoryFor('candidates', candidateRepositoryGetter,);
    this.registerInclusionResolver('candidates', this.candidates.inclusionResolver);
    this.sectors = this.createHasManyRepositoryFactoryFor('sectors', sectorRepositoryGetter,);
  }
}
