# 🚀 Configuration Codemagic pour MY JANTES

Guide complet pour configurer Codemagic et générer vos builds APK et IPA sans erreur.

## ✅ Structure prête pour Codemagic

Votre projet Flutter est maintenant entièrement configuré avec :
- ✅ Fichier `codemagic.yaml` complet
- ✅ Structure iOS xcodeproj correcte
- ✅ Configuration Android complète
- ✅ Version Web optimisée
- ✅ Bundle identifier : `fr.myjantes.app`

## 🔧 Configuration Codemagic

### 1. Créer un compte Codemagic
1. Allez sur [codemagic.io](https://codemagic.io)
2. Connectez-vous avec GitHub/GitLab/Bitbucket
3. Ajoutez votre repository Flutter

### 2. Configuration iOS (pour IPA)

**Certificats et profils :**
1. Dans Codemagic → Teams → votre équipe → Certificates
2. Ajoutez votre certificat de développement Apple
3. Ajoutez votre profil de provisioning

**Variables d'environnement iOS :**
```yaml
APP_STORE_APPLE_ID: "votre_apple_id"
BUNDLE_ID: "fr.myjantes.app"
```

**Important pour éviter les erreurs :**
- Utilisez le certificat "iOS Distribution" pour l'App Store
- Le Bundle ID doit correspondre exactement : `fr.myjantes.app`
- Assurez-vous que votre Apple Developer account est actif

### 3. Configuration Android (pour APK)

**Keystore :**
1. Générez un keystore :
```bash
keytool -genkey -v -keystore myjantes_keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```
2. Uploadez dans Codemagic → Code signing

**Variables d'environnement Android :**
```yaml
PACKAGE_NAME: "fr.myjantes.app"
GOOGLE_PLAY_TRACK: "internal"
```

### 4. Déclencher les builds

**Via l'interface Codemagic :**
1. Sélectionnez votre projet
2. Choisissez le workflow (iOS/Android/Web)
3. Cliquez "Start new build"

**Via webhook (automatique) :**
- Les builds se déclenchent automatiquement à chaque push sur la branche principale

## 📱 Configuration pour installation IPA sans App Store

### Méthode 1 : TestFlight (Recommandée)
1. Le build IPA sera automatiquement envoyé sur TestFlight
2. Invitez votre Apple ID comme testeur
3. Installez l'app TestFlight sur votre iPhone
4. Acceptez l'invitation et installez l'app

### Méthode 2 : Distribution Ad-Hoc
1. Modifiez dans `codemagic.yaml` :
```yaml
ios_signing:
  distribution_type: ad_hoc
```
2. Ajoutez l'UDID de votre iPhone au profil
3. Installez via lien direct ou iTunes

### Méthode 3 : Distribution Enterprise (si compte Enterprise)
```yaml
ios_signing:
  distribution_type: enterprise
```

## 🛠️ Résolution des erreurs courantes

### Erreur : "No provisioning profile"
- Vérifiez que le Bundle ID correspond exactement
- Re-générez le profil de provisioning avec le bon Bundle ID
- Uploadez le nouveau profil dans Codemagic

### Erreur : "Certificate not found"
- Assurez-vous d'utiliser le bon certificat (Developer/Distribution)
- Vérifiez que le certificat n'a pas expiré
- Exportez et re-uploadez le certificat avec le mot de passe

### Erreur Android : "Key not found"
- Vérifiez l'alias de la clé dans le keystore
- Assurez-vous que les mots de passe sont corrects
- Re-créez le keystore si nécessaire

### Erreur Flutter : "Packages not found"
- Vérifiez que `pubspec.yaml` est correct
- Assurez-vous que toutes les dépendances sont compatibles
- Lancez `flutter pub get` localement avant de pusher

## 📊 Monitoring des builds

### Logs détaillés
- Chaque build génère des logs complets
- Consultez les artifacts pour les fichiers générés
- Les erreurs sont détaillées avec stack traces

### Notifications
- Configurez les notifications email dans `codemagic.yaml`
- Recevez les résultats de build par email
- Notifications Slack/Discord disponibles

## 🎯 Optimisations pour réduire les coûts

### Limiter les builds
```yaml
triggering:
  events:
    - push
  branch_patterns:
    - pattern: main
      include: true
      source: true
```

### Optimiser la durée
```yaml
max_build_duration: 60  # Réduire si possible
instance_type: linux_x2  # Plus économique
```

### Cache des dépendances
```yaml
cache:
  cache_paths:
    - ~/.pub-cache
    - $HOME/.gradle/caches
```

## 🚀 Checklist final avant build

- [ ] Bundle ID configuré : `fr.myjantes.app`
- [ ] Certificats iOS uploadés et valides
- [ ] Keystore Android configuré
- [ ] Variables d'environnement définies
- [ ] Fichier `codemagic.yaml` validé
- [ ] Permissions dans `Info.plist` (iOS) et `AndroidManifest.xml`
- [ ] Version et build number corrects

## 📞 Support

Une fois configuré, vos builds devraient réussir :
- **APK Android** : Téléchargeable directement
- **IPA iOS** : Via TestFlight ou distribution directe
- **Web** : Prêt pour hébergement

**Temps de build estimé :**
- Android : 10-15 minutes
- iOS : 15-25 minutes  
- Web : 5-10 minutes

Votre configuration est maintenant optimisée pour Codemagic !