const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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
    secure: false, // Allow HTTP for development
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.redirect('/login?message=admin_required');
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// CSS commun pour responsive design
const commonCSS = `
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
}

/* Navigation responsive */
.navbar {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    color: white;
    padding: 1rem 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    position: sticky;
    top: 0;
    z-index: 1000;
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
    align-items: center;
    gap: 1rem;
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

.mobile-menu-toggle {
    display: none;
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
}

/* Menu mobile */
@media (max-width: 768px) {
    .nav-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #1a1a1a;
        flex-direction: column;
        padding: 1rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    .nav-menu.active {
        display: flex;
    }
    
    .mobile-menu-toggle {
        display: block;
    }
    
    .nav-menu a {
        width: 100%;
        text-align: center;
        padding: 1rem;
        border-bottom: 1px solid #333;
    }
}

/* Conteneurs responsive */
.container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
}

.card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    overflow: hidden;
    margin: 1rem 0;
}

.card-header {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    padding: 2rem;
    text-align: center;
}

.card-body {
    padding: 2rem;
}

/* Formulaires responsive */
.form-group {
    margin-bottom: 1.5rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}

label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
}

input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

button {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(220, 38, 38, 0.3);
}

button.secondary {
    background: #6c757d;
}

button.secondary:hover {
    background: #5a6268;
}

/* Messages */
.success {
    background: #d4edda;
    color: #155724;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    border-left: 4px solid #28a745;
}

.error {
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    border-left: 4px solid #dc3545;
}

/* Grille responsive */
.grid {
    display: grid;
    gap: 2rem;
}

.grid-2 {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-3 {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* Tables responsive */
.table-container {
    overflow-x: auto;
    margin: 1rem 0;
}

table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
}

th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

th {
    background: #f8f9fa;
    font-weight: bold;
}

/* Status badges */
.status {
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    color: white;
    font-size: 0.8rem;
    font-weight: bold;
}

.status-en_attente { background: #ffc107; color: black; }
.status-accepte { background: #28a745; }
.status-refuse { background: #dc3545; }
.status-confirmee { background: #17a2b8; }
.status-en_cours { background: #fd7e14; }
.status-terminee { background: #28a745; }
.status-brouillon { background: #6c757d; }
.status-envoyee { background: #007bff; }
.status-payee { background: #28a745; }

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in {
    animation: fadeIn 0.5s ease;
}

/* Utilitaires responsive */
.text-center { text-align: center; }
.text-right { text-align: right; }
.mb-1 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 2rem; }
.p-1 { padding: 1rem; }
.p-2 { padding: 2rem; }

@media (max-width: 480px) {
    .container {
        padding: 0 0.5rem;
    }
    
    .card-body {
        padding: 1rem;
    }
    
    button {
        width: 100%;
        margin-bottom: 0.5rem;
    }
}
</style>

<script>
function toggleMobileMenu() {
    const menu = document.querySelector('.nav-menu');
    menu.classList.toggle('active');
}

// Auto-close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const menu = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (menu && toggle && !menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('active');
    }
});
</script>
`;

