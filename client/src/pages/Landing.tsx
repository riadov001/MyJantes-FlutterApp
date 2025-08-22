import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-red-600">MY JANTES</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/devis" className="text-gray-700 hover:text-red-600">
                Demande de devis
              </Link>
              <Link href="/reservations" className="text-gray-700 hover:text-red-600">
                Réservation
              </Link>
              <a
                href="/api/login"
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Connexion
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              MY JANTES
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Spécialiste de la rénovation de jantes aluminium à Liévin
            </p>
            <div className="space-x-4">
              <Link
                href="/devis"
                className="bg-white text-red-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 inline-block"
              >
                Demande de devis
              </Link>
              <Link
                href="/reservations"
                className="border-2 border-white text-white px-8 py-3 rounded-md font-semibold hover:bg-white hover:text-red-600 inline-block"
              >
                Prendre rendez-vous
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos Services
            </h2>
            <p className="text-lg text-gray-600">
              Des solutions complètes pour vos jantes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Rénovation</h3>
              <p className="text-gray-600">
                Remise à neuf complète de vos jantes aluminium
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Personnalisation</h3>
              <p className="text-gray-600">
                Couleurs et finitions sur mesure
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Réparation</h3>
              <p className="text-gray-600">
                Correction des rayures et impacts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Contactez-nous
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-2">Téléphone</h3>
                <p className="text-gray-600">03 21 44 XX XX</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Adresse</h3>
                <p className="text-gray-600">Liévin, France</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600">contact@myjantes.fr</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}