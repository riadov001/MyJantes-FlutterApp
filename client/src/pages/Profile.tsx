import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Bell, 
  Save,
  History,
  Eye,
  EyeOff 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import type { z } from "zod";

// Schema for profile updates
const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

const consentUpdateSchema = z.object({
  emailConsent: z.boolean(),
  smsConsent: z.boolean(),
  dataProcessingConsent: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileUpdateSchema>;
type ConsentFormData = z.infer<typeof consentUpdateSchema>;

export default function Profile() {
  const { user, isAuthenticated, refresh } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("profile");
  const [showConsentDetails, setShowConsentDetails] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Connexion requise
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à votre profil.
          </p>
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="bg-red-600 hover:bg-red-700"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      postalCode: user?.postalCode || "",
    },
  });

  // Consent form
  const consentForm = useForm<ConsentFormData>({
    resolver: zodResolver(consentUpdateSchema),
    defaultValues: {
      emailConsent: user?.emailConsent || false,
      smsConsent: user?.smsConsent || false,
      dataProcessingConsent: user?.dataProcessingConsent || false,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées.",
      });
      refresh();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    },
  });

  // Update consent mutation
  const updateConsentMutation = useMutation({
    mutationFn: async (data: ConsentFormData) => {
      return apiRequest('/api/user/consent', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Préférences mises à jour",
        description: "Vos préférences de notification ont été sauvegardées.",
      });
      refresh();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les préférences.",
        variant: "destructive",
      });
    },
  });

  // Get consent history
  const { data: consentHistory = [] } = useQuery({
    queryKey: ['/api/user/consent-history'],
    enabled: selectedTab === "consent",
  });

  // Get user notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/user/notifications'],
    enabled: selectedTab === "notifications",
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onConsentSubmit = (data: ConsentFormData) => {
    updateConsentMutation.mutate(data);
  };

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Mon profil
          </h2>
          <p className="text-lg text-gray-600">
            Gérez vos informations personnelles et préférences
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="consent" data-testid="tab-consent">
              <Shield className="h-4 w-4 mr-2" />
              Consentements
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-2" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Email: </span>
                        <span className="text-sm font-medium">{user?.email}</span>
                        {user?.emailVerified && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Vérifié
                          </Badge>
                        )}
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              Téléphone
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="+33 6 XX XX XX XX"
                                data-testid="input-phone" 
                              />
                            </FormControl>
                            {user?.phoneVerified && (
                              <FormDescription className="text-green-600">
                                ✓ Numéro vérifié
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ville</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code postal</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-postal-code" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-red-600 hover:bg-red-700"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        "Sauvegarde..."
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consent Tab */}
          <TabsContent value="consent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des consentements RGPD</CardTitle>
                <p className="text-sm text-gray-600">
                  Gérez vos préférences de notification et l'utilisation de vos données personnelles.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...consentForm}>
                  <form onSubmit={consentForm.handleSubmit(onConsentSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={consentForm.control}
                        name="emailConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-email-consent"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Notifications par email
                              </FormLabel>
                              <FormDescription>
                                Recevoir des notifications par email concernant mes devis, factures et réservations.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={consentForm.control}
                        name="smsConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-sms-consent"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Notifications par SMS
                              </FormLabel>
                              <FormDescription>
                                Recevoir des notifications par SMS pour les rappels de rendez-vous et informations urgentes.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={consentForm.control}
                        name="dataProcessingConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-data-consent"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Traitement des données à des fins d'amélioration
                              </FormLabel>
                              <FormDescription>
                                Utiliser mes données de manière anonymisée pour améliorer nos services.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-blue-900">
                          Informations sur vos données
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConsentDetails(!showConsentDetails)}
                          data-testid="button-toggle-consent-details"
                        >
                          {showConsentDetails ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {showConsentDetails && (
                        <div className="mt-3 text-sm text-blue-800">
                          <p className="mb-2">Vos données sont utilisées pour :</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Traiter vos demandes de devis et réservations</li>
                            <li>Vous envoyer des notifications (avec votre consentement)</li>
                            <li>Gérer votre compte client</li>
                            <li>Améliorer nos services (données anonymisées)</li>
                          </ul>
                          <p className="mt-2 text-xs">
                            Conformément au RGPD, vous pouvez modifier ces consentements à tout moment.
                          </p>
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="bg-red-600 hover:bg-red-700"
                      disabled={updateConsentMutation.isPending}
                      data-testid="button-save-consent"
                    >
                      {updateConsentMutation.isPending ? (
                        "Sauvegarde..."
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder les préférences
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Aucune notification pour le moment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification: any) => (
                      <div key={notification.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            {notification.subject || 'Notification'}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={notification.type === 'email' ? 'default' : 'secondary'}>
                              {notification.type === 'email' ? 'Email' : 'SMS'}
                            </Badge>
                            <Badge variant={notification.status === 'sent' ? 'default' : 'destructive'}>
                              {notification.status === 'sent' ? 'Envoyé' : 'Échec'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des consentements</CardTitle>
              </CardHeader>
              <CardContent>
                {consentHistory.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Aucun historique de consentement.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {consentHistory.map((log: any) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            Consentement {log.consentType}
                          </h4>
                          <Badge variant={log.granted ? 'default' : 'secondary'}>
                            {log.granted ? 'Accordé' : 'Retiré'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(log.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}