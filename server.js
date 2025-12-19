const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./src/db'); // MySQL Pool
const engine = require('./src/engine');
const aiService = require('./src/aiService'); // Import AI Service

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(session({
    secret: 'antigravity_secret_key_123', // In prod, use env var
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set true if using HTTPS
}));

// User Deserialization Middleware
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
            if (rows.length > 0) {
                const dbUser = rows[0];
                req.user = {
                    id: dbUser.id,
                    name: dbUser.name,
                    email: dbUser.email,
                    preferences: {
                        learningStyle: dbUser.learning_style,
                        pacing: dbUser.pacing,
                        currentLevel: dbUser.current_level
                    }
                };
                res.locals.user = req.user;
            } else {
                res.locals.user = null;
            }
        } catch (err) {
            console.error("Session Auth Error:", err);
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
});

// Auth Guard Middleware
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.render('landing', { title: 'Welcome | Antigravity Learning' });
});

// Login Routes
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login | Antigravity', error: null });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            // Simple password check (plaintext for demo as requested by "password123" default)
            if (user.password === password) {
                req.session.userId = user.id;
                return res.redirect('/dashboard');
            }
        }
        res.render('login', { title: 'Login | Antigravity', error: 'Invalid email or password' });
    } catch (err) {
        console.error(err);
        res.render('login', { title: 'Login | Antigravity', error: 'An error occurred' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Registration Routes
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register | Antigravity', error: null });
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Check if user exists
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.render('register', { title: 'Register | Antigravity', error: 'Email already in use' });
        }

        // Insert new user
        const id = 'u' + Date.now(); // Simple ID generation
        await db.execute(
            'INSERT INTO users (id, name, email, password, learning_style, pacing, current_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, email, password, 'visual', 'moderate', 1] // Defaults
        );

        // --- EMAIL SENDING LOGIC ---
        const nodemailer = require("nodemailer");

        // Use credentials from .env
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (emailUser && emailPass && emailUser !== 'your_gmail@gmail.com') {
            try {
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: emailUser,
                        pass: emailPass
                    }
                });

                console.log(`[EMAIL] Attempting to send welcome email to ${email}...`);

                await transporter.sendMail({
                    from: `"Antigravity Learning" <${emailUser}>`,
                    to: email,
                    subject: "Welcome to Antigravity Learning! 🚀",
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h1 style="color: #7c3aed;">Welcome, ${name}!</h1>
                            <p>We are thrilled to have you on board.</p>
                            <p>You can verify your account and start learning immediately.</p>
                            <br>
                            <a href="http://localhost:3000/dashboard" style="padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                            <p style="margin-top: 20px; font-size: 0.8rem; color: #666;">If you didn't request this, please ignore this email.</p>
                        </div>
                    `,
                });
                console.log("[EMAIL] Sent successfully!");
            } catch (emailErr) {
                console.error("[EMAIL ERROR] Failed to send email:", emailErr.message);
                // Do not block registration if email fails
            }
        } else {
            console.log("[EMAIL SKIPPED] Email credentials not configured or are placeholders.");
            console.log(`[SIMULATION] Would have sent to: ${email}`);
        }

        // Auto login
        req.session.userId = id;
        res.redirect('/placement'); // Redirect to placement for new users
    } catch (err) {
        console.error("Register Error:", err);
        res.render('register', { title: 'Register | Antigravity', error: 'Registration failed' });
    }
});

app.get('/placement', requireAuth, (req, res) => {
    res.render('placement', { title: 'Diagnostic Test' });
});

app.post('/placement-test', requireAuth, async (req, res) => {
    try {
        await db.execute(
            'UPDATE users SET learning_style = ?, pacing = ? WHERE id = ?',
            [req.body.learningStyle, req.body.pacing, req.user.id]
        );
        // Update session user pref immediately for this request if needed, 
        // but reload on next request handles it.
    } catch (err) {
        console.error("Update Error:", err);
    }
    res.redirect('/dashboard');
});

// Forgot Password Routes
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { title: 'Reset Password', error: null, message: null });
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Security: Don't reveal if user exists, but for UX in this demo might be useful.
            // Let's pretend we sent it to avoid enumeration attacks, OR show error for demo clarity.
            // For this specific user request, they want it to work, so let's be explicit if it fails for now.
            return res.render('forgot-password', { title: 'Reset Password', error: 'No account found with that email.', message: null });
        }

        const user = users[0];
        const nodemailer = require("nodemailer");
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        // Send check
        if (emailUser && emailPass && emailUser !== 'your_gmail@gmail.com') {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: emailUser, pass: emailPass }
            });

            await transporter.sendMail({
                from: `"Antigravity Support" <${emailUser}>`,
                to: email,
                subject: "Password Reset Request 🔐",
                html: `
                    <div style="font-family: Arial; padding: 20px; color: #333;">
                        <h2 style="color: #7c3aed;">Reset Your Password</h2>
                        <p>Hi ${user.name},</p>
                        <p>We received a request to reset your password.</p>
                        <a href="http://localhost:3000/reset-password/${user.id}" style="padding: 10px 20px; background: #7c3aed; color: white; border-radius: 5px; text-decoration: none;">Reset Password</a>
                        <p style="font-size: 0.8rem; margin-top: 20px;">If this wasn't you, please ignore this email.</p>
                    </div>
                `
            });
            console.log(`[EMAIL] Password reset sent to ${email}`);
        } else {
            console.log(`[SIMULATION] Password reset link for ${email}: http://localhost:3000/reset-password/${user.id}`);
        }

        res.render('forgot-password', { title: 'Reset Password', error: null, message: 'If an account exists, a reset link has been sent to your email.' });

    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.render('forgot-password', { title: 'Reset Password', error: 'Something went wrong. Try again.', message: null });
    }
});

