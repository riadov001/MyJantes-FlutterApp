import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Politique de Confidentialité'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Politique de Confidentialité',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 16),
                    
                    _buildSection(
                      context,
                      '1. Responsable du traitement',
                      'MY JANTES, société située au 46 rue de la Convention, 62800 Liévin, France.\nTéléphone : 03.21.40.80.53 - Email : contact@myjantes.fr',
                    ),
                    
                    _buildSection(
                      context,
                      '2. Données collectées',
                      'Dans le cadre de nos services de rénovation de jantes, nous collectons :\n\n• Données d\'identification : nom, prénom, email, téléphone\n• Données de localisation : adresse, code postal\n• Données véhicule : marque, modèle, année, état des jantes\n• Photos des jantes pour établissement des devis\n• Données de navigation sur notre application mobile',
                    ),
                    
                    _buildSection(
                      context,
                      '3. Finalités du traitement',
                      'Vos données sont traitées pour :\n\n• Gestion des demandes de devis et réservations\n• Exécution des prestations de rénovation\n• Facturation et suivi commercial\n• Communication marketing (avec votre consentement)\n• Amélioration de nos services\n• Respect des obligations légales',
                    ),
                    
                    _buildSection(
                      context,
                      '4. Base légale',
                      'Le traitement de vos données repose sur :\n\n• L\'exécution du contrat de service (art. 6.1.b RGPD)\n• Votre consentement pour les communications marketing (art. 6.1.a RGPD)\n• Le respect d\'obligations légales (art. 6.1.c RGPD)\n• L\'intérêt légitime pour l\'amélioration de nos services (art. 6.1.f RGPD)',
                    ),
                    
                    _buildSection(
                      context,
                      '5. Durée de conservation',
                      'Nous conservons vos données :\n\n• Données clients : 3 ans après la dernière prestation\n• Données prospects : 3 ans après le dernier contact\n• Données comptables : 10 ans (obligation légale)',
                    ),
                    
                    _buildSection(
                      context,
                      '6. Vos droits',
                      'Conformément au RGPD, vous disposez des droits suivants :\n\n• Droit d\'accès à vos données personnelles\n• Droit de rectification des données inexactes\n• Droit à l\'effacement ("droit à l\'oubli")\n• Droit à la limitation du traitement\n• Droit à la portabilité des données\n• Droit d\'opposition au traitement\n• Droit de retirer votre consentement\n\nPour exercer vos droits, contactez-nous à contact@myjantes.fr',
                    ),
                    
                    _buildSection(
                      context,
                      '7. Sécurité',
                      'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre la perte, l\'altération, la divulgation ou l\'accès non autorisé.',
                    ),
                    
                    _buildSection(
                      context,
                      '8. Réclamation',
                      'Vous avez le droit d\'introduire une réclamation auprès de la CNIL (Commission Nationale de l\'Informatique et des Libertés) si vous estimez que le traitement de vos données ne respecte pas la réglementation.',
                    ),
                    
                    const SizedBox(height: 16),
                    Text(
                      'Dernière mise à jour : 15 août 2025',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}