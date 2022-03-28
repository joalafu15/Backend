import {AuthenticationComponent} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  RefreshTokenServiceBindings,
  TokenServiceBindings,
  UserServiceBindings
} from '@loopback/authentication-jwt';
import {AuthorizationComponent} from '@loopback/authorization';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, generateUniqueId} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import multer from 'multer';
import path from 'path';
import {DbDataSource} from './datasources';
import {FILE_UPLOAD_SERVICE, OTP_SECRET, OTP_STEP, OTP_WINDOW, STORAGE_DIRECTORY} from './keys';
import {AdministrationRepository, CandidateRepository, SectorRepository, UserCredentialsRepository, UserRepository} from './repositories';
import {MySequence} from './sequence';
import {JWTService, UserService} from './services';

export {ApplicationConfig};

export class HiringSystemApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Mount authentication system
    this.component(AuthenticationComponent);

    // Mount jwt component
    this.component(JWTAuthenticationComponent);

    // Mount authorization component
    this.component(AuthorizationComponent);

    // Bind datasources
    this.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);
    this.dataSource(DbDataSource, RefreshTokenServiceBindings.DATASOURCE_NAME);

    // Bind user service
    this.bind(UserServiceBindings.USER_SERVICE).toClass(UserService);

    // Bind user and credentials repository
    this.bind(UserServiceBindings.USER_REPOSITORY).toClass(UserRepository);
    this.bind(UserServiceBindings.USER_CREDENTIALS_REPOSITORY).toClass(UserCredentialsRepository);

    // Set JWT secret and service
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(process.env.JWT_SECRET || 'tatweer-secret');
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);

    // Set OTP secret and time window
    this.bind(OTP_SECRET).to(process.env.OTP_SECRET || 'tatweer-secret');
    this.bind(OTP_STEP).to(parseInt(process.env.OTP_STEP || '300', 10));
    this.bind(OTP_WINDOW).to(parseInt(process.env.OTP_WINDOW || '0', 10));

    // Configure file upload
    this.configureFileUpload(options.fileStorageDirectory);

    // Bind specific repositories to avoid circular dependencies
    this.bind('repository.CandidateRepository').toClass(CandidateRepository);
    this.bind('repository.SectorRepository').toClass(SectorRepository);
    this.bind('repository.AdministrationRepository').toClass(AdministrationRepository);
  }

  /**
   * Configure multer options for file upload
   * @param destination
   */
  protected configureFileUpload(destination?: string) {
    destination = destination || path.join(__dirname, '../private');
    this.bind(STORAGE_DIRECTORY).to(destination);
    const multerOptions: multer.Options = {
      storage: multer.diskStorage({
        destination,
        // Generate a unique identifier for the file for its name
        filename: (req, file, cb) => {
          let extension = file.originalname.split('.').pop();
          extension = extension !== file.originalname ? `.${extension}` : "";
          cb(null, `${generateUniqueId()}${extension}`);
        },
      }),
    };
    this.configure(FILE_UPLOAD_SERVICE).to(multerOptions);
  }
}
