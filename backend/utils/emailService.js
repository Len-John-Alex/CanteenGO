const nodemailer = require('nodemailer');

// Helper to create Gmail transporter
const createGmailTransporter = (port, secure) => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: port,
        secure: secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Unified email sending with Port 465 -> 587 fallback
const sendEmailWithFallback = async (mailOptions) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('EMAIL_USER or EMAIL_PASS not defined in environment variables');
        return false;
    }

    // Try Port 465 first (SSL)
    try {
        console.log(`Attempting to send email to ${mailOptions.to} via Port 465...`);
        const transporter465 = createGmailTransporter(465, true);
        const info = await transporter465.sendMail(mailOptions);
        console.log('Email sent successfully via Port 465:', info.messageId);
        return true;
    } catch (error) {
        console.warn('Port 465 failed, trying Port 587 (STARTTLS)...', error.message);

        // Try Port 587 as fallback (STARTTLS)
        try {
            const transporter587 = createGmailTransporter(587, false);
            const info = await transporter587.sendMail(mailOptions);
            console.log('Email sent successfully via Port 587:', info.messageId);
            return true;
        } catch (error587) {
            console.error('Final email error (Both 464 and 587 failed):', error587.message);

            // Fallback log for development/debugging if both fail
            if (mailOptions.subject.includes('Verification')) {
                console.log('==========================================');
                console.log('EMAIL SENDING FAILED - FALLBACK LOG');
                console.log(`Recipient: ${mailOptions.to}`);
                // Extract code from HTML if possible or just log failure
                console.log('==========================================');
            }
            return false;
        }
    }
};

const sendVerificationEmail = async (to, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'CanteenGO - Email Verification',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to CanteenGO!</h2>
                <p>Please verify your email address using the code below:</p>
                <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${code}</h1>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not sign up for this account, please ignore this email.</p>
            </div>
        `
    };
    return sendEmailWithFallback(mailOptions);
};

const sendWelcomeEmail = async (to, name, role = 'student') => {
    const isStaff = role === 'staff';
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: isStaff ? 'Welcome to the CanteenGO Staff Team!' : 'Welcome to CanteenGO!',
        html: `
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
        `
    };
    return sendEmailWithFallback(mailOptions);
};

module.exports = { sendVerificationEmail, sendWelcomeEmail };
