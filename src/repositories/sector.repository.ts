import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory, repository, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {City, Sector, SectorRelations, Candidate, SectorPreference, School} from '../models';
import {CityRepository} from './city.repository';
import {SectorPreferenceRepository} from './sector-preference.repository';
import {CandidateRepository} from './candidate.repository';
import {SchoolRepository} from './school.repository';

export class SectorRepository extends DefaultCrudRepository<
  Sector,
  typeof Sector.prototype.id,
  SectorRelations
  > {

  public readonly cities: HasManyRepositoryFactory<City, typeof Sector.prototype.id>;

  public readonly candidates: HasManyThroughRepositoryFactory<Candidate, typeof Candidate.prototype.id,
          SectorPreference,
          typeof Sector.prototype.id
        >;

  public readonly schools: HasManyRepositoryFactory<School, typeof Sector.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('CityRepository') protected cityRepositoryGetter: Getter<CityRepository>, @repository.getter('SectorPreferenceRepository') protected sectorPreferenceRepositoryGetter: Getter<SectorPreferenceRepository>, @repository.getter('CandidateRepository') protected candidateRepositoryGetter: Getter<CandidateRepository>, @repository.getter('SchoolRepository') protected schoolRepositoryGetter: Getter<SchoolRepository>,
  ) {
    super(Sector, dataSource);
    this.schools = this.createHasManyRepositoryFactoryFor('schools', schoolRepositoryGetter,);
    this.registerInclusionResolver('schools', this.schools.inclusionResolver);
    this.candidates = this.createHasManyThroughRepositoryFactoryFor('candidates', candidateRepositoryGetter, sectorPreferenceRepositoryGetter,);
    this.registerInclusionResolver('candidates', this.candidates.inclusionResolver);
    this.cities = this.createHasManyRepositoryFactoryFor('cities', cityRepositoryGetter,);
  }
}
