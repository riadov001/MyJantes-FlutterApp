import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertDevisSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, Upload, Send, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { z } from "zod";

const devisFormSchema = insertDevisSchema.extend({
  photos: z.array(z.string()).optional(),
});

type DevisFormData = z.infer<typeof devisFormSchema>;

export default function Devis() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const form = useForm<DevisFormData>({
    resolver: zodResolver(devisFormSchema),
    defaultValues: {
      vehicleType: "",
      rimSize: "",
      rimQuantity: 1,
      serviceType: "",
      description: "",
      customerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
      customerEmail: user?.email || "",
      customerPhone: user?.phone || "",
      photos: [],
    },
  });

  const createDevisMutation = useMutation({
    mutationFn: async (data: DevisFormData) => {
      const response = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          photos: uploadedPhotos,
          userId: user?.id || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create devis');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Devis créé",
        description: "Votre demande de devis a été envoyée avec succès.",
      });
      form.reset();
      setUploadedPhotos([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le devis.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DevisFormData) => {
    createDevisMutation.mutate(data);
  };

  const { data: userDevis = [] } = useQuery({
    queryKey: ['/api/devis'],
    enabled: isAuthenticated,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href={isAuthenticated ? "/" : "/"} className="flex items-center text-gray-600 hover:text-red-600 mr-4">
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
            Demande de devis
          </h2>
          <p className="text-lg text-gray-600">
            Décrivez vos besoins pour recevoir un devis personnalisé
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du devis</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vos informations</h3>
                    
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-customer-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-customer-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-customer-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Vehicle Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations du véhicule</h3>
                    
                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de véhicule</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: BMW Série 3, Audi A4..." {...field} data-testid="input-vehicle-type" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="rimSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taille des jantes</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-rim-size">
                                  <SelectValue placeholder="Taille" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="15">15 pouces</SelectItem>
                                <SelectItem value="16">16 pouces</SelectItem>
                                <SelectItem value="17">17 pouces</SelectItem>
                                <SelectItem value="18">18 pouces</SelectItem>
                                <SelectItem value="19">19 pouces</SelectItem>
                                <SelectItem value="20">20 pouces</SelectItem>
                                <SelectItem value="21">21 pouces</SelectItem>
                                <SelectItem value="22">22 pouces</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rimQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de jantes</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger data-testid="select-rim-quantity">
                                  <SelectValue placeholder="Nombre" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 jante</SelectItem>
                                <SelectItem value="2">2 jantes</SelectItem>
                                <SelectItem value="3">3 jantes</SelectItem>
                                <SelectItem value="4">4 jantes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Service demandé</h3>
                    
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de service</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-service-type">
                                <SelectValue placeholder="Choisir un service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="renovation">Rénovation complète</SelectItem>
                              <SelectItem value="reparation">Réparation (rayures, impacts)</SelectItem>
                              <SelectItem value="personnalisation">Personnalisation (couleur, finition)</SelectItem>
                              <SelectItem value="polissage">Polissage</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description détaillée</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez l'état actuel de vos jantes, les problèmes à traiter, vos souhaits..."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={createDevisMutation.isPending}
                    data-testid="button-submit-devis"
                  >
                    {createDevisMutation.isPending ? (
                      "Envoi en cours..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Demander le devis
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* My Devis (if authenticated) */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle>Mes devis</CardTitle>
              </CardHeader>
              <CardContent>
                {userDevis.length === 0 ? (
                  <p className="text-gray-600">Aucun devis pour le moment.</p>
                ) : (
                  <div className="space-y-4">
                    {userDevis.map((devis: any) => (
                      <div key={devis.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">Devis #{devis.id.slice(-8)}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            devis.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                            devis.status === 'accepte' ? 'bg-green-100 text-green-800' :
                            devis.status === 'refuse' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {devis.status === 'en_attente' ? 'En attente' :
                             devis.status === 'accepte' ? 'Accepté' :
                             devis.status === 'refuse' ? 'Refusé' :
                             'Expiré'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 capitalize">{devis.serviceType}</p>
                        <p className="text-sm text-gray-600">{devis.vehicleType} - {devis.rimQuantity} jante(s)</p>
                        {devis.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{devis.description}</p>
                        )}
                        {devis.estimatedPrice && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-green-600">
                              Prix estimé: {devis.estimatedPrice}€
                            </p>
                            {devis.status === 'accepte' && (
                              <div className="mt-2 space-y-2">
                                <Button 
                                  size="sm" 
                                  className="w-full bg-red-600 hover:bg-red-700"
                                  onClick={() => window.open(`/api/devis/${devis.id}/quote`, '_blank')}
                                  data-testid={`button-view-quote-${devis.id}`}
                                >
                                  Voir le devis détaillé
                                </Button>
                                <Link href={`/reservations?devisId=${devis.id}`}>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="w-full border-red-600 text-red-600 hover:bg-red-50"
                                    data-testid={`button-book-appointment-${devis.id}`}
                                  >
                                    Prendre rendez-vous
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Créé le {new Date(devis.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}