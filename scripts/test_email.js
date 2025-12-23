const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('--- Testing Email Configuration ---');
    console.log('User:', process.env.EMAIL_USER ? 'Set' : 'Missing');
    // Don't print the actual password, just check existence
    console.log('Pass:', process.env.EMAIL_PASSWORD ? 'Set' : 'Missing');
    console.log('Host:', process.env.SMTP_SERVER || 'default(smtp.gmail.com)');
    console.log('Port:', process.env.SMTP_PORT || 'default(587)');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('ERROR: Missing EMAIL_USER or EMAIL_PASSWORD in .env file.');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVER || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    try {
        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('✅ Connection Successful!');

        console.log('Attempting to send test email...');
        await transporter.sendMail({
            from: `"Test Script" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Antigravity',
            text: 'If you receive this, your email configuration works!'
        });
        console.log('✅ Email Sent Successfully to ' + process.env.EMAIL_USER);

    } catch (err) {
        console.error('❌ Email Test Failed:');
        console.error(err.message);
        if (err.code === 'EAUTH') {
            console.error('Hint: Check your username/password. If using Gmail, make sure you are using an App Password.');
        }
    }
}

testEmail();
