# 🌐 Guide Hostinger - Déploiement MY JANTES

## 🎯 Objectif
Déployer votre application Flutter web sur votre domaine Hostinger existant.

## 📋 Prérequis
- ✅ Compte Hostinger actif avec domaine
- ✅ Build web Flutter généré par Codemagic
- ✅ Accès cPanel de votre hébergement

## 🚀 ÉTAPE 1 : Préparation du build

### A. Récupération des fichiers
1. **Via Codemagic :**
   - Allez dans votre build "web-workflow" réussi
   - Téléchargez l'artifact `build/web/**`
   - Extrayez l'archive ZIP

2. **Structure des fichiers :**
```
build/web/
├── index.html              # Page principale
├── main.dart.js           # Application Flutter
├── flutter.js             # Runtime Flutter
├── manifest.json          # Configuration PWA
├── flutter_service_worker.js # Service Worker
├── .htaccess             # Configuration Apache
├── assets/               # Assets de l'app
├── canvaskit/            # Rendu Flutter
└── icons/               # Icônes PWA
```

## 🏗️ ÉTAPE 2 : Déploiement sur Hostinger

### A. Accès cPanel
1. Connectez-vous à votre compte Hostinger
2. Ouvrez le cPanel de votre domaine principal
3. Allez dans "Gestionnaire de fichiers"

### B. Nettoyage du dossier public_html
```
IMPORTANT : Sauvegardez d'abord votre site existant !

1. Sélectionnez tout le contenu de public_html/
2. Supprimez ou déplacez dans un dossier backup/
3. Le dossier public_html/ doit être vide
```

### C. Upload des fichiers Flutter
1. **Méthode 1 - Upload direct :**
   - Cliquez "Téléverser" dans le gestionnaire de fichiers
   - Sélectionnez tous les fichiers du dossier build/web/
   - Attendez la fin du téléchargement

2. **Méthode 2 - Archive ZIP :**
   - Créez un ZIP de tout le contenu build/web/
   - Uploadez le ZIP dans public_html/
   - Clic droit → "Extraire" → Extraire ici
   - Supprimez le fichier ZIP

### D. Vérification de la structure
```
Votre public_html/ doit contenir :
✓ index.html (à la racine)
✓ main.dart.js 
✓ flutter.js
✓ manifest.json
✓ .htaccess
✓ assets/ (dossier)
✓ canvaskit/ (dossier)
✓ icons/ (dossier)
```

## ⚙️ ÉTAPE 3 : Configuration Hostinger

### A. Vérification .htaccess
Assurez-vous que le fichier `.htaccess` est bien présent avec ce contenu :

```apache
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache assets Flutter  
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header append Cache-Control "public, immutable"
</FilesMatch>

# Headers PWA
<FilesMatch "manifest\.json$">
    Header set Content-Type application/json
</FilesMatch>

<FilesMatch "flutter_service_worker\.js$">
    Header set Content-Type application/javascript
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>

# Fallback SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### B. Configuration HTTPS
1. **SSL automatique Hostinger :**
   - Hostinger configure HTTPS automatiquement
   - Vérifiez dans cPanel → SSL/TLS → que le certificat est actif

2. **Forcer HTTPS :**
   - Le .htaccess redirige automatiquement HTTP → HTTPS
   - Testez : http://votre-domaine.com → doit rediriger vers https://

### C. Configuration domaine
1. **Domaine principal :**
   - L'app sera accessible sur https://votre-domaine.com
   
2. **Sous-domaine (optionnel) :**
   - Créez un sous-domaine : app.votre-domaine.com
   - Pointez vers le même dossier public_html/

## 📱 ÉTAPE 4 : Test et validation

### A. Tests de base
1. **Accès principal :**
   ```
   https://votre-domaine.com
   → Doit afficher l'accueil MY JANTES
   ```

2. **Navigation :**
   ```
   https://votre-domaine.com/booking
   → Doit afficher la page de réservation
   
   https://votre-domaine.com/quote  
   → Doit afficher la page de devis
   ```

3. **PWA :**
   ```
   Sur mobile : Navigateur → Menu → "Ajouter à l'écran d'accueil"
   Sur desktop : Barre d'adresse → Icône d'installation
   ```

### B. Tests avancés
1. **Performance :**
   - Utilisez PageSpeed Insights
   - Score attendu : 85+ mobile, 90+ desktop

2. **Fonctionnalité offline :**
   - Chargez la page
   - Coupez internet
   - Actualisez → doit encore fonctionner

3. **Responsive :**
   - Testez sur mobile, tablette, desktop
   - Menu hamburger sur mobile
   - Formulaires adaptés

## 🔧 ÉTAPE 5 : Optimisations Hostinger

### A. Configuration cache
```apache
# Ajoutez dans .htaccess si pas déjà présent :

# Compression Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Headers sécurité
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

### B. Monitoring
1. **Google Analytics :**
   - Ajoutez votre code GA dans index.html si souhaité
   
2. **Search Console :**
   - Soumettez votre sitemap sur search.google.com
   - Sitemap automatique : https://votre-domaine.com/sitemap.xml

## 🚨 ÉTAPE 6 : Dépannage

### Problème : Page blanche
```
Cause : Fichiers mal uploadés
Solution :
1. Vérifiez que index.html est à la racine
2. Vérifiez que main.dart.js existe  
3. Console navigateur → erreurs JS
```

### Problème : Erreur 404 sur navigation
```
Cause : .htaccess manquant ou mal configuré
Solution :
1. Vérifiez présence .htaccess
2. Vérifiez que mod_rewrite est activé (par défaut chez Hostinger)
```

### Problème : Assets ne chargent pas
```
Cause : Chemins incorrects
Solution :
1. Vérifiez structure dossier assets/
2. Permissions fichiers (755 pour dossiers, 644 pour fichiers)
```

### Problème : PWA ne s'installe pas
```
Cause : manifest.json ou HTTPS
Solution :
1. Vérifiez https://votre-domaine.com/manifest.json
2. Vérifiez certificat SSL actif
3. Testez sur mobile Chrome/Safari
```

## 📊 ÉTAPE 7 : Maintenance et mises à jour

### A. Mises à jour automatisées
```
Pour chaque nouvelle version :
1. Codemagic génère nouveau build web
2. Téléchargez artifacts
3. Remplacez fichiers dans public_html/
4. Testez les changements
```

### B. Backup
```
Créez un backup automatique :
1. cPanel → Sauvegardes
2. Programmez backup hebdomadaire
3. Ou dupliquez public_html/ avant chaque mise à jour
```

## ✅ Checklist finale

**Configuration initiale :**
- [ ] Fichiers Flutter uploadés dans public_html/
- [ ] Structure correcte vérifiée
- [ ] .htaccess configuré
- [ ] HTTPS fonctionnel

**Tests fonctionnels :**
- [ ] Page d'accueil charge correctement
- [ ] Navigation fonctionne (booking, quote, etc.)
- [ ] Formulaires soumettent vers API WordPress
- [ ] PWA installable sur mobile
- [ ] Mode offline opérationnel

**Performance :**
- [ ] PageSpeed score > 85
- [ ] Temps de chargement < 3 secondes
- [ ] Responsive sur tous appareils
- [ ] Cache configuré

## 🎯 Résultat final

Votre application MY JANTES sera accessible sur :
- **URL principal :** https://votre-domaine.com
- **PWA installable** sur mobile et desktop
- **Performance optimisée** avec cache Hostinger
- **Sécurisé** avec HTTPS et headers sécurité
- **SEO ready** avec metadata et sitemap

**Temps total de déploiement : 30-45 minutes**