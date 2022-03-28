import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PhoneVerification, PhoneVerificationRelations} from '../models';

export class PhoneVerificationRepository extends DefaultCrudRepository<
  PhoneVerification,
  typeof PhoneVerification.prototype.id,
  PhoneVerificationRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(PhoneVerification, dataSource);
  }
}
