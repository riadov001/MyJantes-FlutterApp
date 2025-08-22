import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import {
  ChevronRight,
  ChevronDown,
  Star,
  Shield,
  Clock,
  Award,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Palette,
  Wrench,
  Sparkles,
  Euro,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const services = [
    {
      id: "renovation",
      title: "Rénovation complète",
      icon: Shield,
      shortDescription: "Remise à neuf intégrale de vos jantes avec finition professionnelle et protection durable.",
      price: "À partir de 80€",
      duration: "3-5 jours",
      features: [
        "Décapage complet de l'ancienne peinture",
        "Traitement anti-corrosion professionnel",
        "Préparation minutieuse de la surface",
        "Application de peinture haute qualité",
        "Finition protective longue durée",
        "Contrôle qualité rigoureux"
      ],
      detailedDescription: "Notre service de rénovation complète redonne une seconde vie à vos jantes. Nous utilisons des techniques professionnelles et des matériaux haut de gamme pour garantir un résultat optimal et durable. Chaque jante est traitée individuellement selon son état et vos exigences.",
      warranty: "Garantie 2 ans sur la finition"
    },
    {
      id: "personnalisation",
      title: "Personnalisation",
      icon: Palette,
      shortDescription: "Donnez un style unique à vos jantes avec nos options de couleurs et finitions sur mesure.",
      price: "À partir de 60€",
      duration: "2-4 jours",
      features: [
        "Plus de 50 couleurs disponibles",
        "Finitions mate, brillante, satinée",
        "Effets métallisés et perlés",
        "Bi-ton et dégradés possibles",
        "Simulation 3D avant réalisation",
        "Conseils personnalisés"
      ],
      detailedDescription: "Exprimez votre personnalité avec nos services de personnalisation. Notre large palette de couleurs et de finitions vous permet de créer des jantes uniques qui reflètent votre style. Nos experts vous conseillent pour obtenir le rendu parfait.",
      warranty: "Garantie 1 an sur la couleur"
    },
    {
      id: "reparation",
      title: "Réparation express",
      icon: Wrench,
      shortDescription: "Correction rapide des rayures, impacts et défauts pour retrouver l'aspect d'origine.",
      price: "À partir de 40€",
      duration: "1-2 jours",
      features: [
        "Réparation de rayures légères à profondes",
        "Correction d'impacts et d'éclats",
        "Retouches localisées précises",
        "Polissage haute qualité",
        "Restauration de l'éclat d'origine",
        "Service express disponible"
      ],
      detailedDescription: "Nos services de réparation permettent de corriger efficacement les dommages du quotidien. Grâce à nos techniques précises, nous restaurons vos jantes à leur état d'origine, évitant ainsi le coût d'un remplacement complet.",
      warranty: "Garantie 6 mois sur la réparation"
    }
  ];

  const toggleService = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Rénovation de{" "}
                <span className="text-red-600">jantes aluminium</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Redonnez vie à vos jantes avec notre expertise professionnelle.
                Service de qualité à Liévin depuis plus de 10 ans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/devis">
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    data-testid="hero-cta-devis"
                  >
                    Demander un devis
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/reservations">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50"
                    data-testid="hero-cta-reservation"
                  >
                    Prendre rendez-vous
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Excellence garantie</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 mr-3" />
                    Garantie qualité
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 mr-3" />
                    Service rapide
                  </li>
                  <li className="flex items-center">
                    <Award className="h-5 w-5 mr-3" />
                    Expertise reconnue
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nos Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des solutions complètes pour tous vos besoins de rénovation et
              personnalisation de jantes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const isExpanded = expandedService === service.id;
              const IconComponent = service.icon;
              
              return (
                <Card 
                  key={service.id}
                  className={`transition-all duration-300 cursor-pointer ${
                    isExpanded 
                      ? 'shadow-xl ring-2 ring-red-500 ring-opacity-50 transform scale-105' 
                      : 'hover:shadow-lg hover:transform hover:scale-102'
                  }`}
                  onClick={() => toggleService(service.id)}
                  data-testid={`service-card-${service.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">{service.price}</div>
                          <div className="text-xs text-gray-500">{service.duration}</div>
                        </div>
                        <ChevronDown 
                          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4">
                      {service.shortDescription}
                    </p>

                    {!isExpanded && (
                      <div className="space-y-2">
                        <ul className="text-sm text-gray-500 space-y-1">
                          {service.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2">
                          <span className="text-xs text-blue-600 font-medium">
                            Cliquez pour voir plus de détails ↓
                          </span>
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="space-y-4 animate-in slide-in-from-top-1">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {service.detailedDescription}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                            <Sparkles className="h-4 w-4 text-yellow-500 mr-1" />
                            Inclus dans ce service
                          </h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {service.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <div className="flex items-center text-xs text-gray-500">
                            <Shield className="h-3 w-3 mr-1" />
                            {service.warranty}
                          </div>
                          <Link href="/devis">
                            <Button 
                              size="sm" 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`cta-${service.id}`}
                            >
                              Demander un devis
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Vous avez un projet spécifique ?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Nos experts étudient chaque demande personnellement. 
                Obtenez un devis gratuit et des conseils adaptés à vos besoins.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/devis">
                  <Button className="bg-red-600 hover:bg-red-700" size="lg">
                    <Euro className="h-5 w-5 mr-2" />
                    Devis gratuit en 24h
                  </Button>
                </Link>
                <Link href="#contact">
                  <Button variant="outline" size="lg" className="border-red-600 text-red-600 hover:bg-red-50">
                    <Phone className="h-5 w-5 mr-2" />
                    Nous appeler
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Plus de 10 ans d'expertise
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                MY JANTES est votre spécialiste de la rénovation de jantes
                aluminium à Liévin. Notre équipe expérimentée utilise les
                dernières technologies pour vous garantir un résultat
                exceptionnel.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">1000+</div>
                  <div className="text-gray-600">Jantes rénovées</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">10+</div>
                  <div className="text-gray-600">Années d'expérience</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Pourquoi nous choisir ?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Award className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Qualité professionnelle</h4>
                    <p className="text-red-100 text-sm">
                      Matériaux haut de gamme et finitions irréprochables
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Délais respectés</h4>
                    <p className="text-red-100 text-sm">
                      Engagement sur les délais de livraison annoncés
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Garantie qualité</h4>
                    <p className="text-red-100 text-sm">
                      Garantie sur tous nos travaux de rénovation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Contactez-nous
            </h2>
            <p className="text-xl text-gray-600">
              Une question ? Un projet ? N'hésitez pas à nous contacter
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Téléphone
                </h3>
                <p className="text-gray-600">03 21 44 XX XX</p>
                <p className="text-sm text-gray-500 mt-2">
                  Lun - Ven : 9h - 18h<br />
                  Sam : 9h - 17h
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Adresse
                </h3>
                <p className="text-gray-600">
                  Liévin<br />
                  Pas-de-Calais, France
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Parking gratuit disponible
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email
                </h3>
                <p className="text-gray-600">contact@myjantes.fr</p>
                <p className="text-sm text-gray-500 mt-2">
                  Réponse sous 24h
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link href="/devis">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                  Demander un devis gratuit
                </Button>
              </Link>
              <Link href="/reservations">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50">
                  Prendre rendez-vous
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-red-500 mb-4">MY JANTES</h3>
              <p className="text-gray-400 mb-4">
                Votre spécialiste de la rénovation de jantes aluminium à Liévin.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  data-testid="footer-facebook"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  data-testid="footer-instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/devis" className="hover:text-white transition-colors">
                    Rénovation complète
                  </Link>
                </li>
                <li>
                  <Link href="/devis" className="hover:text-white transition-colors">
                    Personnalisation
                  </Link>
                </li>
                <li>
                  <Link href="/devis" className="hover:text-white transition-colors">
                    Réparation express
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>03 21 44 XX XX</li>
                <li>contact@myjantes.fr</li>
                <li>Liévin, France</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Horaires</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Lun - Ven : 9h - 18h</li>
                <li>Samedi : 9h - 17h</li>
                <li>Dimanche : Fermé</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MY JANTES. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}