app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const learningPath = await engine.generatePath(req.user.preferences);
        // Mock Mastery Data for Dashboard visualization
        const masteryStats = {
            algebra: 75,
            geometry: 45,
            calculus: 20
        };

        console.log("Rendering dashboard for user:", req.user.email);
        // console.log("Stats:", masteryStats); 

        res.render('dashboard', {
            title: 'Dashboard | Antigravity',
            path: learningPath,
            stats: masteryStats
        });
    } catch (err) {
        console.error("Dashboard Render Error:", err);
        res.status(500).send("Server Error: " + err.message);
    }
});

app.get('/unit/:id', requireAuth, async (req, res) => {
    try {
        // Increment views
        try {
            await db.query('UPDATE units SET views = views + 1 WHERE id = ?', [req.params.id]);
        } catch (e) {
            // Ignore if column missing 
        }

        const [rows] = await db.query('SELECT * FROM units WHERE id = ?', [req.params.id]);
        const unit = rows[0];

        if (!unit) return res.status(404).send('Unit not found');
        res.render('unit', { title: unit.title, unit });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// AI Question Generator (Uses Real AI Service)
app.post('/api/generate-questions', requireAuth, async (req, res) => {
    try {
        const { topic, difficulty } = req.body;

        // Call AI Service
        const questions = await aiService.generateQuestions(topic, difficulty || 2);

        // Store in Database
        await db.execute(
            'INSERT INTO generated_questions (user_id, topic, questions) VALUES (?, ?, ?)',
            [req.session.userId, topic, JSON.stringify(questions)]
        );

        res.json({ questions });
    } catch (err) {
        console.error("AI Generation Error:", err);
        res.status(500).json({ error: "Failed to generate questions" });
    }
});

// Chat API (Uses Real AI Service)
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { message, contextUnit } = req.body;

        // Call AI Service
        const aiResponse = await aiService.getChatResponse(message, contextUnit);

        // Store interaction
        await db.execute(
            'INSERT INTO ai_chat_history (user_id, message_from_user, message_from_ai, context_unit) VALUES (?, ?, ?, ?)',
            [req.session.userId, message, aiResponse, contextUnit || null]
        );

        res.json({ response: aiResponse });
    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ error: "Chat failed" });
    }
});

app.get('/teacher', requireAuth, async (req, res) => {
    try {
        const [usersRows] = await db.query('SELECT * FROM users');

        // Adapt rows for view
        const adaptUsers = usersRows.map(u => ({
            name: u.name,
            email: u.email,
            preferences: {
                learningStyle: u.learning_style,
                pacing: u.pacing,
                currentLevel: u.current_level
            }
        }));

        const stats = {
            totalStudents: adaptUsers.length,
            learningStyles: {
                visual: adaptUsers.filter(u => u.preferences.learningStyle === 'visual').length,
                textual: adaptUsers.filter(u => u.preferences.learningStyle === 'textual').length
            }
        };

        res.render('teacher-dashboard', {
            title: 'Teacher Dashboard | Antigravity',
            students: adaptUsers,
            stats
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// --- SETTINGS ROUTES ---

app.get('/settings', requireAuth, (req, res) => {
    const { success, error } = req.query;
    res.render('settings', {
        title: 'Settings | Antigravity',
        success: success,
        error: error
    });
});

app.post('/settings/profile', requireAuth, async (req, res) => {
    const { name, email } = req.body;
    try {
        // Check if email is taken by another user
        const [existing] = await db.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existing.length > 0) {
            return res.redirect('/settings?error=Email already in use by another account');
        }

        await db.execute(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, req.user.id]
        );
        res.redirect('/settings?success=Profile updated successfully');
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.redirect('/settings?error=Failed to update profile');
    }
});

app.post('/settings/preferences', requireAuth, async (req, res) => {
    const { learningStyle, pacing } = req.body;
    try {
        await db.execute(
            'UPDATE users SET learning_style = ?, pacing = ? WHERE id = ?',
            [learningStyle, pacing, req.user.id]
        );
        res.redirect('/settings?success=Preferences saved');
    } catch (err) {
        console.error("Preferences Update Error:", err);
        res.redirect('/settings?error=Failed to update preferences');
    }
});

app.post('/settings/password', requireAuth, async (req, res) => {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.redirect('/settings?error=Passwords do not match');
    }

    if (password.length < 6) {
        return res.redirect('/settings?error=Password must be at least 6 characters');
    }

    try {
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [password, req.user.id]
        );
        res.redirect('/settings?success=Password changed successfully');
    } catch (err) {
        console.error("Password Update Error:", err);
        res.redirect('/settings?error=Failed to change password');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
