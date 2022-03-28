import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Sector, SectorPreference, SectorPreferenceRelations} from '../models';
import {SectorRepository} from './sector.repository';

export class SectorPreferenceRepository extends DefaultCrudRepository<
  SectorPreference,
  typeof SectorPreference.prototype.id,
  SectorPreferenceRelations
  > {

  public readonly sector: BelongsToAccessor<Sector, typeof SectorPreference.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('SectorRepository') protected sectorRepositoryGetter: Getter<SectorRepository>,
  ) {
    super(SectorPreference, dataSource);
    this.sector = this.createBelongsToAccessorFor('sector', sectorRepositoryGetter,);
    this.registerInclusionResolver('sector', this.sector.inclusionResolver);
  }

  async setPreferences(candidateId: string, sectorChoices: number[]): Promise<SectorPreference[]> {
    const existingChoices = await this.find({where: {candidateId}, order: ['choice ASC']});
    let oldIdsToBeRemoved = existingChoices.map(r => r.id);
    const result: SectorPreference[] = [];
    for (let idx = 1; idx <= sectorChoices.length; idx++) {
      const conflictingChoice = existingChoices.find(r => r.choice === idx);
      if (conflictingChoice) {
        oldIdsToBeRemoved = oldIdsToBeRemoved.filter(i => i !== conflictingChoice.id)
        conflictingChoice.sectorId = sectorChoices[idx - 1];
        await this.update(conflictingChoice);
        result.push(conflictingChoice);
      } else {
        const choice = await this.create({
          choice: idx,
          candidateId,
          sectorId: sectorChoices[idx - 1]
        });
        result.push(choice);
      }
    }
    if (oldIdsToBeRemoved.length > 0) {
      await this.deleteAll({id: {inq: oldIdsToBeRemoved}});
    }
    return result;
  }
}
