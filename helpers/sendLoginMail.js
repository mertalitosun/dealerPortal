const nodemailer = require("nodemailer");
const smtpServer = process.env.smtpServer;
const smtpPort = process.env.smtpPort;
const smtpUsername = process.env.smtpUsername;
const smtpPassword = process.env.smtpPassword;

const sendLoginMail = async (to, subject, text) => {
  let transporter = nodemailer.createTransport({
    host: smtpServer,
    port: smtpPort,
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
  });

  let mailOptions = {
    from: smtpUsername,
    to: to,
    subject: subject,
    text: text,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("mail Gönderildi:" + info.response);
  } catch (err) {
    console.log(err);
  }


  

};

module.exports = sendLoginMail;