import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import xlsx from 'node-xlsx';
import {InterviewTimeSlot, JobPosition} from '../models';
import {Candidate} from '../models/candidate.model';

type parsedCandidateAndJobPosition = Partial<Candidate>;

@injectable({scope: BindingScope.TRANSIENT})
export class XlsxParserService {
  constructor(/* Add @inject to inject parameters */) { }

  public parseCandidatesAndJobPositions(filePath: string): parsedCandidateAndJobPosition[] {
    /**
     * This parser will only read the first worksheet, and after the
     * first row (the labels), it will only parse the first eleven columns by
     * the following order:
     *
     * nationalIdNumber, fullName, phoneNumber, email, specialization,
     * graduationDate, qualificationClass, educationalInstitute, gpa, gpaMax, jobPositionId
     */

    let worksheet = xlsx.parse(filePath);
    worksheet = worksheet.slice(0, 1);
    const length = worksheet[0].data.length;

    const records: parsedCandidateAndJobPosition[] = [];

    for (let rowIndex = 1; rowIndex < length; rowIndex++) {
      records.push({
        nationalIdNumber: worksheet[0].data[rowIndex][0] as string,
        fullName: worksheet[0].data[rowIndex][1] as string,
        phoneNumber: worksheet[0].data[rowIndex][2] as string,
        email: worksheet[0].data[rowIndex][3] as string,
        specialization: worksheet[0].data[rowIndex][4] as string,
        graduationDate: worksheet[0].data[rowIndex][5] as string,
        qualificationClass: worksheet[0].data[rowIndex][6] as string,
        educationalInstitute: worksheet[0].data[rowIndex][7] as string,
        gpa: worksheet[0].data[rowIndex][8] as number,
        gpaMax: worksheet[0].data[rowIndex][9] as number,
        jobPositionId: worksheet[0].data[rowIndex][10] as number,
        qiyasScore: worksheet[0].data[rowIndex][11] as number,
        qiyasSubjectScore: worksheet[0].data[rowIndex][12] as number,
        hasTakenQiyas: worksheet[0].data[rowIndex][11] ? true : false,
        group: worksheet[0].data[rowIndex][13] as string,
      });
    }

    return records;
  }

