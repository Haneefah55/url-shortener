import { Resend } from 'resend';
import 'dotenv/config'
import { EmailData } from '../interfaces/sendEmail.interface'
import { HttpException, HttpStatus } from '@nestjs/common'

const resend = new Resend(process.env.RESEND_API_KEY!);


const sender = 'Echo <onboarding@resend.dev>'

export const sendEmail = async(emailData: EmailData)=> {

    
      const { data, error } = await resend.emails.send({
      from: sender,
      to: "olasupoomotayo@gmail.com", //emailData.email,
      subject: emailData.subject,
      html: emailData.template
    })
  if (error){
    return { success: false, error }
  }
  
      console.log("email response", data)

      return({ success: true, data })
    
  /**
      console.log("Error sending email", error.message)
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
      **/
    
  }

