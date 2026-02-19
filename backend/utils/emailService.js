const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev'; // Resend's default sender for unverified domains

const sendEmail = async (to, subject, html) => {
    try {
        console.log(`Attempting to send email to ${to} via Resend...`);
        const { data, error } = await resend.emails.send({
            from: `CanteenGO <${FROM_EMAIL}>`,
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Resend Error:', error);
            return false;
        }

        console.log('Email sent successfully via Resend:', data.id);
        return true;
    } catch (error) {
        console.error('Resend Exception:', error.message);
        return false;
    }
};

const sendVerificationEmail = async (to, code) => {
    const subject = 'CanteenGO - Email Verification';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to CanteenGO!</h2>
            <p>Please verify your email address using the code below:</p>
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${code}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not sign up for this account, please ignore this email.</p>
        </div>
    `;

    const result = await sendEmail(to, subject, html);

    if (!result) {
        console.log('==========================================');
        console.log('EMAIL SENDING FAILED - FALLBACK LOG');
        console.log(`Recipient: ${to}`);
        console.log(`Verification Code: ${code}`);
        console.log('==========================================');
    }

    return result;
};

const sendWelcomeEmail = async (to, name, role = 'student') => {
    const isStaff = role === 'staff';
    const subject = isStaff ? 'Welcome to the CanteenGO Staff Team!' : 'Welcome to CanteenGO!';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #667eea;">Hi ${name},</h2>
            <p>Your email has been successfully verified! Welcome to the <strong>CanteenGO</strong> ${isStaff ? 'Staff Team' : 'family'}.</p>
            
            ${isStaff ? `
                <p>You can now log in to the staff dashboard to manage orders, menu items, and student feedback.</p>
                <div style="margin-top: 30px; padding: 20px; background-color: #f0f4f8; border-radius: 10px; border-left: 5px solid #667eea;">
                    <h3 style="margin-top: 0; color: #2d3748;">Staff Dashboard Features:</h3>
                    <ul style="padding-left: 20px;">
                        <li>Live order management and processing</li>
                        <li>QR code scanning for order verification</li>
                        <li>Menu management and stock updates</li>
                        <li>Real-time revenue monitoring</li>
                        <li>Managing student records and feedback</li>
                    </ul>
                </div>
            ` : `
                <p>You can now log in and start ordering your favorite meals.</p>
                <div style="margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 10px;">
                    <h3 style="margin-top: 0; color: #4a5568;">What's next?</h3>
                    <ul style="padding-left: 20px;">
                        <li>Browse our daily specials</li>
                        <li>Add items to your cart</li>
                        <li>Select a convenient time slot</li>
                        <li>Pick up your order without the wait!</li>
                    </ul>
                </div>
            `}
            
            <p style="margin-top: 30px;">${isStaff ? 'We are glad to have you with us!' : 'Happy eating!'}</p>
            <p>Best regards,<br>The Canteen Team</p>
        </div>
    `;
    return sendEmail(to, subject, html);
};

module.exports = { sendVerificationEmail, sendWelcomeEmail };
