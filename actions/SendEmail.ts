// actions/SendEmail.ts

import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs'
import hbs from 'hbs'

const loadTemplate=(templateName: string,replacements: { title: string; username: any; otp: any; message: string; })=>{
  const templatePath=path.join(__dirname,"../emailTemplate",templateName)
  const source=fs.readFileSync(templatePath,'utf-8')
  const template=hbs.compile(source)
  return template(replacements)
}


export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || '',
      pass: process.env.GMAIL_PASSWORD || '',
    },
  });

  const mailOptions = {
    from: '"Finance App" <onboarding@yourdomain.com>',
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}


onst htmlTemplate=loadTemplate('otpTemplate.hbs',{
  title:'OTP VERIFICATION',
  username:newUser.username,
  otp,
  message:"YOUR ONE-TIME PASSWORD(OTP) FOR ACCOUNT VERIFICATION IS",

})

try{
  await sendEmail({
      email:newUser.email,
      subject:"OTP FOR EMAIL VERIFICATION",
      html:htmlTemplate,
  })
