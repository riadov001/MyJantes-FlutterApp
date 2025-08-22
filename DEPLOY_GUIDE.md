# 📱 Guide de déploiement complet MY JANTES

## ✅ Votre application Flutter est prête !

### Structure complète créée :
```
flutter_app/
├── lib/                     # Code Dart de l'application
│   ├── main.dart           # Point d'entrée
│   ├── models/             # Modèles de données
│   ├── screens/            # Écrans (home, booking, quote, dashboard, legal)
│   ├── services/           # API et authentification
│   └── utils/              # Thème et utilitaires
├── ios/                    # Configuration iOS complète
│   ├── Runner.xcodeproj/   # ✅ Projet Xcode complet
│   ├── Runner/             # ✅ Code source iOS
│   └── Flutter/            # ✅ Configuration Flutter
├── android/                # Configuration Android complète
│   ├── app/build.gradle    # ✅ Configuration Gradle
│   └── app/src/main/       # ✅ Code source Android
├── web/                    # Version Web PWA
├── codemagic.yaml          # ✅ Configuration CI/CD
└── assets/                 # Assets (icônes, images)
```

## 🚀 Déploiement Codemagic - Configuration complète

### 1. Configuration initiale Codemagic

**Connexion repository :**
1. Allez sur [codemagic.io](https://codemagic.io)
2. Connectez votre compte Git (GitHub/GitLab/Bitbucket)
3. Sélectionnez votre repository MY JANTES
4. Codemagic détectera automatiquement le fichier `codemagic.yaml`

### 2. Configuration iOS (IPA)

**Étape A : Certificats Apple**
```bash
# Dans Codemagic → Teams → [Votre équipe] → Certificates
1. Uploadez votre certificat de développement (.p12)
2. Uploadez votre profil de provisioning (.mobileprovision)
3. Bundle ID : fr.myjantes.app
```

**Étape B : Variables d'environnement iOS**
```yaml
Variables à configurer dans Codemagic :
- APP_STORE_APPLE_ID: "votre_apple_id"
- BUNDLE_ID: "fr.myjantes.app"
```

**Étape C : App Store Connect**
1. Créez l'app sur App Store Connect avec Bundle ID `fr.myjantes.app`
2. Nom : "MY JANTES"
3. Catégorie : Business
4. Configurez TestFlight pour les tests

### 3. Configuration Android (APK)

**Étape A : Création Keystore**
```bash
# Générez votre keystore (à faire une seule fois)
keytool -genkey -v -keystore myjantes_keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias myjantes_key
```

**Informations à saisir :**
- Nom : MY JANTES
- Unité organisationnelle : MY JANTES
- Organisation : MY JANTES
- Ville : Liévin
- État : Hauts-de-France
- Code pays : FR

**Étape B : Upload Keystore dans Codemagic**
1. Codemagic → Teams → Code signing identities
2. Upload keystore file
3. Alias : `myjantes_key`
4. Sauvegardez les mots de passe

### 4. Lancement des builds

**Builds automatiques :**
- Push sur branch `main` → Build automatique
- Workflows configurés : iOS, Android, Web

**Builds manuels :**
1. Codemagic → Select repository → MY JANTES
2. Choisir workflow (iOS/Android/Web)
3. "Start new build"

### 5. Installation IPA sur iPhone (sans App Store)

**Méthode 1 : TestFlight (recommandée)**
1. Build IPA → Automatiquement sur TestFlight
2. Invitez votre Apple ID comme testeur
3. Installez app TestFlight sur iPhone
4. Acceptez invitation et installez

**Méthode 2 : Distribution directe**
```yaml
# Modifiez codemagic.yaml pour distribution directe
ios_signing:
  distribution_type: development  # Au lieu de app_store
```

## 📊 Monitoring et résolution d'erreurs

### Erreurs courantes iOS

**"No provisioning profile matches"**
```bash
Solution :
1. Vérifiez Bundle ID : fr.myjantes.app
2. Re-générez le profil avec bon Bundle ID
3. Uploadez nouveau profil dans Codemagic
```

**"Certificate expired"**
```bash
Solution :
1. Renouvelez certificat sur Apple Developer
2. Téléchargez nouveau .p12
3. Uploadez dans Codemagic
```

### Erreurs courantes Android

**"Key alias not found"**
```bash
Solution :
1. Vérifiez alias keystore : myjantes_key
2. Vérifiez mots de passe
3. Re-créez keystore si nécessaire
```

## 🎯 Optimisation des coûts Codemagic

### Réduire temps de build
```yaml
# Dans codemagic.yaml
max_build_duration: 60      # Minutes (ajuster selon besoins)
instance_type: linux_x2     # Plus économique
```

### Cache des dépendances
```yaml
cache:
  cache_paths:
    - ~/.pub-cache           # Cache Flutter
    - $HOME/.gradle/caches   # Cache Android
```

### Builds conditionnels
```yaml
triggering:
  events:
    - push
  branch_patterns:
    - pattern: main
      include: true
      source: true
```

## 📱 Résultats attendus

**Après build réussi :**

**iOS (IPA) :**
- Fichier .ipa généré
- Envoi automatique TestFlight
- Installation possible sur iPhone
- Durée : ~20-25 minutes

**Android (APK) :**
- Fichier .aab généré
- Prêt pour Google Play Store
- Installation directe possible
- Durée : ~15-20 minutes

**Web :**
- Dossier build/web/ généré
- PWA complète
- Prêt pour hébergement
- Durée : ~10-15 minutes

## 🔐 Sécurité et conformité

**RGPD ✅**
- Pages légales complètes
- Consentements configurés
- Droits utilisateurs respectés

**Sécurité ✅**
- Communications HTTPS
- Données chiffrées localement
- Authentification sécurisée

## 📞 Support post-déploiement

**Une fois déployé, vous aurez :**
- Application iOS installable via TestFlight
- Application Android prête pour Google Play
- Version web hébergeable
- Backend WordPress fonctionnel

**Contact technique :**
- Logs détaillés dans Codemagic
- Notifications email configurées
- Build artifacts téléchargeables

## ✅ Checklist final

- [ ] Repository poussé avec structure Flutter complète
- [ ] Compte Codemagic connecté
- [ ] Certificats iOS uploadés et valides
- [ ] Keystore Android configuré
- [ ] Variables d'environnement définies
- [ ] Bundle ID configuré : `fr.myjantes.app`
- [ ] App Store Connect configuré (pour iOS)
- [ ] TestFlight configuré pour distribution

**Votre application MY JANTES est maintenant prête pour Codemagic !** 🎉

Les builds devraient maintenant réussir sans erreur grâce à la configuration complète fournie.