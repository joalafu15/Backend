import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {PhoneNumberFormat, PhoneNumberUtil} from 'google-libphonenumber';
import {google, identitytoolkit_v3} from 'googleapis';
import {PhoneVerification} from '../models';
import {PhoneVerificationRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class FirebaseService {
  private phoneUtils: PhoneNumberUtil;
  private REGION = 'SA';

  private identityToolkit: identitytoolkit_v3.Identitytoolkit;

  constructor(
    @repository('PhoneVerificationRepository') protected phoneVerificationRepository: PhoneVerificationRepository,
  ) {
    this.phoneUtils = PhoneNumberUtil.getInstance();
    this.identityToolkit = google.identitytoolkit({
      auth: process.env.FIREBASE_SERVER_KEY,
      version: 'v3',
    });
  }

  validateNumber(phoneNumber: string): boolean {
    const number = this.phoneUtils.parse(phoneNumber, this.REGION);
    return this.phoneUtils.isValidNumber(number);
  }

  getNumber(phoneNumber: string): string {
    const number = this.phoneUtils.parse(phoneNumber, this.REGION);
    return this.phoneUtils.format(number, PhoneNumberFormat.E164);
  }

  public async sendVerificationCode(candidateId: string, phoneNumber: string, recaptchaToken: string): Promise<boolean> {
    // Validate phone number first
    if (!this.validateNumber(phoneNumber)) throw new Error("The phone number entered is not valid");

    const sanitizedNumber = this.getNumber(phoneNumber);

    let sessionInfo: string;
    try {
      const response = await this.identityToolkit.relyingparty.sendVerificationCode({
        requestBody: {
          phoneNumber: sanitizedNumber,
          recaptchaToken,
        }
      });
      if (!response?.data?.sessionInfo) throw new Error();
      sessionInfo = response.data.sessionInfo;
    } catch (err) {
      throw new Error("An error ocurred during phone verification");
    }

    await this.phoneVerificationRepository.create(new PhoneVerification({
      candidateId,
      sessionInfo
    }));

    return true;
  }

  public async verifyPhoneNumber(code: string, candidateId: string): Promise<boolean> {
    const verificationRecord = await this.phoneVerificationRepository.findOne({where: {candidateId}});
    if (!verificationRecord) return false;

    let verified = false;
    try {
      const response = await this.identityToolkit.relyingparty.verifyPhoneNumber({
        requestBody: {
          code,
          sessionInfo: verificationRecord.sessionInfo,
        }
      });
      if (response?.data?.idToken) verified = true;
      else verified = false;
    } catch (err) {
      if (err.code === 400) verified = false;
      else throw new Error("An error ocurred during phone verification");
    }

    if (!verified) return false;

    await this.phoneVerificationRepository.deleteAll({candidateId: verificationRecord.candidateId});
    return true;
  }
}
