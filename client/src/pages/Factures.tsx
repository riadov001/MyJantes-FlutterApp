import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, FileText, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Factures() {
  const { user, isAuthenticated } = useAuth();

  const { data: factures = [], isLoading } = useQuery({
    queryKey: ['/api/factures'],
    enabled: isAuthenticated,
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      brouillon: 'bg-gray-100 text-gray-800',
      envoyee: 'bg-blue-100 text-blue-800',
      payee: 'bg-green-100 text-green-800',
      annulee: 'bg-red-100 text-red-800',
    };

    const labels = {
      brouillon: 'Brouillon',
      envoyee: 'Envoyée',
      payee: 'Payée',
      annulee: 'Annulée',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.brouillon}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Connexion requise
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour voir vos factures.
          </p>
          <a
            href="/api/login"
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-red-600 mr-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </Link>
            <h1 className="text-2xl font-bold text-red-600">MY JANTES</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Mes factures
          </h2>
          <p className="text-lg text-gray-600">
            Consultez et téléchargez vos factures
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : factures.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune facture
              </h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas encore de factures.
              </p>
              <Link href="/devis">
                <Button className="bg-red-600 hover:bg-red-700">
                  Demander un devis
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {factures.map((facture: any) => (
              <Card key={facture.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg" data-testid={`facture-title-${facture.id}`}>
                        Facture {facture.id}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Client: {facture.customerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Email: {facture.customerEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(facture.status)}
                      <p className="text-lg font-semibold text-gray-900 mt-2">
                        {facture.total}€
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Sous-total:</span> {facture.subtotal}€
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">TVA ({facture.taxRate}%):</span> {facture.taxAmount}€
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-medium">Total:</span> {facture.total}€
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Créé le:</span>{' '}
                        {new Date(facture.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {facture.dueDate && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Échéance:</span>{' '}
                          {new Date(facture.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {facture.paidAt && (
                        <p className="text-sm text-green-600">
                          <span className="font-medium">Payée le:</span>{' '}
                          {new Date(facture.paidAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  {facture.items && Array.isArray(facture.items) && facture.items.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Détails:</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        {facture.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.description}</span>
                            <span>{item.total}€</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm" data-testid={`button-view-${facture.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-download-${facture.id}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}