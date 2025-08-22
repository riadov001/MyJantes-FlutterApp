import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { User, FileText, Calendar, Settings, LogOut } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-red-600">MY JANTES</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Bonjour, {user?.firstName || user?.email}
              </span>
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-red-600 hover:text-red-700 font-medium"
                  data-testid="link-admin"
                >
                  Administration
                </Link>
              )}
              <Link
                href="/profile"
                className="text-gray-700 hover:text-red-600"
                data-testid="link-profile"
              >
                <User className="h-5 w-5" />
              </Link>
              <a
                href="/api/logout"
                className="text-gray-700 hover:text-red-600"
                data-testid="link-logout"
              >
                <LogOut className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tableau de bord
          </h2>
          <p className="text-lg text-gray-600">
            Gérez vos devis, factures et réservations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/devis">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-devis">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-red-600 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Devis</h3>
                  <p className="text-gray-600">Demander un devis</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/reservations">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-reservations">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-red-600 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Réservations</h3>
                  <p className="text-gray-600">Prendre rendez-vous</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/factures">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-factures">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-red-600 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Factures</h3>
                  <p className="text-gray-600">Voir mes factures</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Activité récente
          </h3>
          <p className="text-gray-600">
            Vos dernières activités apparaîtront ici.
          </p>
        </div>
      </main>
    </div>
  );
}