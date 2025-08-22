import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Page non trouvée
        </h2>
        <p className="text-gray-600 mb-8">
          La page que vous recherchez n'existe pas.
        </p>
        <Link
          href="/"
          className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
          data-testid="button-home"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}