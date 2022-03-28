import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {PhoneNumberFormat, PhoneNumberUtil} from 'google-libphonenumber';
const unifonicLib = require('unifonic-next-gen-lib');

@injectable({scope: BindingScope.TRANSIENT})
export class SMSService {

  private disableSending = false;
  private appsid: string = '';
  private senderName: string;
  private phoneUtils: PhoneNumberUtil;
  private REGION = 'SA'

  constructor(/* Add @inject to inject parameters */) {
    this.phoneUtils = PhoneNumberUtil.getInstance();

    unifonicLib.Configuration.basicAuthUserName = process.env.UNIFONIC_USERNAME;
    unifonicLib.Configuration.basicAuthPassword = process.env.UNIFONIC_PASSWORD;
    this.appsid = process.env.UNIFONIC_APPSID ?? '';
    this.senderName = process.env.UNIFONIC_SENDERNAME ?? '';

    if (process.env.PREVENT_SMS_SENDING === 'true') {
      this.disableSending = true;
    }
  }

  validateNumber(phoneNumber: string): boolean {
    const number = this.phoneUtils.parse(phoneNumber, this.REGION);
    return this.phoneUtils.isValidNumberForRegion(number, this.REGION);
  }

  getNumber(phoneNumber: string): string {
    const number = this.phoneUtils.parse(phoneNumber, this.REGION);
    return this.phoneUtils.format(number, PhoneNumberFormat.E164).replace('+', '');
  }

  public async send(phoneNumber: string, message: string): Promise<boolean> {
    // Validate phone number before sending
    if (!this.validateNumber(phoneNumber)) throw new Error('The phone number entered is not valid');

    const sanitizedNumber = this.getNumber(phoneNumber);

    if (this.disableSending) {
      console.log(`Sending a SMS to "${phoneNumber}" with the following message: "${message}"`);
      return true;
    }

    try {
      const restController = unifonicLib.RestController;
      const response = await restController.createSendMessage(this.appsid, this.senderName, message, sanitizedNumber, 'JSON', '', true, 'sent', false);
      if (response.success === true) {
        return true;
      } else {
        throw new HttpErrors.InternalServerError(`The SMS service is unavailable. Error ${response.errorCode}`);
      }
    } catch (err) {
      throw new HttpErrors.InternalServerError(`The SMS service is unavailable. Error ${err.errorCode}`);
    }
  }
}
