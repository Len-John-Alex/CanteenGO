// Email service stubbed out as OTP verification has been removed
const sendVerificationEmail = async (to, code) => {
    console.log('Skipping verification email (OTP feature removed)');
    return true;
};

const sendWelcomeEmail = async (to, name, role = 'student') => {
    console.log('Skipping welcome email (Email service deactivated)');
    return true;
};

module.exports = { sendVerificationEmail, sendWelcomeEmail };
