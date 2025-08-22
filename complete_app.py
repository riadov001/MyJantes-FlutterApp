#!/usr/bin/env python3
"""
MY JANTES - Application complète avec authentification et persistance SQLite
Version optimisée avec gestion des sessions, espaces utilisateur/admin
"""
import os
import json
import http.server
import socketserver
import urllib.parse
import sqlite3
from datetime import datetime, timedelta
import uuid
import hashlib
import secrets
from http.cookies import SimpleCookie

class DatabaseManager:
    def __init__(self):
        self.db_path = "myjantes_complete.db"
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    
    def init_database(self):
        """Initialize SQLite database with required tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Table des utilisateurs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                phone TEXT,
                address TEXT,
                user_type TEXT DEFAULT 'client',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # Table des sessions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des devis avec référence utilisateur
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devis (
                id TEXT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                client_phone TEXT,
                service_type TEXT NOT NULL,
                description TEXT,
                prix REAL,
                status TEXT DEFAULT 'en_attente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des réservations avec référence utilisateur
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reservations (
                id TEXT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                client_phone TEXT,
                service_type TEXT NOT NULL,
                date_rdv DATE NOT NULL,
                heure_rdv TIME NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'confirmee',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des factures avec référence utilisateur
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS factures (
                id TEXT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                devis_id TEXT REFERENCES devis(id),
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                service_type TEXT NOT NULL,
                montant REAL NOT NULL,
                status TEXT DEFAULT 'en_attente',
                date_facture DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        
        # Créer un admin par défaut
        self.create_default_admin(cursor, conn)
        
        cursor.close()
        conn.close()
    
    def create_default_admin(self, cursor, conn):
        """Créer un administrateur par défaut"""
        admin_email = "admin@myjantes.fr"
        admin_password = "MyJantes2025!"
        
        cursor.execute("SELECT id FROM users WHERE email = ?", (admin_email,))
        if not cursor.fetchone():
            password_hash = hashlib.sha256(admin_password.encode()).hexdigest()
            cursor.execute('''
                INSERT INTO users (email, password_hash, first_name, last_name, user_type)
                VALUES (?, ?, ?, ?, ?)
            ''', (admin_email, password_hash, "Admin", "MY JANTES", "admin"))
            conn.commit()
            print(f"Admin créé - Email: {admin_email}, Mot de passe: {admin_password}")

class AuthManager:
    def __init__(self, db_manager):
        self.db = db_manager
        self.secret_key = secrets.token_hex(32)
    
    def hash_password(self, password):
        """Hash a password"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password, password_hash):
        """Verify a password"""
        return hashlib.sha256(password.encode()).hexdigest() == password_hash
    
    def create_session(self, user_id):
        """Create a new session"""
        session_id = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=24)
        
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO sessions (id, user_id, expires_at)
            VALUES (?, ?, ?)
        ''', (session_id, user_id, expires_at))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return session_id
    
    def get_user_from_session(self, session_id):
        """Get user from session ID"""
        if not session_id:
            return None
            
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.* FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.id = ? AND s.expires_at > datetime('now')
        ''', (session_id,))
        
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return dict(row) if row else None
    
    def login_user(self, email, password):
        """Login user"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        row = cursor.fetchone()
        
        if row and self.verify_password(password, row['password_hash']):
            user = dict(row)
            
            # Update last login
            cursor.execute('UPDATE users SET last_login = datetime("now") WHERE id = ?', (user['id'],))
            conn.commit()
            
            # Create session
            session_id = self.create_session(user['id'])
            
            cursor.close()
            conn.close()
            
            return {'user': user, 'session_id': session_id}
        
        cursor.close()
        conn.close()
        return None
    
    def register_user(self, email, password, first_name, last_name, phone=None, address=None):
        """Register new user"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return {'success': False, 'error': 'Email déjà utilisé'}
        
        # Create user
        password_hash = self.hash_password(password)
        cursor.execute('''
            INSERT INTO users (email, password_hash, first_name, last_name, phone, address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (email, password_hash, first_name, last_name, phone, address))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # Create session
        session_id = self.create_session(user_id)
        
        cursor.close()
        conn.close()
        
        return {'success': True, 'session_id': session_id, 'user_id': user_id}
    
    def logout_user(self, session_id):
        """Logout user"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM sessions WHERE id = ?', (session_id,))
        conn.commit()
        
        cursor.close()
        conn.close()

class MyJantesAPI:
    def __init__(self):
        self.db = DatabaseManager()
        self.auth = AuthManager(self.db)
    
    def create_devis(self, data, user_id):
        """Créer un nouveau devis pour l'utilisateur connecté"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        devis_id = f"DEV-{str(uuid.uuid4())[:8].upper()}"
        prix = self.calculate_price(data.get('service_type', ''))
        
        cursor.execute('''
            INSERT INTO devis (id, user_id, client_name, client_email, client_phone, 
                             service_type, description, prix)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (devis_id, user_id, data['client_name'], data['client_email'], 
              data.get('client_phone', ''), data['service_type'], 
              data.get('description', ''), prix))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'success': True,
            'devis_id': devis_id,
            'prix_estime': prix,
            'message': f'Devis #{devis_id} créé avec succès'
        }
    
    def create_reservation(self, data, user_id):
        """Créer une nouvelle réservation pour l'utilisateur connecté"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        reservation_id = f"RES-{str(uuid.uuid4())[:8].upper()}"
        
        cursor.execute('''
            INSERT INTO reservations (id, user_id, client_name, client_email, client_phone,
                                    service_type, date_rdv, heure_rdv, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (reservation_id, user_id, data['client_name'], data['client_email'],
              data.get('client_phone', ''), data['service_type'],
              data['date_rdv'], data['heure_rdv'], data.get('description', '')))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'success': True,
            'reservation_id': reservation_id,
            'message': f'Réservation #{reservation_id} confirmée pour le {data["date_rdv"]} à {data["heure_rdv"]}'
        }
    
    def create_facture(self, devis_id, user_id, montant):
        """Créer une nouvelle facture depuis un devis"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        # Get devis info
        cursor.execute('SELECT * FROM devis WHERE id = ? AND user_id = ?', (devis_id, user_id))
        devis = cursor.fetchone()
        
        if not devis:
            cursor.close()
            conn.close()
            return {'success': False, 'error': 'Devis non trouvé'}
        
        facture_id = f"FAC-{str(uuid.uuid4())[:8].upper()}"
        date_facture = datetime.now().strftime('%Y-%m-%d')
        
        cursor.execute('''
            INSERT INTO factures (id, user_id, devis_id, client_name, client_email,
                                service_type, montant, date_facture)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (facture_id, user_id, devis_id, devis['client_name'], 
              devis['client_email'], devis['service_type'], montant, date_facture))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'success': True,
            'facture_id': facture_id,
            'message': f'Facture #{facture_id} créée avec succès'
        }
    
    def get_user_devis(self, user_id):
        """Récupérer les devis de l'utilisateur"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM devis WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    
    def get_user_reservations(self, user_id):
        """Récupérer les réservations de l'utilisateur"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM reservations WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    
    def get_user_factures(self, user_id):
        """Récupérer les factures de l'utilisateur"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM factures WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    
    def get_all_devis(self):
        """Récupérer tous les devis (admin)"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT d.*, u.email as user_email 
            FROM devis d 
            LEFT JOIN users u ON d.user_id = u.id 
            ORDER BY d.created_at DESC
        ''')
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    
    def get_all_reservations(self):
        """Récupérer toutes les réservations (admin)"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT r.*, u.email as user_email 
            FROM reservations r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        ''')
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    
    def get_all_factures(self):
        """Récupérer toutes les factures (admin)"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT f.*, u.email as user_email 
            FROM factures f 
            LEFT JOIN users u ON f.user_id = u.id 
            ORDER BY f.created_at DESC
        ''')
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    
    def update_status(self, table, item_id, new_status):
        """Mettre à jour le statut d'un élément (admin)"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        valid_tables = ['devis', 'reservations', 'factures']
        if table not in valid_tables:
            return {'success': False, 'error': 'Table invalide'}
        
        cursor.execute(f'''
            UPDATE {table} SET status = ?, updated_at = datetime('now') 
            WHERE id = ?
        ''', (new_status, item_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {'success': True, 'message': f'Statut mis à jour vers {new_status}'}
    
    def calculate_price(self, service_type):
        """Calculer le prix selon le type de service"""
        prices = {
            'renovation': 150.0,
            'personnalisation': 200.0,
            'devoilage': 120.0,
            'decapage': 100.0
        }
        return prices.get(service_type, 100.0)

class MyJantesServer(http.server.BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.api = MyJantesAPI()
        super().__init__(*args, **kwargs)
    
    def get_session_from_cookies(self):
        """Extract session ID from cookies"""
        cookie_header = self.headers.get('Cookie', '')
        if 'session_id=' in cookie_header:
            for cookie in cookie_header.split(';'):
                if 'session_id=' in cookie:
                    return cookie.split('=')[1].strip()
        return None
    
    def get_current_user(self):
        """Get current authenticated user"""
        session_id = self.get_session_from_cookies()
        if session_id:
            return self.api.auth.get_user_from_session(session_id)
        return None
    
    def require_auth(self):
        """Require authentication"""
        user = self.get_current_user()
        if not user:
            self.send_error_response('Authentication required', 401)
            return None
        return user
    
    def require_admin(self):
        """Require admin authentication"""
        user = self.get_current_user()
        if not user or user.get('user_type') != 'admin':
            self.send_error_response('Admin access required', 403)
            return None
        return user
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
            return
        
        # Auth endpoints
        if self.path == '/api/auth/me':
            user = self.get_current_user()
            if user:
                self.send_json_response({'authenticated': True, 'user': user})
            else:
                self.send_json_response({'authenticated': False})
            return
        
        # User endpoints
        if self.path == '/api/user/devis':
            user = self.require_auth()
            if user:
                devis = self.api.get_user_devis(user['id'])
                self.send_json_response(devis)
            return
        
        if self.path == '/api/user/reservations':
            user = self.require_auth()
            if user:
                reservations = self.api.get_user_reservations(user['id'])
                self.send_json_response(reservations)
            return
        
        if self.path == '/api/user/factures':
            user = self.require_auth()
            if user:
                factures = self.api.get_user_factures(user['id'])
                self.send_json_response(factures)
            return
        
        # Admin endpoints
        if self.path == '/api/admin/devis':
            admin = self.require_admin()
            if admin:
                devis = self.api.get_all_devis()
                self.send_json_response(devis)
            return
        
        if self.path == '/api/admin/reservations':
            admin = self.require_admin()
            if admin:
                reservations = self.api.get_all_reservations()
                self.send_json_response(reservations)
            return
        
        if self.path == '/api/admin/factures':
            admin = self.require_admin()
            if admin:
                factures = self.api.get_all_factures()
                self.send_json_response(factures)
            return
        
        # Static files
        if self.path == '/logo':
            self.serve_image('myjantes_official_logo.png')
        elif self.path.endswith('.jpg') or self.path.endswith('.webp') or self.path.endswith('.png'):
            image_name = self.path[1:]  # Remove leading /
            self.serve_image(image_name)
        elif self.path == '/' or self.path.startswith('/app'):
            self.serve_spa()
        else:
            self.send_404()
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            if self.headers.get('Content-Type') == 'application/json':
                data = json.loads(post_data.decode('utf-8'))
            else:
                data = urllib.parse.parse_qs(post_data.decode('utf-8'))
                data = {k: v[0] if len(v) == 1 else v for k, v in data.items()}
            
            # Auth endpoints
            if self.path == '/api/auth/login':
                result = self.api.auth.login_user(data['email'], data['password'])
                if result:
                    response = {'success': True, 'user': result['user']}
                    self.send_json_response_with_cookie(response, result['session_id'])
                else:
                    self.send_error_response('Email ou mot de passe incorrect')
                return
            
            if self.path == '/api/auth/register':
                result = self.api.auth.register_user(
                    data['email'], data['password'], 
                    data['first_name'], data['last_name'],
                    data.get('phone'), data.get('address')
                )
                if result['success']:
                    response = {'success': True, 'user_id': result['user_id']}
                    self.send_json_response_with_cookie(response, result['session_id'])
                else:
                    self.send_error_response(result['error'])
                return
            
            if self.path == '/api/auth/logout':
                session_id = self.get_session_from_cookies()
                if session_id:
                    self.api.auth.logout_user(session_id)
                self.send_json_response_with_cookie({'success': True}, '', expires=True)
                return
            
            # Protected endpoints
            if self.path == '/api/devis':
                user = self.require_auth()
                if user:
                    result = self.api.create_devis(data, user['id'])
                    self.send_json_response(result)
                return
            
            if self.path == '/api/reservations':
                user = self.require_auth()
                if user:
                    result = self.api.create_reservation(data, user['id'])
                    self.send_json_response(result)
                return
            
            if self.path == '/api/factures':
                user = self.require_auth()
                if user:
                    result = self.api.create_facture(data['devis_id'], user['id'], data['montant'])
                    self.send_json_response(result)
                return
            
            # Admin endpoints
            if self.path == '/api/admin/update-status':
                admin = self.require_admin()
                if admin:
                    result = self.api.update_status(data['table'], data['id'], data['status'])
                    self.send_json_response(result)
                return
            
            self.send_404()
                
        except Exception as e:
            print(f"Error processing request: {e}")
            self.send_error_response(str(e))
    
    def send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode('utf-8'))
    
    def send_json_response_with_cookie(self, data, session_id, expires=False):
        """Send JSON response with session cookie"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        if expires:
            self.send_header('Set-Cookie', 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly')
        else:
            self.send_header('Set-Cookie', f'session_id={session_id}; Path=/; HttpOnly; SameSite=Lax')
        
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode('utf-8'))
    
    def send_error_response(self, error_msg, status=400):
        """Send error response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        response = {'success': False, 'error': error_msg}
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def serve_image(self, image_name):
        """Serve images"""
        try:
            with open(image_name, 'rb') as f:
                image_data = f.read()
                
            self.send_response(200)
            if image_name.endswith('.webp'):
                self.send_header('Content-type', 'image/webp')
            elif image_name.endswith('.jpg'):
                self.send_header('Content-type', 'image/jpeg')
            elif image_name.endswith('.png'):
                self.send_header('Content-type', 'image/png')
            self.send_header('Cache-Control', 'max-age=3600')
            self.end_headers()
            self.wfile.write(image_data)
        except FileNotFoundError:
            self.send_404()
    
    def send_404(self):
        """Send 404 response"""
        self.send_response(404)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Not Found')
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def serve_spa(self):
        """Serve Single Page Application avec design moderne noir/rouge/blanc"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        
        current_user = self.get_current_user()
        
        html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MY JANTES - Application Complète</title>
    <meta name="description" content="MY JANTES - Application complète avec authentification, gestion des devis, réservations et factures.">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * {{ 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }}
        
        :root {{
            --primary-red: #DC2626;
            --deep-red: #B91C1C;
            --black: #000000;
            --dark-gray: #1F1F1F;
            --medium-gray: #333333;
            --light-gray: #F5F5F5;
            --white: #FFFFFF;
            --success: #10B981;
            --warning: #F59E0B;
            --danger: #EF4444;
            --shadow: 0 8px 32px rgba(0,0,0,0.12);
            --shadow-lg: 0 16px 64px rgba(0,0,0,0.2);
            --border-radius: 16px;
            --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: var(--black);
            background: var(--light-gray);
            overflow-x: hidden;
        }}
        
        /* Navigation moderne noir/rouge/blanc */
        .navbar {{
            background: linear-gradient(135deg, var(--black) 0%, var(--dark-gray) 100%);
            border-bottom: 3px solid var(--primary-red);
            color: var(--white);
            padding: 1.5rem 2rem;
            box-shadow: var(--shadow-lg);
            position: sticky;
            top: 0;
            z-index: 1000;
        }}
        
        .navbar-content {{
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        
        .logo {{
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--white);
            text-decoration: none;
        }}
        
        .logo img {{
            height: 50px;
            width: auto;
            background: var(--white);
            padding: 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }}
        
        .nav-menu {{
            display: flex;
            gap: 1rem;
            align-items: center;
        }}
        
        .nav-btn {{
            background: var(--primary-red);
            color: var(--white);
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
        }}
        
        .nav-btn:hover {{
            background: var(--deep-red);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
        }}
        
        .nav-btn.secondary {{
            background: var(--medium-gray);
        }}
        
        .nav-btn.secondary:hover {{
            background: var(--dark-gray);
        }}
        
        .user-info {{
            display: flex;
            align-items: center;
            gap: 1rem;
            color: var(--white);
            font-weight: 500;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 2rem;
        }}
        
        .card {{
            background: var(--white);
            border-radius: var(--border-radius);
            padding: 2rem;
            box-shadow: var(--shadow);
            margin-bottom: 2rem;
            border: 2px solid transparent;
            transition: var(--transition);
        }}
        
        .card:hover {{
            border-color: var(--primary-red);
            transform: translateY(-2px);
        }}
        
        .card h2 {{
            color: var(--black);
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}
        
        .card h2 i {{
            color: var(--primary-red);
        }}
        
        .form-group {{
            margin-bottom: 1.5rem;
        }}
        
        .form-group label {{
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--black);
        }}
        
        .form-group input,
        .form-group select,
        .form-group textarea {{
            width: 100%;
            padding: 1rem;
            border: 2px solid var(--light-gray);
            border-radius: 8px;
            font-size: 1rem;
            transition: var(--transition);
            font-family: inherit;
        }}
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {{
            outline: none;
            border-color: var(--primary-red);
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }}
        
        .btn {{
            background: var(--primary-red);
            color: var(--white);
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
        }}
        
        .btn:hover {{
            background: var(--deep-red);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
        }}
        
        .btn-secondary {{
            background: var(--medium-gray);
        }}
        
        .btn-secondary:hover {{
            background: var(--dark-gray);
        }}
        
        .btn-success {{
            background: var(--success);
        }}
        
        .btn-warning {{
            background: var(--warning);
        }}
        
        .btn-small {{
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
        }}
        
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
            background: var(--white);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: var(--shadow);
        }}
        
        .table th,
        .table td {{
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--light-gray);
        }}
        
        .table th {{
            background: var(--black);
            color: var(--white);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.875rem;
            letter-spacing: 0.5px;
        }}
        
        .table tr:hover {{
            background: var(--light-gray);
        }}
        
        .status {{
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .status.en_attente {{
            background: var(--warning);
            color: var(--white);
        }}
        
        .status.confirmee {{
            background: var(--success);
            color: var(--white);
        }}
        
        .status.payee {{
            background: var(--success);
            color: var(--white);
        }}
        
        .status.annulee {{
            background: var(--danger);
            color: var(--white);
        }}
        
        .hidden {{
            display: none !important;
        }}
        
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }}
        
        .grid-2 {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
        }}
        
        .stat-card {{
            background: linear-gradient(135deg, var(--primary-red), var(--deep-red));
            color: var(--white);
            padding: 2rem;
            border-radius: var(--border-radius);
            text-align: center;
            box-shadow: var(--shadow-lg);
            transition: var(--transition);
        }}
        
        .stat-card:hover {{
            transform: translateY(-5px);
        }}
        
        .stat-number {{
            font-size: 3rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }}
        
        .stat-label {{
            font-size: 1.1rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        .alert {{
            padding: 1rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
        }}
        
        .alert.success {{
            background: #D1FAE5;
            color: #065F46;
            border: 1px solid #A7F3D0;
        }}
        
        .alert.error {{
            background: #FEE2E2;
            color: #991B1B;
            border: 1px solid #FECACA;
        }}
        
        .welcome-section {{
            background: linear-gradient(135deg, var(--black) 0%, var(--dark-gray) 100%);
            color: var(--white);
            padding: 4rem 2rem;
            text-align: center;
            margin-bottom: 2rem;
        }}
        
        .welcome-title {{
            font-size: 3rem;
            font-weight: 900;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, var(--white), var(--primary-red));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .welcome-subtitle {{
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }}
        
        .features {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }}
        
        .feature-card {{
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: var(--border-radius);
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
            transition: var(--transition);
        }}
        
        .feature-card:hover {{
            background: rgba(255,255,255,0.2);
            transform: translateY(-5px);
        }}
        
        .feature-icon {{
            font-size: 3rem;
            color: var(--primary-red);
            margin-bottom: 1rem;
        }}
        
        .feature-title {{
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }}
        
        .tabs {{
            display: flex;
            border-bottom: 2px solid var(--light-gray);
            margin-bottom: 2rem;
        }}
        
        .tab {{
            padding: 1rem 2rem;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            font-weight: 600;
            transition: var(--transition);
        }}
        
        .tab.active {{
            border-bottom-color: var(--primary-red);
            color: var(--primary-red);
        }}
        
        .tab-content {{
            display: none;
        }}
        
        .tab-content.active {{
            display: block;
        }}
        
        .loading {{
            text-align: center;
            padding: 2rem;
            color: var(--medium-gray);
        }}
        
        /* Responsive */
        @media (max-width: 768px) {{
            .navbar-content {{
                flex-direction: column;
                gap: 1rem;
            }}
            
            .nav-menu {{
                flex-wrap: wrap;
                justify-content: center;
            }}
            
            .welcome-title {{
                font-size: 2rem;
            }}
            
            .container {{
                padding: 0 1rem;
            }}
            
            .grid,
            .grid-2 {{
                grid-template-columns: 1fr;
            }}
            
            .table {{
                font-size: 0.875rem;
            }}
            
            .table th,
            .table td {{
                padding: 0.5rem;
            }}
        }}
    </style>
</head>
<body>
    <!-- Navigation moderne -->
    <nav class="navbar">
        <div class="navbar-content">
            <a href="#" onclick="navigateTo('home')" class="logo">
                <img src="/logo" alt="MY JANTES">
                <span>MY JANTES</span>
            </a>
            
            <div class="nav-menu" id="navMenu">
                <!-- Navigation will be updated by JavaScript -->
            </div>
        </div>
    </nav>
    
    <div class="container">
        <div id="app">
            <div class="loading">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Chargement...</p>
            </div>
        </div>
    </div>
    
    <script>
        // Application state
        let currentUser = {json.dumps(current_user) if current_user else 'null'};
        let currentPage = 'home';
        let appData = {{}};
        
        // API functions
        async function apiCall(endpoint, method = 'GET', data = null) {{
            const options = {{
                method,
                headers: {{
                    'Content-Type': 'application/json'
                }},
                credentials: 'same-origin'
            }};
            
            if (data) {{
                options.body = JSON.stringify(data);
            }}
            
            try {{
                const response = await fetch(endpoint, options);
                const result = await response.json();
                
                if (!response.ok) {{
                    throw new Error(result.error || `Erreur HTTP ${{response.status}}`);
                }}
                
                return result;
            }} catch (error) {{
                console.error('API Error:', error);
                throw error;
            }}
        }}
        
        // Authentication functions
        async function login(email, password) {{
            try {{
                const result = await apiCall('/api/auth/login', 'POST', {{ email, password }});
                if (result.success) {{
                    currentUser = result.user;
                    updateNavigation();
                    navigateTo('dashboard');
                    showAlert('Connexion réussie !', 'success');
                }}
            }} catch (error) {{
                showAlert(error.message, 'error');
            }}
        }}
        
        async function register(formData) {{
            try {{
                const result = await apiCall('/api/auth/register', 'POST', formData);
                if (result.success) {{
                    showAlert('Inscription réussie ! Rechargement...', 'success');
                    // Refresh to get user data
                    setTimeout(() => window.location.reload(), 1500);
                }}
            }} catch (error) {{
                showAlert(error.message, 'error');
            }}
        }}
        
        async function logout() {{
            try {{
                await apiCall('/api/auth/logout', 'POST');
                currentUser = null;
                updateNavigation();
                navigateTo('home');
                showAlert('Déconnexion réussie !', 'success');
            }} catch (error) {{
                showAlert(error.message, 'error');
            }}
        }}
        
        // Navigation
        function updateNavigation() {{
            const navMenu = document.getElementById('navMenu');
            
            if (currentUser) {{
                navMenu.innerHTML = `
                    <div class="user-info">
                        <i class="fas fa-user-circle"></i>
                        <span>Bonjour, ${{currentUser.first_name}}</span>
                    </div>
                    <button class="nav-btn" onclick="navigateTo('dashboard')">
                        <i class="fas fa-dashboard"></i> Tableau de bord
                    </button>
                    ${{currentUser.user_type === 'admin' ? 
                        '<button class="nav-btn secondary" onclick="navigateTo(\'admin\')"><i class="fas fa-cog"></i> Administration</button>' : ''
                    }}
                    <button class="nav-btn secondary" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                `;
            }} else {{
                navMenu.innerHTML = `
                    <button class="nav-btn" onclick="navigateTo('login')">
                        <i class="fas fa-sign-in-alt"></i> Connexion
                    </button>
                    <button class="nav-btn secondary" onclick="navigateTo('register')">
                        <i class="fas fa-user-plus"></i> S'inscrire
                    </button>
                `;
            }}
        }}
        
        function navigateTo(page) {{
            currentPage = page;
            renderPage();
        }}
        
        // Page rendering
        function renderPage() {{
            const appDiv = document.getElementById('app');
            
            switch(currentPage) {{
                case 'home':
                    renderHomePage(appDiv);
                    break;
                case 'login':
                    renderLoginPage(appDiv);
                    break;
                case 'register':
                    renderRegisterPage(appDiv);
                    break;
                case 'dashboard':
                    renderDashboard(appDiv);
                    break;
                case 'admin':
                    renderAdminPage(appDiv);
                    break;
                default:
                    renderHomePage(appDiv);
            }}
        }}
        
        function renderHomePage(container) {{
            container.innerHTML = `
                <div class="welcome-section">
                    <h1 class="welcome-title">MY JANTES</h1>
                    <p class="welcome-subtitle">L'excellence dans la rénovation de jantes en aluminium</p>
                    
                    <div class="features">
                        <div class="feature-card">
                            <div class="feature-icon"><i class="fas fa-tools"></i></div>
                            <div class="feature-title">Rénovation Expert</div>
                            <p>Redonnez vie à vos jantes avec notre savoir-faire technique</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon"><i class="fas fa-palette"></i></div>
                            <div class="feature-title">Personnalisation</div>
                            <p>Créez des jantes uniques selon vos goûts</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
                            <div class="feature-title">Garantie Totale</div>
                            <p>Qualité exceptionnelle avec garantie complète</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h2><i class="fas fa-info-circle"></i> Informations Pratiques</h2>
                    
                    <div class="grid">
                        <div>
                            <h3 style="color: var(--primary-red); margin-bottom: 1rem;">
                                <i class="fas fa-phone"></i> Contact
                            </h3>
                            <p><strong>Téléphone:</strong> 03.21.40.80.53</p>
                            <p><strong>Adresse:</strong> 46 rue de la Convention<br>62800 Liévin</p>
                        </div>
                        
                        <div>
                            <h3 style="color: var(--primary-red); margin-bottom: 1rem;">
                                <i class="fas fa-clock"></i> Horaires
                            </h3>
                            <p><strong>Lundi - Vendredi:</strong> 9h-12h / 13h30-18h</p>
                            <p><strong>Samedi:</strong> 9h-13h</p>
                            <p style="margin-top: 0.5rem; color: var(--success); font-weight: 600;">
                                <i class="fas fa-check"></i> Avec ou sans rendez-vous
                            </p>
                        </div>
                        
                        <div>
                            <h3 style="color: var(--primary-red); margin-bottom: 1rem;">
                                <i class="fas fa-cogs"></i> Nos Services
                            </h3>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Rénovation complète</li>
                                <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Personnalisation</li>
                                <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Dévoilage</li>
                                <li><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i> Décapage</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 2rem;">
                        <button class="btn" onclick="navigateTo('register')" style="margin-right: 1rem;">
                            <i class="fas fa-user-plus"></i> Créer un compte
                        </button>
                        <button class="btn btn-secondary" onclick="navigateTo('login')">
                            <i class="fas fa-sign-in-alt"></i> Se connecter
                        </button>
                    </div>
                </div>
            `;
        }}
        
        function renderLoginPage(container) {{
            container.innerHTML = `
                <div class="card" style="max-width: 500px; margin: 0 auto;">
                    <h2><i class="fas fa-sign-in-alt"></i> Connexion</h2>
                    <form onsubmit="handleLogin(event)">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required placeholder="votre@email.com">
                        </div>
                        <div class="form-group">
                            <label for="password">Mot de passe</label>
                            <input type="password" id="password" name="password" required placeholder="Votre mot de passe">
                        </div>
                        <button type="submit" class="btn" style="width: 100%;">
                            <i class="fas fa-sign-in-alt"></i> Se connecter
                        </button>
                    </form>
                    
                    <div style="margin-top: 2rem; text-align: center; padding: 1rem; background: var(--light-gray); border-radius: 8px;">
                        <p style="margin-bottom: 1rem; color: var(--medium-gray);">
                            Pas encore de compte ? 
                            <a href="#" onclick="navigateTo('register')" style="color: var(--primary-red); font-weight: 600;">S'inscrire</a>
                        </p>
                        
                        <div style="border-top: 1px solid var(--medium-gray); padding-top: 1rem; margin-top: 1rem;">
                            <h4 style="color: var(--primary-red); margin-bottom: 0.5rem;">
                                <i class="fas fa-user-shield"></i> Compte admin de test
                            </h4>
                            <p><strong>Email:</strong> admin@myjantes.fr</p>
                            <p><strong>Mot de passe:</strong> MyJantes2025!</p>
                        </div>
                    </div>
                </div>
            `;
        }}
        
        function renderRegisterPage(container) {{
            container.innerHTML = `
                <div class="card" style="max-width: 600px; margin: 0 auto;">
                    <h2><i class="fas fa-user-plus"></i> Inscription</h2>
                    <form onsubmit="handleRegister(event)">
                        <div class="grid">
                            <div class="form-group">
                                <label for="first_name">Prénom *</label>
                                <input type="text" id="first_name" name="first_name" required placeholder="Votre prénom">
                            </div>
                            <div class="form-group">
                                <label for="last_name">Nom *</label>
                                <input type="text" id="last_name" name="last_name" required placeholder="Votre nom">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="reg_email">Email *</label>
                            <input type="email" id="reg_email" name="email" required placeholder="votre@email.com">
                        </div>
                        
                        <div class="form-group">
                            <label for="phone">Téléphone</label>
                            <input type="tel" id="phone" name="phone" placeholder="03.21.40.80.53">
                        </div>
                        
                        <div class="form-group">
                            <label for="address">Adresse</label>
                            <textarea id="address" name="address" rows="3" placeholder="Votre adresse complète"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="reg_password">Mot de passe *</label>
                            <input type="password" id="reg_password" name="password" required placeholder="Choisissez un mot de passe">
                        </div>
                        
                        <button type="submit" class="btn" style="width: 100%;">
                            <i class="fas fa-user-plus"></i> S'inscrire
                        </button>
                    </form>
                    
                    <p style="margin-top: 1rem; text-align: center; color: var(--medium-gray);">
                        Déjà un compte ? 
                        <a href="#" onclick="navigateTo('login')" style="color: var(--primary-red); font-weight: 600;">Se connecter</a>
                    </p>
                </div>
            `;
        }}
        
        async function renderDashboard(container) {{
            if (!currentUser) {{
                navigateTo('login');
                return;
            }}
            
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p>Chargement de votre tableau de bord...</p>
                </div>
            `;
            
            try {{
                // Load user data
                const [devis, reservations, factures] = await Promise.all([
                    apiCall('/api/user/devis'),
                    apiCall('/api/user/reservations'),
                    apiCall('/api/user/factures')
                ]);
                
                appData = {{ devis, reservations, factures }};
                
                container.innerHTML = `
                    <div class="card">
                        <h2><i class="fas fa-dashboard"></i> Tableau de bord - ${{currentUser.first_name}} ${{currentUser.last_name}}</h2>
                        
                        <div class="grid">
                            <div class="stat-card">
                                <div class="stat-number">${{devis.length}}</div>
                                <div class="stat-label">Devis</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${{reservations.length}}</div>
                                <div class="stat-label">Réservations</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${{factures.length}}</div>
                                <div class="stat-label">Factures</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tabs">
                        <div class="tab active" onclick="switchTab('devis-tab')">
                            <i class="fas fa-file-alt"></i> Demander un devis
                        </div>
                        <div class="tab" onclick="switchTab('reservation-tab')">
                            <i class="fas fa-calendar"></i> Prendre rendez-vous
                        </div>
                        <div class="tab" onclick="switchTab('history-tab')">
                            <i class="fas fa-history"></i> Mon historique
                        </div>
                    </div>
                    
                    <div id="devis-tab" class="tab-content active">
                        <div class="card">
                            <h2><i class="fas fa-file-alt"></i> Demander un devis</h2>
                            <form onsubmit="handleDevisRequest(event)">
                                <div class="form-group">
                                    <label for="service_type">Service souhaité *</label>
                                    <select id="service_type" name="service_type" required>
                                        <option value="">Choisir un service</option>
                                        <option value="renovation">Rénovation complète (150€)</option>
                                        <option value="personnalisation">Personnalisation (200€)</option>
                                        <option value="devoilage">Dévoilage (120€)</option>
                                        <option value="decapage">Décapage (100€)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="description">Description détaillée</label>
                                    <textarea id="description" name="description" rows="4" placeholder="Décrivez vos besoins, l'état actuel de vos jantes, vos préférences..."></textarea>
                                </div>
                                <button type="submit" class="btn">
                                    <i class="fas fa-file-alt"></i> Demander un devis
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div id="reservation-tab" class="tab-content">
                        <div class="card">
                            <h2><i class="fas fa-calendar"></i> Prendre rendez-vous</h2>
                            <form onsubmit="handleReservation(event)">
                                <div class="form-group">
                                    <label for="res_service_type">Service *</label>
                                    <select id="res_service_type" name="service_type" required>
                                        <option value="">Choisir un service</option>
                                        <option value="renovation">Rénovation complète</option>
                                        <option value="personnalisation">Personnalisation</option>
                                        <option value="devoilage">Dévoilage</option>
                                        <option value="decapage">Décapage</option>
                                    </select>
                                </div>
                                <div class="grid">
                                    <div class="form-group">
                                        <label for="date_rdv">Date *</label>
                                        <input type="date" id="date_rdv" name="date_rdv" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="heure_rdv">Heure *</label>
                                        <select id="heure_rdv" name="heure_rdv" required>
                                            <option value="">Choisir une heure</option>
                                            <option value="09:00">09:00</option>
                                            <option value="10:00">10:00</option>
                                            <option value="11:00">11:00</option>
                                            <option value="14:00">14:00</option>
                                            <option value="15:00">15:00</option>
                                            <option value="16:00">16:00</option>
                                            <option value="17:00">17:00</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="res_description">Détails du rendez-vous</label>
                                    <textarea id="res_description" name="description" rows="3" placeholder="Informations complémentaires..."></textarea>
                                </div>
                                <button type="submit" class="btn">
                                    <i class="fas fa-calendar"></i> Réserver
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div id="history-tab" class="tab-content">
                        <div class="card">
                            <h2><i class="fas fa-file-alt"></i> Mes devis</h2>
                            ${{renderTable(devis, ['id', 'service_type', 'prix', 'status', 'created_at'])}}
                        </div>
                        
                        <div class="card">
                            <h2><i class="fas fa-calendar"></i> Mes réservations</h2>
                            ${{renderTable(reservations, ['id', 'service_type', 'date_rdv', 'heure_rdv', 'status'])}}
                        </div>
                        
                        <div class="card">
                            <h2><i class="fas fa-file-invoice"></i> Mes factures</h2>
                            ${{renderTable(factures, ['id', 'service_type', 'montant', 'status', 'date_facture'])}}
                        </div>
                    </div>
                `;
                
                // Set minimum date to today
                const today = new Date().toISOString().split('T')[0];
                const dateInput = document.getElementById('date_rdv');
                if (dateInput) {{
                    dateInput.min = today;
                }}
                
            }} catch (error) {{
                showAlert('Erreur lors du chargement des données', 'error');
                console.error('Dashboard error:', error);
            }}
        }}
        
        async function renderAdminPage(container) {{
            if (!currentUser || currentUser.user_type !== 'admin') {{
                navigateTo('dashboard');
                return;
            }}
            
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p>Chargement de l'administration...</p>
                </div>
            `;
            
            try {{
                const [allDevis, allReservations, allFactures] = await Promise.all([
                    apiCall('/api/admin/devis'),
                    apiCall('/api/admin/reservations'),
                    apiCall('/api/admin/factures')
                ]);
                
                const devisEnAttente = allDevis.filter(d => d.status === 'en_attente').length;
                const reservationsConfirmees = allReservations.filter(r => r.status === 'confirmee').length;
                const facturesEnAttente = allFactures.filter(f => f.status === 'en_attente').length;
                
                container.innerHTML = `
                    <div class="card">
                        <h2><i class="fas fa-cog"></i> Administration MY JANTES</h2>
                        
                        <div class="grid">
                            <div class="stat-card">
                                <div class="stat-number">${{allDevis.length}}</div>
                                <div class="stat-label">Devis Total</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${{allReservations.length}}</div>
                                <div class="stat-label">Réservations Total</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${{allFactures.length}}</div>
                                <div class="stat-label">Factures Total</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid">
                        <div class="card">
                            <h3 style="color: var(--warning);">
                                <i class="fas fa-exclamation-triangle"></i> 
                                Actions requises
                            </h3>
                            <p><strong>${{devisEnAttente}}</strong> devis en attente</p>
                            <p><strong>${{reservationsConfirmees}}</strong> réservations confirmées</p>
                            <p><strong>${{facturesEnAttente}}</strong> factures en attente de paiement</p>
                        </div>
                    </div>
                    
                    <div class="tabs">
                        <div class="tab active" onclick="switchTab('admin-devis-tab')">
                            <i class="fas fa-file-alt"></i> Gestion des devis
                        </div>
                        <div class="tab" onclick="switchTab('admin-reservations-tab')">
                            <i class="fas fa-calendar"></i> Gestion des réservations
                        </div>
                        <div class="tab" onclick="switchTab('admin-factures-tab')">
                            <i class="fas fa-file-invoice"></i> Gestion des factures
                        </div>
                    </div>
                    
                    <div id="admin-devis-tab" class="tab-content active">
                        <div class="card">
                            <h2><i class="fas fa-file-alt"></i> Gestion des devis</h2>
                            ${{renderAdminTable(allDevis, 'devis', ['id', 'client_name', 'client_email', 'service_type', 'prix', 'status', 'created_at'])}}
                        </div>
                    </div>
                    
                    <div id="admin-reservations-tab" class="tab-content">
                        <div class="card">
                            <h2><i class="fas fa-calendar"></i> Gestion des réservations</h2>
                            ${{renderAdminTable(allReservations, 'reservations', ['id', 'client_name', 'client_email', 'service_type', 'date_rdv', 'heure_rdv', 'status'])}}
                        </div>
                    </div>
                    
                    <div id="admin-factures-tab" class="tab-content">
                        <div class="card">
                            <h2><i class="fas fa-file-invoice"></i> Gestion des factures</h2>
                            ${{renderAdminTable(allFactures, 'factures', ['id', 'client_name', 'service_type', 'montant', 'status', 'date_facture'])}}
                        </div>
                    </div>
                `;
                
            }} catch (error) {{
                showAlert('Erreur lors du chargement des données admin', 'error');
                console.error('Admin error:', error);
            }}
        }}
        
        // Utility functions
        function switchTab(tabId) {{
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {{
                content.classList.remove('active');
            }});
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {{
                tab.classList.remove('active');
            }});
            
            // Show selected tab content
            document.getElementById(tabId).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }}
        
        function renderTable(data, columns) {{
            if (!data || data.length === 0) {{
                return '<p style="text-align: center; color: var(--medium-gray); padding: 2rem;"><i class="fas fa-inbox"></i><br>Aucune donnée à afficher</p>';
            }}
            
            let html = '<table class="table"><thead><tr>';
            columns.forEach(col => {{
                const displayName = col.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                html += `<th>${{displayName}}</th>`;
            }});
            html += '</tr></thead><tbody>';
            
            data.forEach(row => {{
                html += '<tr>';
                columns.forEach(col => {{
                    let value = row[col] || '-';
                    if (col === 'status') {{
                        value = `<span class="status ${{value}}">${{value}}</span>`;
                    }} else if (col === 'prix' || col === 'montant') {{
                        value = `${{value}}€`;
                    }} else if (col.includes('date') || col.includes('created_at')) {{
                        value = new Date(value).toLocaleDateString('fr-FR');
                    }} else if (col === 'service_type') {{
                        const serviceNames = {{
                            'renovation': 'Rénovation',
                            'personnalisation': 'Personnalisation',
                            'devoilage': 'Dévoilage',
                            'decapage': 'Décapage'
                        }};
                        value = serviceNames[value] || value;
                    }}
                    html += `<td>${{value}}</td>`;
                }});
                html += '</tr>';
            }});
            
            html += '</tbody></table>';
            return html;
        }}
        
        function renderAdminTable(data, table, columns) {{
            if (!data || data.length === 0) {{
                return '<p style="text-align: center; color: var(--medium-gray); padding: 2rem;"><i class="fas fa-inbox"></i><br>Aucune donnée à afficher</p>';
            }}
            
            let html = '<table class="table"><thead><tr>';
            columns.forEach(col => {{
                const displayName = col.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                html += `<th>${{displayName}}</th>`;
            }});
            html += '<th>Actions</th></tr></thead><tbody>';
            
            data.forEach(row => {{
                html += '<tr>';
                columns.forEach(col => {{
                    let value = row[col] || '-';
                    if (col === 'status') {{
                        value = `<span class="status ${{value}}">${{value}}</span>`;
                    }} else if (col === 'prix' || col === 'montant') {{
                        value = `${{value}}€`;
                    }} else if (col.includes('date') || col.includes('created_at')) {{
                        value = new Date(value).toLocaleDateString('fr-FR');
                    }} else if (col === 'service_type') {{
                        const serviceNames = {{
                            'renovation': 'Rénovation',
                            'personnalisation': 'Personnalisation',
                            'devoilage': 'Dévoilage',
                            'decapage': 'Décapage'
                        }};
                        value = serviceNames[value] || value;
                    }}
                    html += `<td>${{value}}</td>`;
                }});
                
                // Actions
                html += '<td style="white-space: nowrap;">';
                if (table === 'factures' && row.status !== 'payee') {{
                    html += `<button class="btn btn-success btn-small" onclick="updateStatus('${{table}}', '${{row.id}}', 'payee')" style="margin-right: 0.5rem;">
                        <i class="fas fa-check"></i> Payée
                    </button>`;
                }}
                if (row.status !== 'annulee') {{
                    html += `<button class="btn btn-warning btn-small" onclick="updateStatus('${{table}}', '${{row.id}}', 'annulee')">
                        <i class="fas fa-times"></i> Annuler
                    </button>`;
                }}
                html += '</td>';
                
                html += '</tr>';
            }});
            
            html += '</tbody></table>';
            return html;
        }}
        
        // Event handlers
        async function handleLogin(event) {{
            event.preventDefault();
            const formData = new FormData(event.target);
            const email = formData.get('email');
            const password = formData.get('password');
            await login(email, password);
        }}
        
        async function handleRegister(event) {{
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData);
            await register(data);
        }}
        
        async function handleDevisRequest(event) {{
            event.preventDefault();
            try {{
                const formData = new FormData(event.target);
                const data = Object.fromEntries(formData);
                
                // Pre-fill user data
                data.client_name = `${{currentUser.first_name}} ${{currentUser.last_name}}`;
                data.client_email = currentUser.email;
                data.client_phone = currentUser.phone || '';
                
                const result = await apiCall('/api/devis', 'POST', data);
                showAlert(result.message, 'success');
                event.target.reset();
                
                // Refresh dashboard
                setTimeout(() => navigateTo('dashboard'), 1500);
                
            }} catch (error) {{
                showAlert(error.message, 'error');
            }}
        }}
        
        async function handleReservation(event) {{
            event.preventDefault();
            try {{
                const formData = new FormData(event.target);
                const data = Object.fromEntries(formData);
                
                // Pre-fill user data
                data.client_name = `${{currentUser.first_name}} ${{currentUser.last_name}}`;
                data.client_email = currentUser.email;
                data.client_phone = currentUser.phone || '';
                
                const result = await apiCall('/api/reservations', 'POST', data);
                showAlert(result.message, 'success');
                event.target.reset();
                
                // Refresh dashboard
                setTimeout(() => navigateTo('dashboard'), 1500);
                
            }} catch (error) {{
                showAlert(error.message, 'error');
            }}
        }}
        
        async function updateStatus(table, id, status) {{
            try {{
                const result = await apiCall('/api/admin/update-status', 'POST', {{
                    table, id, status
                }});
                showAlert(result.message, 'success');
                
                // Refresh admin page
                setTimeout(() => navigateTo('admin'), 1500);
                
            }} catch (error) {{
                showAlert(error.message, 'error');
            }}
        }}
        
        function showAlert(message, type) {{
            // Remove existing alerts
            const existingAlerts = document.querySelectorAll('.alert');
            existingAlerts.forEach(alert => alert.remove());
            
            // Create new alert
            const alert = document.createElement('div');
            alert.className = `alert ${{type}}`;
            alert.innerHTML = `<i class="fas fa-${{type === 'success' ? 'check-circle' : 'exclamation-triangle'}}"></i> ${{message}}`;
            
            // Insert at top of container
            const container = document.querySelector('.container');
            container.insertBefore(alert, container.firstChild);
            
            // Auto remove after 5 seconds
            setTimeout(() => {{
                if (alert.parentNode) {{
                    alert.remove();
                }}
            }}, 5000);
        }}
        
        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {{
            updateNavigation();
            
            // Set initial page based on user state
            if (currentUser) {{
                navigateTo('dashboard');
            }} else {{
                navigateTo('home');
            }}
        }});
    </script>
</body>
</html>"""
        
        self.wfile.write(html_content.encode('utf-8'))

def run_server(port=5000):
    """Run the HTTP server"""
    try:
        server_address = ('', port)
        httpd = socketserver.TCPServer(server_address, MyJantesServer)
        
        print("=" * 60)
        print("🚀 MY JANTES - APPLICATION COMPLÈTE DÉMARRÉE")
        print("=" * 60)
        print(f"📍 Serveur : http://localhost:{port}")
        print(f"🗄️  Base de données : SQLite (myjantes_complete.db)")
        print(f"🔐 Admin par défaut :")
        print(f"   📧 Email : admin@myjantes.fr")
        print(f"   🔑 Mot de passe : MyJantes2025!")
        print("=" * 60)
        print("✅ Fonctionnalités disponibles :")
        print("   • Authentification utilisateur/admin")
        print("   • Gestion des devis avec pré-remplissage")
        print("   • Système de réservations")
        print("   • Gestion des factures")
        print("   • Historique personnel")
        print("   • Panel d'administration")
        print("   • Design moderne noir/rouge/blanc")
        print("=" * 60)
        
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Serveur arrêté.")
    except Exception as e:
        print(f"❌ Erreur serveur: {e}")

if __name__ == '__main__':
    run_server()