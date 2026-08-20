import { sendEmail } from './email.config'
import { User } from '../interfaces/user.interface'
import { VERIFICATIONEMAILTEMP } from './emailTemplate'



export const sendVerificationEmail =async(user: User) =>{

  const year = new Date().getFullYear()
  console.log("year", year)
  const data = {
    email: user.email,
    emailType: "Verification Email",
    subject: "Verify your email",
    template: VERIFICATIONEMAILTEMP.replaceAll("{{VERIFICATION_CODE}}", user.verificationToken).replaceAll("{{year}}", String(year))
  }
  
  const result = await sendEmail(data)
  console.log("email result", result)
}