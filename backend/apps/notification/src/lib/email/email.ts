import { sendEmail } from './email.config'
import { User } from '../interfaces/user.interface'
import { VERIFICATIONEMAILTEMP } from './emailTemplate'



export const sendVerificationEmail =async(email, token) =>{

    const year = new Date().getFullYear()
 // console.log("year", year)
  console.log("token", token)
  const data = {
    email,
    emailType: "Verification Email",
    subject: "Verify your email",
    template: VERIFICATIONEMAILTEMP.replaceAll("{{VERIFICATION_CODE}}", token).replaceAll("{{year}}", String(year))
  }
  
  const result = await sendEmail(data)

    if(result.error){
      return ({message: "Failed to send verification email", error: result.error})

    }
    console.log("email sent successfully")
  console.log("email result", result)
  return ({ message: "verification email sent successfully", data: result.data})
  
    
  
  
}