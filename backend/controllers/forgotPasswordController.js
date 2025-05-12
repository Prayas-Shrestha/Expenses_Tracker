const User = require("../models/User");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

//  Mailtrap SMTP
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const code = generateCode();
    const expiry = Date.now() + 10 * 60 * 1000;

    user.resetCode = code;
    user.resetCodeExpires = expiry;
    await user.save();

    await transporter.sendMail({
      from: "Expense Tracker <no-reply@expense-tracker.com>",
      to: email,
      subject: "OTP Code",
      text: `Your code is ${code}. It expires in 10 minutes.`
    });

    res.status(200).json({ msg: "OTP sent" });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// ✅ Step 2: Verify user-submitted code
exports.verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.resetCode !== code) {
      return res.status(400).json({ msg: "Invalid verification code" });
    }

    if (Date.now() > user.resetCodeExpires) {
      return res.status(410).json({ msg: "Verification code expired" });
    }

    res.status(200).json({ msg: "Verification code is valid" });
  } catch (error) {
    console.error("❌ Verify Code Error:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// ✅ Step 3: Reset user password after verification
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    // Validate code again
    if (!user || user.resetCode !== code) {
      return res.status(400).json({ msg: "Invalid code or email" });
    }

    if (Date.now() > user.resetCodeExpires) {
      return res.status(410).json({ msg: "Verification code expired" });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;

    await user.save();

    res.status(200).json({ msg: "Password has been reset successfully" });
  } catch (error) {
    console.error("❌ Reset Password Error:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