// Page d'accueil
app.get('/', (req, res) => {
  const isAuthenticated = !!req.session.userId;
  const userRole = req.session.userRole;
  const userName = req.session.userName;
  
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MY JANTES - Rénovation de Jantes Aluminium</title>
    ${commonCSS}
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">MY JANTES</a>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/devis">Devis</a>
                <a href="/reservations">Réservation</a>
                ${isAuthenticated ? `
                    <a href="/dashboard">Mon Espace</a>
                    ${userRole === 'admin' ? '<a href="/admin">Admin</a>' : ''}
                    <a href="#" onclick="logout()">Déconnexion (${userName})</a>
                ` : `
                    <a href="/login">Connexion</a>
                    <a href="/register">Inscription</a>
                `}
            </div>
        </div>
    </nav>

    <div class="container">
        ${isAuthenticated ? `
            <div class="card fade-in">
                <div class="card-header">
                    <h1>Bienvenue ${userName} !</h1>
                    <p>Votre espace personnel MY JANTES</p>
                </div>
                <div class="card-body">
                    <div class="grid grid-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <h3>📋 Mes Devis</h3>
                                <p>Consultez vos demandes de devis</p>
                                <a href="/dashboard" style="text-decoration: none;">
                                    <button>Voir mes devis</button>
                                </a>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body text-center">
                                <h3>📅 Mes Réservations</h3>
                                <p>Gérez vos rendez-vous</p>
                                <a href="/dashboard" style="text-decoration: none;">
                                    <button>Voir mes RDV</button>
                                </a>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body text-center">
                                <h3>💰 Mes Factures</h3>
                                <p>Consultez vos factures</p>
                                <a href="/dashboard" style="text-decoration: none;">
                                    <button>Voir mes factures</button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ` : `
            <!-- Hero Section -->
            <div class="card fade-in">
                <div class="card-header">
                    <h1>🏆 MY JANTES</h1>
                    <h2>Spécialiste Rénovation Jantes Aluminium</h2>
                    <p>Redonnez vie à vos jantes avec notre expertise professionnelle</p>
                </div>
                <div class="card-body">
                    <div class="grid grid-2">
                        <div>
                            <h3>🎯 Nos Services</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin: 0.5rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
                                    ✨ <strong>Rénovation Standard</strong> - 70€/jante
                                </li>
                                <li style="margin: 0.5rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
                                    💎 <strong>Rénovation Premium</strong> - 90€/jante
                                </li>
                                <li style="margin: 0.5rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
                                    🎨 <strong>Personnalisation</strong> - 120€/jante
                                </li>
                                <li style="margin: 0.5rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
                                    🔧 <strong>Dévoilage</strong> - 40€/jante
                                </li>
                                <li style="margin: 0.5rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 5px;">
                                    🧹 <strong>Décapage</strong> - 60€/jante
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3>📊 Nos Résultats</h3>
                            <div class="grid grid-2">
                                <div class="text-center">
                                    <div style="font-size: 2rem; font-weight: bold; color: #dc2626;">500+</div>
                                    <div>Jantes rénovées</div>
                                </div>
                                <div class="text-center">
                                    <div style="font-size: 2rem; font-weight: bold; color: #dc2626;">98%</div>
                                    <div>Clients satisfaits</div>
                                </div>
                            </div>
                            <div class="text-center" style="margin-top: 2rem;">
                                <a href="/register" style="text-decoration: none;">
                                    <button style="font-size: 1.2rem; padding: 1rem 2rem;">
                                        🚀 Commencer maintenant
                                    </button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `}
    </div>

    <script>
        function logout() {
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                fetch('/api/logout', { method: 'POST' })
                    .then(() => window.location.href = '/');
            }
        }
    </script>
</body>
</html>
  `);
});

// Page d'inscription
app.get('/register', (req, res) => {
  const message = req.query.message;
  
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inscription - MY JANTES</title>
    ${commonCSS}
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">MY JANTES</a>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/login">Connexion</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="card fade-in" style="max-width: 600px; margin: 2rem auto;">
            <div class="card-header">
                <h1>Créer un compte</h1>
                <p>Rejoignez MY JANTES pour accéder à tous nos services</p>
            </div>
            <div class="card-body">
                ${message === 'success' ? '<div class="success">Inscription réussie ! Vous pouvez maintenant vous connecter.</div>' : ''}
                ${message === 'email_exists' ? '<div class="error">Cette adresse email est déjà utilisée.</div>' : ''}
                
                <form onsubmit="registerUser(event)">
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
                        <label for="email">Adresse email *</label>
                        <input type="email" id="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="phone">Téléphone</label>
                        <input type="tel" id="phone" placeholder="06 12 34 56 78">
                    </div>
                    
                    <div class="form-group">
                        <label for="address">Adresse complète</label>
                        <textarea id="address" rows="3" placeholder="123 Rue de la Paix, 62800 Liévin"></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="password">Mot de passe *</label>
                            <input type="password" id="password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirmer le mot de passe *</label>
                            <input type="password" id="confirmPassword" required minlength="6">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="terms" required>
                            J'accepte les conditions d'utilisation et la politique de confidentialité
                        </label>
                    </div>
                    
                    <button type="submit" style="width: 100%; margin-top: 1rem;">
                        Créer mon compte
                    </button>
                </form>
                
                <div class="text-center" style="margin-top: 2rem;">
                    <p>Déjà un compte ? <a href="/login" style="color: #dc2626; text-decoration: none; font-weight: bold;">Se connecter</a></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function registerUser(event) {
            event.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Les mots de passe ne correspondent pas');
                return;
            }
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                password: password
            };
            
            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/login?message=registration_success';
                } else {
                    alert(data.message || 'Erreur lors de l\\'inscription');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Erreur lors de l\\'inscription');
            });
        }
    </script>
</body>
</html>
  `);
});

