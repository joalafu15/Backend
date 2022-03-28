import {authenticate} from '@loopback/authentication';
import {
  UserServiceBindings
} from '@loopback/authentication-jwt';
import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  Request,
  requestBody,
  response,
  Response,
  RestBindings
} from '@loopback/rest';
import fs, {unlink} from 'fs';
import {promisify} from 'util';
import {CandidateDetails, UpdateJobOffer, UpdateJobOfferRequestBody, UpdateJobTermRequestBody, UpdateJobTerms} from '../interfaces';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {Candidate, InterviewTimeSlot, Setting} from '../models';
import {AttachmentRepository, CandidateRepository, JobPositionRepository, SchoolPreferenceRepository, SchoolRepository, SectorPreferenceRepository, SectorRepository, SettingRepository, UserRepository} from '../repositories';
import {basicAuthorization, CandidateService, FirebaseService, InterviewTimeSlotService, OTPService, ROLES, SMSService, TemplateService, UserService} from '../services';
import {FileUploadHandler} from '../types';
const excel = require('exceljs');
const readfile = promisify(fs.readFile);
@authenticate('jwt')
export class CandidateController {
  constructor(
    @repository(CandidateRepository)
    public candidateRepository: CandidateRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(SchoolPreferenceRepository) public schoolPreferenceRepository: SchoolPreferenceRepository,
    @repository(SectorPreferenceRepository)
    public sectorPreferenceRepository: SectorPreferenceRepository,
    @repository(SettingRepository)
    public settingRepository: SettingRepository,
    @repository(AttachmentRepository) protected attachmentRepository: AttachmentRepository,
    @repository(JobPositionRepository) protected jobPositionRepository: JobPositionRepository,
    @repository(SchoolRepository) protected schoolRepository: SchoolRepository,
    @repository(SectorRepository) protected sectorRepository: SectorRepository,
    @inject(FILE_UPLOAD_SERVICE) private fileHandler: FileUploadHandler,
    @service(CandidateService) protected candidateService: CandidateService,
    @service(FirebaseService) protected firebaseService: FirebaseService,
    @service(OTPService) protected otpService: OTPService,
    @service(InterviewTimeSlotService) protected interviewTimeSlotService: InterviewTimeSlotService,
    @service(SMSService) protected smsService: SMSService,
    @service(TemplateService) protected templateService: TemplateService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService,
  ) { }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @post('/candidates')
  @response(200, {
    description: 'Candidate model instance',
    content: {'application/json': {schema: getModelSchemaRef(Candidate)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Candidate, {
            title: 'NewCandidate',
            exclude: ['id', 'createdAt', 'updatedAt'],
          }),
        },
      },
    })
    candidate: Omit<Candidate, 'id' & 'createdAt' & 'updatedAt'>,
  ): Promise<Candidate> {
    if (candidate.qiyasScore) {
      candidate.hasTakenQiyas = true;
    }
    return this.candidateRepository.create(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @get('/candidates/count')
  @response(200, {
    description: 'Candidate model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Candidate) where?: Where<Candidate>,
  ): Promise<Count> {
    return this.candidateRepository.count(where);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @get('/candidates')
  @response(200, {
    description: 'Array of Candidate model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Candidate, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Candidate) filter?: Filter<Candidate>,
  ): Promise<Candidate[]> {
    return this.candidateRepository.find(filter);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @get('/exportCandidates')
  @response(200, {
    responses: {
      200: {
        content: {
          // string[]
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        description: 'A list of files',
      },
    },
  })
  async exportCandidates(
    @param.filter(Candidate) filter?: Filter<Candidate>,
  ): Promise<Candidate[]> {
    const candidate = await this.candidateRepository.find(filter).then((result) => {return result;});
    const workbook = new excel.Workbook(); //creating workbook
    const worksheet = workbook.addWorksheet('Candidates'); //creating worksheet
    const result = [];

    const jsonCandidate = JSON.parse(JSON.stringify(candidate));
    worksheet.columns = [
      {header: 'id', key: 'id', width: 10},
      {header: 'fullName', key: 'fullName', width: 30},
      {header: 'birthdate', key: 'birthdate', width: 30},
      {header: 'nationalIdNumber', key: 'nationalIdNumber', width: 30},
      {header: 'studyType', key: 'studyType', width: 30},
      {header: 'qualificationClass', key: 'qualificationClass', width: 30},
      {header: 'specialization', key: 'specialization', width: 100},
      {header: 'educationalInstitute', key: 'educationalInstitute', width: 30},
      {header: 'gpa', key: 'gpa', width: 10},
      {header: 'gpaMax', key: 'gpaMax', width: 10},
      {header: 'gpaMax', key: 'gpaMax', width: 10},
      {header: 'qiyasScore', key: 'qiyasScore', width: 10},
      {header: 'qiyasSubjectScore', key: 'qiyasSubjectScore', width: 10},
      {header: 'hasTakenQiyas', key: 'hasTakenQiyas', width: 10},
      {header: 'graduationDate', key: 'graduationDate', width: 10},
      {header: 'city', key: 'city', width: 30},
      {header: 'phoneNumber', key: 'phoneNumber', width: 30},
      {header: 'email', key: 'email', width: 30},
      {header: 'jobTermsAccepted', key: 'jobTermsAccepted', width: 5},
      {header: 'jobOfferAccepted', key: 'jobOfferAccepted', width: 5},
      {header: 'acceptedTermsAt', key: 'acceptedTermsAt', width: 30},
      {header: 'acceptedOfferAt', key: 'acceptedOfferAt', width: 30},
      {header: 'submittedInformationAt', key: 'submittedInformationAt', width: 30},
      {header: 'submittedAttachmentsAt', key: 'submittedAttachmentsAt', width: 30},
      {header: 'submittedSectorPreferencesAt', key: 'submittedSectorPreferencesAt', width: 30},
      {header: 'submittedPhaseOneAt', key: 'submittedPhaseOneAt', width: 30},
      {header: 'createdAt', key: 'createdAt', width: 30},
      {header: 'updatedAt', key: 'updatedAt', width: 30},
      {header: 'submittedInterViewTimeSlotAt', key: 'submittedInterViewTimeSlotAt', width: 30},
      {header: 'submittedPhaseTwoAt', key: 'submittedPhaseTwoAt', width: 30},
      {header: 'conductedInterview', key: 'conductedInterview', width: 30},
      {header: 'conductedInterviewAt', key: 'conductedInterviewAt', width: 30},
      {header: 'passedInterview', key: 'passedInterview', width: 30},
      {header: 'passedInterviewAt', key: 'passedInterviewAt', width: 30},
      {header: 'interviewNotes', key: 'interviewNotes', width: 30},
      {header: 'medicalExaminationDirections', key: 'medicalExaminationDirections', width: 30},
      {header: 'medicalExaminationLocation', key: 'medicalExaminationLocation', width: 30},
      {header: 'medicalExaminationConductedAt', key: 'medicalExaminationConductedAt', width: 30},
      {header: 'medicalExaminationPassed', key: 'medicalExaminationPassed', width: 30},
      {header: 'medicalExaminationPassedAt', key: 'medicalExaminationPassedAt', width: 30},
      {header: 'medicalExaminationNotes', key: 'medicalExaminationNotes', width: 30},
      {header: 'submittedSchoolPreferenceAt', key: 'submittedSchoolPreferenceAt', width: 30},
      {header: 'qualifiedSectorId', key: 'qualifiedSectorId', width: 30},
      {header: 'qualifiedSchoolId', key: 'qualifiedSchoolId', width: 30},
      {header: 'contractValidated', key: 'contractValidated', width: 30},
      {header: 'contractValidatedAt', key: 'contractValidatedAt', width: 30},
      {header: 'finalDirection', key: 'finalDirection', width: 30},
      {header: 'isPaused', key: 'isPaused', width: 30},
      {header: 'pausedMessage', key: 'pausedMessage', width: 30},
      {header: 'pausedAt', key: 'pausedAt', width: 30},
      {header: 'isDisqualified', key: 'isDisqualified', width: 30},
      {header: 'disqualifiedAt', key: 'disqualifiedAt', width: 30},
      {header: 'disqualifiedMessage', key: 'disqualifiedMessage', width: 30},
      {header: 'lastLogin', key: 'lastLogin', width: 30},
      {header: 'jobPositionId', key: 'jobPositionId', width: 30},
      {header: 'userId', key: 'userId', width: 30},
      {header: 'administrationId', key: 'administrationId', width: 30},
      {header: 'chosenInterviewTimeSlotId', key: 'chosenInterviewTimeSlotId', width: 30},

    ];
    worksheet.addRows(jsonCandidate);
    // Write to File
    const files = workbook.xlsx.writeFile("customer.xlsx")
      .then(async function () {
        const files = await readfile('customer.xlsx');
        return files;
      });
    return files;
  }


  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @patch('/candidates')
  @response(200, {
    description: 'Candidate PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Candidate, {partial: true}),
        },
      },
    })
    candidate: Candidate,
    @param.where(Candidate) where?: Where<Candidate>,
  ): Promise<Count> {
    return this.candidateRepository.updateAll(candidate, where);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @get('/candidates/{id}')
  @response(200, {
    description: 'Candidate model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Candidate, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Candidate, {exclude: 'where'}) filter?: FilterExcludingWhere<Candidate>
  ): Promise<CandidateDetails> {
    const candidate = await this.candidateRepository.findById(id, filter);
    return this.candidateService.computeCandidateProperties(candidate)
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @patch('/candidates/{id}')
  @response(204, {
    description: 'Candidate PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Candidate, {partial: true}),
        },
      },
    })
    candidate: Candidate,
  ): Promise<void> {
    await this.candidateRepository.updateById(id, candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/{id}/accept-terms')
  @response(204, {
    description: 'Candidate Job Terms success',
  })
  async updateJobTerms(
    @param.path.string('id') id: string,
    @requestBody(UpdateJobTermRequestBody) request: UpdateJobTerms,
  ): Promise<void> {
    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.jobTermsAccepted !== null) throw new HttpErrors.BadRequest('Candidate has already sent an answer');
    candidate.jobTermsAccepted = request.accept;
    if (candidate.jobTermsAccepted === true) candidate.acceptedTermsAt = new Date().toString();
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/{id}/accept-offer')
  @response(204, {
    description: 'Candidate Job Offer success',
  })
  async updateJobOffer(
    @param.path.string('id') id: string,
    @requestBody(UpdateJobOfferRequestBody) request: UpdateJobOffer,
  ): Promise<void> {
    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.jobTermsAccepted !== true) throw new HttpErrors.BadRequest('Candidate must accept the job terms first, in order to send an answer');
    if (candidate.jobOfferAccepted !== null) throw new HttpErrors.BadRequest('Candidate has already sent an answer');
    candidate.jobOfferAccepted = request.accept;
    if (candidate.jobOfferAccepted === true) candidate.acceptedOfferAt = new Date().toString();
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/{id}/submit-information')
  @response(204, {
    description: 'Candidate information submit success',
  })
  async markInformationAsSubmitted(
    @param.path.string('id') id: string
  ): Promise<void> {
    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedInformationAt) throw new HttpErrors.BadRequest("Candidate has already submitted the information")

    const canEditInformation = await this.candidateService.canCandidateEditInformation(candidate);
    if (canEditInformation) throw new HttpErrors.BadRequest("Candidate did not submitted all the informations yet")

    candidate.submittedInformationAt = new Date().toString();
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/{id}/submit-attachments')
  @response(204, {
    description: 'Candidate attachments submit success',
  })
  async markAttachmentsAsSubmitted(
    @param.path.string('id') id: string
  ): Promise<void> {
    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedAttachmentsAt) throw new HttpErrors.BadRequest("Candidate has already submitted the attachments")

    const canUploadDocument = await this.candidateService.canCandidateUploadDocument(candidate.id);
    if (canUploadDocument) throw new HttpErrors.BadRequest("Candidate did not submitted all the attachment types yet")

    candidate.submittedAttachmentsAt = new Date().toString();
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/{id}/submit-sector-preferences')
  @response(204, {
    description: 'Candidate sector preferences submit success',
  })
  async markSectorPreferencesAsSubmitted(
    @param.path.string('id') id: string
  ): Promise<void> {
    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedSectorPreferencesAt) throw new HttpErrors.BadRequest("Candidate has already submitted their sector preferences")

    const sectorPreferences = await this.sectorPreferenceRepository.count({candidateId: candidate.id});
    if (sectorPreferences.count < 1) throw new HttpErrors.BadRequest("Candidate must submit at least one sector preference")

    candidate.submittedSectorPreferencesAt = new Date().toString();
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/{id}/submit-school-preferences')
  @response(204, {
    description: 'Candidate school preferences submit success',
  })
  async markSchoolPreferencesAsSubmitted(
    @param.path.string('id') id: string
  ): Promise<void> {
    const phaseThreeLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase3');
    if (phaseThreeLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedSchoolPreferenceAt) throw new HttpErrors.BadRequest("Candidate has already submitted their school preferences")

    const schoolPreferences = await this.schoolPreferenceRepository.count({candidateId: candidate.id});
    if (schoolPreferences.count < 1) throw new HttpErrors.BadRequest("Candidate must submit at least one school preference")

    candidate.submittedSchoolPreferenceAt = new Date().toString();
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/{id}/submit-phase-one')
  @response(204, {
    description: 'Candidate phase one submit success',
  })
  async markPhaseOneAsSubmitted(
    @param.path.string('id') id: string
  ): Promise<void> {
    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedPhaseOneAt) throw new HttpErrors.BadRequest("Candidate has already submitted to phase one")

    if (
      !candidate.acceptedTermsAt ||
      !candidate.acceptedOfferAt ||
      !candidate.submittedInformationAt ||
      !candidate.submittedAttachmentsAt ||
      !candidate.submittedSectorPreferencesAt
    ) throw new HttpErrors.BadRequest("Candidate did not submitted all previous requirements for phase one yet")

    candidate.submittedPhaseOneAt = new Date().toString();
    await this.candidateRepository.update(candidate);
  }


  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/{id}/submit-phase-two')
  @response(204, {
    description: 'Candidate phase two submit success',
  })
  async markPhaseTwoAsSubmitted(
    @param.path.string('id') id: string
  ): Promise<void> {
    const phaseTwoLocked = await this.settingRepository.isActiveForCandidate(id!, 'lockPhase2');
    if (phaseTwoLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedPhaseTwoAt) throw new HttpErrors.BadRequest("Candidate has already submitted to phase two")

    if (
      !candidate.submittedPhaseOneAt ||
      !candidate.chosenInterviewTimeSlotId
    ) throw new HttpErrors.BadRequest("Candidate did not submitted all previous requirements for phase two yet")

    candidate.submittedPhaseTwoAt = new Date().toString();
    await this.candidateRepository.update(candidate);
  }


  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @put('/candidates/{id}')
  @response(204, {
    description: 'Candidate PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() candidate: Candidate,
  ): Promise<void> {
    await this.candidateRepository.replaceById(id, candidate);
  }


  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @del('/candidates/{id}')
  @response(204, {
    description: 'Candidate DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.candidateRepository.deleteById(id);
  }

  @authenticate.skip()
  @post('/candidates/send-otp')
  @response(200, {
    description: 'Indicates if the OTP has been sent.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            phoneNumber: {
              type: 'string',
            }
          },
        },
      },
    },
  })
  async sendOtp(
    @requestBody({
      description: 'The input for candidate\'s OTP verification with the internal OTP system',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nationalIdNumber'],
            properties: {
              nationalIdNumber: {
                type: 'string',
              }
            },
          },
        },
      },
    }) request: {
      nationalIdNumber: string;
    },
  ): Promise<{success: boolean, phoneNumber?: string}> {
    // TODO: Add rate limiter to avoid abuse over the SMS service


    const candidate = await this.candidateRepository.findByNationalId(request.nationalIdNumber);
    if (!candidate) throw new HttpErrors.Forbidden('You are not allowed to register');
    if (candidate.userId) throw new HttpErrors.BadRequest('An account has been created already');

    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(candidate.id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to register');

    // Generate OTP
    const code = this.otpService.generate(candidate.id as string);

    // Send SMS
    const success = await this.smsService.send(
      candidate.phoneNumber,
      this.templateService.otpSMS({code})
    );

    // Omit complete phone number on response
    const phoneNumber =
      candidate.phoneNumber.substr(0, 3) +
      "*".repeat(candidate.phoneNumber.length - 5) +
      candidate.phoneNumber.substr(candidate.phoneNumber.length - 2);

    return {success, phoneNumber};
  }

  @authenticate.skip()
  @post('/candidates/verify-interview-status')
  @response(200, {
    description: 'Indicates the candidate interview status.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            conductedInterview: {
              type: 'boolean',
            },
            passedInterview: {
              type: 'boolean',
            },
          },
        },
      },
    },
  })
  async verifyInterviewStatus(
    @requestBody({
      description: 'The input for candidate\'s identification',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nationalIdNumber'],
            properties: {
              nationalIdNumber: {
                type: 'string',
              }
            },
          },
        },
      },
    }) request: {
      nationalIdNumber: string;
    },
  ): Promise<{conductedInterview?: boolean, passedInterview?: boolean}> {
    const candidate = await this.candidateRepository.findByNationalId(request.nationalIdNumber);
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');

    return {
      conductedInterview: candidate.conductedInterview,
      passedInterview: candidate.passedInterview
    };
  }

  @authenticate.skip()
  @post('/candidates/verify-national-id')
  @response(200, {
    description: 'Indicates if the National Id is valid.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            }
          },
        },
      },
    },
  })
  async verifyNationalId(
    @requestBody({
      description: 'The input for candidate\'s National ID Verification',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nationalIdNumber'],
            properties: {
              nationalIdNumber: {
                type: 'string',
              }
            },
          },
        },
      },
    }) request: {
      nationalIdNumber: string;
    },
  ): Promise<{success: boolean}> {

    const candidate = await this.candidateRepository.findByNationalId(request.nationalIdNumber);
    if (!candidate) throw new HttpErrors.Forbidden('You are not allowed to register');
    if (candidate.userId) throw new HttpErrors.BadRequest('An account has been created already');

    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(candidate.id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to register');

    return {success: true};
  }

  @authenticate.skip()
  @post('/candidates/update-password')
  @response(200, {
    description: 'Update the password',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
          },
        },
      },
    },
  })
  async updatePassword(
    @requestBody({
      description: 'Update the password',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nationalIdNumber', 'oldPassword', 'newPassword'],
            properties: {
              nationalIdNumber: {
                type: 'string',
              },
              oldPassword: {
                type: 'string',
                minLength: 8,
              },
              newPassword: {
                type: 'string',
                minLength: 8,
              },
            },
          },
        },
      },
    }) request: {
      nationalIdNumber: string;
      oldPassword: string;
      newPassword: string;
    },
  ): Promise<{success: boolean}> {

    const credentials = {username: request.nationalIdNumber, password: request.oldPassword};

    const user = await this.userService.verifyCredentials(credentials);
    if (!user) new HttpErrors.Forbidden('Invalid credentials. Please check again.');

    const candidate = await this.candidateRepository.findByNationalId(request.nationalIdNumber);
    if (!candidate) throw new HttpErrors.Forbidden('You are not allowed to update the password');
    const userId = candidate.userId;
    if (!userId) throw new HttpErrors.BadRequest('An account has not been created yet');

    const result = await this.userRepository.updateUserPassword(userId, request.newPassword);

    return {success: !!result};
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @post('/candidates/retrieve-otp')
  @response(200, {
    description: 'Retrieves the current OTP for that candidate.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async retrieveOtp(
    @requestBody({
      description: 'The input for candidate\'s OTP retrieval with the internal OTP system',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nationalIdNumber'],
            properties: {
              nationalIdNumber: {
                type: 'string',
              }
            },
          },
        },
      },
    }) request: {
      nationalIdNumber: string;
    },
  ): Promise<{code: string}> {
    const candidate = await this.candidateRepository.findByNationalId(request.nationalIdNumber);
    if (!candidate) throw new HttpErrors.NotFound('There is no candidate with this National ID on record');

    // Generate OTP
    const code = this.otpService.generate(candidate.id as string);
    return {code};
  }

  @authenticate.skip()
  @post('/candidates/sign-up')
  @response(200, {
    description: 'Finish the user sign-up process with their password and OTP code',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
          },
        },
      },
    },
  })
  async signUp(
    @requestBody({
      description: 'The input of candidate sign-up function with the internal OTP system',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nationalIdNumber', 'password'],
            properties: {
              nationalIdNumber: {
                type: 'string',
              },
              password: {
                type: 'string',
                minLength: 8,
              },
            },
          },
        },
      },
    }) request: {
      nationalIdNumber: string;
      password: string;
    },
  ): Promise<{success: boolean}> {

    const candidate = await this.candidateRepository.findByNationalId(request.nationalIdNumber);
    if (!candidate) throw new HttpErrors.Forbidden('You are not allowed to register');
    if (candidate.userId) throw new HttpErrors.BadRequest('An account has been created already');

    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(candidate.id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to register');

    const savedUser = await this.candidateRepository.createCandidateUser(
      candidate.id as string,
      {
        username: candidate.nationalIdNumber,
        email: candidate.email,
        password: request.password
      }
    );
    return {success: !!savedUser};
  }

  @authenticate.skip()
  @post('/candidates/send-verification-code')
  @response(200, {
    description: 'Indicates if the verification code has been sent.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            phoneNumber: {
              type: 'string',
            }
          },
        },
      },
    },
  })
  async sendVerificationCode(
    @requestBody({
      description: 'The input for candidate\'s phone verification through Firebase',
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
              recaptchaToken: {
                type: 'string',
              }
            },
          },
        },
      },
    }) request: {
      nationalIdNumber: string;
      recaptchaToken: string;
    },
  ): Promise<{success: boolean, phoneNumber?: string}> {
    // TODO: Add rate limiter to avoid abuse over the Firebase service


    const candidate = await this.candidateRepository.findByNationalId(request.nationalIdNumber);
    if (!candidate) throw new HttpErrors.Forbidden('You are not allowed to register');
    if (candidate.userId) throw new HttpErrors.BadRequest('An account has been created already');

    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(candidate.id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to register');

    // Send SMS
    let success = false;
    try {
      success = await this.firebaseService.sendVerificationCode(
        candidate.id as string,
        candidate.phoneNumber,
        request.recaptchaToken
      );
    } catch (err) {
      throw new HttpErrors.InternalServerError('Could not send the verification code');
    }

    // Omit complete phone number on response
    const phoneNumber =
      candidate.phoneNumber.substr(0, 3) +
      "*".repeat(candidate.phoneNumber.length - 5) +
      candidate.phoneNumber.substr(candidate.phoneNumber.length - 2);

    return {success, phoneNumber};
  }

  @authenticate.skip()
  @post('/candidates/verify-phone-number')
  @response(200, {
    description: 'Finish the user sign-up process with their password and verification code code through Firebase',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
          },
        },
      },
    },
  })
  async verifyPhoneNumber(
    @requestBody({
      description: 'The input of candidate sign-up function through Firebase\'s phone verification',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['otp', 'nationalIdNumber', 'password'],
            properties: {
              otp: {
                type: 'string',
              },
              nationalIdNumber: {
                type: 'string',
              },
              password: {
                type: 'string',
                minLength: 8,
              },
            },
          },
        },
      },
    }) request: {
      otp: string;
      nationalIdNumber: string;
      password: string;
    },
  ): Promise<{success: boolean}> {

    const candidate = await this.candidateRepository.findByNationalId(request.nationalIdNumber);
    if (!candidate) throw new HttpErrors.Forbidden('You are not allowed to register');
    if (candidate.userId) throw new HttpErrors.BadRequest('An account has been created already');

    const phaseOneLocked = await this.settingRepository.isActiveForCandidate(candidate.id!, 'lockPhase1');
    if (phaseOneLocked) throw new HttpErrors.Forbidden('You are not allowed to register');

    let validationResponse: boolean;
    try {
      validationResponse = await this.firebaseService.verifyPhoneNumber(request.otp, candidate.id as string);
    } catch (err) {
      throw new HttpErrors.InternalServerError('Could not verify OTP code');
    }
    if (!validationResponse) {
      throw new HttpErrors.BadRequest('OTP is not valid');
    }

    const savedUser = await this.candidateRepository.createCandidateUser(
      candidate.id as string,
      {
        username: candidate.nationalIdNumber,
        email: candidate.email,
        password: request.password
      }
    );
    return {success: !!savedUser};
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @post('/candidates/bulk-upload')
  @response(200, {
    description: 'Bulk upload candidates to be imported',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: "number",
            },
            failures: {
              type: "number",
            },
          },
        },
      },
    },
  })
  async bulkUpload(
    @requestBody.file()
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.fileHandler(request, response, async (err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        const uploadedFiles = request.files;

        const filter = (f: globalThis.Express.Multer.File) => {
          // Parse only these file mime-types
          if ([
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ].includes(f.mimetype)) {
            return true;
          }
          // Remove the rejected file
          unlink(f.path, () => null);
          return false;
        }
        const mapper = (f: globalThis.Express.Multer.File) => f.path;

        let files: string[] = [];
        if (Array.isArray(uploadedFiles)) {
          files = uploadedFiles.filter(filter).map(mapper);
        } else {
          for (const filename in uploadedFiles) {
            files.push(...uploadedFiles[filename].filter(filter).map(mapper));
          }
        }
        if (files.length === 0) reject(new HttpErrors.BadRequest('Invalid file'));
        else {
          const imported = await this.candidateRepository.bulkImportFromFiles(files);
          resolve(imported);
        }
      });
    });
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @post('/candidates/bulk-upload-update')
  @response(200, {
    description: 'Bulk upload update candidates to be imported',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            imported: {
              type: "number",
            },
          },
        },
      },
    },
  })
  async bulkUploadUpdate(
    @requestBody.file()
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.fileHandler(request, response, async (err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        const uploadedFiles = request.files;

        const filter = (f: globalThis.Express.Multer.File) => {
          // Parse only these file mime-types
          if ([
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ].includes(f.mimetype)) {
            return true;
          }
          // Remove the rejected file
          unlink(f.path, () => null);
          return false;
        }
        const mapper = (f: globalThis.Express.Multer.File) => f.path;

        let files: string[] = [];
        if (Array.isArray(uploadedFiles)) {
          files = uploadedFiles.filter(filter).map(mapper);
        } else {
          for (const filename in uploadedFiles) {
            files.push(...uploadedFiles[filename].filter(filter).map(mapper));
          }
        }

        if (files.length === 0) reject(new HttpErrors.BadRequest('Invalid file'));
        else {
          const imported = await this.candidateRepository.bulkUpdateFromFiles(files);
          resolve({imported});
        }
      });
    });
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @post('/candidates/bulk-assignment')
  @response(200, {
    description: 'Bulk assignment candidates to be imported',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            imported: {
              type: "number",
            },
          },
        },
      },
    },
  })
  async bulkAssignment(
    @requestBody.file()
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.fileHandler(request, response, async (err: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        const uploadedFiles = request.files;

        const filter = (f: globalThis.Express.Multer.File) => {
          // Parse only these file mime-types
          if ([
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ].includes(f.mimetype)) {
            return true;
          }
          // Remove the rejected file
          unlink(f.path, () => null);
          return false;
        }
        const mapper = (f: globalThis.Express.Multer.File) => f.path;

        let files: string[] = [];
        if (Array.isArray(uploadedFiles)) {
          files = uploadedFiles.filter(filter).map(mapper);
        } else {
          for (const filename in uploadedFiles) {
            files.push(...uploadedFiles[filename].filter(filter).map(mapper));
          }
        }

        if (files.length === 0) reject(new HttpErrors.BadRequest('Invalid file'));
        else {
          const imported = await this.candidateRepository.bulkAssignmentFromFiles(files);
          resolve({imported});
        }
      });
    });
  }


  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @get('/candidates/reports')
  @response(204, {
    description: 'Report response about the Candidates',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            totalRegistered: {
              type: "number",
            },
            totalTermsAccepted: {
              type: "number",
            },
            totalOfferAccepted: {
              type: "number",
            },
            totalCompletedInformation: {
              type: "number",
            },
            totalCompletedSectorPreferences: {
              type: "number",
            }
          },
        },
      },
    },
  })
  async getReport() {
    await this.candidateRepository.getCandidateReport();
  }

  @get('/candidates/{id}/onboarding-instructions')
  @response(200, {
    description: 'Onboarding Instructions',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            value: {
              type: 'string',
            }
          }
        }
      },
    },
  })
  async onboardingInstructions(
    @param.path.string('id') id: string,
  ): Promise<{value: string}> {
    const candidate = await this.candidateRepository.findById(id, {include: ['jobPosition', 'sector', 'school']});
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');

    if (candidate.contractValidated !== true || candidate.qualifiedSectorId === null || candidate.qualifiedSchoolId === null) {
      throw new HttpErrors.BadRequest('Candidate not ready yet');
    }
    if (!candidate.jobPosition || !candidate.sector || !candidate.school) {
      throw new HttpErrors.BadRequest('Candidate required relations not available');
    }

    const onboardingInstructions = await this.settingRepository.findOne({
      where: {
        setting: 'onboardingInstructions',
      },
    });
    if (!onboardingInstructions || !onboardingInstructions.active) {
      throw new HttpErrors.NotFound('Onboarding instructions not available');
    }

    const value = onboardingInstructions.value
      .replace(/{{candidateName}}/g, candidate.fullName)
      .replace(/{{jobTitle}}/g, candidate.jobPosition.title)
      .replace(/{{sectorName}}/g, candidate.sector.name)
      .replace(/{{schoolName}}/g, candidate.school.name)
      .replace(/{{schoolManagerName}}/g, candidate.school.schoolManagerName!)
      .replace(/{{schoolManagerPhoneNumber}}/g, candidate.school.schoolManagerPhoneNumber!)

    return {value}
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @get('/candidates/time-slots/{id}')
  @response(200, {
    description: 'Available Candidate interview slots',
    content: {
      'application/json': {
        schema: getModelSchemaRef(InterviewTimeSlot),
      },
    },
  })
  async findAvailableTimeslots(
    @param.path.string('id') id: string,
  ): Promise<InterviewTimeSlot[]> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.Forbidden('candidate not register');

    return this.candidateService.getUserTimeSlots(candidate)
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.CANDIDATE], voters: [basicAuthorization]})
  @post('/candidates/interview-slot/{id}')
  @response(204, {
    description: 'Candidate Interview slot saved',
  })
  async saveInterviewSlot(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'The input of candidate interview',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['chosenInterviewTimeSlotId'],
            properties: {
              chosenInterviewTimeSlotId: {
                type: 'number',
              }
            },
          },
        },
      },
    }) request: {
      chosenInterviewTimeSlotId: number;
    },
  ): Promise<void> {

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound();
    if (candidate.submittedInterViewTimeSlotAt) throw new HttpErrors.BadRequest("Candidate has already submitted their interview time slot")

    const phaseTwoLocked = await this.settingRepository.isActiveForCandidate(candidate.id!, 'lockPhase2');
    if (phaseTwoLocked) throw new HttpErrors.Forbidden('You are not allowed to do this action');

    const interviewSlot = await this.interviewTimeSlotService.getInterviewSlotBeforeSaving(request.chosenInterviewTimeSlotId);
    candidate.chosenInterviewTimeSlotId = request.chosenInterviewTimeSlotId;
    candidate.submittedInterViewTimeSlotAt = new Date().toISOString();
    await this.candidateRepository.updateById(candidate.id, candidate);
    interviewSlot.currentCandidatesCount = interviewSlot.currentCandidatesCount + 1;
    await this.interviewTimeSlotService.updateInterViewSlot(interviewSlot);

    // Mark phase two as submitted after choosing a timeslot
    await this.markPhaseTwoAsSubmitted(candidate.id as string);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @post('/candidates/{id}/files-matched')
  @response(200, {
    description: 'Set Files Matched of Candidate.',
  })
  async setFilesMatched(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Input to set Files Matched of Candidate.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['filesMatched'],
            properties: {
              filesMatched: {
                type: 'boolean',
              }
            },
          },
        },
      },
    }) request: {
      filesMatched: boolean;
    },
  ): Promise<void> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');

    candidate.filesMatched = request.filesMatched;
    candidate.filesMatchedAt = request.filesMatched ? new Date().toISOString() : undefined;
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @post('/candidates/{id}/conducted-interview')
  @response(200, {
    description: 'Set Interview Conducted of Candidate.',
  })
  async setConductedInterview(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Input to set Interview Conducted of Candidate.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['conductedInterview'],
            properties: {
              conductedInterview: {
                type: 'boolean',
              }
            },
          },
        },
      },
    }) request: {
      conductedInterview: boolean;
    },
  ): Promise<void> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');

    candidate.conductedInterview = request.conductedInterview;
    candidate.conductedInterviewAt = request.conductedInterview ? new Date().toISOString() : undefined;
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS], voters: [basicAuthorization]})
  @post('/candidates/{id}/contract-validated')
  @response(200, {
    description: 'Set Contract Validated of Candidate.',
  })
  async setContractValidated(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Input to set Contract Validated of Candidate.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['contractValidated'],
            properties: {
              contractValidated: {
                type: 'boolean',
              }
            },
          },
        },
      },
    }) request: {
      contractValidated: boolean;
    },
  ): Promise<void> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');
    const attachment = await this.attachmentRepository.findOne({where: {candidateId: id, type: 'contract'}});
    if (!attachment) {
      throw new HttpErrors.NotFound('Attachment not found');
    }
    candidate.contractValidated = request.contractValidated;
    candidate.contractValidatedAt = request.contractValidated ? new Date().toISOString() : undefined;
    if (!request.contractValidated) {
      candidate.contractDocumentId = undefined;
      unlink(attachment.path, () => null);
      await this.attachmentRepository.deleteById(attachment.id);
    }

    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @post('/candidates/{id}/passed-interview')
  @response(200, {
    description: 'Set Passed Interview of Candidate.',
  })
  async setPassedInterview(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Input to set Passed Interview of Candidate.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['passedInterview'],
            properties: {
              passedInterview: {
                type: 'boolean',
              }
            },
          },
        },
      },
    }) request: {
      passedInterview: boolean;
    },
  ): Promise<void> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');

    if (candidate.conductedInterview === null) {
      candidate.conductedInterview = true;
      candidate.conductedInterviewAt = new Date().toISOString();
    }

    candidate.passedInterview = request.passedInterview;
    candidate.passedInterviewAt = request.passedInterview ? new Date().toISOString() : undefined;
    await this.candidateRepository.update(candidate);
  }

  @authorize({allowedRoles: [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.COMMITTEE], voters: [basicAuthorization]})
  @post('/candidates/{id}/medical-examination-passed')
  @response(200, {
    description: 'Set Medical Examination Passed of Candidate.',
  })
  async setMedicalExaminationPassed(
    @param.path.string('id') id: string,
    @requestBody({
      description: 'Input to set Medical Examination Passed of Candidate.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['medicalExaminationPassed'],
            properties: {
              medicalExaminationPassed: {
                type: 'boolean',
              }
            },
          },
        },
      },
    }) request: {
      medicalExaminationPassed: boolean;
    },
  ): Promise<void> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');
    candidate.medicalExaminationPassed = request.medicalExaminationPassed;
    candidate.medicalExaminationPassedAt = request.medicalExaminationPassed ? new Date().toISOString() : undefined;
    await this.candidateRepository.update(candidate);
  }

  @get('/candidates/{id}/settings')
  @response(200, {
    description: 'Array of Setting model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Setting, {includeRelations: true}),
        },
      },
    },
  })
  async settings(
    @param.path.string('id') id: string,
  ): Promise<Partial<Setting>[]> {
    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) throw new HttpErrors.NotFound('Candidate not found');

    const settings = await this.settingRepository.find({
      where: {
        setting: {
          // Available settings for candidates:
          inq: ['lockPhase1', 'lockPhase2', 'lockPhase3']
        }
      },
    });

    return settings.map(s => {
      const settingGroups = s.value.split(';');
      let active = s.active;
      // Override value if group don't match. NULL groups will use the original value.
      if (candidate.group && !settingGroups.includes(candidate.group)) {
        active = false
      }
      return {setting: s.setting, active}
    })
  }
}
