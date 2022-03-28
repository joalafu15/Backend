import {authenticate, TokenService} from '@loopback/authentication';
import {
  RefreshTokenServiceBindings, TokenServiceBindings,
  UserServiceBindings
} from '@loopback/authentication-jwt';
import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef, HttpErrors, param,
  patch,
  post, put, requestBody,
  response,
  SchemaObject
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {get as apiRequest} from 'https';
import {SentMessageInfo} from 'nodemailer';
import {User} from '../models';
import {UserRepository} from '../repositories';
import {
  basicAuthorization,
  EmailService,
  NewUserRequest, RefreshTokenService, ROLES, UserResetPassword, UserService,
  UserServiceCredentials as Credentials
} from '../services';

const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['password'],
  oneOf: [
    {required: ['username']},
    {required: ['email']},
  ],
  properties: {
    username: {
      type: 'string',
    },
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
}

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
}

type RefreshGrant = {
  refreshToken: string;
};

type RecaptchaRequest = {
  token: string
}

const RefreshGrantSchema: SchemaObject = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: {
      type: 'string',
    },
  },
};

const RefreshGrantRequestBody = {
  description: 'Reissuing Acess Token',
  required: true,
  content: {
    'application/json': {schema: RefreshGrantSchema},
  },
};

@authenticate('jwt')
@authorize({allowedRoles: [ROLES.ADMIN], voters: [basicAuthorization]})
export class UserController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
    @service(EmailService) protected emailService: EmailService,
    @repository(UserRepository) protected userRepository: UserRepository,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE)
    public refreshService: RefreshTokenService,
  ) { }

  @authenticate.skip()
  @authorize.skip()
  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
                refresh: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<{token: string, refresh: string | undefined}> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const accessToken = await this.jwtService.generateToken(userProfile);

    // create refresh token
    const tokens = await this.refreshService.generateToken(userProfile, accessToken);

    return {
      token: tokens.accessToken,
      refresh: tokens.refreshToken
    };
  }

  @authenticate.skip()
  @authorize.skip()
  @post('/users/refresh', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async refresh(
    @requestBody(RefreshGrantRequestBody) refreshGrant: RefreshGrant,
  ): Promise<{token: string}> {
    // create refresh token
    const tokens = await this.refreshService.refreshToken(refreshGrant.refreshToken);

    return {token: tokens.accessToken};
  }

  @authorize.skip()
  @get('/whoAmI', {
    responses: {
      '200': {
        description: 'Return current user',
        content: {
          'application/json': {
            schema: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async whoAmI(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<string> {
    return currentUserProfile[securityId]
  }

  @post('/users', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async createUser(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUserRequest, {
            title: 'NewUser',
            exclude: ['id'],
          }),
        },
      },
    })
    newUserRequest: NewUserRequest
  ): Promise<User> {
    return this.userService.createUser(newUserRequest);
  }

  @get('/users/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUserRequest, {
            title: 'Password Change',
          }),
        },
      },
    })
    newUserRequest: NewUserRequest,
  ): Promise<void> {
    if (newUserRequest && newUserRequest.password) {
      const response = await this.userRepository.updateUserPassword(id, newUserRequest.password);
    } else {
      await this.userRepository.updateById(id, newUserRequest);
    }
  }

  @put('/users/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.userRepository.deleteById(id);
  }

  @authenticate.skip()
  @authorize.skip()
  @post('/validate-recaptcha')
  @response(200, {
    description: 'Google reCAPTCHA validation',
    content: {
      'application/json': {
        schema: {
          type: 'boolean',
        }
      },
    },
  })
  validateRecaptcha(
    @requestBody({
      description: 'The input of the reCAPTCHA validation function',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['token'],
            properties: {
              token: {
                type: 'string',
              }
            },
          }
        },
      },
    }) request: RecaptchaRequest,
  ) {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    }
    return new Promise((resolve, reject) => {
      const req = apiRequest(`${process.env.RECAPTCHA_VERIFICATION_URL}?secret=${process.env.RECAPTCHA_SECRET}&response=${request.token}`, options, (res) => {
        if (res.statusCode as number < 200 || res.statusCode as number > 299) {
          return reject(new Error(`HTTP status code ${res.statusCode}`))
        }

        const body: any[] = []
        res.on('data', (chunk) => body.push(chunk))
        res.on('end', () => {
          const resString = Buffer.concat(body).toString()
          resolve(resString)
        })
      })

      req.on('error', (err) => {
        reject(err)
      })
      req.end()
    })

  }

  @authenticate.skip()
  @authorize.skip()
  @post('/user/reset-password')
  @response(204, {
    description: 'Reset Email has beed sent.',
  })
  async resetPassword(
    @requestBody({
      description: 'The input of reset password function',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nationalIdNumber'],
            properties: {
              nationalIdNumber: {
                type: 'string',
              },
            },
          }
        },
      },
    }) userReset: UserResetPassword,
  ) {
    const user = await this.userService.requestPasswordReset(userReset.nationalIdNumber);
    const nodeMailer: SentMessageInfo = await this.emailService.sendResetPasswordMail(user);

    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (nodeMailer && nodeMailer.accepted.length) {
      return 'Successfully sent reset password link';
    }
    throw new HttpErrors.InternalServerError(
      'Error sending reset password email',
    );

  }

  @authenticate.skip()
  @authorize.skip()
  @post('/user/reset-password/init')
  @response(204, {
    description: 'Password has been reset.',
  })
  async resetPasswordInit(
    @requestBody({
      description: 'The input of reset password function',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nationalIdNumber', 'code', 'password'],
            properties: {
              nationalIdNumber: {
                type: 'string',
              },
              code: {
                type: 'string',
              },
              password: {
                type: 'string',
              }
            },
          }
        },
      },
    }) userReset: UserResetPassword,
  ) {
    return this.userService.resetPassword(userReset);
  }
}
