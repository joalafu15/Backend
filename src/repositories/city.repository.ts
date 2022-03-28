import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {City, CityRelations, School} from '../models';
import {SchoolRepository} from './school.repository';

export class CityRepository extends DefaultCrudRepository<
  City,
  typeof City.prototype.id,
  CityRelations
> {

  public readonly schools: HasManyRepositoryFactory<School, typeof City.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('SchoolRepository') protected schoolRepositoryGetter: Getter<SchoolRepository>,
  ) {
    super(City, dataSource);
    this.schools = this.createHasManyRepositoryFactoryFor('schools', schoolRepositoryGetter,);
  }
}
