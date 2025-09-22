import nodemailer from "nodemailer";

export async function sendEmployeeDetailsEmail(
  email: string,
  firstName: string,
  password: string,
  companyName: string
) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🎉 Welcome to ${companyName}! Your Account Details`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background-color: #4CAF50; padding: 15px; border-radius: 10px 10px 0 0;">
            <h2 style="color: #ffffff; margin: 0;">Welcome to ${companyName} 🎉</h2>
          </div>

          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333;">Dear <strong>${firstName}</strong>,</p>
            <p style="font-size: 14px; color: #555;">
              You have been added as an employee at <strong>${companyName}</strong>. Below are your login credentials:
            </p>

            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>

            <p style="font-size: 14px; color: #555; margin-top: 10px;">
              Please log in and change your password for security reasons.
            </p>

            <div style="text-align: center; margin-top: 20px;">
              <a href="https://workspace.taskforges.com/sign-in" target="_blank" style="
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                font-size: 16px;
                border-radius: 5px;">
                Login Now
              </a>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 10px; text-align: center; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 12px; color: #888;">If you did not request this, please contact HR at ${companyName}.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: `Email sent: ${info.response}` };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send email" };
  }
}
