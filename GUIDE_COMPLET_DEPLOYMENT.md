# 📱 Guide Complet - Deployment MY JANTES

## 🎯 Résumé de votre situation
- ✅ Compte Google Play Developer payé (25€)
- ✅ Domaine Hostinger disponible
- ❌ Pas de compte Apple Developer (99€)
- ❌ Pas de Mac disponible
- 🎯 Objectif : APK signé + Bundle Google Play + IPA test + Hébergement web

## 🚀 ÉTAPE 1 : Configuration Codemagic

### A. Création compte et connexion
1. Allez sur [codemagic.io](https://codemagic.io)
2. Créez un compte avec votre email
3. Connectez votre repository Git
4. Codemagic détecte automatiquement `codemagic.yaml`

### B. Configuration Android (APK + Bundle signé)

**1. Générer le keystore de signature :**
```bash
# Sur votre ordinateur local ou via un service en ligne
keytool -genkey -v -keystore myjantes-release-key.keystore \
  -alias myjantes \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Informations à saisir :
# Nom et prénom : MY JANTES
# Unité organisationnelle : MY JANTES  
# Organisation : MY JANTES
# Ville : Liévin
# État/Province : Hauts-de-France
# Code pays : FR
```

**2. Upload du keystore dans Codemagic :**
- Codemagic → Teams → Code signing identities
- Android signing → Upload keystore
- Alias : `myjantes`
- Sauvegardez les mots de passe

**3. Variables d'environnement Android :**
```yaml
PACKAGE_NAME: "fr.myjantes.app"
GOOGLE_PLAY_TRACK: "internal"
```

### C. Configuration iOS (IPA sans compte Developer)

**Option 1 : Certificat de développement gratuit**
```yaml
# Dans codemagic.yaml
ios_signing:
  distribution_type: development
  bundle_identifier: fr.myjantes.app
```

**Option 2 : Distribution Ad-Hoc (recommandée pour tests)**
1. Récupérez les UDID des iPhones de test :
   - Paramètres → Général → Informations → UDID
2. Créez un profil Ad-Hoc sur developer.apple.com
3. Configurez dans Codemagic

## 🏗️ ÉTAPE 2 : Lancement des builds

### Build Android (APK + AAB)
1. Codemagic → Votre projet → Workflows
2. Sélectionnez "android-workflow"
3. Start new build
4. **Résultat attendu :**
   - APK signé pour installation directe
   - AAB signé pour Google Play Store
   - Durée : 15-20 minutes

### Build iOS (IPA)
1. Sélectionnez "ios-workflow"
2. Start new build
3. **Résultat attendu :**
   - IPA pour installation test
   - Durée : 20-25 minutes

## 📱 ÉTAPE 3 : Installation IPA sur iPhone (sans Apple Developer)

### Méthode 1 : Installation directe (SANS Mac requis)

**A. Préparation iPhone :**
```
1. Paramètres → Général → Gestion VPN et appareils
2. Notez que vous devrez faire confiance au développeur après installation
```

**B. Installation via Codemagic :**
```
1. Build IPA terminé → Téléchargez le fichier .ipa
2. Uploadez sur un service comme Diawi.com ou InstallOnAir
3. Générez un lien d'installation
4. Envoyez le lien à vos testeurs
5. Ouvrez le lien sur iPhone → Installer
```

**C. Validation sur iPhone :**
```
1. Paramètres → Général → Gestion VPN et appareils
2. Trouvez votre profil développeur
3. Touchez "Faire confiance à [Développeur]"
4. L'app est maintenant utilisable
```

### Méthode 2 : Via services tiers (Plus facile)

**TestApp.io (Gratuit) :**
1. Créez compte sur testapp.io
2. Uploadez votre IPA
3. Invitez vos testeurs par email
4. Installation automatique via lien

**AppCenter (Microsoft) :**
1. Compte gratuit sur appcenter.ms
2. Upload IPA
3. Distribution aux testeurs
4. Notifications automatiques

## 🌐 ÉTAPE 4 : Hébergement Web sur Hostinger

### A. Préparation du build Web
```bash
# Le workflow web-workflow génère automatiquement :
# → Dossier build/web/ complet
# → PWA avec manifest.json
# → Service Worker pour offline
```

### B. Configuration Hostinger

**1. Accès cPanel :**
- Connectez-vous à votre compte Hostinger
- Ouvrez cPanel de votre domaine
- Allez dans "Gestionnaire de fichiers"

**2. Upload des fichiers :**
```
1. Supprimez le contenu du dossier public_html
2. Uploadez tout le contenu de build/web/ vers public_html/
3. Structure finale :
   public_html/
   ├── index.html
   ├── main.dart.js
   ├── manifest.json
   ├── flutter_service_worker.js
   └── assets/
```

**3. Configuration domaine :**
- Votre app sera accessible sur : https://votre-domaine.com
- Configuration HTTPS automatique Hostinger
- Cache optimisé pour assets Flutter

### C. Configuration avancée Hostinger

**1. Fichier .htaccess (pour PWA) :**
```apache
# Créez public_html/.htaccess
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache des assets Flutter
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>

# Headers pour PWA
<FilesMatch "manifest\.json$">
    Header set Content-Type application/json
</FilesMatch>

# Fallback pour SPA
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 📦 ÉTAPE 5 : Publication Google Play Store

### A. Préparation Google Play Console
1. Connectez-vous à play.google.com/console
2. Créez une nouvelle application
3. Nom : "MY JANTES"
4. Package : `fr.myjantes.app`

### B. Upload du Bundle
1. Production → Versions → Créer une version
2. Upload du fichier .aab généré par Codemagic
3. Ajoutez description, captures d'écran
4. Configurez la fiche Store

### C. Informations Store requises
```
Titre : MY JANTES - Rénovation Jantes Alu
Description courte : Expert en rénovation de jantes aluminium à Liévin

Description longue :
MY JANTES est votre expert en rénovation de jantes en aluminium.
Découvrez nos services professionnels :
• Rénovation complète de jantes
• Personnalisation et customisation  
• Dévoilage professionnel
• Demande de devis en ligne avec photos
• Prise de rendez-vous simplifiée

Basés à Liévin (62800), nous intervenons dans toute la région.
Contactez-nous au 03.21.40.80.53

Catégorie : Automobile
Classification : Contenu adapté à tous
```

## ⚙️ ÉTAPE 6 : Automatisation complète

### A. Workflow automatisé
```yaml
# Votre codemagic.yaml configure :
✅ Build Android automatique (push sur main)
✅ Signature automatique APK/AAB
✅ Build iOS automatique
✅ Build Web automatique
✅ Notifications email des résultats
```

### B. Déploiement continu
```
1. Code modifié → Push sur GitHub
2. Codemagic détecte → Build automatique
3. Android : AAB → prêt pour Google Play
4. iOS : IPA → prêt pour test
5. Web : build/ → prêt pour Hostinger
```

## 🔧 ÉTAPE 7 : Résolution problèmes courants

### Erreurs Android
**"Keystore not found"**
```
Solution :
1. Vérifiez l'alias : myjantes
2. Re-uploadez le keystore
3. Vérifiez les mots de passe
```

### Erreurs iOS  
**"Provisioning profile expired"**
```
Solution :
1. Utilisez development au lieu d'app_store
2. Ou créez nouveau profil sur developer.apple.com
```

### Erreurs Web
**"Assets not loading"**
```
Solution :
1. Vérifiez structure public_html/
2. Ajoutez .htaccess
3. Videz cache Hostinger
```

## 📊 Monitoring et coûts

### Coûts Codemagic
- Build minutes gratuites : 500/mois
- Android build : ~15 minutes
- iOS build : ~20 minutes  
- Web build : ~10 minutes
- **Estimation :** ~30 builds gratuits/mois

### Optimisations
```yaml
# Réduire coûts dans codemagic.yaml :
max_build_duration: 60
cache:
  cache_paths:
    - ~/.pub-cache
    - $HOME/.gradle/caches
```

## ✅ Checklist final

**Avant premier build :**
- [ ] Repository sur Git avec code Flutter
- [ ] Compte Codemagic créé et connecté
- [ ] Keystore Android généré et uploadé
- [ ] Variables d'environnement configurées
- [ ] Certificat iOS configuré (même gratuit)

**Après builds réussis :**
- [ ] APK téléchargé et testé
- [ ] AAB uploadé sur Google Play Console
- [ ] IPA distribué aux testeurs
- [ ] Site web déployé sur Hostinger

## 🎯 Résultats attendus

**Dans 2-3 heures vous aurez :**
1. **APK signé** → Installation directe Android
2. **AAB signé** → Publication Google Play Store
3. **IPA fonctionnel** → Test sur iPhone sans Apple Developer
4. **Site web PWA** → Accessible sur votre domaine Hostinger
5. **Pipeline automatisé** → Builds futurs automatiques

**Votre écosystème complet MY JANTES sera opérationnel !**