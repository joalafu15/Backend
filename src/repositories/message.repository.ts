import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Message, MessageRelations, Candidate} from '../models';
import {CandidateRepository} from './candidate.repository';

export class MessageRepository extends DefaultCrudRepository<
  Message,
  typeof Message.prototype.id,
  MessageRelations
> {

  public readonly candidate: BelongsToAccessor<Candidate, typeof Message.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('CandidateRepository') protected candidateRepositoryGetter: Getter<CandidateRepository>,
  ) {
    super(Message, dataSource);
    this.candidate = this.createBelongsToAccessorFor('candidate', candidateRepositoryGetter,);
    this.registerInclusionResolver('candidate', this.candidate.inclusionResolver);
  }
}