// Page de connexion
app.get('/login', (req, res) => {
  const message = req.query.message;
  const redirect = req.query.redirect || '/dashboard';
  
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - MY JANTES</title>
    ${commonCSS}
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">MY JANTES</a>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/register">Inscription</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="card fade-in" style="max-width: 500px; margin: 2rem auto;">
            <div class="card-header">
                <h1>Connexion</h1>
                <p>Accédez à votre espace personnel</p>
            </div>
            <div class="card-body">
                ${message === 'registration_success' ? '<div class="success">Inscription réussie ! Connectez-vous maintenant.</div>' : ''}
                ${message === 'invalid_credentials' ? '<div class="error">Email ou mot de passe incorrect.</div>' : ''}
                ${message === 'admin_required' ? '<div class="error">Accès administrateur requis.</div>' : ''}
                
                <form onsubmit="loginUser(event)">
                    <input type="hidden" id="redirectUrl" value="${redirect}">
                    
                    <div class="form-group">
                        <label for="email">Adresse email</label>
                        <input type="email" id="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Mot de passe</label>
                        <input type="password" id="password" required>
                    </div>
                    
                    <button type="submit" style="width: 100%; margin-top: 1rem;">
                        Se connecter
                    </button>
                </form>
                
                <div class="text-center" style="margin-top: 2rem;">
                    <p>Pas encore de compte ? <a href="/register" style="color: #dc2626; text-decoration: none; font-weight: bold;">S'inscrire</a></p>
                </div>
                
                <div class="text-center" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                    <p style="font-size: 0.9rem; color: #666;">
                        <strong>Compte admin de test :</strong><br>
                        Email: admin@myjantes.fr<br>
                        Mot de passe: admin123
                    </p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function loginUser(event) {
            event.preventDefault();
            
            const formData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const redirectUrl = document.getElementById('redirectUrl').value;
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = '/login?message=invalid_credentials';
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Erreur lors de la connexion');
            });
        }
    </script>
