#!/usr/bin/env python3
"""
MY JANTES - Application complète avec authentification et persistance PostgreSQL
"""
import os
import json
import http.server
import socketserver
import urllib.parse
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import uuid
import hashlib
import hmac
import secrets
from http.cookies import SimpleCookie

class DatabaseManager:
    def __init__(self):
        self.db_url = os.environ.get('DATABASE_URL')
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable not set")
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url)
    
    def init_database(self):
        """Initialize PostgreSQL database with required tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Table des utilisateurs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                user_type VARCHAR(20) DEFAULT 'client',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # Table des sessions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(255) PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des devis avec référence utilisateur
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devis (
                id VARCHAR(50) PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                client_name VARCHAR(255) NOT NULL,
                client_email VARCHAR(255) NOT NULL,
                client_phone VARCHAR(20),
                service_type VARCHAR(100) NOT NULL,
                description TEXT,
                prix DECIMAL(10,2),
                status VARCHAR(50) DEFAULT 'en_attente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des réservations avec référence utilisateur
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reservations (
                id VARCHAR(50) PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                client_name VARCHAR(255) NOT NULL,
                client_email VARCHAR(255) NOT NULL,
                client_phone VARCHAR(20),
                service_type VARCHAR(100) NOT NULL,
                date_rdv DATE NOT NULL,
                heure_rdv TIME NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'confirmee',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des factures avec référence utilisateur
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS factures (
                id VARCHAR(50) PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                devis_id VARCHAR(50) REFERENCES devis(id),
                client_name VARCHAR(255) NOT NULL,
                client_email VARCHAR(255) NOT NULL,
                service_type VARCHAR(100) NOT NULL,
                montant DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'en_attente',
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
        
        cursor.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        if not cursor.fetchone():
            password_hash = hashlib.sha256(admin_password.encode()).hexdigest()
            cursor.execute('''
                INSERT INTO users (email, password_hash, first_name, last_name, user_type)
                VALUES (%s, %s, %s, %s, %s)
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
            VALUES (%s, %s, %s)
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
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute('''
            SELECT u.* FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.id = %s AND s.expires_at > NOW()
        ''', (session_id,))
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return dict(user) if user else None
    
    def login_user(self, email, password):
        """Login user"""
        conn = self.db.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()
        
        if user and self.verify_password(password, user['password_hash']):
            # Update last login
            cursor.execute('UPDATE users SET last_login = NOW() WHERE id = %s', (user['id'],))
            conn.commit()
            
            # Create session
            session_id = self.create_session(user['id'])
            
            cursor.close()
            conn.close()
            
            return {'user': dict(user), 'session_id': session_id}
        
        cursor.close()
        conn.close()
        return None
    
    def register_user(self, email, password, first_name, last_name, phone=None, address=None):
        """Register new user"""
        conn = self.db.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return {'success': False, 'error': 'Email déjà utilisé'}
        
        # Create user
        password_hash = self.hash_password(password)
        cursor.execute('''
            INSERT INTO users (email, password_hash, first_name, last_name, phone, address)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (email, password_hash, first_name, last_name, phone, address))
        
        user_id = cursor.fetchone()['id']
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
        
        cursor.execute('DELETE FROM sessions WHERE id = %s', (session_id,))
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
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
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
    
    def get_user_devis(self, user_id):
        """Récupérer les devis de l'utilisateur"""
        conn = self.db.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('SELECT * FROM devis WHERE user_id = %s ORDER BY created_at DESC', (user_id,))
        devis = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(d) for d in devis]
    
    def get_user_reservations(self, user_id):
        """Récupérer les réservations de l'utilisateur"""
        conn = self.db.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('SELECT * FROM reservations WHERE user_id = %s ORDER BY created_at DESC', (user_id,))
        reservations = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(r) for r in reservations]
    
    def get_user_factures(self, user_id):
        """Récupérer les factures de l'utilisateur"""
        conn = self.db.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('SELECT * FROM factures WHERE user_id = %s ORDER BY created_at DESC', (user_id,))
        factures = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(f) for f in factures]
    
    def get_all_devis(self):
        """Récupérer tous les devis (admin)"""
        conn = self.db.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('''
            SELECT d.*, u.email as user_email 
            FROM devis d 
            LEFT JOIN users u ON d.user_id = u.id 
            ORDER BY d.created_at DESC
        ''')
        devis = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(d) for d in devis]
    
    def get_all_reservations(self):
        """Récupérer toutes les réservations (admin)"""
        conn = self.db.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('''
            SELECT r.*, u.email as user_email 
            FROM reservations r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        ''')
        reservations = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(r) for r in reservations]
    
    def get_all_factures(self):
        """Récupérer toutes les factures (admin)"""
        conn = self.db.get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute('''
            SELECT f.*, u.email as user_email 
            FROM factures f 
            LEFT JOIN users u ON f.user_id = u.id 
            ORDER BY f.created_at DESC
        ''')
        factures = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(f) for f in factures]
    
    def update_status(self, table, item_id, new_status):
        """Mettre à jour le statut d'un élément (admin)"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(f'''
            UPDATE {table} SET status = %s, updated_at = NOW() 
            WHERE id = %s
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
        elif self.path == '/' or self.path == '/login' or self.path == '/register' or self.path == '/dashboard' or self.path == '/admin':
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
            
            # Admin endpoints
            if self.path.startswith('/api/admin/update-status'):
                admin = self.require_admin()
                if admin:
                    result = self.api.update_status(data['table'], data['id'], data['status'])
                    self.send_json_response(result)
                return
            
            self.send_404()
                
        except Exception as e:
            self.send_error_response(str(e))
    
    def send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode('utf-8'))
    
    def send_json_response_with_cookie(self, data, session_id, expires=False):
        """Send JSON response with session cookie"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
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
        self.send_header('Content-type', 'application/json')
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
        """Serve Single Page Application with authentication"""
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
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
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
            --border-radius: 16px;
            --transition: all 0.3s ease;
        }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: var(--black);
            background: var(--light-gray);
        }}
        
        .navbar {{
            background: linear-gradient(135deg, var(--black) 0%, var(--dark-gray) 100%);
            border-bottom: 3px solid var(--primary-red);
            color: var(--white);
            padding: 1rem 2rem;
            box-shadow: var(--shadow);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        
        .logo {{
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 1.5rem;
            font-weight: 800;
        }}
        
        .logo img {{
            height: 40px;
            background: var(--white);
            padding: 5px;
            border-radius: 8px;
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
        }}
        
        .nav-btn:hover {{
            background: var(--deep-red);
            transform: translateY(-2px);
        }}
        
        .container {{
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }}
        
        .card {{
            background: var(--white);
            border-radius: var(--border-radius);
            padding: 2rem;
            box-shadow: var(--shadow);
            margin-bottom: 2rem;
        }}
        
        .card h2 {{
            color: var(--black);
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
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
        }}
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {{
            outline: none;
            border-color: var(--primary-red);
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
        }}
        
        .btn:hover {{
            background: var(--deep-red);
            transform: translateY(-2px);
        }}
        
        .btn-secondary {{
            background: var(--medium-gray);
        }}
        
        .btn-secondary:hover {{
            background: var(--dark-gray);
        }}
        
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
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
        }}
        
        .status {{
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
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
        
        .hidden {{
            display: none !important;
        }}
        
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }}
        
        .stat-card {{
            background: linear-gradient(135deg, var(--primary-red), var(--deep-red));
            color: var(--white);
            padding: 2rem;
            border-radius: var(--border-radius);
            text-align: center;
        }}
        
        .stat-number {{
            font-size: 3rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
        }}
        
        .alert {{
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
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
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">
            <img src="/logo" alt="MY JANTES">
            <span>MY JANTES</span>
        </div>
        <div class="nav-menu" id="navMenu">
            <!-- Navigation will be updated by JavaScript -->
        </div>
    </nav>
    
    <div class="container">
        <div id="app">
            <!-- Content will be loaded here -->
        </div>
    </div>
    
    <script>
        // Current user state
        let currentUser = {json.dumps(current_user) if current_user else 'null'};
        
        // Application state
        const app = {{
            currentPage: 'home',
            data: {{}}
        }};
        
        // API functions
        async function apiCall(endpoint, method = 'GET', data = null) {{
            const options = {{
                method,
                headers: {{
                    'Content-Type': 'application/json'
                }}
            }};
            
            if (data) {{
                options.body = JSON.stringify(data);
            }}
            
            try {{
                const response = await fetch(endpoint, options);
                const result = await response.json();
                
                if (!response.ok) {{
                    throw new Error(result.error || 'Erreur réseau');
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
                    showAlert('Inscription réussie ! Vous êtes maintenant connecté.', 'success');
                    // Refresh to get user data
                    window.location.reload();
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
                    <span>Bonjour, ${{currentUser.first_name}}</span>
                    <button class="nav-btn" onclick="navigateTo('dashboard')">
                        <i class="fas fa-dashboard"></i> Tableau de bord
                    </button>
                    ${{currentUser.user_type === 'admin' ? 
                        '<button class="nav-btn" onclick="navigateTo(\'admin\')"><i class="fas fa-cog"></i> Admin</button>' : ''
                    }}
                    <button class="nav-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                `;
            }} else {{
                navMenu.innerHTML = `
                    <button class="nav-btn" onclick="navigateTo('login')">
                        <i class="fas fa-sign-in-alt"></i> Connexion
                    </button>
                    <button class="nav-btn" onclick="navigateTo('register')">
                        <i class="fas fa-user-plus"></i> S'inscrire
                    </button>
                `;
            }}
        }}
        
        function navigateTo(page) {{
            app.currentPage = page;
            renderPage();
        }}
        
        // Page rendering
        function renderPage() {{
            const appDiv = document.getElementById('app');
            
            switch(app.currentPage) {{
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
                <div class="card">
                    <h2>Bienvenue chez MY JANTES</h2>
                    <p>Les experts de la rénovation de jantes en aluminium à Liévin.</p>
                    <p><strong>Téléphone:</strong> 03.21.40.80.53</p>
                    <p><strong>Adresse:</strong> 46 rue de la Convention, 62800 Liévin</p>
                    
                    <div class="grid" style="margin-top: 2rem;">
                        <div style="text-align: center;">
                            <h3>Nos Services</h3>
                            <ul style="text-align: left; margin-top: 1rem;">
                                <li>Rénovation complète</li>
                                <li>Personnalisation</li>
                                <li>Dévoilage</li>
                                <li>Décapage</li>
                            </ul>
                        </div>
                        <div style="text-align: center;">
                            <h3>Horaires</h3>
                            <p>Lundi - Vendredi: 9h-12h / 13h30-18h</p>
                            <p>Samedi: 9h-13h</p>
                            <p style="margin-top: 1rem;"><strong>Avec ou sans rendez-vous</strong></p>
                        </div>
                    </div>
                </div>
            `;
        }}
        
        function renderLoginPage(container) {{
            container.innerHTML = `
                <div class="card" style="max-width: 400px; margin: 0 auto;">
                    <h2>Connexion</h2>
                    <form onsubmit="handleLogin(event)">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Mot de passe</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <button type="submit" class="btn">
                            <i class="fas fa-sign-in-alt"></i> Se connecter
                        </button>
                    </form>
                    
                    <p style="margin-top: 1rem; text-align: center;">
                        Pas encore de compte ? 
                        <a href="#" onclick="navigateTo('register')" style="color: var(--primary-red);">S'inscrire</a>
                    </p>
                    
                    <div style="margin-top: 2rem; padding: 1rem; background: var(--light-gray); border-radius: 8px;">
                        <h4>Compte admin de test:</h4>
                        <p><strong>Email:</strong> admin@myjantes.fr</p>
                        <p><strong>Mot de passe:</strong> MyJantes2025!</p>
                    </div>
                </div>
            `;
        }}
        
        function renderRegisterPage(container) {{
            container.innerHTML = `
                <div class="card" style="max-width: 500px; margin: 0 auto;">
                    <h2>Inscription</h2>
                    <form onsubmit="handleRegister(event)">
                        <div class="form-group">
                            <label for="first_name">Prénom</label>
                            <input type="text" id="first_name" name="first_name" required>
                        </div>
                        <div class="form-group">
                            <label for="last_name">Nom</label>
                            <input type="text" id="last_name" name="last_name" required>
                        </div>
                        <div class="form-group">
                            <label for="reg_email">Email</label>
                            <input type="email" id="reg_email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Téléphone</label>
                            <input type="tel" id="phone" name="phone">
                        </div>
                        <div class="form-group">
                            <label for="address">Adresse</label>
                            <textarea id="address" name="address" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="reg_password">Mot de passe</label>
                            <input type="password" id="reg_password" name="password" required>
                        </div>
                        <button type="submit" class="btn">
                            <i class="fas fa-user-plus"></i> S'inscrire
                        </button>
                    </form>
                    
                    <p style="margin-top: 1rem; text-align: center;">
                        Déjà un compte ? 
                        <a href="#" onclick="navigateTo('login')" style="color: var(--primary-red);">Se connecter</a>
                    </p>
                </div>
            `;
        }}
        
        async function renderDashboard(container) {{
            if (!currentUser) {{
                navigateTo('login');
                return;
            }}
            
            try {{
                // Load user data
                const [devis, reservations, factures] = await Promise.all([
                    apiCall('/api/user/devis'),
                    apiCall('/api/user/reservations'),
                    apiCall('/api/user/factures')
                ]);
                
                container.innerHTML = `
                    <div class="card">
                        <h2>Tableau de bord - ${{currentUser.first_name}} ${{currentUser.last_name}}</h2>
                        
                        <div class="grid">
                            <div class="stat-card">
                                <div class="stat-number">${{devis.length}}</div>
                                <div>Devis</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${{reservations.length}}</div>
                                <div>Réservations</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${{factures.length}}</div>
                                <div>Factures</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h2>Demander un devis</h2>
                        <form onsubmit="handleDevisRequest(event)">
                            <div class="form-group">
                                <label for="service_type">Service souhaité</label>
                                <select id="service_type" name="service_type" required>
                                    <option value="">Choisir un service</option>
                                    <option value="renovation">Rénovation</option>
                                    <option value="personnalisation">Personnalisation</option>
                                    <option value="devoilage">Dévoilage</option>
                                    <option value="decapage">Décapage</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="description">Description</label>
                                <textarea id="description" name="description" rows="4"></textarea>
                            </div>
                            <button type="submit" class="btn">
                                <i class="fas fa-file-alt"></i> Demander un devis
                            </button>
                        </form>
                    </div>
                    
                    <div class="card">
                        <h2>Prendre rendez-vous</h2>
                        <form onsubmit="handleReservation(event)">
                            <div class="form-group">
                                <label for="res_service_type">Service</label>
                                <select id="res_service_type" name="service_type" required>
                                    <option value="">Choisir un service</option>
                                    <option value="renovation">Rénovation</option>
                                    <option value="personnalisation">Personnalisation</option>
                                    <option value="devoilage">Dévoilage</option>
                                    <option value="decapage">Décapage</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="date_rdv">Date</label>
                                <input type="date" id="date_rdv" name="date_rdv" required>
                            </div>
                            <div class="form-group">
                                <label for="heure_rdv">Heure</label>
                                <input type="time" id="heure_rdv" name="heure_rdv" required>
                            </div>
                            <div class="form-group">
                                <label for="res_description">Description</label>
                                <textarea id="res_description" name="description" rows="3"></textarea>
                            </div>
                            <button type="submit" class="btn">
                                <i class="fas fa-calendar"></i> Réserver
                            </button>
                        </form>
                    </div>
                    
                    <div class="card">
                        <h2>Mes devis</h2>
                        ${{renderTable(devis, ['id', 'service_type', 'prix', 'status', 'created_at'])}}
                    </div>
                    
                    <div class="card">
                        <h2>Mes réservations</h2>
                        ${{renderTable(reservations, ['id', 'service_type', 'date_rdv', 'heure_rdv', 'status'])}}
                    </div>
                    
                    <div class="card">
                        <h2>Mes factures</h2>
                        ${{renderTable(factures, ['id', 'service_type', 'montant', 'status', 'date_facture'])}}
                    </div>
                `;
                
                // Set minimum date to today
                document.getElementById('date_rdv').min = new Date().toISOString().split('T')[0];
                
            }} catch (error) {{
                showAlert('Erreur lors du chargement des données', 'error');
            }}
        }}
        
        async function renderAdminPage(container) {{
            if (!currentUser || currentUser.user_type !== 'admin') {{
                navigateTo('dashboard');
                return;
            }}
            
            try {{
                const [allDevis, allReservations, allFactures] = await Promise.all([
                    apiCall('/api/admin/devis'),
                    apiCall('/api/admin/reservations'),
                    apiCall('/api/admin/factures')
                ]);
                
                container.innerHTML = `
                    <div class="card">
                        <h2>Administration MY JANTES</h2>
                        
                        <div class="grid">
                            <div class="stat-card">
                                <div class="stat-number">${{allDevis.length}}</div>
                                <div>Devis Total</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${{allReservations.length}}</div>
                                <div>Réservations Total</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${{allFactures.length}}</div>
                                <div>Factures Total</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h2>Gestion des devis</h2>
                        ${{renderAdminTable(allDevis, 'devis', ['id', 'client_name', 'client_email', 'service_type', 'prix', 'status', 'created_at'])}}
                    </div>
                    
                    <div class="card">
                        <h2>Gestion des réservations</h2>
                        ${{renderAdminTable(allReservations, 'reservations', ['id', 'client_name', 'client_email', 'service_type', 'date_rdv', 'status'])}}
                    </div>
                    
                    <div class="card">
                        <h2>Gestion des factures</h2>
                        ${{renderAdminTable(allFactures, 'factures', ['id', 'client_name', 'service_type', 'montant', 'status', 'date_facture'])}}
                    </div>
                `;
                
            }} catch (error) {{
                showAlert('Erreur lors du chargement des données admin', 'error');
            }}
        }}
        
        // Utility functions
        function renderTable(data, columns) {{
            if (!data || data.length === 0) {{
                return '<p>Aucune donnée à afficher</p>';
            }}
            
            let html = '<table class="table"><thead><tr>';
            columns.forEach(col => {{
                html += `<th>${{col.replace('_', ' ').toUpperCase()}}</th>`;
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
                return '<p>Aucune donnée à afficher</p>';
            }}
            
            let html = '<table class="table"><thead><tr>';
            columns.forEach(col => {{
                html += `<th>${{col.replace('_', ' ').toUpperCase()}}</th>`;
            }});
            html += '<th>ACTIONS</th></tr></thead><tbody>';
            
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
                    }}
                    html += `<td>${{value}}</td>`;
                }});
                
                // Actions
                html += '<td>';
                if (table === 'factures') {{
                    html += `<button class="btn btn-secondary" onclick="updateStatus('${{table}}', '${{row.id}}', 'payee')" style="margin-right: 0.5rem;">Marquer payée</button>`;
                }}
                html += `<button class="btn btn-secondary" onclick="updateStatus('${{table}}', '${{row.id}}', 'annulee')">Annuler</button>`;
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
            alert.innerHTML = `<i class="fas fa-${{type === 'success' ? 'check' : 'exclamation-triangle'}}"></i> ${{message}}`;
            
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
    server_address = ('', port)
    httpd = socketserver.TCPServer(server_address, MyJantesServer)
    print(f"MY JANTES - Serveur complet démarré sur le port {port}")
    print("Base de données PostgreSQL configurée")
    print("Admin par défaut: admin@myjantes.fr / MyJantes2025!")
    httpd.serve_forever()

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\nServeur arrêté.")