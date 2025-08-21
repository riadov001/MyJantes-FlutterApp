#!/usr/bin/env python3
"""
Backend server for MY JANTES application
Provides API endpoints for devis, reservations, and invoices
"""
import os
import json
import http.server
import socketserver
import urllib.parse
from pathlib import Path
import sqlite3
from datetime import datetime
import uuid

class MyJantesAPI:
    def __init__(self):
        self.db_path = "myjantes.db"
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table des devis
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devis (
                id TEXT PRIMARY KEY,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                client_phone TEXT,
                service_type TEXT NOT NULL,
                description TEXT,
                prix REAL,
                status TEXT DEFAULT 'en_attente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des réservations
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reservations (
                id TEXT PRIMARY KEY,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                client_phone TEXT,
                service_type TEXT NOT NULL,
                date_rdv TEXT NOT NULL,
                heure_rdv TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'confirmee',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table des factures
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS factures (
                id TEXT PRIMARY KEY,
                devis_id TEXT,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                service_type TEXT NOT NULL,
                montant REAL NOT NULL,
                status TEXT DEFAULT 'en_attente',
                date_facture TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (devis_id) REFERENCES devis (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def create_devis(self, data):
        """Créer un nouveau devis"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        devis_id = str(uuid.uuid4())[:8]
        prix = self.calculate_price(data.get('service_type', ''))
        
        cursor.execute('''
            INSERT INTO devis (id, client_name, client_email, client_phone, 
                             service_type, description, prix)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (devis_id, data['client_name'], data['client_email'], 
              data.get('client_phone', ''), data['service_type'], 
              data.get('description', ''), prix))
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'devis_id': devis_id,
            'prix_estime': prix,
            'message': f'Devis #{devis_id} créé avec succès'
        }
    
    def create_reservation(self, data):
        """Créer une nouvelle réservation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        reservation_id = str(uuid.uuid4())[:8]
        
        cursor.execute('''
            INSERT INTO reservations (id, client_name, client_email, client_phone,
                                    service_type, date_rdv, heure_rdv, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (reservation_id, data['client_name'], data['client_email'],
              data.get('client_phone', ''), data['service_type'],
              data['date_rdv'], data['heure_rdv'], data.get('description', '')))
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'reservation_id': reservation_id,
            'message': f'Réservation #{reservation_id} confirmée pour le {data["date_rdv"]} à {data["heure_rdv"]}'
        }
    
    def create_facture(self, data):
        """Créer une nouvelle facture"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        facture_id = str(uuid.uuid4())[:8]
        date_facture = datetime.now().strftime('%Y-%m-%d')
        
        cursor.execute('''
            INSERT INTO factures (id, devis_id, client_name, client_email,
                                service_type, montant, date_facture)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (facture_id, data.get('devis_id'), data['client_name'], 
              data['client_email'], data['service_type'], 
              data['montant'], date_facture))
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'facture_id': facture_id,
            'date_facture': date_facture,
            'message': f'Facture #{facture_id} générée avec succès'
        }
    
    def get_all_devis(self):
        """Récupérer tous les devis"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM devis ORDER BY created_at DESC')
        devis = cursor.fetchall()
        conn.close()
        
        return [dict(zip([col[0] for col in cursor.description], row)) for row in devis]
    
    def get_all_reservations(self):
        """Récupérer toutes les réservations"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM reservations ORDER BY created_at DESC')
        reservations = cursor.fetchall()
        conn.close()
        
        return [dict(zip([col[0] for col in cursor.description], row)) for row in reservations]
    
    def get_all_factures(self):
        """Récupérer toutes les factures"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM factures ORDER BY created_at DESC')
        factures = cursor.fetchall()
        conn.close()
        
        return [dict(zip([col[0] for col in cursor.description], row)) for row in factures]
    
    def calculate_price(self, service_type):
        """Calculer le prix selon le type de service"""
        prices = {
            'renovation_complete': 150.0,
            'polissage': 80.0,
            'personnalisation': 200.0,
            'reparation': 120.0,
            'renovation': 150.0,
            'custom': 200.0
        }
        return prices.get(service_type, 100.0)

class MyJantesServer(http.server.BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.api = MyJantesAPI()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
            return
        
        # API endpoints
        if self.path == '/api/devis':
            self.send_json_response(self.api.get_all_devis())
        elif self.path == '/api/reservations':
            self.send_json_response(self.api.get_all_reservations())
        elif self.path == '/api/factures':
            self.send_json_response(self.api.get_all_factures())
        elif self.path == '/logo':
            self.serve_logo()
        elif self.path == '/renovation_jante.jpg':
            self.serve_image('renovation_jante.jpg')
        elif self.path == '/personnalisation_jante.webp':
            self.serve_image('personnalisation_jante.webp')
        elif self.path == '/devoilage_jante.jpg':
            self.serve_image('devoilage_jante.jpg')
        elif self.path == '/decapage_jante.webp':
            self.serve_image('decapage_jante.webp')
        elif self.path == '/hero_jante.webp':
            self.serve_image('hero_jante.webp')
        elif self.path == '/':
            self.serve_main_page()
        else:
            self.send_404()
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            if self.headers.get('Content-Type') == 'application/json':
                data = json.loads(post_data.decode('utf-8'))
            else:
                # Parse form data
                data = urllib.parse.parse_qs(post_data.decode('utf-8'))
                data = {k: v[0] if len(v) == 1 else v for k, v in data.items()}
            
            # Route to appropriate handler
            if self.path == '/api/devis':
                result = self.api.create_devis(data)
                self.send_json_response(result)
            elif self.path == '/api/reservations':
                result = self.api.create_reservation(data)
                self.send_json_response(result)
            elif self.path == '/api/factures':
                result = self.api.create_facture(data)
                self.send_json_response(result)
            else:
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
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def send_error_response(self, error_msg):
        """Send error response"""
        self.send_response(400)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {'success': False, 'error': error_msg}
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def serve_logo(self):
        """Serve the MY JANTES logo"""
        try:
            logo_path = "myjantes_official_logo.png"
            with open(logo_path, 'rb') as f:
                logo_data = f.read()
                
            self.send_response(200)
            self.send_header('Content-type', 'image/png')
            self.send_header('Cache-Control', 'max-age=3600')
            self.end_headers()
            self.wfile.write(logo_data)
        except FileNotFoundError:
            self.send_404()
    
    def serve_image(self, image_name):
        """Serve images from the current directory"""
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
    
    def serve_main_page(self):
        """Serve the main application page with working forms"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html_content = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MY JANTES - Les Experts de la Jante Aluminium</title>
    <meta name="description" content="MY JANTES - Spécialiste de la rénovation de jantes en aluminium à Liévin. Qualité exceptionnelle, garantie totale. Rénovation, personnalisation, dévoilage, décapage.">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        :root {
            --primary-red: #DC2626;
            --deep-red: #B91C1C;
            --light-red: #FCA5A5;
            --black: #000000;
            --dark-gray: #1F1F1F;
            --medium-gray: #333333;
            --light-gray: #F5F5F5;
            --white: #FFFFFF;
            --shadow: 0 8px 32px rgba(0,0,0,0.12);
            --shadow-lg: 0 16px 64px rgba(0,0,0,0.2);
            --border-radius: 16px;
            --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: var(--black);
            background: var(--white);
            overflow-x: hidden;
        }
        
        /* Navigation moderne avec design noir/rouge/blanc */
        .navbar {
            background: linear-gradient(135deg, var(--black) 0%, var(--dark-gray) 100%);
            border-bottom: 3px solid var(--primary-red);
            color: var(--white);
            padding: 0;
            box-shadow: var(--shadow-lg);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .navbar-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .logo img {
            height: 50px;
            width: auto;
            background: var(--white);
            padding: 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
        
        .logo-text {
            font-size: 1.6rem;
            font-weight: 800;
            color: var(--white);
            letter-spacing: -0.5px;
        }
        
        /* Menu principal symétrique et moderne */
        .nav-menu {
            display: flex;
            list-style: none;
            gap: 2rem;
            align-items: center;
        }
        
        .nav-menu li {
            position: relative;
        }
        
        .nav-menu a {
            color: var(--white);
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .nav-menu a:hover {
            background: var(--primary-red);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
        }
        
        .nav-menu a i {
            font-size: 1.1rem;
        }
        
        /* Contact info dans la nav */
        .nav-contact {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            color: var(--white);
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .contact-item i {
            color: var(--primary-red);
            font-size: 1rem;
        }
        
        /* Menu mobile hamburger moderne */
        .mobile-menu-btn {
            display: none;
            background: none;
            border: none;
            color: var(--white);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 8px;
            transition: var(--transition);
        }
        
        .mobile-menu-btn:hover {
            background: var(--primary-red);
        }
        
        /* Section Hero moderne avec image */
        .hero {
            position: relative;
            min-height: 600px;
            background: linear-gradient(135deg, var(--black) 0%, var(--dark-gray) 50%, var(--medium-gray) 100%);
            display: flex;
            align-items: center;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('/hero_jante.webp') center/cover;
            opacity: 0.3;
            z-index: 1;
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 1400px;
            margin: 0 auto;
            padding: 4rem 2rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
        }
        
        .hero-text {
            color: var(--white);
        }
        
        .hero-title {
            font-size: 2.8rem;
            font-weight: 900;
            line-height: 1.2;
            margin-bottom: 1.5rem;
            background: linear-gradient(45deg, var(--white), var(--primary-red));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero-subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            color: var(--light-gray);
            font-weight: 500;
            line-height: 1.6;
        }
        
        .hero-buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 0.9rem 1.8rem;
            border-radius: var(--border-radius);
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: var(--transition);
            border: 2px solid transparent;
            cursor: pointer;
        }
        
        .btn-primary {
            background: var(--primary-red);
            color: var(--white);
            box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
        }
        
        .btn-primary:hover {
            background: var(--deep-red);
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(220, 38, 38, 0.6);
        }
        
        .btn-outline {
            background: transparent;
            color: var(--white);
            border-color: var(--white);
        }
        
        .btn-outline:hover {
            background: var(--white);
            color: var(--black);
            transform: translateY(-3px);
        }
        
        /* Services avec images authentiques */
        .services {
            padding: 4rem 2rem;
            background: var(--light-gray);
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .section-title {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .section-title h2 {
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--black);
            margin-bottom: 1rem;
            line-height: 1.3;
        }
        
        .section-title p {
            font-size: 1.1rem;
            color: var(--medium-gray);
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.6;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .service-card {
            background: var(--white);
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: var(--transition);
            border: 2px solid transparent;
        }
        
        .service-card:hover {
            transform: translateY(-8px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary-red);
        }
        
        .service-image {
            height: 200px;
            background-size: cover;
            background-position: center;
            position: relative;
        }
        
        .service-image::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(220, 38, 38, 0.9), rgba(0, 0, 0, 0.7));
            opacity: 0;
            transition: var(--transition);
        }
        
        .service-card:hover .service-image::after {
            opacity: 1;
        }
        
        .service-content {
            padding: 2rem;
        }
        
        .service-content h3 {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--black);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            line-height: 1.4;
        }
        
        .service-content h3 i {
            color: var(--primary-red);
            font-size: 1.2rem;
        }
        
        .service-content p {
            color: var(--medium-gray);
            line-height: 1.7;
            font-size: 1rem;
        }
        
        /* Section Contact moderne */
        .contact-section {
            background: var(--black);
            color: var(--white);
            padding: 4rem 2rem;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
        }
        
        .contact-info h3 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 2rem;
            color: var(--primary-red);
            line-height: 1.3;
        }
        
        .contact-details {
            display: grid;
            gap: 1.5rem;
        }
        
        .contact-detail {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: var(--dark-gray);
            border-radius: 12px;
            border-left: 4px solid var(--primary-red);
        }
        
        .contact-detail i {
            font-size: 1.5rem;
            color: var(--primary-red);
        }
        
        /* Footer moderne */
        .footer {
            background: var(--black);
            color: var(--white);
            border-top: 3px solid var(--primary-red);
            padding: 3rem 2rem 2rem;
        }
        
        .footer-content {
            max-width: 1400px;
            margin: 0 auto;
            text-align: center;
        }
        
        .footer-logo {
            margin-bottom: 2rem;
        }
        
        .footer-logo img {
            height: 60px;
            background: var(--white);
            padding: 10px;
            border-radius: 12px;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }
        
        .footer-links a {
            color: var(--white);
            text-decoration: none;
            font-weight: 500;
            transition: var(--transition);
        }
        
        .footer-links a:hover {
            color: var(--primary-red);
        }
        
        /* Styles du formulaire */
        .form {
            background: var(--dark-gray);
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--white);
            font-weight: 600;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 1rem;
            border: 2px solid var(--medium-gray);
            border-radius: 8px;
            background: var(--white);
            font-size: 1rem;
            transition: var(--transition);
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--primary-red);
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        
        /* Responsive Design */
        /* Large desktop screens (1200px+) */
        @media (min-width: 1200px) {
            .hero-title {
                font-size: 3.2rem;
            }
            
            .section-title h2 {
                font-size: 2.5rem;
            }
            
            .hero-content {
                padding: 5rem 2rem;
            }
            
            .services {
                padding: 5rem 2rem;
            }
            
            .contact-section {
                padding: 5rem 2rem;
            }
        }
        
        /* Medium screens (768px to 1199px) */
        @media (min-width: 769px) and (max-width: 1199px) {
            .hero-title {
                font-size: 2.4rem;
            }
            
            .section-title h2 {
                font-size: 2rem;
            }
            
            .hero-content {
                gap: 3rem;
                padding: 3rem 1.5rem;
            }
            
            .services {
                padding: 3rem 1.5rem;
            }
            
            .contact-section {
                padding: 3rem 1.5rem;
            }
            
            .contact-grid {
                gap: 3rem;
            }
        }
        
        /* Small screens and tablets (768px and below) */
        @media (max-width: 768px) {
            .nav-menu, .nav-contact {
                display: none;
            }
            
            .mobile-menu-btn {
                display: block;
            }
            
            .hero-content {
                grid-template-columns: 1fr;
                text-align: center;
                padding: 2rem 1rem;
                gap: 2rem;
            }
            
            .hero-title {
                font-size: 2rem;
            }
            
            .hero-subtitle {
                font-size: 1rem;
            }
            
            .section-title h2 {
                font-size: 1.8rem;
            }
            
            .section-title p {
                font-size: 1rem;
            }
            
            .contact-grid {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
            
            .contact-info h3 {
                font-size: 1.8rem;
            }
            
            .services-grid {
                grid-template-columns: 1fr;
            }
            
            .services {
                padding: 2rem 1rem;
            }
            
            .contact-section {
                padding: 2rem 1rem;
            }
            
            .btn {
                padding: 0.8rem 1.5rem;
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation moderne noir/rouge/blanc -->
    <nav class="navbar">
        <div class="navbar-content">
            <div class="logo">
                <img src="/logo" alt="MY JANTES Logo">
                <span class="logo-text">MY JANTES</span>
            </div>
            
            <ul class="nav-menu">
                <li><a href="#home"><i class="fas fa-home"></i> Accueil</a></li>
                <li><a href="#services"><i class="fas fa-cogs"></i> Services</a></li>
                <li><a href="#contact"><i class="fas fa-phone"></i> Contact</a></li>
                <li><a href="#about"><i class="fas fa-info-circle"></i> À propos</a></li>
            </ul>
            
            <div class="nav-contact">
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <span>03.21.40.80.53</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Liévin</span>
                </div>
            </div>
            
            <button class="mobile-menu-btn">
                <i class="fas fa-bars"></i>
            </button>
        </div>
    </nav>

    <!-- Section Hero avec image authentique -->
    <section class="hero" id="home">
        <div class="hero-content">
            <div class="hero-text">
                <h1 class="hero-title">LES EXPERTS DE LA JANTE ALU</h1>
                <p class="hero-subtitle">Rénovation de jantes chez MY JANTES : Qualité exceptionnelle, garantie totale. Choisissez l'excellence pour vos jantes en aluminium !</p>
                <div class="hero-buttons">
                    <a href="#contact" class="btn btn-primary">
                        <i class="fas fa-phone"></i>
                        Demander un devis
                    </a>
                    <a href="#services" class="btn btn-outline">
                        <i class="fas fa-eye"></i>
                        Nos services
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Section Services avec vraies images -->
    <section class="services" id="services">
        <div class="container">
            <div class="section-title">
                <h2>Nos Services</h2>
                <p>Découvrez l'assurance d'une rénovation de jantes exceptionnelle. Notre expertise inégalée, associée à une garantie complète, assure des résultats durables et un éclat durable pour votre véhicule.</p>
            </div>
            
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-image" style="background-image: url('/renovation_jante.jpg')"></div>
                    <div class="service-content">
                        <h3><i class="fas fa-tools"></i> Rénovation</h3>
                        <p>Rénovation complète de vos jantes en aluminium avec notre expertise technique de pointe. Redonnez vie à vos jantes avec un finish parfait.</p>
                    </div>
                </div>
                
                <div class="service-card">
                    <div class="service-image" style="background-image: url('/personnalisation_jante.webp')"></div>
                    <div class="service-content">
                        <h3><i class="fas fa-palette"></i> Personnalisation</h3>
                        <p>Personnalisez vos jantes selon vos goûts avec nos finitions sur-mesure. Couleurs, effets spéciaux, design unique pour votre véhicule.</p>
                    </div>
                </div>
                
                <div class="service-card">
                    <div class="service-image" style="background-image: url('/devoilage_jante.jpg')"></div>
                    <div class="service-content">
                        <h3><i class="fas fa-sync"></i> Dévoilage</h3>
                        <p>Service professionnel de dévoilage pour corriger les déformations. Retrouvez l'équilibre parfait et la sécurité optimale de vos jantes.</p>
                    </div>
                </div>
                
                <div class="service-card">
                    <div class="service-image" style="background-image: url('/decapage_jante.webp')"></div>
                    <div class="service-content">
                        <h3><i class="fas fa-eraser"></i> Décapage</h3>
                        <p>Décapage professionnel pour éliminer toute trace d'oxydation et préparer vos jantes pour une finition impeccable.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section Contact moderne -->
    <section class="contact-section" id="contact">
        <div class="container">
            <div class="contact-grid">
                <div class="contact-info">
                    <h3>Contactez-nous</h3>
                    <div class="contact-details">
                        <div class="contact-detail">
                            <i class="fas fa-phone"></i>
                            <div>
                                <strong>Téléphone</strong><br>
                                03.21.40.80.53
                            </div>
                        </div>
                        
                        <div class="contact-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <strong>Adresse</strong><br>
                                46 rue de la Convention<br>
                                62800 Liévin
                            </div>
                        </div>
                        
                        <div class="contact-detail">
                            <i class="fas fa-clock"></i>
                            <div>
                                <strong>Horaires</strong><br>
                                Lun-Ven: 9h-12h / 13h30-18h<br>
                                Samedi: 9h-13h
                            </div>
                        </div>
                        
                        <div class="contact-detail">
                            <i class="fas fa-tools"></i>
                            <div>
                                <strong>Services</strong><br>
                                Avec ou sans rendez-vous
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="contact-form">
                    <form action="/api/devis" method="POST" class="form">
                        <h4 style="color: var(--primary-red); margin-bottom: 2rem; font-size: 1.8rem;">Demander un devis</h4>
                        
                        <div class="form-group">
                            <label for="client_name">Nom complet</label>
                            <input type="text" id="client_name" name="client_name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="client_email">Email</label>
                            <input type="email" id="client_email" name="client_email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="client_phone">Téléphone</label>
                            <input type="tel" id="client_phone" name="client_phone">
                        </div>
                        
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
                            <label for="description">Description détaillée</label>
                            <textarea id="description" name="description" rows="4" placeholder="Décrivez vos besoins..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i>
                            Envoyer la demande
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer moderne -->
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-logo">
                <img src="/logo" alt="MY JANTES Logo">
            </div>
            
            <div class="footer-links">
                <a href="#home">Accueil</a>
                <a href="#services">Services</a>
                <a href="#contact">Contact</a>
                <a href="/mentions-legales">Mentions légales</a>
                <a href="/cgv">CGV</a>
                <a href="/confidentialite">Confidentialité</a>
            </div>
            
            <p>&copy; 2025 MY JANTES - Tous droits réservés. Spécialiste de la rénovation de jantes en aluminium.</p>
        </div>
    </footer>



    <script>
        // Menu mobile
        document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
            const navMenu = document.querySelector('.nav-menu');
            const navContact = document.querySelector('.nav-contact');
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
            navContact.style.display = navContact.style.display === 'flex' ? 'none' : 'flex';
        });

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Form submission
        document.querySelector('.form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            fetch('/api/devis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('Votre demande de devis a été envoyée avec succès ! Nous vous contacterons rapidement.');
                    this.reset();
                } else {
                    alert('Erreur lors de l\\'envoi. Veuillez réessayer.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Erreur lors de l\\'envoi. Veuillez réessayer.');
            });
        });
    </script>
</body>
</html>"""
        
        self.wfile.write(html_content.encode('utf-8'))


class MyJantesHandler(http.server.BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.api = MyJantesAPI()
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        return  # Silencer les logs HTTP par défaut

    def do_GET(self):
        if self.path == '/':
            self.homepage()
        elif self.path == '/logo':
            self.serve_logo()
        elif self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_post()
        else:
            self.send_error(404)

    def homepage(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        
        # HTML content directement intégré pour éviter les erreurs
        html_content = self.api.get_homepage_html()
        self.wfile.write(html_content.encode('utf-8'))

    def serve_logo(self):
        try:
            with open('myjantes_official_logo.png', 'rb') as f:
                self.send_response(200)
                self.send_header('Content-type', 'image/png')
                self.end_headers()
                self.wfile.write(f.read())
        except:
            self.send_error(404)

    def handle_api_get(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {"status": "ok", "message": "MY JANTES API active"}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def handle_api_post(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            
            if self.path == '/api/devis':
                response = self.api.create_devis(data)
            elif self.path == '/api/reservations':
                response = self.api.create_reservation(data)
            elif self.path == '/api/factures':
                response = self.api.create_facture(data)
            else:
                response = {"success": False, "message": "Endpoint non trouvé"}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {"success": False, "message": f"Erreur serveur: {str(e)}"}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))


def main():
    """Start the Flask-like server"""
    port = int(os.environ.get('PORT', 8080))
    
    print(f"🚀 MY JANTES Backend Server starting on port {port}")
    print("✨ Interface web moderne et responsive disponible")
    print("🔧 API endpoints: /api/devis, /api/reservations, /api/factures")
    
    with socketserver.TCPServer(("", port), MyJantesHandler) as httpd:
        print(f"📱 Serveur démarré: http://0.0.0.0:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n⏹️ Serveur arrêté proprement")


if __name__ == "__main__":
    main()
