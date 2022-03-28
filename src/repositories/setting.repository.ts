import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {DbDataSource} from '../datasources';
import {Setting, SettingRelations} from '../models';
import {CandidateRepository} from './candidate.repository';

export class SettingRepository extends DefaultCrudRepository<
  Setting,
  typeof Setting.prototype.id,
  SettingRelations
  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject('repository.CandidateRepository') protected candidateRepository: CandidateRepository,
  ) {
    super(Setting, dataSource);
  }

  async isActive(setting: string): Promise<boolean | undefined> {
    const record = await this.findOne({where: {setting}});
    return record?.active
  }

  async isActiveForCandidate(candidateId: string, setting: string): Promise<boolean | undefined> {
    const candidate = await this.candidateRepository.findById(candidateId);
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');

    const record = await this.findOne({where: {setting}});
    if (!record) return;

    const settingGroups = record.value.split(';');
    return (candidate.group && !settingGroups.includes(candidate.group)) ? false : record.active;
  }
}
