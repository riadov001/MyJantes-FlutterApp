import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Conditions Générales de Vente'),
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
                      'Conditions Générales de Vente',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 16),
                    
                    _buildSection(
                      context,
                      '1. Objet',
                      'Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre MY JANTES, société spécialisée dans la rénovation de jantes en aluminium, et ses clients.',
                    ),
                    
                    _buildSection(
                      context,
                      '2. Services proposés',
                      'MY JANTES propose les services suivants :\n\n• Rénovation complète de jantes en aluminium\n• Personnalisation et customisation\n• Dévoilage professionnel\n• Décapage et nettoyage en profondeur\n• Conseils techniques personnalisés',
                    ),
                    
                    _buildSection(
                      context,
                      '3. Commandes et réservations',
                      'Les commandes peuvent être passées :\n\n• En ligne via notre application mobile\n• Par téléphone au 03.21.40.80.53\n• Sur place à notre atelier\n\nToute commande implique l\'acceptation pleine et entière des présentes CGV.',
                    ),
                    
                    _buildSection(
                      context,
                      '4. Prix et paiement',
                      'Les prix sont indiqués en euros TTC. Le règlement s\'effectue :\n\n• À la commande pour les prestations inférieures à 200€\n• 50% à la commande, solde à la livraison pour les prestations supérieures\n• Moyens de paiement acceptés : espèces, chèque, carte bancaire, virement',
                    ),
                    
                    _buildSection(
                      context,
                      '5. Délais d\'exécution',
                      'Les délais indicatifs sont :\n\n• Rénovation standard : 3 à 5 jours ouvrés\n• Personnalisation : 5 à 10 jours ouvrés\n• Dévoilage : 1 à 2 jours ouvrés\n• Décapage : 1 à 3 jours ouvrés\n\nCes délais peuvent varier selon la charge de travail et la complexité des prestations.',
                    ),
                    
                    _buildSection(
                      context,
                      '6. Garanties',
                      'MY JANTES garantit :\n\n• La conformité des prestations aux spécifications convenues\n• Un travail de qualité professionnelle\n• Garantie de 6 mois sur les travaux de rénovation\n• Garantie de 3 mois sur le dévoilage\n\nLa garantie ne couvre pas l\'usure normale ni les dommages dus à un mauvais usage.',
                    ),
                    
                    _buildSection(
                      context,
                      '7. Responsabilité',
                      'MY JANTES s\'engage à apporter le plus grand soin à l\'exécution de ses prestations. Sa responsabilité est limitée au remplacement ou à la réparation des jantes endommagées dans le cadre de l\'intervention.',
                    ),
                    
                    _buildSection(
                      context,
                      '8. Droit de rétractation',
                      'Conformément au Code de la consommation, vous disposez d\'un délai de 14 jours pour exercer votre droit de rétractation, sauf pour les prestations déjà commencées avec votre accord exprès.',
                    ),
                    
                    _buildSection(
                      context,
                      '9. Règlement des litiges',
                      'En cas de litige, nous privilégions une solution amiable. À défaut, les tribunaux de Béthune seront seuls compétents.',
                    ),
                    
                    const SizedBox(height: 16),
                    Text(
                      'MY JANTES - 46 rue de la Convention, 62800 Liévin\nTél: 03.21.40.80.53 - Email: contact@myjantes.fr',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 8),
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