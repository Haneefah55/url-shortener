import { Resend } from 'resend';
import 'dotenv/config'
import { EmailData } from '../interfaces/sendEmail.interface'
import { HttpException, HttpStatus } from '@nestjs/common'

const resend = new Resend(process.env.RESEND_API_KEY!);


const sender = 'Echo <onboarding@resend.dev>'

export const sendEmail = async(data: EmailData)=> {

    try {
      const result = await resend.emails.send({
      from: sender,
      to: data.email,
      subject: data.subject,
      html: data.template
    })
      console.log("email sent successfully")
      console.log("email response", result)
      

      return({ success: true, message: `${data.emailType} sent successfully` })
    } catch (error: any) {
      console.log("Error sending email", error.message)
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

