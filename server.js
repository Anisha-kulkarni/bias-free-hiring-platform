const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./src/db'); // MySQL Pool
const engine = require('./src/engine');
const aiService = require('./src/aiService'); // Import AI Service
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('./utils/email');

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
    secret: process.env.SESSION_SECRET || 'antigravity_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
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
                    isVerified: dbUser.is_verified,
                    preferences: {
                        learningStyle: dbUser.learning_style,
                        pacing: dbUser.pacing,
                        currentLevel: dbUser.current_level
                    }
                };
                res.locals.user = req.user;
            } else {
                req.session.userId = null;
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
    // Optional: Enforce verification
    // if (!req.user.isVerified) {
    //     return res.render('verify-email', { title: 'Verify Email', user: req.user, message: 'Please verify your email.' });
    // }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.render('landing', { title: 'Welcome | Antigravity Learning' });
});

// --- AUTH ROUTES ---

// Login
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login | Antigravity', error: null, success: req.query.success });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.render('login', { title: 'Login | Antigravity', error: 'Invalid email or password', success: null });
        }

        const user = rows[0];

        // Check password (handle legacy plaintext if needed, but here we assume bcrypt or transition)
        // If password starts with $2, it's bcrypt. Else it's component.
        let match = false;
        if (user.password.startsWith('$2')) {
            match = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plaintext fallback (should be removed in prod)
            match = (user.password === password);
            if (match) {
                // Determine to upgrade hash? For now, let's keep it simple.
            }
        }

        if (match) {
            if (!user.is_verified) {
                // We allow login but maybe show a banner? Or strict block?
                // For this demo, we'll warn or just allow.
                req.session.userId = user.id;
                return res.redirect('/dashboard?info=unverified');
            }

            req.session.userId = user.id;
            return res.redirect('/dashboard');
        } else {
            res.render('login', { title: 'Login | Antigravity', error: 'Invalid email or password', success: null });
        }
    } catch (err) {
        console.error(err);
        res.render('login', { title: 'Login | Antigravity', error: 'An error occurred during login', success: null });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Register
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register | Antigravity', error: null });
});

app.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    // Basic validation
    if (password !== confirmPassword) {
        return res.render('register', { title: 'Register | Antigravity', error: 'Passwords do not match' });
    }

    // Password strength (simple check)
    if (password.length < 8) {
        return res.render('register', { title: 'Register | Antigravity', error: 'Password must be at least 8 characters' });
    }

    try {
        // Check if user exists
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.render('register', { title: 'Register | Antigravity', error: 'Email already in use' });
        }

        const id = 'u' + Date.now();
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await db.execute(
            'INSERT INTO users (id, name, email, password, learning_style, pacing, current_level, verification_token, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, email, hashedPassword, 'visual', 'moderate', 1, verificationToken, false]
        );

        // Send Email
        await emailService.sendVerificationEmail(email, verificationToken, { name, id });

        // Show Verification Page
        res.render('verification-sent', {
            title: 'Verify Email | Student Portal',
            email: email
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.render('register', { title: 'Register | Antigravity', error: 'Registration failed due to server error' });
    }
});

app.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            if (!user.is_verified) {
                // Generate new token if needed, or re-send existing if valid. 
                // For simplicity, let's just re-send the current one if it exists, or logic to generate new.
                // Re-generating is safer for expiration logic if we had it.
                await emailService.sendVerificationEmail(email, user.verification_token, { name: user.name, id: user.id });
            }
        }
        // Always show the page to prevent enumeration (or show success message)
        res.render('verification-sent', {
            title: 'Verify Email | Student Portal',
            email: email
        });
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});

// Verify Email
app.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.redirect('/login');

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE verification_token = ?', [token]);
        if (rows.length === 0) {
            return res.render('login', { title: 'Login', error: 'Invalid or expired verification token.', success: null });
        }

        const user = rows[0];
        await db.query('UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?', [user.id]);

        res.render('login', { title: 'Login', error: null, success: 'Email verified! You can now log in.' });
    } catch (err) {
        console.error("Verification Error:", err);
        res.redirect('/login');
    }
});

// Forgot Password
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { title: 'Reset Password', error: null, message: null });
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            // For security, don't reveal existence
            return res.render('forgot-password', { title: 'Reset Password', error: null, message: 'If an account exists, a reset link has been sent.' });
        }

        const user = rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id]);

        await emailService.sendPasswordResetEmail(email, token, { name: user.name, id: user.id });

        res.render('forgot-password', { title: 'Reset Password', error: null, message: 'If an account exists, a reset link has been sent.' });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.render('forgot-password', { title: 'Reset Password', error: 'Error sending email', message: null });
    }
});

// Reset Password Page
app.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]);
        if (rows.length === 0) {
            return res.render('forgot-password', { title: 'Reset Password', error: 'Password reset link is invalid or has expired.', message: null });
        }
        res.render('reset-password', { title: 'Set New Password', token, error: null });
    } catch (err) {
        res.redirect('/forgot-password');
    }
});

app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render('reset-password', { title: 'Set New Password', token, error: 'Passwords do not match' });
    }

    if (password.length < 8) {
        return res.render('reset-password', { title: 'Set New Password', token, error: 'Password must be at least 8 characters' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]);
        if (rows.length === 0) {
            return res.render('forgot-password', { title: 'Reset Password', error: 'Link expired.', message: null });
        }

        const user = rows[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, user.id]);

        res.render('login', { title: 'Login', success: 'Password reset successfully. Please login.', error: null });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.render('reset-password', { title: 'Set New Password', token, error: 'System error.' });
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

app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const learningPath = await engine.generatePath(req.user.preferences);
        // Mock Mastery Data for Dashboard visualization
        const masteryStats = {
            algebra: 75,
            geometry: 45,
            calculus: 20
        };

        // Check verification for UI notice
        if (!req.user.isVerified) {
            // Could pass a flag to view
        }

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
        try {
            await db.query('UPDATE units SET views = views + 1 WHERE id = ?', [req.params.id]);
        } catch (e) { }

        const [rows] = await db.query('SELECT * FROM units WHERE id = ?', [req.params.id]);
        const unit = rows[0];

        if (!unit) return res.status(404).send('Unit not found');
        res.render('unit', { title: unit.title, unit });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// AI Question Generator
app.post('/api/generate-questions', requireAuth, async (req, res) => {
    try {
        const { topic, difficulty } = req.body;
        const questions = await aiService.generateQuestions(topic, difficulty || 2);
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

// Chat API
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { message, contextUnit } = req.body;
        const aiResponse = await aiService.getChatResponse(message, contextUnit);
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

    if (password.length < 8) {
        return res.redirect('/settings?error=Password must be at least 8 characters');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
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
