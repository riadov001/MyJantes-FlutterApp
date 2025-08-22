const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static('web'));
app.use(session({
    secret: 'myjantes-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Base de données simple en mémoire
let users = [
    {
        id: 1,
        email: 'admin@myjantes.fr',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
        firstName: 'Admin',
        lastName: 'MyJantes',
        isAdmin: true
    }
];

let factures = [];
let nextUserId = 2;
let nextFactureId = 1;

// Routes principales
app.get('/health', (req, res) => {
    res.send('OK');
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MY JANTES - Rénovation de Jantes Aluminium</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .logo h1 {
            color: #DC2626;
            font-weight: bold;
            font-size: 1.8rem;
        }
        
        .nav-menu {
            display: flex;
            list-style: none;
            gap: 30px;
        }
        
        .nav-menu a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s;
        }
        
        .nav-menu a:hover {
            color: #DC2626;
        }
        
        .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            gap: 3px;
        }
        
        .hamburger span {
            width: 25px;
            height: 3px;
            background: #333;
            transition: 0.3s;
        }
        
        .hero {
            padding: 120px 20px 80px;
            text-align: center;
            color: white;
        }
        
        .hero h2 {
            font-size: 3rem;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .hero p {
            font-size: 1.3rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .cta-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary {
            background: #DC2626;
            color: white;
        }
        
        .btn-primary:hover {
            background: #B91C1C;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(220, 38, 38, 0.3);
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid white;
        }
        
        .btn-secondary:hover {
            background: white;
            color: #333;
        }
        
        .services {
            padding: 80px 20px;
            background: white;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .services h3 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 50px;
            color: #333;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 50px;
        }
        
        .service-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s;
            border-left: 5px solid #DC2626;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
        }
        
        .service-card h4 {
            color: #DC2626;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .stats {
            background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
            padding: 60px 20px;
            color: white;
            text-align: center;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .stat-item h4 {
            font-size: 3rem;
            margin-bottom: 10px;
        }
        
        .contact {
            padding: 80px 20px;
            background: #f8fafc;
            text-align: center;
        }
        
        .contact h3 {
            font-size: 2.5rem;
            margin-bottom: 20px;
            color: #333;
        }
        
        .contact-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin: 40px 0;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .contact-item {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .footer {
            background: #1f2937;
            color: white;
            padding: 40px 20px 20px;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .nav-menu {
                display: none;
                position: fixed;
                top: 70px;
                left: 0;
                width: 100%;
                background: white;
                flex-direction: column;
                padding: 20px;
                box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            }
            
            .nav-menu.active {
                display: flex;
            }
            
            .hamburger {
                display: flex;
            }
            
            .hero h2 {
                font-size: 2rem;
            }
            
            .hero p {
                font-size: 1.1rem;
            }
            
            .cta-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .services-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav-container">
            <div class="logo">
                <h1>MY JANTES</h1>
            </div>
            <ul class="nav-menu" id="nav-menu">
                <li><a href="#accueil">Accueil</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="/register">Inscription</a></li>
                <li><a href="/login">Connexion</a></li>
            </ul>
            <div class="hamburger" id="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </nav>
    </header>

    <section class="hero" id="accueil">
        <div class="container">
            <h2>Rénovation de Jantes Aluminium</h2>
            <p>Redonnez éclat et beauté à vos jantes avec nos services professionnels à Liévin</p>
            <div class="cta-buttons">
                <a href="/register" class="btn btn-primary">Demander un Devis</a>
                <a href="#contact" class="btn btn-secondary">Nous Contacter</a>
            </div>
        </div>
    </section>

    <section class="services" id="services">
        <div class="container">
            <h3>Nos Services</h3>
            <div class="services-grid">
                <div class="service-card">
                    <h4>Décapage Professionnel</h4>
                    <p>Décapage chimique et mécanique pour éliminer l'oxydation et les rayures profondes.</p>
                </div>
                <div class="service-card">
                    <h4>Rénovation Complète</h4>
                    <p>Ponçage, apprêt, peinture et vernis pour un résultat comme neuf.</p>
                </div>
                <div class="service-card">
                    <h4>Personnalisation</h4>
                    <p>Large choix de couleurs et finitions pour personnaliser vos jantes.</p>
                </div>
                <div class="service-card">
                    <h4>Dévoilage Expert</h4>
                    <p>Remise en forme professionnelle des jantes déformées.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="stats">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-item">
                    <h4>500+</h4>
                    <p>Jantes Rénovées</p>
                </div>
                <div class="stat-item">
                    <h4>98%</h4>
                    <p>Satisfaction Client</p>
                </div>
                <div class="stat-item">
                    <h4>15+</h4>
                    <p>Années d'Expérience</p>
                </div>
            </div>
        </div>
    </section>

    <section class="contact" id="contact">
        <div class="container">
            <h3>Contactez-nous</h3>
            <div class="contact-info">
                <div class="contact-item">
                    <h4>📍 Adresse</h4>
                    <p>123 Rue de la Rénovation<br>62800 Liévin, France</p>
                </div>
                <div class="contact-item">
                    <h4>📞 Téléphone</h4>
                    <p>03 21 XX XX XX</p>
                </div>
                <div class="contact-item">
                    <h4>✉️ Email</h4>
                    <p>contact@myjantes.fr</p>
                </div>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 MY JANTES. Tous droits réservés.</p>
        </div>
    </footer>

    <script>
        // Menu hamburger
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        // Fermer le menu lors du clic sur un lien
        navMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navMenu.classList.remove('active');
            }
        });
    </script>
</body>
</html>
    `);
});

// Page d'inscription
app.get('/register', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inscription - MY JANTES</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .form-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 500px;
        }
        
        .form-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .form-header h1 {
            color: #DC2626;
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #DC2626;
        }
        
        .checkbox-group {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin: 0;
        }
        
        .checkbox-group label {
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .btn {
            width: 100%;
            padding: 15px;
            background: #DC2626;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #B91C1C;
        }
        
        .form-footer {
            text-align: center;
            margin-top: 20px;
        }
        
        .form-footer a {
            color: #DC2626;
            text-decoration: none;
        }
        
        .message {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        @media (max-width: 768px) {
            .form-container {
                padding: 30px 20px;
            }
            
            .form-header h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="form-header">
            <h1>MY JANTES</h1>
            <p>Créer un compte</p>
        </div>
        
        <div id="message"></div>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="firstName">Prénom *</label>
                <input type="text" id="firstName" name="firstName" required>
            </div>
            
            <div class="form-group">
                <label for="lastName">Nom *</label>
                <input type="text" id="lastName" name="lastName" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="phone">Téléphone</label>
                <input type="tel" id="phone" name="phone">
            </div>
            
            <div class="form-group">
                <label for="address">Adresse</label>
                <input type="text" id="address" name="address">
            </div>
            
            <div class="form-group">
                <label for="password">Mot de passe *</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" id="gdprConsent" name="gdprConsent" required>
                <label for="gdprConsent">J'accepte le traitement de mes données personnelles conformément au RGPD *</label>
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" id="emailConsent" name="emailConsent">
                <label for="emailConsent">J'accepte de recevoir des emails de communication</label>
            </div>
            
            <button type="submit" class="btn">Créer un compte</button>
        </form>
        
        <div class="form-footer">
            <p>Déjà un compte ? <a href="/login">Se connecter</a></p>
            <p><a href="/">Retour à l'accueil</a></p>
        </div>
    </div>
    
    <script>
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            data.gdprConsent = document.getElementById('gdprConsent').checked;
            data.emailConsent = document.getElementById('emailConsent').checked;
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                const messageDiv = document.getElementById('message');
                
                if (response.ok) {
                    messageDiv.innerHTML = '<div class="message success">Inscription réussie ! Vous pouvez maintenant vous connecter.</div>';
                    e.target.reset();
                } else {
                    messageDiv.innerHTML = '<div class="message error">' + result.error + '</div>';
                }
            } catch (error) {
                document.getElementById('message').innerHTML = '<div class="message error">Erreur de connexion</div>';
            }
        });
    </script>
</body>
</html>
    `);
});

// Page de connexion
app.get('/login', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - MY JANTES</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .form-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        
        .form-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .form-header h1 {
            color: #DC2626;
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #DC2626;
        }
        
        .btn {
            width: 100%;
            padding: 15px;
            background: #DC2626;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #B91C1C;
        }
        
        .form-footer {
            text-align: center;
            margin-top: 20px;
        }
        
        .form-footer a {
            color: #DC2626;
            text-decoration: none;
        }
        
        .message {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="form-header">
            <h1>MY JANTES</h1>
            <p>Connexion</p>
        </div>
        
        <div id="message"></div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Mot de passe</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn">Se connecter</button>
        </form>
        
        <div class="form-footer">
            <p>Pas encore de compte ? <a href="/register">S'inscrire</a></p>
            <p><a href="/">Retour à l'accueil</a></p>
        </div>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                const messageDiv = document.getElementById('message');
                
                if (response.ok) {
                    messageDiv.innerHTML = '<div class="message success">Connexion réussie !</div>';
                    setTimeout(() => {
                        if (result.user.isAdmin) {
                            window.location.href = '/admin';
                        } else {
                            window.location.href = '/dashboard';
                        }
                    }, 1000);
                } else {
                    messageDiv.innerHTML = '<div class="message error">' + result.error + '</div>';
                }
            } catch (error) {
                document.getElementById('message').innerHTML = '<div class="message error">Erreur de connexion</div>';
            }
        });
    </script>
