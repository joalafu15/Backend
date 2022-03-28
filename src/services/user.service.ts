import {UserService as AuthenticationUserService} from '@loopback/authentication';
import {model, property, repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {compare, genSalt, hash} from 'bcryptjs';
import _ from 'lodash';
import {UserResetPassword} from '.';
import {User, UserWithRelations} from '../models';
import {CandidateRepository, UserRepository} from '../repositories';

@model()
export class NewUserRequest extends User {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}

type Credentials = {
  username?: string;
  email?: string;
  password: string;
};

export type UserServiceCredentials = Credentials;

export class UserService implements AuthenticationUserService<User, Credentials> {
  constructor(
    @repository('UserRepository') protected userRepository: UserRepository,
    @repository('CandidateRepository') protected candidateRepository: CandidateRepository,
  ) { }

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const invalidCredentialsError = 'Invalid username or password.';

    // Check for either username or email
    const conditions = [];
    if (credentials.username) conditions.push({username: credentials.username});
    if (credentials.email) conditions.push({email: credentials.email});
    if (conditions.length == 0) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const foundUser = await this.userRepository.findOne({where: {or: conditions}});
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const credentialsFound = await this.userRepository.findCredentials(
      foundUser.id,
    );
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const passwordMatched = await compare(
      credentials.password,
      credentialsFound.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    return foundUser;
  }

  convertToUserProfile(user: User): UserProfile {
    return {
      [securityId]: user.id,
      id: user.id,
      name: user.name,
      roles: user.roles,
      ...(user.administrationId && {
        administrationId: user.administrationId
      }),
    };
  }

  async findUserById(id: string): Promise<User & UserWithRelations> {
    const userNotfound = 'invalid User';
    const foundUser = await this.userRepository.findOne({
      where: {id: id},
    });

    if (!foundUser) {
      throw new HttpErrors.Unauthorized(userNotfound);
    }
    return foundUser;
  }

  async createUser(newUserRequest: Partial<NewUserRequest>): Promise<User> {
    const password = await hash(newUserRequest.password as string, await genSalt());
    const savedUser = await this.userRepository.create(
      _.omit(newUserRequest, 'password'),
    );
    await this.userRepository.userCredentials(savedUser.id).create({password});
    return savedUser;
  }

  async requestPasswordReset(nationalIdNumber: string): Promise<User> {
    const candidate = await this.candidateRepository.findOne({
      where: {nationalIdNumber}
    })

    if (!candidate) {
      throw new HttpErrors.BadRequest('Invalid national ID');
    }

    const user = await this.userRepository.findOne({
      where: {id: candidate.userId}
    })

    if (!user) {
      throw new HttpErrors.BadRequest('Invalid user');
    }

    const resetTimestampDate = new Date(user.resetTimestamp);
    const difference = (new Date().getMilliseconds() - resetTimestampDate.getMilliseconds()) / (1000 * 60 * 60 * 24);
    if (difference === 0) {
      user.resetCount = user.resetCount + 1;

      if (user.resetCount > +(process.env.PASSWORD_RESET_EMAIL_LIMIT ?? 2)) {
        throw new HttpErrors.TooManyRequests(
          'Account has reached daily limit for sending password-reset requests',
        );
      }
    } else {
      user.resetTimestamp = new Date().toISOString();
      user.resetCount = 1;
    }

    user.resetKey = this.generateRandomToken(5);
    user.resetTimestamp = new Date().toLocaleDateString();
    await this.userRepository.updateById(user.id, user);

    return user
  }

  async resetPassword(userReset: UserResetPassword): Promise<User> {

    const candidate = await this.candidateRepository.findOne({
      where: {nationalIdNumber: userReset.nationalIdNumber}
    })

    if (!candidate) {
      throw new HttpErrors.BadRequest('Invalid national ID');
    }

    const user = await this.userRepository.findOne({
      where: {id: candidate.userId}
    })

    if (!user) {
      throw new HttpErrors.BadRequest('Invalid email address');
    }
    if (user.resetKey !== userReset.code) {
      throw new HttpErrors.BadRequest('Invalid Code');
    }
    const password = await hash(userReset.password as string, await genSalt());
    await this.userRepository.userCredentials(user.id).patch({password})
    await this.userRepository.updateById(user.id, {resetKey: undefined})
    return user
  }

  private generateRandomToken(length: number): string {
    const chars = '0123456789';
    let value = ''
    for (let i = 0; i < length; i++) {
      value += chars[Math.floor(Math.random() * chars.length)]
    }
    return value;
  }
}