  public parseCandidateUpdate(filePath: string): parsedCandidateAndJobPosition[] {
    let worksheet = xlsx.parse(filePath);
    worksheet = worksheet.slice(0, 1);
    const length = worksheet[0].data.length;

    const records: parsedCandidateAndJobPosition[] = [];
    const indexes = {
      nationalIdNumber: -1,
      fullName: -1,
      phoneNumber: -1,
      email: -1,
      specialization: -1,
      graduationDate: -1,
      qualificationClass: -1,
      educationalInstitute: -1,
      gpa: -1,
      gpaMax: -1,
      jobPositionId: -1,
      qiyasScore: -1,
      qualifiedSectorId: -1,
      qualifiedSchoolId: -1,
      qiyasSubjectScore: -1,
      birthdate: -1,
      studyType: -1,
      hasTakenQiyas: -1,
      city: -1,
      jobTermsAccepted: -1,
      jobOfferAccepted: -1,
      acceptedTermsAt: -1,
      acceptedOfferAt: -1,
      submittedInformationAt: -1,
      submittedAttachmentsAt: -1,
      submittedSectorPreferencesAt: -1,
      submittedPhaseOneAt: -1,
      createdAt: -1,
      updatedAt: -1,
      submittedInterViewTimeSlotAt: -1,
      submittedPhaseTwoAt: -1,
      conductedInterview: -1,
      conductedInterviewAt: -1,
      passedInterview: -1,
      passedInterviewAt: -1,
      interviewNotes: -1,
      filesMatched: -1,
      filesMatchedAt: -1,
      medicalExaminationDirections: -1,
      medicalExaminationLocation: -1,
      medicalExaminationConductedAt: -1,
      medicalExaminationPassed: -1,
      medicalExaminationPassedAt: -1,
      medicalExaminationNotes: -1,
      submittedSchoolPreferenceAt: -1,
      contractValidated: -1,
      contractValidatedAt: -1,
      finalDirection: -1,
      isPaused: -1,
      pausedMessage: -1,
      pausedAt: -1,
      isDisqualified: -1,
      disqualifiedAt: -1,
      disqualifiedMessage: -1,
      administrationId: -1,
      qualifiedAt: -1,
      matchingIdentification: -1,
      processedAt: -1,
      contractUrl: -1,
      group: -1,
    }

    if (length > 1) {
      const columns = worksheet[0].data[0];
      indexes.nationalIdNumber = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "nationalidnumber");
      indexes.fullName = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "fullname");
      indexes.phoneNumber = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "phonenumber");
      indexes.email = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "email");
      indexes.specialization = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "specialization");
      indexes.graduationDate = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "graduationdate");
      indexes.qualificationClass = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "qualificationclass");
      indexes.educationalInstitute = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "educationalinstitute");
      indexes.gpa = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "gpa");
      indexes.gpaMax = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "gpamax");
      indexes.jobPositionId = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "jobpositionid");
      indexes.qiyasScore = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "qiyasscore");
      indexes.qualifiedSectorId = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "qualifiedsectorid");
      indexes.qualifiedSchoolId = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "qualifiedschoolid");
      indexes.qiyasSubjectScore = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "qiyassubjectscore");
      indexes.birthdate = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "birthdate");
      indexes.studyType = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "studytype");
      indexes.hasTakenQiyas = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "hastakenqiyas");
      indexes.city = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "city");
      indexes.jobTermsAccepted = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "jobtermsaccepted");
      indexes.jobOfferAccepted = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "jobofferaccepted");
      indexes.acceptedTermsAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "acceptedtermsat");
      indexes.acceptedOfferAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "acceptedofferat");
      indexes.submittedInformationAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "submittedinformationat");
      indexes.submittedAttachmentsAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "submittedattachmentsat");
      indexes.submittedSectorPreferencesAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "submittedsectorpreferencesat");
      indexes.submittedPhaseOneAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "submittedphaseoneat");
      indexes.createdAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "createdat");
      indexes.updatedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "updatedat");
      indexes.submittedInterViewTimeSlotAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "submittedinterviewiimeslotat");
      indexes.submittedPhaseTwoAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "submittedphasetwoat");
      indexes.conductedInterview = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "conductedinterview");
      indexes.conductedInterviewAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "conductedinterviewat");
      indexes.passedInterview = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "passedinterview");
      indexes.passedInterviewAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "passedinterviewat");
      indexes.interviewNotes = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "interviewnotes");
      indexes.filesMatched = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "filesmatched");
      indexes.filesMatchedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "filesmatchedat");
      indexes.medicalExaminationDirections = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "medicalexaminationdirections");
      indexes.medicalExaminationLocation = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "medicalexaminationlocation");
      indexes.medicalExaminationConductedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "medicalexaminationconductedat");
      indexes.medicalExaminationPassed = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "medicalexaminationpassed");
      indexes.medicalExaminationPassedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "medicalexaminationpassedat");
      indexes.medicalExaminationNotes = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "medicalexaminationnotes");
      indexes.submittedSchoolPreferenceAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "submittedschoolpreferenceat");
      indexes.contractValidated = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "contractvalidated");
      indexes.contractValidatedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "contractvalidatedat");
      indexes.finalDirection = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "finaldirection");
      indexes.isPaused = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "ispaused");
      indexes.pausedMessage = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "pausedmessage");
      indexes.pausedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "pausedat");
      indexes.isDisqualified = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "isdisqualified");
      indexes.disqualifiedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "disqualifiedat");
      indexes.disqualifiedMessage = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "disqualifiedmessage");
      indexes.administrationId = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "administrationid");
      indexes.qualifiedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "qualifiedat");
      indexes.matchingIdentification = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "matchingidentification");
      indexes.processedAt = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "processedat");
      indexes.contractUrl = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "contracturl");
      indexes.group = columns.findIndex((c) => c && (c as string).toLowerCase().trim().replace(/ /g, '') === "group");
    }

    for (let rowIndex = 1; rowIndex < length; rowIndex++) {
      const record: {[key: string]: unknown} = {
        nationalIdNumber: String(worksheet[0].data[rowIndex][indexes.nationalIdNumber]) as string,
        fullName: worksheet[0].data[rowIndex][indexes.fullName] as string,
        phoneNumber: worksheet[0].data[rowIndex][indexes.phoneNumber] as string,
        email: worksheet[0].data[rowIndex][indexes.email] as string,
        specialization: worksheet[0].data[rowIndex][indexes.specialization] as string,
        graduationDate: worksheet[0].data[rowIndex][indexes.graduationDate] as string,
        qualificationClass: worksheet[0].data[rowIndex][indexes.qualificationClass] as string,
        educationalInstitute: worksheet[0].data[rowIndex][indexes.educationalInstitute] as string,
        gpa: worksheet[0].data[rowIndex][indexes.gpa] as number,
        gpaMax: worksheet[0].data[rowIndex][indexes.gpaMax] as number,
        jobPositionId: worksheet[0].data[rowIndex][indexes.jobPositionId] as number,
        qiyasScore: worksheet[0].data[rowIndex][indexes.qiyasScore] as number,
        qualifiedSectorId: worksheet[0].data[rowIndex][indexes.qualifiedSectorId] as number,
        qualifiedSchoolId: worksheet[0].data[rowIndex][indexes.qualifiedSchoolId] as number,
        qiyasSubjectScore: worksheet[0].data[rowIndex][indexes.qiyasSubjectScore] as string,
        birthdate: worksheet[0].data[rowIndex][indexes.birthdate] as string,
        studyType: worksheet[0].data[rowIndex][indexes.studyType] as string,
        hasTakenQiyas: worksheet[0].data[rowIndex][indexes.hasTakenQiyas] as boolean,
        city: worksheet[0].data[rowIndex][indexes.city] as string,
        jobTermsAccepted: worksheet[0].data[rowIndex][indexes.jobTermsAccepted] as boolean,
        jobOfferAccepted: worksheet[0].data[rowIndex][indexes.jobOfferAccepted] as boolean,
        acceptedTermsAt: worksheet[0].data[rowIndex][indexes.acceptedTermsAt] as string,
        acceptedOfferAt: worksheet[0].data[rowIndex][indexes.acceptedOfferAt] as string,
        submittedInformationAt: worksheet[0].data[rowIndex][indexes.submittedInformationAt] as string,
        submittedAttachmentsAt: worksheet[0].data[rowIndex][indexes.submittedAttachmentsAt] as string,
        submittedSectorPreferencesAt: worksheet[0].data[rowIndex][indexes.submittedSectorPreferencesAt] as string,
        submittedPhaseOneAt: worksheet[0].data[rowIndex][indexes.submittedPhaseOneAt] as string,
        createdAt: worksheet[0].data[rowIndex][indexes.createdAt] as string,
        updatedAt: worksheet[0].data[rowIndex][indexes.updatedAt] as string,
        submittedInterViewTimeSlotAt: worksheet[0].data[rowIndex][indexes.submittedInterViewTimeSlotAt] as string,
        submittedPhaseTwoAt: worksheet[0].data[rowIndex][indexes.submittedPhaseTwoAt] as string,
        conductedInterview: worksheet[0].data[rowIndex][indexes.conductedInterview] as boolean,
        conductedInterviewAt: worksheet[0].data[rowIndex][indexes.conductedInterviewAt] as string,
        passedInterview: worksheet[0].data[rowIndex][indexes.passedInterview] as boolean,
        passedInterviewAt: worksheet[0].data[rowIndex][indexes.passedInterviewAt] as string,
        interviewNotes: worksheet[0].data[rowIndex][indexes.interviewNotes] as string,
        filesMatched: worksheet[0].data[rowIndex][indexes.filesMatched] as boolean,
        filesMatchedAt: worksheet[0].data[rowIndex][indexes.filesMatchedAt] as string,
        medicalExaminationDirections: worksheet[0].data[rowIndex][indexes.medicalExaminationDirections] as string,
        medicalExaminationLocation: worksheet[0].data[rowIndex][indexes.medicalExaminationLocation] as string,
        medicalExaminationConductedAt: worksheet[0].data[rowIndex][indexes.medicalExaminationConductedAt] as string,
        medicalExaminationPassed: worksheet[0].data[rowIndex][indexes.medicalExaminationPassed] as boolean,
        medicalExaminationPassedAt: worksheet[0].data[rowIndex][indexes.medicalExaminationPassedAt] as string,
        medicalExaminationNotes: worksheet[0].data[rowIndex][indexes.medicalExaminationNotes] as string,
        submittedSchoolPreferenceAt: worksheet[0].data[rowIndex][indexes.submittedSchoolPreferenceAt] as string,
        contractValidated: worksheet[0].data[rowIndex][indexes.contractValidated] as boolean,
        contractValidatedAt: worksheet[0].data[rowIndex][indexes.contractValidatedAt] as string,
        finalDirection: worksheet[0].data[rowIndex][indexes.finalDirection] as string,
        isPaused: worksheet[0].data[rowIndex][indexes.isPaused] as boolean,
        pausedMessage: worksheet[0].data[rowIndex][indexes.pausedMessage] as string,
        contractUrl: worksheet[0].data[rowIndex][indexes.contractUrl] as string,
        pausedAt: worksheet[0].data[rowIndex][indexes.pausedAt] as string,
        isDisqualified: worksheet[0].data[rowIndex][indexes.isDisqualified] as boolean,
        disqualifiedAt: worksheet[0].data[rowIndex][indexes.disqualifiedAt] as string,
        disqualifiedMessage: worksheet[0].data[rowIndex][indexes.disqualifiedMessage] as string,
        administrationId: worksheet[0].data[rowIndex][indexes.administrationId] as number,
        qualifiedAt: worksheet[0].data[rowIndex][indexes.qualifiedAt] as string,
        matchingIdentification: worksheet[0].data[rowIndex][indexes.matchingIdentification] as string,
        processedAt: worksheet[0].data[rowIndex][indexes.processedAt] as string,
        group: worksheet[0].data[rowIndex][indexes.group] as string,
      }
      const keys = Object.keys(record);
      keys.forEach((key: string) => {
        if (record[key] === undefined) {
          delete record[key];
        }
      })
      records.push(record)
    }

    return records;
  }

  public parseJobPositions(filePath: string): Partial<JobPosition>[] {
    /**
     * This parser will only read the first worksheet, and after the
     * first row (the labels), it will only parse the first nineteen columns
     */

    let worksheet = xlsx.parse(filePath);
    worksheet = worksheet.slice(0, 1);
    const length = worksheet[0].data.length;

    const records: Partial<JobPosition>[] = [];

    for (let rowIndex = 1; rowIndex < length; rowIndex++) {
      records.push({
        id: worksheet[0].data[rowIndex][0] as number,
        title: worksheet[0].data[rowIndex][1] as string,
        description: worksheet[0].data[rowIndex][2] as string,
        terms: worksheet[0].data[rowIndex][3] as string,
        salaryDescription: worksheet[0].data[rowIndex][4] as string,
        contractDuration: worksheet[0].data[rowIndex][5] as string,
        expectedJoiningDate: worksheet[0].data[rowIndex][6] as string,
        basicSalary: worksheet[0].data[rowIndex][7] as number,
        housing: worksheet[0].data[rowIndex][8] as number,
        transportation: worksheet[0].data[rowIndex][9] as number,
        totalSalary: worksheet[0].data[rowIndex][10] as number,
        gosi: worksheet[0].data[rowIndex][11] as number,
        netSalary: worksheet[0].data[rowIndex][12] as number,
        vacationDays: worksheet[0].data[rowIndex][13] as string,
        medicalInsurance: worksheet[0].data[rowIndex][14] as string,
        contractPeriod: worksheet[0].data[rowIndex][15] as string,
        salaryNotice: worksheet[0].data[rowIndex][16] as string,
        offerNotice: worksheet[0].data[rowIndex][17] as string,
        subject: worksheet[0].data[rowIndex][18] as string
      });
    }

    return records;
  }


  public parseInterviewTimeSlots(filePath: string): Partial<InterviewTimeSlot>[] {
    let worksheet = xlsx.parse(filePath);
    worksheet = worksheet.slice(0, 1);
    const length = worksheet[0].data.length;

    const records: Partial<InterviewTimeSlot>[] = [];

    const sanitizeDateTime = (dateVal: number, timeVal: string): string => {
      const date = new Date(1899, 12, dateVal - 1);
      const timeString = timeVal.replace(/([0-9]{1,2}\:[0-9]{2})(\s*)(AM|PM)/, '$1 $3');
      return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${timeString}`;
    }

    for (let rowIndex = 1; rowIndex < length; rowIndex++) {
      const startDateTime = new Date(sanitizeDateTime(worksheet[0].data[rowIndex][4] as number, worksheet[0].data[rowIndex][3] as string));
      const endDateTime = new Date(sanitizeDateTime(worksheet[0].data[rowIndex][6] as number, worksheet[0].data[rowIndex][5] as string));

      records.push({
        administrationID: worksheet[0].data[rowIndex][0] as number,
        googleMapsLink: worksheet[0].data[rowIndex][1] as string,
        locationName: worksheet[0].data[rowIndex][2] as string,
        startDateTime: startDateTime.toString(),
        endDateTime: endDateTime.toString(),
        maxCandidatesCapacity: worksheet[0].data[rowIndex][7] as number,
      });
    }

    return records;
  }
}
