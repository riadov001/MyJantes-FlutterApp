import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp,
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  BarChart3,
  PieChart,
  Settings,
  Bell,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface AdminStats {
  devis: {
    total: number;
    en_attente: number;
    accepte: number;
    refuse: number;
  };
  factures: {
    total: number;
    brouillon: number;
    envoyee: number;
    payee: number;
  };
  reservations: {
    total: number;
    confirmee: number;
    en_cours: number;
    terminee: number;
  };
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Accès refusé
          </h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions pour accéder à cette page.
          </p>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch all users (admin endpoint to be implemented)
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch all devis
  const { data: allDevis = [] } = useQuery({
    queryKey: ['/api/admin/devis'],
  });

  // Fetch all factures
  const { data: allFactures = [] } = useQuery({
    queryKey: ['/api/admin/factures'],
  });

  // Fetch all reservations
  const { data: allReservations = [] } = useQuery({
    queryKey: ['/api/admin/reservations'],
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations ont été sauvegardées.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async ({ userId, type, message }: { userId: string; type: string; message: string }) => {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, type, message }),
      });
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification envoyée",
        description: "La notification a été envoyée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = allUsers.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      accepte: 'bg-green-100 text-green-800',
      refuse: 'bg-red-100 text-red-800',
      expire: 'bg-gray-100 text-gray-800',
      brouillon: 'bg-gray-100 text-gray-800',
      envoyee: 'bg-blue-100 text-blue-800',
      payee: 'bg-green-100 text-green-800',
      annulee: 'bg-red-100 text-red-800',
      confirmee: 'bg-green-100 text-green-800',
      en_cours: 'bg-blue-100 text-blue-800',
      terminee: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(amount));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-red-600 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Link>
              <h1 className="text-2xl font-bold text-red-600">MY JANTES - Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Administrateur: {user?.firstName || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tableau de bord administrateur
          </h2>
          <p className="text-lg text-gray-600">
            Gérez les utilisateurs, suivez les statistiques et administrez le système
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="devis" data-testid="tab-devis">Devis</TabsTrigger>
            <TabsTrigger value="factures" data-testid="tab-factures">Factures</TabsTrigger>
            <TabsTrigger value="reservations" data-testid="tab-reservations">Réservations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-users">{allUsers.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Utilisateurs enregistrés
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Devis en Attente</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600" data-testid="stat-devis-pending">
                        {stats?.devis.en_attente || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sur {stats?.devis.total || 0} devis total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Factures Payées</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600" data-testid="stat-factures-paid">
                        {stats?.factures.payee || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sur {stats?.factures.total || 0} factures total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Réservations Actives</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600" data-testid="stat-reservations-active">
                        {(stats?.reservations.confirmee || 0) + (stats?.reservations.en_cours || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Confirmées + En cours
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Statut des Devis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">En attente</span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {stats?.devis.en_attente || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Acceptés</span>
                          <Badge className="bg-green-100 text-green-800">
                            {stats?.devis.accepte || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Refusés</span>
                          <Badge className="bg-red-100 text-red-800">
                            {stats?.devis.refuse || 0}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PieChart className="h-5 w-5 mr-2" />
                        Statut des Factures
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Brouillons</span>
                          <Badge className="bg-gray-100 text-gray-800">
                            {stats?.factures.brouillon || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Envoyées</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {stats?.factures.envoyee || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Payées</span>
                          <Badge className="bg-green-100 text-green-800">
                            {stats?.factures.payee || 0}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-users"
                  />
                </div>
                <Button variant="outline" data-testid="button-export-users">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilisateur
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Consentements
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dernière connexion
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Nom non renseigné'}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-xs text-gray-400">ID: {user.id}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.phone || 'Non renseigné'}
                              </div>
                              <div className="flex space-x-2 mt-1">
                                {user.emailVerified && (
                                  <Badge variant="outline" className="text-xs">Email vérifié</Badge>
                                )}
                                {user.phoneVerified && (
                                  <Badge variant="outline" className="text-xs">Tél. vérifié</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role === 'admin' ? 'Administrateur' : 'Client'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col space-y-1">
                                {user.emailConsent && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    Email autorisé
                                  </Badge>
                                )}
                                {user.smsConsent && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    SMS autorisé
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.lastLoginAt 
                                ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR')
                                : 'Jamais connecté'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-view-user-${user.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-edit-user-${user.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {user.emailConsent && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => sendNotificationMutation.mutate({
                                      userId: user.id,
                                      type: 'email',
                                      message: 'Message test depuis l\'administration'
                                    })}
                                    data-testid={`button-email-user-${user.id}`}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                )}
                                {user.smsConsent && user.phoneVerified && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => sendNotificationMutation.mutate({
                                      userId: user.id,
                                      type: 'sms',
                                      message: 'Message test depuis l\'administration'
                                    })}
                                    data-testid={`button-sms-user-${user.id}`}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Devis Tab */}
          <TabsContent value="devis" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Gestion des devis</h3>
              <Button variant="outline" data-testid="button-export-devis">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Devis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix estimé
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allDevis.map((devis: any) => (
                        <tr key={devis.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{devis.id}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(devis.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{devis.customerName}</div>
                            <div className="text-sm text-gray-500">{devis.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{devis.serviceType}</div>
                            <div className="text-sm text-gray-500">
                              {devis.vehicleType} - {devis.rimQuantity} jante(s)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadge(devis.status)}>
                              {devis.status === 'en_attente' ? 'En attente' :
                               devis.status === 'accepte' ? 'Accepté' :
                               devis.status === 'refuse' ? 'Refusé' : 'Expiré'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {devis.estimatedPrice ? formatCurrency(devis.estimatedPrice) : 'Non défini'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-view-devis-${devis.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-edit-devis-${devis.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Factures Tab */}
          <TabsContent value="factures" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Gestion des factures</h3>
              <div className="flex space-x-2">
                <Button variant="outline" data-testid="button-create-facture">
                  Créer une facture
                </Button>
                <Button variant="outline" data-testid="button-export-factures">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Échéance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allFactures.map((facture: any) => (
                        <tr key={facture.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{facture.id}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(facture.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{facture.customerName}</div>
                            <div className="text-sm text-gray-500">{facture.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(facture.total)}
                            </div>
                            <div className="text-sm text-gray-500">
                              HT: {formatCurrency(facture.subtotal)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadge(facture.status)}>
                              {facture.status === 'brouillon' ? 'Brouillon' :
                               facture.status === 'envoyee' ? 'Envoyée' :
                               facture.status === 'payee' ? 'Payée' : 'Annulée'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {facture.dueDate 
                              ? new Date(facture.dueDate).toLocaleDateString('fr-FR')
                              : 'Non définie'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-view-facture-${facture.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-edit-facture-${facture.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Gestion des réservations</h3>
              <Button variant="outline" data-testid="button-export-reservations">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Réservation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date de service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allReservations.map((reservation: any) => (
                        <tr key={reservation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{reservation.id}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{reservation.customerName}</div>
                            <div className="text-sm text-gray-500">{reservation.customerEmail}</div>
                            <div className="text-sm text-gray-500">{reservation.customerPhone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(reservation.serviceDate).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(reservation.serviceDate).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{reservation.serviceType}</div>
                            {reservation.vehicleInfo && (
                              <div className="text-sm text-gray-500">{reservation.vehicleInfo}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadge(reservation.status)}>
                              {reservation.status === 'confirmee' ? 'Confirmée' :
                               reservation.status === 'en_cours' ? 'En cours' :
                               reservation.status === 'terminee' ? 'Terminée' : 'Annulée'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-view-reservation-${reservation.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-edit-reservation-${reservation.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}