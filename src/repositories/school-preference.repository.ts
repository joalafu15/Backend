import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {School, SchoolPreference, SchoolPreferenceRelations} from '../models';
import {SchoolRepository} from './school.repository';

export class SchoolPreferenceRepository extends DefaultCrudRepository<
  SchoolPreference,
  typeof SchoolPreference.prototype.id,
  SchoolPreferenceRelations
  > {

  public readonly school: BelongsToAccessor<School, typeof SchoolPreference.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('SchoolRepository') protected schoolRepositoryGetter: Getter<SchoolRepository>,
  ) {
    super(SchoolPreference, dataSource);
    this.school = this.createBelongsToAccessorFor('school', schoolRepositoryGetter,);
    this.registerInclusionResolver('school', this.school.inclusionResolver);
  }

  async setPreferences(
    candidateId: string,
    schoolChoices: number[],
  ): Promise<SchoolPreference[]> {
    const existingChoices = await this.find({
      where: {candidateId},
      order: ['choice ASC'],
    });
    let oldIdsToBeRemoved = existingChoices.map(r => r.id);
    const result: SchoolPreference[] = [];
    for (let idx = 1; idx <= schoolChoices.length; idx++) {
      const conflictingChoice = existingChoices.find(r => r.choice === idx);
      if (conflictingChoice) {
        oldIdsToBeRemoved = oldIdsToBeRemoved.filter(
          i => i !== conflictingChoice.id,
        );
        conflictingChoice.schoolId = schoolChoices[idx - 1];
        await this.update(conflictingChoice);
        result.push(conflictingChoice);
      } else {
        const choice = await this.create({
          choice: idx,
          candidateId,
          schoolId: schoolChoices[idx - 1],
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
