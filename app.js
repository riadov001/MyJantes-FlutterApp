const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Session configuration (temporary memory store for testing)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
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

// Routes

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// Home page with authentication status
app.get('/', (req, res) => {
  const isAuthenticated = !!req.session.userId;
  const userRole = req.session.userRole;
  
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .navbar {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: white;
            padding: 1rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
            padding: 0 2rem;
        }
        
        .logo {
            font-size: 1.8rem;
            font-weight: bold;
            color: #dc2626;
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
            transition: background 0.3s;
        }
        
        .nav-menu a:hover {
            background: #dc2626;
        }
        
        .hero {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 4rem 2rem;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: bold;
        }
        
        .hero p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .btn {
            display: inline-block;
            padding: 1rem 2rem;
            background: white;
            color: #dc2626;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 0.5rem;
            transition: transform 0.3s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn-outline {
            background: transparent;
            color: white;
            border: 2px solid white;
        }
        
        .services {
            padding: 4rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .services h2 {
            text-align: center;
            margin-bottom: 3rem;
            font-size: 2.5rem;
            color: #333;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .service-card {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
        }
        
        .auth-section {
            background: #f8f9fa;
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #dee2e6;
        }
        
        .dashboard-section {
            background: #e3f2fd;
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #90caf9;
        }
        
        @media (max-width: 768px) {
            .navbar-content {
                flex-direction: column;
                gap: 1rem;
                padding: 0 1rem;
            }
            
            .nav-menu {
                flex-wrap: wrap;
                justify-content: center;
                gap: 0.8rem;
            }
            
            .nav-menu a {
                padding: 0.6rem 1rem;
                font-size: 0.9rem;
            }
            
            .hero {
                padding: 3rem 1rem;
            }
            
            .hero h1 {
                font-size: 2.2rem;
            }
            
            .hero p {
                font-size: 1.1rem;
            }
            
            .services {
                padding: 3rem 1rem;
            }
            
            .services-grid {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }
            
            .btn {
                padding: 0.8rem 1.5rem;
                margin: 0.3rem;
            }
        }
        
        @media (max-width: 480px) {
            .logo {
                font-size: 1.5rem;
            }
            
            .nav-menu a {
                padding: 0.5rem 0.8rem;
                font-size: 0.85rem;
            }
            
            .hero h1 {
                font-size: 1.8rem;
            }
            
            .hero p {
                font-size: 1rem;
            }
            
            .hero {
                padding: 2rem 0.8rem;
            }
            
            .services h2 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <div class="logo">MY JANTES</div>
            <div class="nav-menu">
                <a href="/devis">Demande de Devis</a>
                <a href="/reservations">Réservation</a>
                <a href="/factures">Factures</a>
                ${isAuthenticated ? `
                    ${userRole === 'admin' ? '<a href="/admin">Dashboard Admin</a>' : ''}
                    <a href="/dashboard">Mon Espace</a>
                    <a href="#" onclick="logout()">Déconnexion</a>
                ` : `
                    <a href="/login">Connexion</a>
                `}
            </div>
        </div>
    </nav>

    <section class="hero">
        <h1>MY JANTES</h1>
        <p>Spécialiste de la rénovation de jantes aluminium à Liévin</p>
        <div>
            <a href="/devis" class="btn">Demande de Devis</a>
            <a href="/reservations" class="btn btn-outline">Prendre Rendez-vous</a>
        </div>
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
        </section>
    `}

    <section class="services">
        <h2>Nos Services</h2>
        <div class="services-grid">
            <div class="service-card">
                <h3>Rénovation</h3>
                <p>Remise à neuf complète de vos jantes aluminium avec finition professionnelle</p>
            </div>
            <div class="service-card">
                <h3>Personnalisation</h3>
                <p>Couleurs et finitions sur mesure selon vos préférences</p>
            </div>
            <div class="service-card">
                <h3>Réparation</h3>
                <p>Correction des rayures, impacts et déformations</p>
            </div>
        </div>
    </section>

    <script>
        function logout() {
            fetch('/api/logout', { method: 'POST' })
                .then(() => window.location.reload());
        }
    </script>
</body>
</html>
  `);
});

// Login page
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
        body { font-family: Arial, sans-serif; background: #f8f9fa; }
        .container { max-width: 400px; margin: 100px auto; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        h1 { text-align: center; margin-bottom: 2rem; color: #dc2626; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px; }
        button { width: 100%; padding: 0.75rem; background: #dc2626; color: white; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #b91c1c; }
        .admin-login { margin-top: 1rem; padding: 1rem; background: #fff3cd; border-radius: 5px; text-align: center; }
        .back-link { text-align: center; margin-top: 2rem; }
        .back-link a { color: #dc2626; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Connexion MY JANTES</h1>
        <form onsubmit="login(event)">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" required>
            </div>
            <button type="submit">Se Connecter</button>
        </form>
        
        <div class="admin-login">
            <p><strong>Accès Administrateur:</strong></p>
            <p>Email: admin@myjantes.fr</p>
            <button onclick="loginAdmin()">Connexion Admin</button>
        </div>
        
        <div class="back-link">
            <a href="/">← Retour à l'accueil</a>
        </div>
    </div>

    <script>
        function login(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = data.role === 'admin' ? '/admin' : '/dashboard';
                } else {
                    alert('Erreur de connexion');
                }
            });
        }
        
        function loginAdmin() {
            document.getElementById('email').value = 'admin@myjantes.fr';
            document.querySelector('form').dispatchEvent(new Event('submit'));
        }
    </script>
</body>
</html>
  `);
});

// API Login
app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  
  try {
    if (email === 'admin@myjantes.fr') {
      req.session.userId = 'admin-user-001';
      req.session.userRole = 'admin';
      req.session.userEmail = email;
      res.json({ success: true, role: 'admin' });
    } else {
      // Create or find regular user
      const result = await pool.query(
        'INSERT INTO users (email, role) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET email = $1 RETURNING id',
        [email, 'client']
      );
      
      req.session.userId = result.rows[0].id;
      req.session.userRole = 'client';
      req.session.userEmail = email;
      res.json({ success: true, role: 'client' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Erreur de connexion' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Dashboard pages
app.get('/dashboard', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  
  try {
    const devisResult = await pool.query('SELECT * FROM devis WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const reservationsResult = await pool.query('SELECT * FROM reservations WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const facturesResult = await pool.query('SELECT * FROM factures WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Espace - MY JANTES</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f8f9fa; }
        .navbar { background: #1a1a1a; color: white; padding: 1rem 0; }
        .navbar-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #dc2626; }
        .nav-menu a { color: white; text-decoration: none; margin: 0 1rem; }
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .section { background: white; margin: 2rem 0; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section h2 { color: #dc2626; margin-bottom: 1rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .btn { padding: 0.5rem 1rem; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; }
        .status { padding: 0.25rem 0.5rem; border-radius: 3px; color: white; font-size: 0.8rem; }
        .status-en_attente { background: #ffc107; color: black; }
        .status-accepte { background: #28a745; }
        .status-confirmee { background: #17a2b8; }
        .status-brouillon { background: #6c757d; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <div class="logo">MY JANTES</div>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/devis">Nouveau Devis</a>
                <a href="/reservations">Nouvelle Réservation</a>
                <a href="#" onclick="logout()">Déconnexion</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <h1>Mon Espace Client</h1>
        
        <div class="section">
            <h2>Mes Devis (${devisResult.rows.length})</h2>
            ${devisResult.rows.length > 0 ? `
                <table>
                    <thead>
                        <tr><th>ID</th><th>Service</th><th>Véhicule</th><th>Prix Estimé</th><th>Statut</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                        ${devisResult.rows.map(row => `
                            <tr>
                                <td>${row.id}</td>
                                <td>${row.service_type}</td>
                                <td>${row.vehicle_type} - ${row.rim_size}</td>
                                <td>${row.estimated_price ? row.estimated_price + '€' : 'En cours'}</td>
                                <td><span class="status status-${row.status}">${row.status}</span></td>
                                <td>${new Date(row.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>Aucun devis pour le moment</p>'}
        </div>
        
        <div class="section">
            <h2>Mes Réservations (${reservationsResult.rows.length})</h2>
            ${reservationsResult.rows.length > 0 ? `
                <table>
                    <thead>
                        <tr><th>ID</th><th>Service</th><th>Date de Service</th><th>Statut</th><th>Créé le</th></tr>
                    </thead>
                    <tbody>
                        ${reservationsResult.rows.map(row => `
                            <tr>
                                <td>${row.id}</td>
                                <td>${row.service_type}</td>
                                <td>${new Date(row.service_date).toLocaleDateString()}</td>
                                <td><span class="status status-${row.status}">${row.status}</span></td>
                                <td>${new Date(row.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>Aucune réservation pour le moment</p>'}
        </div>
        
        <div class="section">
            <h2>Mes Factures (${facturesResult.rows.length})</h2>
            ${facturesResult.rows.length > 0 ? `
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
            ` : '<p>Aucune facture pour le moment</p>'}
        </div>
    </div>

    <script>
        function logout() {
            fetch('/api/logout', { method: 'POST' })
                .then(() => window.location.href = '/');
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

// Admin dashboard
app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const devisResult = await pool.query('SELECT * FROM devis ORDER BY created_at DESC');
    const reservationsResult = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
    const facturesResult = await pool.query('SELECT * FROM factures ORDER BY created_at DESC');
    
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin - MY JANTES</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f8f9fa; }
        .navbar { background: #1a1a1a; color: white; padding: 1rem 0; }
        .navbar-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #dc2626; }
        .nav-menu a { color: white; text-decoration: none; margin: 0 1rem; }
        .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2rem; font-weight: bold; color: #dc2626; }
        .section { background: white; margin: 2rem 0; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section h2 { color: #dc2626; margin-bottom: 1rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .status { padding: 0.25rem 0.5rem; border-radius: 3px; color: white; font-size: 0.8rem; }
        .status-en_attente { background: #ffc107; color: black; }
        .status-accepte { background: #28a745; }
        .status-refuse { background: #dc3545; }
        .status-confirmee { background: #17a2b8; }
        .status-en_cours { background: #fd7e14; }
        .status-terminee { background: #28a745; }
        .status-brouillon { background: #6c757d; }
        .status-envoyee { background: #007bff; }
        .status-payee { background: #28a745; }
        select { padding: 0.25rem; border: 1px solid #ddd; border-radius: 3px; }
        button { padding: 0.25rem 0.5rem; background: #dc2626; color: white; border: none; border-radius: 3px; cursor: pointer; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <div class="logo">MY JANTES - ADMIN</div>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/dashboard">Mon Espace</a>
                <a href="#" onclick="logout()">Déconnexion</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <h1>Dashboard Administrateur</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${devisResult.rows.length}</div>
                <div>Devis Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reservationsResult.rows.length}</div>
                <div>Réservations Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${facturesResult.rows.length}</div>
                <div>Factures Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${devisResult.rows.filter(d => d.status === 'en_attente').length}</div>
                <div>Devis en Attente</div>
            </div>
        </div>
        
        <div class="section">
            <h2>Gestion des Devis</h2>
            <table>
                <thead>
                    <tr><th>ID</th><th>Client</th><th>Email</th><th>Service</th><th>Véhicule</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${devisResult.rows.map(row => `
                        <tr>
                            <td>${row.id}</td>
                            <td>${row.customer_name}</td>
                            <td>${row.customer_email}</td>
                            <td>${row.service_type}</td>
                            <td>${row.vehicle_type} - ${row.rim_size}</td>
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
        
        <div class="section">
            <h2>Gestion des Réservations</h2>
            <table>
                <thead>
                    <tr><th>ID</th><th>Client</th><th>Email</th><th>Service</th><th>Date Service</th><th>Statut</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${reservationsResult.rows.map(row => `
                        <tr>
                            <td>${row.id}</td>
                            <td>${row.customer_name}</td>
                            <td>${row.customer_email}</td>
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
        
        <div class="section">
            <h2>Gestion des Factures</h2>
            <table>
                <thead>
                    <tr><th>ID</th><th>Client</th><th>Email</th><th>Montant</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
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
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <script>
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
        
        function logout() {
            fetch('/api/logout', { method: 'POST' })
                .then(() => window.location.href = '/');
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

// API routes for updating statuses
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

// Devis page and API
app.get('/devis', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande de Devis - MY JANTES</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f8f9fa; }
        .navbar { background: #1a1a1a; color: white; padding: 1rem 0; }
        .navbar-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #dc2626; }
        .nav-menu a { color: white; text-decoration: none; margin: 0 1rem; }
        .container { max-width: 800px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
        textarea { height: 100px; resize: vertical; }
        button { width: 100%; padding: 1rem; background: #dc2626; color: white; border: none; border-radius: 5px; font-size: 1.1rem; cursor: pointer; }
        button:hover { background: #b91c1c; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .success { background: #d4edda; color: #155724; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
        .error { background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <div class="logo">MY JANTES</div>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/reservations">Réservation</a>
                <a href="/factures">Factures</a>
                <a href="/login">Connexion</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <h1>Demande de Devis</h1>
        <p style="margin-bottom: 2rem; color: #666;">Remplissez ce formulaire pour recevoir un devis personnalisé pour vos jantes.</p>
        
        <form onsubmit="submitDevis(event)">
            <div class="form-row">
                <div class="form-group">
                    <label for="customerName">Nom complet *</label>
                    <input type="text" id="customerName" required>
                </div>
                <div class="form-group">
                    <label for="customerEmail">Email *</label>
                    <input type="email" id="customerEmail" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="customerPhone">Téléphone</label>
                <input type="tel" id="customerPhone">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="vehicleType">Type de véhicule *</label>
                    <input type="text" id="vehicleType" placeholder="Ex: Audi A4, BMW Serie 3..." required>
                </div>
                <div class="form-group">
                    <label for="rimSize">Taille des jantes *</label>
                    <select id="rimSize" required>
                        <option value="">Sélectionnez</option>
                        <option value="15 pouces">15 pouces</option>
                        <option value="16 pouces">16 pouces</option>
                        <option value="17 pouces">17 pouces</option>
                        <option value="18 pouces">18 pouces</option>
                        <option value="19 pouces">19 pouces</option>
                        <option value="20 pouces">20 pouces</option>
                        <option value="21 pouces">21 pouces</option>
                        <option value="22 pouces">22 pouces</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="rimQuantity">Nombre de jantes *</label>
                    <select id="rimQuantity" required>
                        <option value="">Sélectionnez</option>
                        <option value="1">1 jante</option>
                        <option value="2">2 jantes</option>
                        <option value="3">3 jantes</option>
                        <option value="4">4 jantes</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="serviceType">Type de service *</label>
                    <select id="serviceType" required>
                        <option value="">Sélectionnez</option>
                        <option value="Rénovation complète">Rénovation complète</option>
                        <option value="Réparation rayures">Réparation rayures</option>
                        <option value="Personnalisation couleur">Personnalisation couleur</option>
                        <option value="Polissage">Polissage</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="description">Description des travaux souhaités</label>
                <textarea id="description" placeholder="Décrivez l'état de vos jantes et vos attentes..."></textarea>
            </div>
            
            <button type="submit">Envoyer ma demande de devis</button>
        </form>
        
        <div id="message"></div>
    </div>

    <script>
        function submitDevis(event) {
            event.preventDefault();
            
            const formData = {
                customerName: document.getElementById('customerName').value,
                customerEmail: document.getElementById('customerEmail').value,
                customerPhone: document.getElementById('customerPhone').value,
                vehicleType: document.getElementById('vehicleType').value,
                rimSize: document.getElementById('rimSize').value,
                rimQuantity: parseInt(document.getElementById('rimQuantity').value),
                serviceType: document.getElementById('serviceType').value,
                description: document.getElementById('description').value
            };
            
            fetch('/api/devis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                const messageDiv = document.getElementById('message');
                if (data.success) {
                    messageDiv.innerHTML = '<div class="success">Votre demande de devis #' + data.devis_id + ' a été envoyée avec succès ! Nous vous contacterons rapidement.</div>';
                    document.querySelector('form').reset();
                } else {
                    messageDiv.innerHTML = '<div class="error">Erreur lors de l\'envoi: ' + data.message + '</div>';
                }
            })
            .catch(error => {
                document.getElementById('message').innerHTML = '<div class="error">Erreur de connexion</div>';
            });
        }
    </script>
</body>
</html>
  `);
});

app.post('/api/devis', async (req, res) => {
  try {
    const {
      customerName, customerEmail, customerPhone,
      vehicleType, rimSize, rimQuantity, serviceType, description
    } = req.body;
    
    const devisId = `DEVIS-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Calculate estimated price based on service type
    let estimatedPrice = 0;
    switch (serviceType) {
      case 'Rénovation complète': estimatedPrice = 80 * rimQuantity; break;
      case 'Réparation rayures': estimatedPrice = 40 * rimQuantity; break;
      case 'Personnalisation couleur': estimatedPrice = 100 * rimQuantity; break;
      case 'Polissage': estimatedPrice = 30 * rimQuantity; break;
      default: estimatedPrice = 60 * rimQuantity;
    }
    
    await pool.query(`
      INSERT INTO devis (id, user_id, customer_name, customer_email, customer_phone, 
                        vehicle_type, rim_size, rim_quantity, service_type, description, estimated_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      devisId, req.session.userId || null, customerName, customerEmail, customerPhone,
      vehicleType, rimSize, rimQuantity, serviceType, description, estimatedPrice
    ]);
    
    res.json({ success: true, devis_id: devisId, estimated_price: estimatedPrice });
  } catch (error) {
    console.error('Devis creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reservations page and API
app.get('/reservations', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réservation - MY JANTES</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f8f9fa; }
        .navbar { background: #1a1a1a; color: white; padding: 1rem 0; }
        .navbar-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #dc2626; }
        .nav-menu a { color: white; text-decoration: none; margin: 0 1rem; }
        .container { max-width: 800px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; }
        textarea { height: 100px; resize: vertical; }
        button { width: 100%; padding: 1rem; background: #dc2626; color: white; border: none; border-radius: 5px; font-size: 1.1rem; cursor: pointer; }
        button:hover { background: #b91c1c; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .success { background: #d4edda; color: #155724; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
        .error { background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <div class="logo">MY JANTES</div>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/devis">Devis</a>
                <a href="/factures">Factures</a>
                <a href="/login">Connexion</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <h1>Prendre Rendez-vous</h1>
        <p style="margin-bottom: 2rem; color: #666;">Réservez votre créneau pour le service de vos jantes.</p>
        
        <form onsubmit="submitReservation(event)">
            <div class="form-row">
                <div class="form-group">
                    <label for="customerName">Nom complet *</label>
                    <input type="text" id="customerName" required>
                </div>
                <div class="form-group">
                    <label for="customerEmail">Email *</label>
                    <input type="email" id="customerEmail" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="customerPhone">Téléphone *</label>
                <input type="tel" id="customerPhone" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="serviceDate">Date souhaitée *</label>
                    <input type="date" id="serviceDate" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="serviceType">Type de service *</label>
                    <select id="serviceType" required>
                        <option value="">Sélectionnez</option>
                        <option value="Rénovation complète">Rénovation complète</option>
                        <option value="Réparation rayures">Réparation rayures</option>
                        <option value="Personnalisation couleur">Personnalisation couleur</option>
                        <option value="Polissage">Polissage</option>
                        <option value="Consultation">Consultation</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="vehicleInfo">Informations véhicule</label>
                <input type="text" id="vehicleInfo" placeholder="Marque, modèle, taille des jantes...">
            </div>
            
            <div class="form-group">
                <label for="specialInstructions">Instructions spéciales</label>
                <textarea id="specialInstructions" placeholder="Détails supplémentaires, préférences..."></textarea>
            </div>
            
            <button type="submit">Confirmer ma réservation</button>
        </form>
        
        <div id="message"></div>
    </div>

    <script>
        function submitReservation(event) {
            event.preventDefault();
            
            const formData = {
                customerName: document.getElementById('customerName').value,
                customerEmail: document.getElementById('customerEmail').value,
                customerPhone: document.getElementById('customerPhone').value,
                serviceDate: document.getElementById('serviceDate').value,
                serviceType: document.getElementById('serviceType').value,
                vehicleInfo: document.getElementById('vehicleInfo').value,
                specialInstructions: document.getElementById('specialInstructions').value
            };
            
            fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                const messageDiv = document.getElementById('message');
                if (data.success) {
                    messageDiv.innerHTML = '<div class="success">Votre réservation #' + data.reservation_id + ' a été confirmée pour le ' + formData.serviceDate + ' !</div>';
                    document.querySelector('form').reset();
                } else {
                    messageDiv.innerHTML = '<div class="error">Erreur lors de la réservation: ' + data.message + '</div>';
                }
            })
            .catch(error => {
                document.getElementById('message').innerHTML = '<div class="error">Erreur de connexion</div>';
            });
        }
    </script>
</body>
</html>
  `);
});

app.post('/api/reservations', async (req, res) => {
  try {
    const {
      customerName, customerEmail, customerPhone,
      serviceDate, serviceType, vehicleInfo, specialInstructions,
      preferredDate, preferredTime, description
    } = req.body;
    
    const reservationId = `RES-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Use preferredDate if provided, otherwise serviceDate, or default to today
    const finalServiceDate = preferredDate || serviceDate || new Date().toISOString().split('T')[0];
    const finalVehicleInfo = vehicleInfo || description || 'Véhicule non spécifié';
    const finalSpecialInstructions = specialInstructions || description || '';
    
    console.log('Debug reservation data:', {
      reservationId, 
      userId: req.session.userId || null, 
      customerName, customerEmail, customerPhone,
      finalServiceDate, serviceType, finalVehicleInfo, finalSpecialInstructions
    });
    
    await pool.query(`
      INSERT INTO reservations (id, user_id, customer_name, customer_email, customer_phone, 
                               service_date, service_type, vehicle_info, special_instructions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      reservationId, req.session.userId || null, customerName, customerEmail, customerPhone,
      finalServiceDate, serviceType, finalVehicleInfo, finalSpecialInstructions
    ]);
    
    res.json({ success: true, reservation_id: reservationId });
  } catch (error) {
    console.error('Reservation creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Factures
app.post('/api/factures', async (req, res) => {
  try {
    const {
      customerName, customerEmail, customerPhone, customerAddress,
      serviceType, quantity, unitPrice, description
    } = req.body;
    
    const factureId = `FACT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Create invoice items structure
    const items = [{
      description: serviceType || description || 'Service MY JANTES',
      quantity: quantity || 1,
      unitPrice: unitPrice || 0,
      total: (quantity || 1) * (unitPrice || 0)
    }];
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 20.00;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    await pool.query(`
      INSERT INTO factures (id, user_id, customer_name, customer_email, customer_phone, 
                           customer_address, items, subtotal, tax_rate, tax_amount, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      factureId, req.session.userId || null, customerName, customerEmail, customerPhone,
      customerAddress || '', JSON.stringify(items), subtotal, taxRate, taxAmount, total
    ]);
    
    res.json({ success: true, facture_id: factureId, total: total, subtotal: subtotal, tax_amount: taxAmount });
  } catch (error) {
    console.error('Facture creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Factures page
app.get('/factures', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factures - MY JANTES</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f8f9fa; }
        .navbar { background: #1a1a1a; color: white; padding: 1rem 0; }
        .navbar-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #dc2626; }
        .nav-menu a { color: white; text-decoration: none; margin: 0 1rem; }
        .container { max-width: 800px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .info-box { background: #e3f2fd; padding: 1.5rem; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-content">
            <div class="logo">MY JANTES</div>
            <div class="nav-menu">
                <a href="/">Accueil</a>
                <a href="/devis">Devis</a>
                <a href="/reservations">Réservation</a>
                <a href="/login">Connexion</a>
            </div>
        </div>
    </nav>

    <div class="container">
        <h1>Gestion des Factures</h1>
        <div class="info-box">
            <h3>Factures Disponibles</h3>
            <p>Les factures sont générées automatiquement après acceptation des devis.</p>
            <p>Connectez-vous pour accéder à vos factures ou contactez-nous pour plus d'informations.</p>
            <div style="margin-top: 1rem;">
                <a href="/login" style="background: #dc2626; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 5px;">Se Connecter</a>
            </div>
        </div>
    </div>
</body>
</html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MY JANTES server running on port ${PORT}`);
});

module.exports = app;