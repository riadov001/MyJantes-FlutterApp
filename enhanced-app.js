const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Session configuration
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for temporary file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Notification service setup
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const twilioClient = process.env.TWILIO_ACCOUNT_SID ? 
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// Authentication helpers
const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.status(403).json({ message: 'Accès administrateur requis' });
  }
  next();
};

// Notification helpers
const sendEmail = async (to, subject, message, userId = null) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.log('Email service not configured');
      return false;
    }

    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: message
    });

    if (userId) {
      await pool.query(`
        INSERT INTO notifications (user_id, type, subject, message, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, 'email', subject, message, 'sent', new Date()]);
    }

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const sendSMS = async (to, message, userId = null) => {
  try {
    if (!twilioClient) {
      console.log('SMS service not configured');
      return false;
    }

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    if (userId) {
      await pool.query(`
        INSERT INTO notifications (user_id, type, subject, message, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, 'sms', null, message, 'sent', new Date()]);
    }

    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
};

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// Home page with responsive design
app.get('/', async (req, res) => {
  const isAuthenticated = !!req.session.userId;
  const userRole = req.session.userRole;
  
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MY JANTES - Spécialiste Rénovation Jantes Aluminium</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh;
        }

        /* Mobile-first responsive navbar */
        .navbar { 
            background: rgba(26, 26, 26, 0.95); 
            color: white; 
            padding: 1rem 0; 
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        .navbar-content { 
            max-width: 1200px; 
            margin: 0 auto; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 0 1rem; 
        }
        
        .logo { 
            font-size: 1.8rem; 
            font-weight: bold; 
            color: #dc2626; 
            text-decoration: none;
        }
        
        .nav-menu { 
            display: flex; 
            gap: 2rem; 
            align-items: center;
        }
        
        .nav-menu a { 
            color: white; 
            text-decoration: none; 
            padding: 0.5rem 1rem;
            border-radius: 5px;
            transition: all 0.3s ease;
        }
        
        .nav-menu a:hover { 
            background: #dc2626; 
            transform: translateY(-2px);
        }

        /* Mobile menu toggle */
        .menu-toggle {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
        }

        @media (max-width: 768px) {
            .nav-menu {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(26, 26, 26, 0.98);
                flex-direction: column;
                padding: 1rem;
                gap: 0;
            }
            
            .nav-menu.active {
                display: flex;
            }
            
            .nav-menu a {
                width: 100%;
                text-align: center;
                padding: 1rem;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .menu-toggle {
                display: block;
            }
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 2rem 1rem; 
        }
        
        .hero { 
            background: rgba(255, 255, 255, 0.95); 
            border-radius: 20px; 
            padding: 3rem 2rem; 
            text-align: center; 
            margin-bottom: 3rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        
        .hero h1 { 
            font-size: 3rem; 
            margin-bottom: 1rem; 
            color: #1a1a1a; 
            background: linear-gradient(45deg, #dc2626, #b91c1c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero p { 
            font-size: 1.2rem; 
            color: #666; 
            margin-bottom: 2rem; 
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        @media (max-width: 768px) {
            .hero {
                padding: 2rem 1rem;
            }
            
            .hero h1 {
                font-size: 2rem;
            }
        }
        
        .btn { 
            display: inline-block; 
            padding: 1rem 2rem; 
            background: linear-gradient(45deg, #dc2626, #b91c1c); 
            color: white; 
            text-decoration: none; 
            border-radius: 50px; 
            font-weight: bold; 
            margin: 0.5rem; 
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }
        
        .btn:hover { 
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
        }

        .btn-secondary {
            background: linear-gradient(45deg, #374151, #1f2937);
            box-shadow: 0 4px 15px rgba(55, 65, 81, 0.3);
        }

        .btn-secondary:hover {
            box-shadow: 0 8px 25px rgba(55, 65, 81, 0.4);
        }
        
        .dashboard-section {
            background: rgba(34, 197, 94, 0.1);
            border: 2px solid #22c55e;
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            text-align: center;
        }

        .dashboard-section h2 {
            color: #166534;
            margin-bottom: 1rem;
        }

        .auth-section {
            background: rgba(59, 130, 246, 0.1);
            border: 2px solid #3b82f6;
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            text-align: center;
        }

        .auth-section h2 {
            color: #1e40af;
            margin-bottom: 1rem;
        }
        
        .services { 
            background: rgba(255, 255, 255, 0.95); 
            border-radius: 20px; 
            padding: 3rem 2rem; 
            margin-bottom: 3rem;
            backdrop-filter: blur(10px);
        }
        
        .services h2 { 
            text-align: center; 
            margin-bottom: 3rem; 
            font-size: 2.5rem; 
            color: #1a1a1a; 
        }
        
        .services-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 2rem; 
        }
        
        .service-card { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
            padding: 2rem; 
            border-radius: 15px; 
            text-align: center; 
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .service-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }
        
        .service-card h3 { 
            color: #dc2626; 
            margin-bottom: 1rem; 
            font-size: 1.5rem;
        }
        
        .service-card p { 
            color: #555; 
            line-height: 1.6;
        }

        .service-card .read-more {
            color: #dc2626;
            cursor: pointer;
            font-weight: bold;
            margin-top: 1rem;
            display: inline-block;
        }

        .service-card .read-more:hover {
            text-decoration: underline;
        }

        .service-details {
            display: none;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
        }

        .service-details.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .stats-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 3rem 2rem;
            margin-bottom: 3rem;
            backdrop-filter: blur(10px);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            text-align: center;
        }

        .stat-item {
            padding: 2rem 1rem;
        }

        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            color: #dc2626;
            display: block;
        }

        .stat-label {
            color: #666;
            margin-top: 0.5rem;
        }
        
        .footer { 
            background: rgba(26, 26, 26, 0.95); 
            color: white; 
            text-align: center; 
            padding: 2rem; 
            margin-top: 3rem;
            backdrop-filter: blur(10px);
        }

        .contact-info {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 3rem 2rem;
            margin-bottom: 3rem;
            backdrop-filter: blur(10px);
        }

        .contact-info h2 {
            text-align: center;
            margin-bottom: 2rem;
            color: #1a1a1a;
        }

        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }

        .contact-item {
            text-align: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 15px;
        }

        .contact-icon {
            font-size: 2rem;
            color: #dc2626;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">MY JANTES</a>
            <button class="menu-toggle" onclick="toggleMenu()">☰</button>
            <div class="nav-menu" id="navMenu">
                <a href="/">Accueil</a>
                <a href="/devis">Devis</a>
                <a href="/reservations">Réservation</a>
                <a href="/factures">Factures</a>
                ${isAuthenticated ? `
                    <a href="/dashboard">Mon Espace</a>
                    ${userRole === 'admin' ? '<a href="/admin">Admin</a>' : ''}
                    <a href="#" onclick="logout()">Déconnexion</a>
                ` : `
                    <a href="/login">Connexion</a>
                    <a href="/register">Inscription</a>
                `}
            </div>
        </div>
    </nav>

    <div class="container">
        <section class="hero">
            <h1>MY JANTES</h1>
            <p>Spécialiste de la rénovation de jantes aluminium à Liévin. Redonnez vie à vos jantes avec notre expertise et notre savoir-faire artisanal.</p>
            <a href="/devis" class="btn">Demander un Devis</a>
            <a href="/reservations" class="btn btn-secondary">Réserver</a>
        </section>

        ${isAuthenticated ? `
            <section class="dashboard-section">
                <h2>Bienvenue ${req.session.userEmail || 'Utilisateur'}</h2>
                <p>Vous êtes connecté${userRole === 'admin' ? ' en tant qu\'administrateur' : ' en tant que client'}</p>
                <div style="margin-top: 1rem;">
                    <a href="/dashboard" class="btn">Accéder à mon espace</a>
                    ${userRole === 'admin' ? '<a href="/admin" class="btn">Dashboard Admin</a>' : ''}
                </div>
            </section>
        ` : `
            <section class="auth-section">
                <h2>Espace Client</h2>
                <p>Connectez-vous pour accéder à vos devis, factures et réservations</p>
                <a href="/login" class="btn">Se Connecter</a>
                <a href="/register" class="btn btn-secondary">S'inscrire</a>
            </section>
        `}

        <section class="stats-section">
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">500+</span>
                    <div class="stat-label">Jantes rénovées</div>
                </div>
                <div class="stat-item">
                    <span class="stat-number">10+</span>
                    <div class="stat-label">Années d'expérience</div>
                </div>
                <div class="stat-item">
                    <span class="stat-number">98%</span>
                    <div class="stat-label">Clients satisfaits</div>
                </div>
                <div class="stat-item">
                    <span class="stat-number">24h</span>
                    <div class="stat-label">Délai de réponse</div>
                </div>
            </div>
        </section>

        <section class="services">
            <h2>Nos Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <h3>Rénovation Complète</h3>
                    <p>Remise à neuf complète de vos jantes aluminium avec finition professionnelle</p>
                    <div class="read-more" onclick="toggleDetails(this)">Lire plus...</div>
                    <div class="service-details">
                        <p><strong>Processus complet :</strong></p>
                        <ul style="text-align: left; margin-top: 1rem;">
                            <li>Décapage chimique ou par sablage</li>
                            <li>Réparation des impacts et rayures</li>
                            <li>Apprêt et lissage</li>
                            <li>Peinture haute qualité</li>
                            <li>Vernis de protection</li>
                        </ul>
                        <p style="margin-top: 1rem;"><strong>À partir de 80€ par jante</strong></p>
                    </div>
                </div>
                <div class="service-card">
                    <h3>Personnalisation</h3>
                    <p>Couleurs et finitions sur mesure selon vos préférences</p>
                    <div class="read-more" onclick="toggleDetails(this)">Lire plus...</div>
                    <div class="service-details">
                        <p><strong>Options disponibles :</strong></p>
                        <ul style="text-align: left; margin-top: 1rem;">
                            <li>Peinture couleur RAL au choix</li>
                            <li>Finitions mate, brillante, satinée</li>
                            <li>Effets métallisés et nacrés</li>
                            <li>Bi-ton et dégradés</li>
                            <li>Finitions carbone</li>
                        </ul>
                        <p style="margin-top: 1rem;"><strong>À partir de 100€ par jante</strong></p>
                    </div>
                </div>
                <div class="service-card">
                    <h3>Réparation</h3>
                    <p>Correction des rayures, impacts et déformations</p>
                    <div class="read-more" onclick="toggleDetails(this)">Lire plus...</div>
                    <div class="service-details">
                        <p><strong>Types de réparations :</strong></p>
                        <ul style="text-align: left; margin-top: 1rem;">
                            <li>Rayures superficielles et profondes</li>
                            <li>Impacts de bordure de trottoir</li>
                            <li>Déformations légères</li>
                            <li>Corrosion et oxydation</li>
                            <li>Fissures mineures</li>
                        </ul>
                        <p style="margin-top: 1rem;"><strong>À partir de 40€ par jante</strong></p>
                    </div>
                </div>
            </div>
        </section>

        <section class="contact-info">
            <h2>Nous Contacter</h2>
            <div class="contact-grid">
                <div class="contact-item">
                    <div class="contact-icon">📍</div>
                    <h4>Adresse</h4>
                    <p>123 Rue de la Rénovation<br>62800 Liévin</p>
                </div>
                <div class="contact-item">
                    <div class="contact-icon">📞</div>
                    <h4>Téléphone</h4>
                    <p>03 21 XX XX XX</p>
                </div>
                <div class="contact-item">
                    <div class="contact-icon">✉️</div>
                    <h4>Email</h4>
                    <p>contact@myjantes.fr</p>
                </div>
                <div class="contact-item">
                    <div class="contact-icon">🕒</div>
                    <h4>Horaires</h4>
                    <p>Lun-Ven: 8h-18h<br>Sam: 9h-16h</p>
                </div>
            </div>
        </section>
    </div>

    <footer class="footer">
        <p>&copy; 2025 MY JANTES - Tous droits réservés | Liévin, France</p>
        <div style="margin-top: 1rem;">
            <a href="/mentions-legales" style="color: #ccc; margin: 0 1rem;">Mentions Légales</a>
            <a href="/cgv" style="color: #ccc; margin: 0 1rem;">CGV</a>
            <a href="/confidentialite" style="color: #ccc; margin: 0 1rem;">Confidentialité</a>
        </div>
    </footer>

    <script>
        function toggleMenu() {
            const navMenu = document.getElementById('navMenu');
            navMenu.classList.toggle('active');
        }

        function toggleDetails(element) {
            const details = element.nextElementSibling;
            const isActive = details.classList.contains('active');
            
            // Close all other details
            document.querySelectorAll('.service-details.active').forEach(detail => {
                detail.classList.remove('active');
            });
            document.querySelectorAll('.read-more').forEach(btn => {
                btn.textContent = 'Lire plus...';
            });
            
            if (!isActive) {
                details.classList.add('active');
                element.textContent = 'Voir moins...';
            }
        }

        function logout() {
            fetch('/api/logout', { method: 'POST' })
                .then(() => window.location.reload());
        }
    </script>
</body>
</html>
  `);
});

// Registration page with GDPR consent
app.get('/register', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inscription - MY JANTES</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh;
            padding: 2rem 1rem;
        }
        
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(45deg, #dc2626, #b91c1c);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .header h1 { 
            font-size: 2rem; 
            margin-bottom: 0.5rem; 
        }
        
        .form-container {
            padding: 2rem;
        }
        
        .form-group { 
            margin-bottom: 1.5rem; 
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        
        @media (max-width: 600px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
        
        label { 
            display: block; 
            margin-bottom: 0.5rem; 
            font-weight: 600; 
            color: #374151;
        }
        
        input, textarea { 
            width: 100%; 
            padding: 0.875rem; 
            border: 2px solid #e5e7eb; 
            border-radius: 10px; 
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        input:focus, textarea:focus { 
            outline: none; 
            border-color: #dc2626; 
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        
        .consent-section {
            background: #f8fafc;
            border-radius: 15px;
            padding: 1.5rem;
            margin: 2rem 0;
            border: 2px solid #e2e8f0;
        }
        
        .consent-section h3 {
            color: #1e40af;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .consent-item {
            margin: 1rem 0;
            padding: 1rem;
            background: white;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
        }
        
        .consent-item label {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            cursor: pointer;
            margin-bottom: 0;
        }
        
        .consent-item input[type="checkbox"] {
            width: auto;
            margin-top: 0.25rem;
        }
        
        .consent-text {
            flex: 1;
        }
        
        .consent-required {
            color: #dc2626;
            font-weight: bold;
        }
        
        .consent-optional {
            color: #6b7280;
        }
        
        button { 
            width: 100%; 
            padding: 1rem; 
            background: linear-gradient(45deg, #dc2626, #b91c1c); 
            color: white; 
            border: none; 
            border-radius: 10px; 
            font-size: 1.1rem; 
            font-weight: 600;
            cursor: pointer; 
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }
        
        button:hover:not(:disabled) { 
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .back-link { 
            text-align: center; 
            margin-top: 2rem; 
        }
        
        .back-link a { 
            color: #dc2626; 
            text-decoration: none; 
            font-weight: 600;
        }
        
        .success { 
            background: #d4edda; 
            color: #155724; 
            padding: 1rem; 
            border-radius: 10px; 
            margin: 1rem 0; 
            text-align: center;
        }
        
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            padding: 1rem; 
            border-radius: 10px; 
            margin: 1rem 0; 
            text-align: center;
        }

        .gdpr-popup {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            padding: 2rem;
        }

        .gdpr-popup.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .gdpr-content {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .gdpr-content h2 {
            color: #dc2626;
            margin-bottom: 1rem;
        }

        .gdpr-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        }

        .gdpr-buttons button {
            flex: 1;
        }

        .btn-secondary {
            background: linear-gradient(45deg, #6b7280, #4b5563);
            box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Créer un Compte</h1>
            <p>Rejoignez MY JANTES pour gérer vos services</p>
        </div>
        
        <div class="form-container">
            <form onsubmit="register(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">Prénom *</label>
                        <input type="text" id="firstName" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Nom *</label>
                        <input type="text" id="lastName" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="password">Mot de passe *</label>
                        <input type="password" id="password" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirmer le mot de passe *</label>
                        <input type="password" id="confirmPassword" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="phone">Téléphone</label>
                    <input type="tel" id="phone" placeholder="06 12 34 56 78">
                </div>
                
                <div class="form-group">
                    <label for="address">Adresse complète</label>
                    <textarea id="address" rows="2" placeholder="123 Rue de la Paix, 62800 Liévin"></textarea>
                </div>
                
                <div class="consent-section">
                    <h3>🔒 Protection de vos données</h3>
                    
                    <div class="consent-item">
                        <label>
                            <input type="checkbox" id="dataProcessingConsent" required>
                            <div class="consent-text">
                                <strong class="consent-required">J'accepte le traitement de mes données personnelles *</strong><br>
                                <small>Nécessaire pour créer votre compte et gérer vos services MY JANTES. Vous pouvez consulter notre <a href="/confidentialite" target="_blank">politique de confidentialité</a>.</small>
                            </div>
                        </label>
                    </div>
                    
                    <div class="consent-item">
                        <label>
                            <input type="checkbox" id="emailConsent">
                            <div class="consent-text">
                                <strong class="consent-optional">J'accepte de recevoir des notifications par email</strong><br>
                                <small>Pour vous tenir informé de l'avancement de vos services, devis et factures.</small>
                            </div>
                        </label>
                    </div>
                    
                    <div class="consent-item">
                        <label>
                            <input type="checkbox" id="smsConsent">
                            <div class="consent-text">
                                <strong class="consent-optional">J'accepte de recevoir des notifications par SMS</strong><br>
                                <small>Pour des notifications urgentes concernant vos rendez-vous et services.</small>
                            </div>
                        </label>
                    </div>
                </div>
                
                <button type="submit" id="submitBtn">Créer mon compte</button>
            </form>
            
            <div id="message"></div>
            
            <div class="back-link">
                <a href="/login">← Déjà un compte ? Se connecter</a><br>
                <a href="/">← Retour à l'accueil</a>
            </div>
        </div>
    </div>

    <!-- GDPR Popup -->
    <div class="gdpr-popup" id="gdprPopup">
        <div class="gdpr-content">
            <h2>🛡️ Protection de vos données</h2>
            <p>Chez MY JANTES, nous respectons votre vie privée et la réglementation RGPD.</p>
            
            <h3>Nous collectons vos données pour :</h3>
            <ul>
                <li>✅ Gérer votre compte client</li>
                <li>✅ Traiter vos devis et réservations</li>
                <li>✅ Vous envoyer vos factures</li>
                <li>✅ Vous contacter concernant vos services</li>
            </ul>
            
            <h3>Vos droits :</h3>
            <ul>
                <li>🔍 Droit d'accès à vos données</li>
                <li>✏️ Droit de rectification</li>
                <li>🗑️ Droit à l'effacement</li>
                <li>📧 Droit de retirer votre consentement</li>
            </ul>
            
            <p><strong>Contact DPO :</strong> dpo@myjantes.fr</p>
            
            <div class="gdpr-buttons">
                <button type="button" class="btn-secondary" onclick="closeGdprPopup()">J'ai compris</button>
                <button type="button" onclick="openPrivacyPolicy()">Lire la politique complète</button>
            </div>
        </div>
    </div>

    <script>
        // Show GDPR popup when data processing checkbox is clicked
        document.getElementById('dataProcessingConsent').addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('gdprPopup').classList.add('active');
            }
        });

        function closeGdprPopup() {
            document.getElementById('gdprPopup').classList.remove('active');
        }

        function openPrivacyPolicy() {
            window.open('/confidentialite', '_blank');
            closeGdprPopup();
        }

        // Password confirmation validation
        document.getElementById('confirmPassword').addEventListener('input', function() {
            const password = document.getElementById('password').value;
            const confirmPassword = this.value;
            
            if (password !== confirmPassword) {
                this.setCustomValidity('Les mots de passe ne correspondent pas');
            } else {
                this.setCustomValidity('');
            }
        });

        function register(event) {
            event.preventDefault();
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                dataProcessingConsent: document.getElementById('dataProcessingConsent').checked,
                emailConsent: document.getElementById('emailConsent').checked,
                smsConsent: document.getElementById('smsConsent').checked
            };
            
            document.getElementById('submitBtn').disabled = true;
            document.getElementById('submitBtn').textContent = 'Création en cours...';
            
            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                const messageDiv = document.getElementById('message');
                if (data.success) {
                    messageDiv.innerHTML = '<div class="success">Compte créé avec succès ! Redirection vers la connexion...</div>';
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    messageDiv.innerHTML = '<div class="error">' + (data.message || 'Erreur lors de la création du compte') + '</div>';
                    document.getElementById('submitBtn').disabled = false;
                    document.getElementById('submitBtn').textContent = 'Créer mon compte';
                }
            })
            .catch(error => {
                document.getElementById('message').innerHTML = '<div class="error">Erreur de connexion</div>';
                document.getElementById('submitBtn').disabled = false;
                document.getElementById('submitBtn').textContent = 'Créer mon compte';
            });
        }
    </script>
</body>
</html>
  `);
});

// Registration API
app.post('/api/register', async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, phone, address,
      dataProcessingConsent, emailConsent, smsConsent
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs obligatoires doivent être remplis' });
    }

    if (!dataProcessingConsent) {
      return res.status(400).json({ success: false, message: 'Vous devez accepter le traitement de vos données personnelles' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Un compte existe déjà avec cet email' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await pool.query(`
      INSERT INTO users (email, password, first_name, last_name, phone, address,
                        email_consent, sms_consent, data_processing_consent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name, role
    `, [
      email, hashedPassword, firstName, lastName, phone || null, address || null,
      emailConsent || false, smsConsent || false, dataProcessingConsent
    ]);

    const user = result.rows[0];

    // Log consent
    await pool.query(`
      INSERT INTO consent_logs (user_id, consent_type, granted, ip_address, user_agent)
      VALUES 
        ($1, 'data_processing', $2, $3, $4),
        ($1, 'email', $5, $3, $4),
        ($1, 'sms', $6, $3, $4)
    `, [
      user.id, dataProcessingConsent, 
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent'],
      emailConsent || false, smsConsent || false
    ]);

    // Send welcome email if consent given
    if (emailConsent) {
      await sendEmail(
        user.email,
        'Bienvenue chez MY JANTES !',
        `
        <h2>Bienvenue ${firstName} !</h2>
        <p>Votre compte MY JANTES a été créé avec succès.</p>
        <p>Vous pouvez maintenant:</p>
        <ul>
          <li>Demander des devis en ligne</li>
          <li>Réserver vos services</li>
          <li>Suivre l'avancement de vos commandes</li>
          <li>Consulter vos factures</li>
        </ul>
        <p>Merci de votre confiance !</p>
        <p><strong>L'équipe MY JANTES</strong></p>
        `,
        user.id
      );
    }

    res.json({ success: true, message: 'Compte créé avec succès' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du compte' });
  }
});

// Enhanced login page
app.get('/login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - MY JANTES</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .container { 
            max-width: 400px; 
            width: 100%;
            background: white; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(45deg, #dc2626, #b91c1c);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .header h1 { 
            font-size: 1.8rem; 
            margin-bottom: 0.5rem; 
        }
        
        .form-container {
            padding: 2rem;
        }
        
        .form-group { 
            margin-bottom: 1.5rem; 
        }
        
        label { 
            display: block; 
            margin-bottom: 0.5rem; 
            font-weight: 600; 
            color: #374151;
        }
        
        input { 
            width: 100%; 
            padding: 0.875rem; 
            border: 2px solid #e5e7eb; 
            border-radius: 10px; 
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        input:focus { 
            outline: none; 
            border-color: #dc2626; 
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        
        button { 
            width: 100%; 
            padding: 1rem; 
            background: linear-gradient(45deg, #dc2626, #b91c1c); 
            color: white; 
            border: none; 
            border-radius: 10px; 
            font-size: 1.1rem; 
            font-weight: 600;
            cursor: pointer; 
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
            margin-bottom: 1rem;
        }
        
        button:hover:not(:disabled) { 
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .admin-login { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7;
            border-radius: 10px; 
            padding: 1rem; 
            text-align: center; 
            margin: 1rem 0;
        }
        
        .admin-login button {
            background: linear-gradient(45deg, #f39c12, #e67e22);
            box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
            margin-top: 1rem;
        }
        
        .back-link { 
            text-align: center; 
            margin-top: 1rem; 
        }
        
        .back-link a { 
            color: #dc2626; 
            text-decoration: none; 
            font-weight: 600;
            display: block;
            margin: 0.5rem 0;
        }
        
        .success { 
            background: #d4edda; 
            color: #155724; 
            padding: 1rem; 
            border-radius: 10px; 
            margin: 1rem 0; 
            text-align: center;
        }
        
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            padding: 1rem; 
            border-radius: 10px; 
            margin: 1rem 0; 
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Connexion MY JANTES</h1>
            <p>Accédez à votre espace client</p>
        </div>
        
        <div class="form-container">
            <form onsubmit="login(event)">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Mot de passe:</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" id="loginBtn">Se Connecter</button>
            </form>
            
            <div class="admin-login">
                <p><strong>Accès Administrateur</strong></p>
                <p>Email: admin@myjantes.fr</p>
                <button type="button" onclick="loginAdmin()">Connexion Admin</button>
            </div>
            
            <div id="message"></div>
            
            <div class="back-link">
                <a href="/register">Créer un compte →</a>
                <a href="/">← Retour à l'accueil</a>
            </div>
        </div>
    </div>

    <script>
        function login(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            document.getElementById('loginBtn').disabled = true;
            document.getElementById('loginBtn').textContent = 'Connexion...';
            
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                const messageDiv = document.getElementById('message');
                if (data.success) {
                    messageDiv.innerHTML = '<div class="success">Connexion réussie ! Redirection...</div>';
                    setTimeout(() => {
                        window.location.href = data.role === 'admin' ? '/admin' : '/dashboard';
                    }, 1500);
                } else {
                    messageDiv.innerHTML = '<div class="error">' + (data.message || 'Email ou mot de passe incorrect') + '</div>';
                    document.getElementById('loginBtn').disabled = false;
                    document.getElementById('loginBtn').textContent = 'Se Connecter';
                }
            })
            .catch(error => {
                document.getElementById('message').innerHTML = '<div class="error">Erreur de connexion</div>';
                document.getElementById('loginBtn').disabled = false;
                document.getElementById('loginBtn').textContent = 'Se Connecter';
            });
        }

        function loginAdmin() {
            document.getElementById('email').value = 'admin@myjantes.fr';
            document.getElementById('password').value = 'admin123';
            
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'admin@myjantes.fr', password: 'admin123' })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/admin';
                } else {
                    document.getElementById('message').innerHTML = '<div class="error">Erreur d\'authentification admin</div>';
                }
            });
        }
    </script>
</body>
</html>
  `);
});

// Enhanced login API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    // Special admin login
    if (email === 'admin@myjantes.fr' && password === 'admin123') {
      // Create admin user if doesn't exist
      let adminUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (adminUser.rows.length === 0) {
        const hashedPassword = await hashPassword(password);
        const result = await pool.query(`
          INSERT INTO users (email, password, first_name, last_name, role, data_processing_consent)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [email, hashedPassword, 'Admin', 'MY JANTES', 'admin', true]);
        adminUser = result;
      }

      const user = adminUser.rows[0];
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userRole = 'admin';
      
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
      
      return res.json({ success: true, role: 'admin', message: 'Connexion admin réussie' });
    }

    // Regular user login
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;

    res.json({ 
      success: true, 
      role: user.role,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la connexion' });
  }
});

// Logout API
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erreur lors de la déconnexion' });
    }
    res.json({ success: true, message: 'Déconnexion réussie' });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Enhanced MY JANTES server running on port ${PORT}`);
});