</body>
</html>
    `);
});

// Dashboard admin
app.get('/admin', (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.redirect('/login');
    }
    
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - MY JANTES</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', Arial, sans-serif;
            background: #f8fafc;
            line-height: 1.6;
        }
        
        .header {
            background: white;
            padding: 1rem 2rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            color: #DC2626;
        }
        
        .header-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.3s;
        }
        
        .btn-primary {
            background: #DC2626;
            color: white;
        }
        
        .btn-primary:hover {
            background: #B91C1C;
        }
        
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #4b5563;
        }
        
        .main-content {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-card h3 {
            font-size: 2rem;
            color: #DC2626;
            margin-bottom: 5px;
        }
        
        .section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            border-bottom: 2px solid #DC2626;
            padding-bottom: 10px;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            font-size: 1rem;
        }
        
        .form-group textarea {
            height: 80px;
            resize: vertical;
        }
        
        .factures-list {
            margin-top: 20px;
        }
        
        .facture-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 4px solid #DC2626;
        }
        
        .facture-info h4 {
            color: #333;
            margin-bottom: 5px;
        }
        
        .facture-info p {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .facture-amount {
            font-size: 1.2rem;
            font-weight: bold;
            color: #DC2626;
        }
        
        .message {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                gap: 10px;
            }
            
            .main-content {
                padding: 1rem;
            }
            
            .form-grid {
                grid-template-columns: 1fr;
            }
            
            .facture-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>MY JANTES - Administration</h1>
        <div class="header-actions">
            <span>Bienvenue, Admin</span>
            <a href="/logout" class="btn btn-secondary">Déconnexion</a>
        </div>
    </header>
    
    <div class="main-content">
        <div class="stats-grid">
            <div class="stat-card">
                <h3 id="totalUsers">${users.length}</h3>
                <p>Utilisateurs</p>
            </div>
            <div class="stat-card">
                <h3 id="totalFactures">${factures.length}</h3>
                <p>Factures</p>
            </div>
            <div class="stat-card">
                <h3 id="totalRevenue">${factures.reduce((sum, f) => sum + f.total, 0).toFixed(2)}€</h3>
                <p>Chiffre d'affaires</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Créer Facture Manuelle</h2>
            <div id="factureMessage"></div>
            <form id="factureForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="customerName">Nom du client *</label>
                        <input type="text" id="customerName" name="customer_name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="customerEmail">Email du client *</label>
                        <input type="email" id="customerEmail" name="customer_email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="customerPhone">Téléphone</label>
                        <input type="tel" id="customerPhone" name="customer_phone">
                    </div>
                    
                    <div class="form-group">
                        <label for="serviceType">Type de service *</label>
                        <select id="serviceType" name="service_type" required>
                            <option value="">Sélectionner un service</option>
                            <option value="Décapage Simple">Décapage Simple</option>
                            <option value="Rénovation Standard">Rénovation Standard</option>
                            <option value="Rénovation Premium">Rénovation Premium</option>
                            <option value="Personnalisation">Personnalisation</option>
                            <option value="Dévoilage">Dévoilage</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="rimCount">Nombre de jantes *</label>
                        <input type="number" id="rimCount" name="rim_count" min="1" max="6" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="totalAmount">Montant total (€) *</label>
                        <input type="number" id="totalAmount" name="total" step="0.01" min="0" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="workDescription">Description du travail</label>
                    <textarea id="workDescription" name="work_description" placeholder="Détails du travail effectué..."></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary">Créer la Facture</button>
            </form>
        </div>
        
        <div class="section">
            <h2>Factures Récentes</h2>
            <div class="factures-list" id="facturesList">
                ${factures.length === 0 ? '<p>Aucune facture créée.</p>' : 
                    factures.map(f => `
                        <div class="facture-item">
                            <div class="facture-info">
                                <h4>Facture #${f.id} - ${f.customer_name}</h4>
                                <p>${f.service_type} | ${f.rim_count} jante(s) | ${f.customer_email}</p>
                            </div>
                            <div class="facture-amount">${f.total}€</div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    </div>
    
    <script>
        document.getElementById('factureForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/admin/factures/manual', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                const messageDiv = document.getElementById('factureMessage');
                
                if (response.ok) {
                    messageDiv.innerHTML = '<div class="message success">Facture créée avec succès ! ID: ' + result.facture.id + '</div>';
                    e.target.reset();
                    // Recharger la page pour voir la nouvelle facture
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    messageDiv.innerHTML = '<div class="message error">' + result.error + '</div>';
                }
            } catch (error) {
                document.getElementById('factureMessage').innerHTML = '<div class="message error">Erreur de connexion</div>';
            }
        });
    </script>
