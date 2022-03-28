import { /* inject, */ BindingScope, injectable} from '@loopback/core';

interface TemplateData {
  [key: string]: string
};

@injectable({scope: BindingScope.TRANSIENT})
export class TemplateService {
  constructor(/* Add @inject to inject parameters */) { }

  private replace(template: string, data: TemplateData): string {
    for (const key in data) {
      template = template.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    }
    return template;
  }

  otpSMS(data: {code: string}): string {
    const template = "{code} is your verification code for Tatweer. This code is valid for 5 minutes.";
    return this.replace(template, data);
  }
}
