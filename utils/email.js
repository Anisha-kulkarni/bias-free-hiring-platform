const nodemailer = require('nodemailer');

const APP_NAME = process.env.APP_NAME || "Student Portal";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const ACADEMIC_YEAR = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);

const createTransporter = () => {
    // Check if credentials exist
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        console.warn('Email credentials (EMAIL_USER/EMAIL_PASSWORD) are missing. Email sending will be simulated.');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_SERVER || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });
};

const getBaseTemplate = (content) => `
    <div style="font-family: 'Inter', sans-serif; background: #f3f4f6; padding: 40px; color: #1f2937;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: #7c3aed; padding: 20px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 1.5rem;">${APP_NAME}</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 0.9rem;">Academic Year ${ACADEMIC_YEAR}</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
                ${content}
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 10px; color: #374151; font-size: 0.9rem;">Campus Resources</h4>
                <div style="font-size: 0.85rem; color: #6b7280; display: flex; gap: 15px; flex-wrap: wrap;">
                    <a href="${FRONTEND_URL}/library" style="color: #7c3aed; text-decoration: none;">📚 Library</a>
                    <a href="${FRONTEND_URL}/schedule" style="color: #7c3aed; text-decoration: none;">📅 Class Schedule</a>
                    <a href="${FRONTEND_URL}/support" style="color: #7c3aed; text-decoration: none;">🤝 Student Support</a>
                </div>
                <p style="margin-top: 20px; font-size: 0.75rem; color: #9ca3af; text-align: center;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                    This message was sent to you as a registered student.
                </p>
            </div>
        </div>
    </div>
`;

const sendEmail = async (to, subject, html) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.log(`[SIMULATION] Email to ${to}: ${subject}`);
        return true;
    }

    try {
        await transporter.sendMail({
            from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`[EMAIL] Sent to ${to}`);
        return true;
    } catch (error) {
        console.error('[EMAIL ERROR]', error);
        return false;
    }
};

const sendVerificationEmail = async (email, token, user) => {
    const link = `${FRONTEND_URL}/verify-email?token=${token}`;
    const content = `
        <h2 style="color: #111827; margin-top: 0;">Welcome, ${user.name}! 🎓</h2>
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #047857; font-weight: 500;">Student ID: ${user.id}</p>
        </div>
        <p style="color: #4b5563; line-height: 1.6;">
            You have successfully registered for the ${APP_NAME}. To access your courses, personalized learning path, and campus resources, please verify your school email address.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);">
                Verify Student Account
            </a>
        </div>
        
        <p style="color: #6b7280; font-size: 0.875rem;">
            <strong>Tip:</strong> Once verified, check your dashboard for upcoming assignments in the "${ACADEMIC_YEAR}" semester schedule.
        </p>
    `;
    return sendEmail(email, `Verify your ${APP_NAME} Account`, getBaseTemplate(content));
};

const sendPasswordResetEmail = async (email, token, user) => {
    const link = `${FRONTEND_URL}/reset-password/${token}`;
    const content = `
        <h2 style="color: #111827; margin-top: 0;">Password Reset Request 🔐</h2>
        <p style="color: #4b5563;">Hello ${user.name} (ID: ${user.id}),</p>
        <p style="color: #4b5563; line-height: 1.6;">
            We received a request to reset the password for your student portal account. 
            If you did not make this request, please contact IT Support immediately.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Reset Password
            </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 0.75rem;">
            This link is valid for 1 hour. Access to campus resources (Library, Labs) remains unaffected until password change.
        </p>
    `;
    return sendEmail(email, `Reset Your ${APP_NAME} Password`, getBaseTemplate(content));
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