</body>
</html>
    `);
});

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, password, gdprConsent, emailConsent } = req.body;
        
        if (!firstName || !lastName || !email || !password || !gdprConsent) {
            return res.status(400).json({ error: 'Champs obligatoires manquants' });
        }
        
        // Vérifier si l'email existe déjà
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Un compte avec cet email existe déjà' });
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer l'utilisateur
        const newUser = {
            id: nextUserId++,
            firstName,
            lastName,
            email,
            phone: phone || '',
            address: address || '',
            password: hashedPassword,
            gdprConsent,
            emailConsent: emailConsent || false,
            isAdmin: false,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        res.json({ 
            success: true, 
            message: 'Inscription réussie',
            user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName }
        });
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }
        
        // Trouver l'utilisateur
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }
        
        // Vérifier le mot de passe
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }
        
        // Créer la session
        req.session.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin
        };
        
        res.json({ 
            success: true,
            message: 'Connexion réussie',
            user: req.session.user
        });
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/admin/factures/manual', (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    try {
        const { customer_name, customer_email, customer_phone, service_type, rim_count, total, work_description } = req.body;
        
        if (!customer_name || !customer_email || !service_type || !rim_count || !total) {
            return res.status(400).json({ error: 'Champs obligatoires manquants' });
        }
        
        const newFacture = {
            id: nextFactureId++,
            customer_name,
            customer_email,
            customer_phone: customer_phone || '',
            service_type,
            rim_count: parseInt(rim_count),
            total: parseFloat(total),
            work_description: work_description || '',
            status: 'payée',
            created_by: req.session.user.id,
            created_at: new Date().toISOString()
        };
        
        factures.push(newFacture);
        
        res.json({
            success: true,
            message: 'Facture créée avec succès',
            facture: newFacture
        });
        
    } catch (error) {
        console.error('Erreur création facture:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`MY JANTES Working Server running on port ${PORT}`);
});