import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {School, SchoolRelations} from '../models';

export class SchoolRepository extends DefaultCrudRepository<
  School,
  typeof School.prototype.id,
  SchoolRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(School, dataSource);
  }
}
