import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (emails, title, content) => {
  try {
    const info = await transporter.sendMail({
      from: `"S.P.I.T Exam Section" <${process.env.SMTP_MAIL}>`,
      to: emails.join(', '),
      subject: title, 
      html: content,
    });
  
    console.log(info)
  } catch (error) {
    console.log(error)
  }
}

export const sendResultEmail = async (email, title, content, attachments) => {
  if (email != 'aditya.kharote@spit.ac.in') return;

  try {
    const info = await transporter.sendMail({
      from: `"S.P.I.T Exam Section" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: title, 
      html: content,
      attachments: attachments
    });
  
    console.log(info)
  } catch (error) {
    console.log(error)
  }
}