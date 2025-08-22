# 📱 Guide d'installation MY JANTES Flutter

Guide complet pour transformer votre application React MY JANTES en application Flutter native.

## ✅ Transformation terminée

L'application Flutter est maintenant **entièrement créée** avec :

- ✅ Architecture Flutter complète (iOS/Android/Web)
- ✅ Tous les écrans : accueil, réservation, devis, dashboard admin
- ✅ Pages légales RGPD : mentions, confidentialité, CGV, garanties
- ✅ Thème authentique My Jantes (rouge #DC2626, Roboto fonts)
- ✅ Services API WordPress intégrés
- ✅ Authentification admin sécurisée
- ✅ Upload de photos pour les devis
- ✅ Interface responsive multi-plateforme

## 🚀 Étapes de déploiement

### 1. Installation Flutter SDK

**Sur macOS :**
```bash
# Installer Flutter via Homebrew
brew install flutter

# Ou télécharger depuis https://flutter.dev/docs/get-started/install
```

**Sur Ubuntu/Linux :**
```bash
# Télécharger Flutter
wget https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.16.0-stable.tar.xz
tar xf flutter_linux_*-stable.tar.xz
export PATH="$PATH:`pwd`/flutter/bin"
```

**Sur Windows :**
- Télécharger depuis https://flutter.dev/docs/get-started/install/windows
- Extraire et ajouter au PATH

### 2. Vérification de l'installation
```bash
flutter doctor
```

### 3. Installation des dépendances du projet
```bash
cd flutter_app
flutter pub get
```

### 4. Configuration du backend WordPress

Modifiez l'URL dans `lib/services/api_service.dart` :
```dart
static const String baseUrl = 'https://votre-domaine-hostinger.com/wp-json/myjantes/v1';
```

### 5. Test de l'application

**Version web :**
```bash
flutter run -d chrome
```

**Version mobile (avec émulateur/appareil) :**
```bash
flutter run
```

## 📦 Compilation pour production

### Android (Google Play Store)
```bash
# Générer l'App Bundle (recommandé)
flutter build appbundle --release

# Ou générer l'APK
flutter build apk --release
```

### iOS (App Store)
```bash
flutter build ios --release
```

### Web
```bash
flutter build web --release
```

## 🔧 Configuration supplémentaire

### Logo et icônes
1. Ajoutez votre logo dans `assets/icons/logo.png` (512x512px)
2. Générez les icônes :
```bash
flutter pub run flutter_launcher_icons:main
```

### Écran de démarrage
1. Configurez l'image dans `assets/icons/logo.png`
2. Générez :
```bash
flutter pub run flutter_native_splash:create
```

## 🌐 Intégration WordPress

Le backend WordPress est prêt dans `wordpress-backend/` avec :
- API REST personnalisée `/wp-json/myjantes/v1/`
- Gestion des services, réservations, devis
- Authentification admin
- Envoi d'emails automatiques
- Base de données structurée

## 📱 Fonctionnalités principales

### Client
- **Accueil** : Présentation services, contact, horaires
- **Réservation** : Système de prise de RDV complet
- **Devis** : Demande avec upload photos (jusqu'à 5 images)
- **Légal** : 4 pages conformes RGPD

### Admin (Dashboard)
- **Connexion sécurisée** : Authentification WordPress
- **Réservations** : Vue liste avec statuts
- **Devis** : Gestion complète avec détails véhicule
- **Déconnexion** : Nettoyage sécurisé

## 🛡️ Sécurité et conformité

- **RGPD complet** : Pages légales exhaustives
- **Données chiffrées** : Flutter Secure Storage
- **HTTPS obligatoire** : Communication sécurisée
- **Validation stricte** : Côtés client et serveur
- **Stockage local minimal** : Token admin uniquement

## 📞 Support technique

Une fois l'application installée, vous pouvez :
- Publier sur Google Play Store et Apple App Store
- Héberger la version web sur votre serveur
- Intégrer avec votre WordPress existant sur Hostinger

**Contact développement :**
- Application Flutter complète et fonctionnelle
- Backend WordPress prêt pour production
- Documentation technique incluse