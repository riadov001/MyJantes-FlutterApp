import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class WarrantyScreen extends StatelessWidget {
  const WarrantyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Garanties'),
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
                      'Garanties MY JANTES',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 16),
                    
                    _buildSection(
                      context,
                      '🛡️ Garantie Rénovation - 6 mois',
                      'Nos prestations de rénovation sont garanties 6 mois contre :\n\n• Défauts de peinture ou de finition\n• Écaillage prématuré du revêtement\n• Problèmes d\'adhérence\n• Défauts de matière\n\nLa garantie couvre la reprise gratuite des travaux défectueux.',
                    ),
                    
                    _buildSection(
                      context,
                      '⚖️ Garantie Dévoilage - 3 mois',
                      'Le dévoilage de vos jantes est garanti 3 mois contre :\n\n• Retour de la déformation traitée\n• Problèmes d\'équilibrage liés à notre intervention\n• Défauts de géométrie\n\nLa garantie inclut une nouvelle intervention gratuite si nécessaire.',
                    ),
                    
                    _buildSection(
                      context,
                      '🎨 Garantie Personnalisation - 6 mois',
                      'Nos travaux de personnalisation bénéficient d\'une garantie de 6 mois sur :\n\n• La tenue des couleurs\n• La qualité des finitions spéciales\n• L\'adhérence des éléments décoratifs\n• La conformité au design convenu',
                    ),
                    
                    _buildSection(
                      context,
                      '🧽 Garantie Décapage - 1 mois',
                      'Le décapage professionnel est garanti 1 mois contre :\n\n• Résidus de décapage\n• Altération du support aluminium\n• Préparation insuffisante de la surface',
                    ),
                    
                    _buildSection(
                      context,
                      '❌ Exclusions de garantie',
                      'La garantie ne s\'applique pas en cas de :\n\n• Usure normale liée à l\'utilisation\n• Dommages causés par un choc ou un accident\n• Mauvais usage ou entretien inadapté\n• Modification ou réparation par un tiers\n• Exposition à des produits chimiques agressifs\n• Utilisation en compétition automobile',
                    ),
                    
                    _buildSection(
                      context,
                      '📝 Mise en œuvre de la garantie',
                      'Pour faire jouer la garantie :\n\n1. Contactez-nous dès constatation du problème\n2. Présentez-vous avec la facture originale\n3. Nous diagnostiquons la nature du défaut\n4. Si la garantie s\'applique, reprise gratuite sous 48h\n\nContact garantie : 03.21.40.80.53',
                    ),
                    
                    _buildSection(
                      context,
                      '💡 Conseils d\'entretien',
                      'Pour préserver vos jantes et maintenir la garantie :\n\n• Nettoyage régulier avec des produits adaptés\n• Éviter les produits abrasifs ou acides\n• Contrôle régulier de la pression des pneus\n• Protection contre les chocs de trottoir\n• Inspection visuelle périodique',
                    ),
                    
                    _buildSection(
                      context,
                      '🏆 Notre engagement qualité',
                      'MY JANTES s\'engage à :\n\n• Utiliser uniquement des matériaux de qualité professionnelle\n• Respecter les procédures techniques rigoureuses\n• Former continuellement nos techniciens\n• Contrôler la qualité à chaque étape\n• Assurer un service après-vente réactif',
                    ),
                    
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDC2626).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFDC2626).withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline, color: Color(0xFFDC2626)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Nos garanties s\'ajoutent à vos droits légaux et ne les limitent pas.',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    Text(
                      'MY JANTES - 46 rue de la Convention, 62800 Liévin\nTél: 03.21.40.80.53 - Email: contact@myjantes.fr\nHoraires: Lun-Ven 9h-12h/13h30-18h, Sam 9h-13h',
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
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w600,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}