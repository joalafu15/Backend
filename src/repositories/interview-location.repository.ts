import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InterviewLocation, InterviewLocationRelations} from '../models';

export class InterviewLocationRepository extends DefaultCrudRepository<
  InterviewLocation,
  typeof InterviewLocation.prototype.id,
  InterviewLocationRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(InterviewLocation, dataSource);
  }
}
