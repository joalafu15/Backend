import {BindingScope, inject, injectable} from '@loopback/core';
import {totp} from 'otplib';
import {OTP_SECRET, OTP_STEP, OTP_WINDOW} from '../keys';

@injectable({scope: BindingScope.TRANSIENT})
export class OTPService {
  protected salt: string;
  protected options: {
    digits: number,
    step: number,
    window: number
  };

  constructor(
    @inject(OTP_SECRET) otpSecret: string,
    @inject(OTP_STEP) otpStep: number,
    @inject(OTP_WINDOW) otpWindow: number,
  ) {
    this.salt = otpSecret;
    this.options = {
      digits: 6,
      step: otpStep,
      window: otpWindow,
    };
  }

  private saltSecret(secret: string): string {
    return `${this.salt}.${secret}`;
  }

  public generate(secret: string): string {
    totp.options = this.options;
    return totp.generate(this.saltSecret(secret));
  }

  public verify(token: string, secret: string): boolean {
    totp.options = this.options;
    return totp.verify({
      token: token,
      secret: this.saltSecret(secret)
    });
  }
}
