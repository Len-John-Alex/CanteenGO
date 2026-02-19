const nodemailer = require('nodemailer');

const createTransporter = () => {
    console.log('Creating mail transporter...');

    // Explicit Gmail configuration for better reliability on cloud platforms like Render
    if (process.env.EMAIL_SERVICE === 'gmail' || process.env.EMAIL_USER?.endsWith('@gmail.com')) {
        console.log('Using explicit Gmail SMTP configuration (Port 465)');
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // Use SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Generic service configuration
    if (process.env.EMAIL_SERVICE) {
        console.log(`Using generic service: ${process.env.EMAIL_SERVICE}`);
        return nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Fallback to custom SMTP if host is provided
    if (process.env.SMTP_HOST) {
        console.log(`Using custom SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    console.error('No email configuration found in environment variables!');
    return null;
};

const sendVerificationEmail = async (to, code) => {
    console.log(`Attempting to send verification email to: ${to}`);
    const transporter = createTransporter();

    if (!transporter) {
        console.log('==========================================');
        console.log('EMAIL SERVICE NOT CONFIGURED - CHECK ENV VARS');
        console.log(`Service: ${process.env.EMAIL_SERVICE}`);
        console.log(`User: ${process.env.EMAIL_USER}`);
        console.log(`Pass defined: ${!!process.env.EMAIL_PASS}`);
        console.log('==========================================');
        return true;
    }

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

    try {
        console.log('Transporter created, sending mail...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        console.log('SMTP Config used:', {
            service: process.env.EMAIL_SERVICE,
            user: process.env.EMAIL_USER,
            passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
        });

        console.log('==========================================');
        console.log('EMAIL SENDING FAILED - FALLBACK LOG');
        console.log(`Verification Code: ${code}`);
        console.log('==========================================');
        return false;
    }
};

const sendWelcomeEmail = async (to, name, role = 'student') => {
    const transporter = createTransporter();

    if (!transporter) {
        console.log('==========================================');
        console.log('EMAIL SERVICE NOT CONFIGURED');
        console.log(`Welcome Email To: ${to} (${name}, Role: ${role})`);
        console.log('==========================================');
        return true;
    }

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

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

module.exports = { sendVerificationEmail, sendWelcomeEmail };

