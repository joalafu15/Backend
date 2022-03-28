import {RefreshTokenServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {RefreshToken, RefreshTokenRelations} from '../models';

export class RefreshTokenRepository extends DefaultCrudRepository<
  RefreshToken,
  typeof RefreshToken.prototype.id,
  RefreshTokenRelations
  > {
  constructor(
    @inject(`datasources.${RefreshTokenServiceBindings.DATASOURCE_NAME}`)
    dataSource: juggler.DataSource,
  ) {
    super(RefreshToken, dataSource);
  }
}
