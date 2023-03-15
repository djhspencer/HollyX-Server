require("dotenv").config();
const nodeMailer = require('nodemailer');

async function sendMail(emailAddress, eventLink) {

  //let testAccount = await nodeMailer.createTestAccount();

  let config = {
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  }
  let transporter1 = nodeMailer.createTransport(config);

  let info = await transporter1.sendMail({
    from: '"HollyX" <devopper9021@gmail.com>', // sender address
    to: "devopper9021@gmail.com", // list of receivers
    subject: "You've been invited!", // Subject line
    text: "Hello world????", // plain text body
    html: `<a href="${eventLink}">RSVP to event</a>`, // html body
  });

  //console.log(nodeMailer.getTestMessageUrl(info));
  console.log(info)
}

module.exports = {
  sendMail
}