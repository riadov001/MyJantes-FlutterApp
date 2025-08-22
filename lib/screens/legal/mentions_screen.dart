import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MentionsScreen extends StatelessWidget {
  const MentionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mentions Légales'),
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
                      'Mentions Légales',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 16),
                    
                    _buildSection(
                      context,
                      'Éditeur de l\'application',
                      'MY JANTES\nSpécialiste en rénovation de jantes en aluminium\n46 rue de la Convention\n62800 Liévin, France\nTéléphone : 03.21.40.80.53\nEmail : contact@myjantes.fr',
                    ),
                    
                    _buildSection(
                      context,
                      'Horaires d\'ouverture',
                      'Lundi - Vendredi : 9h-12h / 13h30-18h\nSamedi : 9h-13h\nDimanche : Fermé',
                    ),
                    
                    _buildSection(
                      context,
                      'Hébergement de l\'application',
                      'Application hébergée sur les serveurs Google Play Store et Apple App Store\nDonnées hébergées par Hostinger\nHostinger International Ltd.\nKaunas, Lithuania',
                    ),
                    
                    _buildSection(
                      context,
                      'Propriété intellectuelle',
                      'Le contenu de cette application mobile (textes, images, graphismes, logo, icônes, sons, logiciels) est la propriété exclusive de MY JANTES, à l\'exception des marques, logos ou contenus appartenant à d\'autres sociétés partenaires ou auteurs.\n\nToute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de l\'application, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de MY JANTES.',
                    ),
                    
                    _buildSection(
                      context,
                      'Protection des données personnelles',
                      'Les informations recueillies dans cette application sont nécessaires pour le traitement de vos demandes et sont destinées à MY JANTES. Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 et au RGPD, vous disposez d\'un droit d\'accès, de rectification et de suppression des données vous concernant.\n\nPour exercer ces droits, contactez-nous à : contact@myjantes.fr',
                    ),
                    
                    _buildSection(
                      context,
                      'Conditions d\'utilisation',
                      'L\'utilisation de cette application mobile implique l\'acceptation pleine et entière des conditions générales d\'utilisation décrites dans les présentes mentions légales. Ces conditions d\'utilisation sont susceptibles d\'être modifiées ou complétées à tout moment.',
                    ),
                    
                    _buildSection(
                      context,
                      'Responsabilité',
                      'MY JANTES ne pourra être tenue responsable des dommages directs et indirects causés au matériel de l\'utilisateur, lors de l\'accès à l\'application, et résultant soit de l\'utilisation d\'un matériel ne répondant pas aux spécifications indiquées, soit de l\'apparition d\'un bug ou d\'une incompatibilité.\n\nMY JANTES ne pourra également être tenue responsable des dommages indirects (tels par exemple qu\'une perte de marché ou perte d\'une chance) consécutifs à l\'utilisation de l\'application.',
                    ),
                    
                    _buildSection(
                      context,
                      'Droit applicable et attribution de juridiction',
                      'Tout litige en relation avec l\'utilisation de l\'application MY JANTES est soumis au droit français. Il est fait attribution exclusive de juridiction aux tribunaux compétents de Béthune.',
                    ),
                    
                    _buildSection(
                      context,
                      'Liens vers nos pages légales',
                      '',
                    ),
                    
                    // Legal links section
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Column(
                        children: [
                          _buildLegalLink(
                            context,
                            'Politique de confidentialité',
                            'Consultez notre politique de protection des données',
                            Icons.privacy_tip,
                            () => context.go('/privacy'),
                          ),
                          const Divider(),
                          _buildLegalLink(
                            context,
                            'Conditions générales de vente',
                            'Consultez nos conditions de vente',
                            Icons.description,
                            () => context.go('/terms'),
                          ),
                          const Divider(),
                          _buildLegalLink(
                            context,
                            'Garanties',
                            'Découvrez nos garanties et conditions',
                            Icons.verified_user,
                            () => context.go('/warranty'),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    _buildSection(
                      context,
                      'Contact',
                      'Pour toute question concernant l\'application ou nos services, n\'hésitez pas à nous contacter :',
                    ),
                    
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDC2626).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFDC2626).withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.contact_phone, color: Color(0xFFDC2626), size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              '📞 03.21.40.80.53 | ✉️ contact@myjantes.fr',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: const Color(0xFFDC2626),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    Text(
                      'Dernière mise à jour : 15 août 2025',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontStyle: FontStyle.italic,
                        color: Colors.grey[600],
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
          if (content.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              content,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLegalLink(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFFDC2626), size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: const Color(0xFFDC2626),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}