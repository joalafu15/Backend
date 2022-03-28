import {BindingScope, injectable} from '@loopback/core';
import {createTransport} from 'nodemailer';
import {User} from '../models';


type RequestResetPassword = {
  email: string;
};
type ResetPassword = {
  nationalIdNumber: string;
  email: string;
  code: string;
  password: string;
}
export type UserRequestResetPassword = RequestResetPassword;;
export type UserResetPassword = ResetPassword;
@injectable({scope: BindingScope.TRANSIENT})
export class EmailService {

  private static async setupTransporter() {
    return createTransport({
      host: process.env.SMTP_HOST,
      port: +process.env.SMTP_PORT!,
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
  async sendResetPasswordMail(user: User) {
    const transporter = await EmailService.setupTransporter();
    const emailTemplate = ({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USERNAME,
      to: user.email,
      subject: 'اعادة ضبط كلمة المرور منصة الطفولة المبكرة',
      html: `
<div>
  <p>مرحبا, ${user.name}</p>
  <p style="color: red;">وصلنا طلبك لاعادة ضبط كلمة المرور لمنصة الطفولة المبكرة</p>
  <p>لاعادة ضبط كلمة المرور الرجاء استخدام الرمز الخاص:</p>
  <div>الرمز: ${user.resetKey}</div>
  <p>اذا لم تقم بطلب اعادة ضبط كلمة المرور، الرجاء تجاهل هذه الرسالة</p>
  <p>نتمنى لكم التوفيق</p>
</div>
      `,
    });

    return transporter.sendMail(emailTemplate);

  }
}
