import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertReservationSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { z } from "zod";

const reservationFormSchema = insertReservationSchema.extend({
  serviceDate: z.string().min(1, "La date est obligatoire"),
});

type ReservationFormData = z.infer<typeof reservationFormSchema>;

export default function Reservations() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      customerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
      customerEmail: user?.email || "",
      customerPhone: user?.phone || "",
      serviceType: "",
      vehicleInfo: "",
      specialInstructions: "",
      serviceDate: "",
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          serviceDate: new Date(data.serviceDate).toISOString(),
          userId: user?.id || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create reservation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Réservation créée",
        description: "Votre réservation a été enregistrée avec succès.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la réservation.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReservationFormData) => {
    createReservationMutation.mutate(data);
  };

  const { data: userReservations = [] } = useQuery({
    queryKey: ['/api/reservations'],
    enabled: isAuthenticated,
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmee: 'bg-green-100 text-green-800',
      en_cours: 'bg-blue-100 text-blue-800',
      terminee: 'bg-gray-100 text-gray-800',
      annulee: 'bg-red-100 text-red-800',
    };

    const labels = {
      confirmee: 'Confirmée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.confirmee}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

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
            Prendre rendez-vous
          </h2>
          <p className="text-lg text-gray-600">
            Réservez un créneau pour vos travaux de jantes
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle réservation</CardTitle>
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

                  {/* Service Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Détails du rendez-vous</h3>
                    
                    <FormField
                      control={form.control}
                      name="serviceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date souhaitée</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              min={getTomorrowDate() + "T09:00"}
                              max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + "T18:00"}
                              {...field} 
                              data-testid="input-service-date" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              <SelectItem value="diagnostic">Diagnostic/Évaluation</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Informations du véhicule</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: BMW X3 2019, jantes 19 pouces"
                              {...field} 
                              data-testid="input-vehicle-info" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions spéciales</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Problèmes spécifiques, souhaits particuliers, contraintes d'horaires..."
                              className="min-h-[100px]"
                              {...field}
                              data-testid="textarea-special-instructions"
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
                    disabled={createReservationMutation.isPending}
                    data-testid="button-submit-reservation"
                  >
                    {createReservationMutation.isPending ? (
                      "Réservation en cours..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Confirmer la réservation
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* My Reservations (if authenticated) */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle>Mes réservations</CardTitle>
              </CardHeader>
              <CardContent>
                {userReservations.length === 0 ? (
                  <p className="text-gray-600">Aucune réservation pour le moment.</p>
                ) : (
                  <div className="space-y-4">
                    {userReservations.map((reservation: any) => (
                      <div key={reservation.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{reservation.id}</h4>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(reservation.serviceDate).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(reservation.serviceDate).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Service:</span> {reservation.serviceType}
                        </p>
                        {reservation.vehicleInfo && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Véhicule:</span> {reservation.vehicleInfo}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Informations pratiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Horaires d'ouverture</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Lundi - Vendredi: 9h00 - 18h00</p>
                    <p>Samedi: 9h00 - 17h00</p>
                    <p>Dimanche: Fermé</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Délais d'intervention</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Diagnostic: 30 minutes</p>
                    <p>Réparation simple: 2-4 heures</p>
                    <p>Rénovation complète: 1-3 jours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}