</body>
</html>
  `);
});

// API d'inscription
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phone, address, password } = req.body;
  
  try {
    // Vérifier si l'email existe déjà
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.json({ success: false, message: 'Cette adresse email est déjà utilisée' });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Créer l'utilisateur
    const userId = `USER-${Date.now()}`;
    await pool.query(`
      INSERT INTO users (id, email, password, first_name, last_name, phone, address, role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'client', NOW())
    `, [userId, email, hashedPassword, firstName, lastName, phone, address]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    res.json({ success: false, message: 'Erreur lors de l\'inscription' });
  }
});

// API de connexion
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.json({ success: false, message: 'Mot de passe incorrect' });
    }
    
    // Créer la session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = `${user.first_name} ${user.last_name}`;
    req.session.userRole = user.role;
    
    // Mettre à jour la dernière connexion
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: 'Erreur lors de la connexion' });
  }
});

// API de déconnexion
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.json({ success: false });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Dashboard utilisateur
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const userName = req.session.userName;
    
    // Récupérer les données de l'utilisateur
    const devisResult = await pool.query('SELECT * FROM devis WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const reservationsResult = await pool.query('SELECT * FROM reservations WHERE user_id = $1 ORDER BY service_date DESC', [userId]);
    const facturesResult = await pool.query('SELECT * FROM factures WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Espace - MY JANTES</title>
    ${commonCSS}
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">MY JANTES</a>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/devis">Nouveau Devis</a>
                <a href="/reservations">Réserver</a>
                <a href="#" onclick="logout()">Déconnexion</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="card fade-in">
            <div class="card-header">
                <h1>Mon Espace Personnel</h1>
                <p>Bienvenue ${userName}</p>
            </div>
        </div>
        
        <!-- Mes Devis -->
        <div class="card fade-in">
            <div class="card-body">
                <h2>📋 Mes Devis</h2>
                ${devisResult.rows.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>ID</th><th>Service</th><th>Véhicule</th><th>Statut</th><th>Date</th></tr>
                            </thead>
                            <tbody>
                                ${devisResult.rows.map(row => `
                                    <tr>
                                        <td>${row.id}</td>
                                        <td>${row.service_type}</td>
                                        <td>${row.vehicle_type} - ${row.rim_size}</td>
                                        <td><span class="status status-${row.status}">${row.status}</span></td>
                                        <td>${new Date(row.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p>Aucun devis pour le moment. <a href="/devis">Faire une demande</a></p>'}
            </div>
        </div>
        
        <!-- Mes Réservations -->
        <div class="card fade-in">
            <div class="card-body">
                <h2>📅 Mes Réservations</h2>
                ${reservationsResult.rows.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>ID</th><th>Service</th><th>Date</th><th>Statut</th></tr>
                            </thead>
                            <tbody>
                                ${reservationsResult.rows.map(row => `
                                    <tr>
                                        <td>${row.id}</td>
                                        <td>${row.service_type}</td>
                                        <td>${new Date(row.service_date).toLocaleDateString()}</td>
                                        <td><span class="status status-${row.status}">${row.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p>Aucune réservation pour le moment. <a href="/reservations">Réserver maintenant</a></p>'}
            </div>
        </div>
        
        <!-- Mes Factures -->
        <div class="card fade-in">
            <div class="card-body">
                <h2>💰 Mes Factures</h2>
                ${facturesResult.rows.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>ID</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
                            </thead>
                            <tbody>
                                ${facturesResult.rows.map(row => `
                                    <tr>
                                        <td>${row.id}</td>
                                        <td>${row.total}€</td>
                                        <td><span class="status status-${row.status}">${row.status}</span></td>
                                        <td>${new Date(row.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p>Aucune facture pour le moment</p>'}
            </div>
        </div>
    </div>

    <script>
        function logout() {
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                fetch('/api/logout', { method: 'POST' })
                    .then(() => window.location.href = '/');
            }
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Erreur serveur');
  }
});

// Admin dashboard avec génération de factures manuelles FONCTIONNELLE
app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const devisResult = await pool.query('SELECT * FROM devis ORDER BY created_at DESC');
    const reservationsResult = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
    const facturesResult = await pool.query('SELECT * FROM factures ORDER BY created_at DESC');
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['client']);
    
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - MY JANTES</title>
    ${commonCSS}
    <style>
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .invoice-form {
            display: none;
            background: #e8f5e8;
            border: 2px solid #28a745;
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .btn-create {
            background: #28a745;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
        }
        
        .btn-send {
            background: #007bff;
            color: white;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.85rem;
            margin-left: 0.5rem;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">MY JANTES - ADMIN</a>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/dashboard">Mon Espace</a>
                <a href="#" onclick="logout()">Déconnexion</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="card fade-in">
            <div class="card-header">
                <h1>🔧 Dashboard Administrateur</h1>
                <p>Gestion complète de MY JANTES</p>
            </div>
        </div>
        
        <!-- Statistiques -->
        <div class="stats-grid fade-in">
            <div class="stat-card">
                <div class="stat-number">${devisResult.rows.length}</div>
                <div>Devis Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reservationsResult.rows.length}</div>
                <div>Réservations</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${facturesResult.rows.length}</div>
                <div>Factures</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${usersResult.rows[0].count}</div>
                <div>Clients</div>
            </div>
        </div>
        
        <!-- Gestion des Factures avec Création Manuelle -->
        <div class="card fade-in">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <h2>💰 Gestion des Factures</h2>
                    <button class="btn-create" onclick="showInvoiceForm()">+ Créer Facture Manuelle</button>
                </div>
                
                <!-- Formulaire de création de facture -->
                <div id="invoiceForm" class="invoice-form">
                    <h3 style="color: #28a745; margin-bottom: 1rem;">✨ Nouvelle Facture Manuelle</h3>
                    <form onsubmit="createManualInvoice(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="customerName">Nom du client *</label>
                                <input type="text" id="customerName" required>
                            </div>
                            <div class="form-group">
                                <label for="customerEmail">Email du client *</label>
                                <input type="email" id="customerEmail" required>
                            </div>
                            <div class="form-group">
                                <label for="customerPhone">Téléphone</label>
                                <input type="tel" id="customerPhone">
                            </div>
                            <div class="form-group">
                                <label for="serviceType">Service réalisé *</label>
                                <select id="serviceType" required onchange="updatePrice()">
                                    <option value="">Sélectionnez un service</option>
                                    <option value="Rénovation Standard" data-price="70">Rénovation Standard - 70€</option>
                                    <option value="Rénovation Premium" data-price="90">Rénovation Premium - 90€</option>
                                    <option value="Personnalisation" data-price="120">Personnalisation - 120€</option>
                                    <option value="Dévoilage" data-price="40">Dévoilage - 40€</option>
                                    <option value="Décapage" data-price="60">Décapage - 60€</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="rimCount">Nombre de jantes *</label>
                                <input type="number" id="rimCount" min="1" max="8" value="4" required onchange="updatePrice()">
                            </div>
                            <div class="form-group">
                                <label for="totalAmount">Montant total (€) *</label>
                                <input type="number" id="totalAmount" step="0.01" min="0" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="workDescription">Description des travaux</label>
                            <textarea id="workDescription" rows="3" placeholder="Décrivez les travaux effectués..."></textarea>
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; flex-wrap: wrap;">
                            <button type="button" onclick="hideInvoiceForm()" class="secondary">Annuler</button>
                            <button type="submit" class="btn-create">Créer la Facture</button>
                        </div>
                    </form>
                </div>
                
                <!-- Liste des factures -->
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Client</th>
                                <th>Email</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${facturesResult.rows.map(row => `
                                <tr>
                                    <td>${row.id}</td>
                                    <td>${row.customer_name}</td>
                                    <td>${row.customer_email}</td>
                                    <td>${row.total}€</td>
                                    <td><span class="status status-${row.status}">${row.status}</span></td>
                                    <td>${new Date(row.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <select onchange="updateStatus('factures', '${row.id}', this.value)">
                                            <option value="brouillon" ${row.status === 'brouillon' ? 'selected' : ''}>Brouillon</option>
                                            <option value="envoyee" ${row.status === 'envoyee' ? 'selected' : ''}>Envoyée</option>
                                            <option value="payee" ${row.status === 'payee' ? 'selected' : ''}>Payée</option>
                                            <option value="annulee" ${row.status === 'annulee' ? 'selected' : ''}>Annulée</option>
                                        </select>
                                        <button class="btn-send" onclick="sendInvoiceEmail('${row.id}')">📧 Envoyer</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Gestion des Devis -->
        <div class="card fade-in">
            <div class="card-body">
                <h2>📋 Gestion des Devis</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Client</th><th>Email</th><th>Service</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${devisResult.rows.map(row => `
                                <tr>
                                    <td>${row.id}</td>
                                    <td>${row.customer_name}</td>
                                    <td>${row.customer_email}</td>
                                    <td>${row.service_type}</td>
                                    <td><span class="status status-${row.status}">${row.status}</span></td>
                                    <td>${new Date(row.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <select onchange="updateStatus('devis', '${row.id}', this.value)">
                                            <option value="en_attente" ${row.status === 'en_attente' ? 'selected' : ''}>En attente</option>
                                            <option value="accepte" ${row.status === 'accepte' ? 'selected' : ''}>Accepté</option>
                                            <option value="refuse" ${row.status === 'refuse' ? 'selected' : ''}>Refusé</option>
                                            <option value="expire" ${row.status === 'expire' ? 'selected' : ''}>Expiré</option>
                                        </select>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Gestion des Réservations -->
        <div class="card fade-in">
            <div class="card-body">
                <h2>📅 Gestion des Réservations</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Client</th><th>Service</th><th>Date</th><th>Statut</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${reservationsResult.rows.map(row => `
                                <tr>
                                    <td>${row.id}</td>
                                    <td>${row.customer_name}</td>
                                    <td>${row.service_type}</td>
                                    <td>${new Date(row.service_date).toLocaleDateString()}</td>
                                    <td><span class="status status-${row.status}">${row.status}</span></td>
                                    <td>
                                        <select onchange="updateStatus('reservations', '${row.id}', this.value)">
                                            <option value="confirmee" ${row.status === 'confirmee' ? 'selected' : ''}>Confirmée</option>
                                            <option value="en_cours" ${row.status === 'en_cours' ? 'selected' : ''}>En cours</option>
                                            <option value="terminee" ${row.status === 'terminee' ? 'selected' : ''}>Terminée</option>
                                            <option value="annulee" ${row.status === 'annulee' ? 'selected' : ''}>Annulée</option>
                                        </select>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        function showInvoiceForm() {
            document.getElementById('invoiceForm').style.display = 'block';
            window.scrollTo({
                top: document.getElementById('invoiceForm').offsetTop - 100,
                behavior: 'smooth'
            });
        }
        
        function hideInvoiceForm() {
            document.getElementById('invoiceForm').style.display = 'none';
            document.querySelector('#invoiceForm form').reset();
        }
        
        function updatePrice() {
            const serviceSelect = document.getElementById('serviceType');
            const rimCount = parseInt(document.getElementById('rimCount').value) || 4;
            const totalField = document.getElementById('totalAmount');
            
            if (serviceSelect.selectedOptions[0]) {
                const pricePerRim = parseFloat(serviceSelect.selectedOptions[0].dataset.price);
                if (pricePerRim) {
                    totalField.value = (pricePerRim * rimCount).toFixed(2);
                }
            }
        }
        
        function createManualInvoice(event) {
            event.preventDefault();
            
            const formData = {
                customer_name: document.getElementById('customerName').value,
                customer_email: document.getElementById('customerEmail').value,
                customer_phone: document.getElementById('customerPhone').value,
                service_type: document.getElementById('serviceType').value,
                rim_count: parseInt(document.getElementById('rimCount').value),
                total: parseFloat(document.getElementById('totalAmount').value),
                work_description: document.getElementById('workDescription').value
            };
            
            fetch('/api/admin/factures/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('✅ Facture créée avec succès !\\nNuméro: ' + data.invoiceId);
                    location.reload();
                } else {
                    alert('❌ Erreur: ' + (data.message || 'Erreur inconnue'));
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('❌ Erreur lors de la création de la facture');
            });
        }
        
        function updateStatus(type, id, status) {
            fetch('/api/admin/' + type + '/' + id + '/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Erreur lors de la mise à jour');
                }
            });
        }
        
        function sendInvoiceEmail(invoiceId) {
            if (confirm('Envoyer cette facture par email au client ?')) {
                fetch('/api/admin/factures/' + invoiceId + '/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('✅ Email envoyé avec succès !');
                        location.reload();
                    } else {
                        alert('❌ Erreur: ' + (data.message || 'Erreur inconnue'));
                    }
                });
            }
        }
        
        function logout() {
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                fetch('/api/logout', { method: 'POST' })
                    .then(() => window.location.href = '/');
            }
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).send('Erreur serveur');
  }
});

// API pour créer des factures manuelles (CORRIGÉE)
app.post('/api/admin/factures/manual', requireAdmin, async (req, res) => {
  const { customer_name, customer_email, customer_phone, service_type, rim_count, total, work_description } = req.body;
  
  try {
    // Générer l'ID de facture
    const year = new Date().getFullYear();
    const countResult = await pool.query('SELECT COUNT(*) FROM factures WHERE created_at >= $1', [`${year}-01-01`]);
    const count = parseInt(countResult.rows[0].count) + 1;
    const invoiceId = `FACT-${year}-${count.toString().padStart(4, '0')}`;
    
    // Créer l'objet items pour la compatibilité avec le schéma existant
    const items = [{
      description: service_type,
      quantity: rim_count,
      unit_price: total / rim_count,
      total: total
    }];
    
    // Calculer la TVA
    const tax_rate = 20.00;
    const subtotal = total / (1 + tax_rate / 100);
    const tax_amount = total - subtotal;
    
    // Insérer la facture avec tous les champs requis
    await pool.query(`
      INSERT INTO factures (
        id, customer_name, customer_email, customer_phone, 
        service_type, rim_count, work_description,
        items, subtotal, tax_rate, tax_amount, total, 
        status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'brouillon', NOW())
    `, [
      invoiceId, customer_name, customer_email, customer_phone,
      service_type, rim_count, work_description,
      JSON.stringify(items), subtotal, tax_rate, tax_amount, total
    ]);
    
    res.json({ success: true, invoiceId });
  } catch (error) {
    console.error('Manual invoice creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API pour envoyer une facture par email
app.post('/api/admin/factures/:id/send-email', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Récupérer les détails de la facture
    const result = await pool.query('SELECT * FROM factures WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }
    
    const invoice = result.rows[0];
    
    // Simuler l'envoi d'email (dans un vrai projet, utilisez nodemailer)
    console.log(`Envoi email facture ${invoice.id} à ${invoice.customer_email}`);
    
    // Mettre à jour le statut de la facture
    await pool.query('UPDATE factures SET status = $1 WHERE id = $2', ['envoyee', id]);
    
    res.json({ success: true, message: 'Email de facture envoyé' });
  } catch (error) {
    console.error('Invoice email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API pour mettre à jour les statuts
app.put('/api/admin/:type/:id/status', requireAdmin, async (req, res) => {
  const { type, id } = req.params;
  const { status } = req.body;
  
  try {
    await pool.query(`UPDATE ${type} SET status = $1 WHERE id = $2`, [status, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ success: false });
  }
});

// Pages de devis et réservations (simplifiées pour l'exemple)
app.get('/devis', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de Devis - MY JANTES</title>
    ${commonCSS}
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">MY JANTES</a>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/login">Connexion</a>
                <a href="/register">Inscription</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="card fade-in">
            <div class="card-header">
                <h1>Demande de Devis</h1>
                <p>Obtenez un devis personnalisé pour vos jantes</p>
            </div>
            <div class="card-body">
                <p style="text-align: center; color: #666; font-size: 1.1rem;">
                    📋 Cette page sera développée prochainement<br>
                    En attendant, contactez-nous directement !
                </p>
                <div class="text-center" style="margin-top: 2rem;">
                    <a href="/" style="text-decoration: none;">
                        <button>Retour à l'accueil</button>
                    </a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

app.get('/reservations', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réservation - MY JANTES</title>
    ${commonCSS}
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/" class="logo">MY JANTES</a>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/login">Connexion</a>
                <a href="/register">Inscription</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="card fade-in">
            <div class="card-header">
                <h1>Réservation</h1>
                <p>Prenez rendez-vous pour vos jantes</p>
            </div>
            <div class="card-body">
                <p style="text-align: center; color: #666; font-size: 1.1rem;">
                    📅 Cette page sera développée prochainement<br>
                    En attendant, contactez-nous directement !
                </p>
                <div class="text-center" style="margin-top: 2rem;">
                    <a href="/" style="text-decoration: none;">
                        <button>Retour à l'accueil</button>
                    </a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MY JANTES Complete Server running on port ${PORT}`);
});