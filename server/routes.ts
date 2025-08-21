import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import {
  insertDevisSchema,
  insertFactureSchema,
  insertReservationSchema,
  updateDevisSchema,
  updateFactureSchema,
  updateReservationSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // JSON middleware
  app.use('/api', express.json());

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ========== DEVIS ROUTES ==========
  
  // Get all devis (admin only)
  app.get("/api/admin/devis", isAdmin, async (req, res) => {
    try {
      const allDevis = await storage.getAllDevis();
      res.json(allDevis);
    } catch (error) {
      console.error("Error fetching all devis:", error);
      res.status(500).json({ message: "Failed to fetch devis" });
    }
  });

  // Search devis (admin only)
  app.get("/api/admin/devis/search", isAdmin, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      const results = await storage.searchDevis(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching devis:", error);
      res.status(500).json({ message: "Failed to search devis" });
    }
  });

  // Get user's devis
  app.get("/api/devis", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userDevis = await storage.getDevisByUser(userId);
      res.json(userDevis);
    } catch (error) {
      console.error("Error fetching user devis:", error);
      res.status(500).json({ message: "Failed to fetch devis" });
    }
  });

  // Get specific devis
  app.get("/api/devis/:id", isAuthenticated, async (req: any, res) => {
    try {
      const devis = await storage.getDevis(req.params.id);
      if (!devis) {
        return res.status(404).json({ message: "Devis not found" });
      }
      
      // Check if user owns this devis or is admin
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (devis.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(devis);
    } catch (error) {
      console.error("Error fetching devis:", error);
      res.status(500).json({ message: "Failed to fetch devis" });
    }
  });

  // Create new devis (public endpoint)
  app.post("/api/devis", async (req, res) => {
    try {
      const validatedData = insertDevisSchema.parse(req.body);
      const newDevis = await storage.createDevis(validatedData);
      res.status(201).json(newDevis);
    } catch (error) {
      console.error("Error creating devis:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create devis" });
    }
  });

  // Update devis (admin only)
  app.put("/api/admin/devis/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = updateDevisSchema.parse(req.body);
      const updatedDevis = await storage.updateDevis(req.params.id, validatedData);
      res.json(updatedDevis);
    } catch (error) {
      console.error("Error updating devis:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update devis" });
    }
  });

  // Delete devis (admin only)
  app.delete("/api/admin/devis/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteDevis(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting devis:", error);
      res.status(500).json({ message: "Failed to delete devis" });
    }
  });

  // ========== FACTURES ROUTES ==========
  
  // Get all factures (admin only)
  app.get("/api/admin/factures", isAdmin, async (req, res) => {
    try {
      const allFactures = await storage.getAllFactures();
      res.json(allFactures);
    } catch (error) {
      console.error("Error fetching all factures:", error);
      res.status(500).json({ message: "Failed to fetch factures" });
    }
  });

  // Search factures (admin only)
  app.get("/api/admin/factures/search", isAdmin, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      const results = await storage.searchFactures(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching factures:", error);
      res.status(500).json({ message: "Failed to search factures" });
    }
  });

  // Get user's factures
  app.get("/api/factures", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userFactures = await storage.getFacturesByUser(userId);
      res.json(userFactures);
    } catch (error) {
      console.error("Error fetching user factures:", error);
      res.status(500).json({ message: "Failed to fetch factures" });
    }
  });

  // Get specific facture
  app.get("/api/factures/:id", isAuthenticated, async (req: any, res) => {
    try {
      const facture = await storage.getFacture(req.params.id);
      if (!facture) {
        return res.status(404).json({ message: "Facture not found" });
      }
      
      // Check if user owns this facture or is admin
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (facture.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(facture);
    } catch (error) {
      console.error("Error fetching facture:", error);
      res.status(500).json({ message: "Failed to fetch facture" });
    }
  });

  // Create new facture (admin only)
  app.post("/api/admin/factures", isAdmin, async (req, res) => {
    try {
      const validatedData = insertFactureSchema.parse(req.body);
      const newFacture = await storage.createFacture(validatedData);
      res.status(201).json(newFacture);
    } catch (error) {
      console.error("Error creating facture:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create facture" });
    }
  });

  // Update facture (admin only)
  app.put("/api/admin/factures/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = updateFactureSchema.parse(req.body);
      const updatedFacture = await storage.updateFacture(req.params.id, validatedData);
      res.json(updatedFacture);
    } catch (error) {
      console.error("Error updating facture:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update facture" });
    }
  });

  // Delete facture (admin only)
  app.delete("/api/admin/factures/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteFacture(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting facture:", error);
      res.status(500).json({ message: "Failed to delete facture" });
    }
  });

  // ========== RESERVATIONS ROUTES ==========
  
  // Get all reservations (admin only)
  app.get("/api/admin/reservations", isAdmin, async (req, res) => {
    try {
      const allReservations = await storage.getAllReservations();
      res.json(allReservations);
    } catch (error) {
      console.error("Error fetching all reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Search reservations (admin only)
  app.get("/api/admin/reservations/search", isAdmin, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      const results = await storage.searchReservations(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching reservations:", error);
      res.status(500).json({ message: "Failed to search reservations" });
    }
  });

  // Get user's reservations
  app.get("/api/reservations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userReservations = await storage.getReservationsByUser(userId);
      res.json(userReservations);
    } catch (error) {
      console.error("Error fetching user reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Get specific reservation
  app.get("/api/reservations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      // Check if user owns this reservation or is admin
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (reservation.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(reservation);
    } catch (error) {
      console.error("Error fetching reservation:", error);
      res.status(500).json({ message: "Failed to fetch reservation" });
    }
  });

  // Create new reservation (public endpoint)
  app.post("/api/reservations", async (req, res) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      const newReservation = await storage.createReservation(validatedData);
      res.status(201).json(newReservation);
    } catch (error) {
      console.error("Error creating reservation:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reservation" });
    }
  });

  // Update reservation (admin only)
  app.put("/api/admin/reservations/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = updateReservationSchema.parse(req.body);
      const updatedReservation = await storage.updateReservation(req.params.id, validatedData);
      res.json(updatedReservation);
    } catch (error) {
      console.error("Error updating reservation:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update reservation" });
    }
  });

  // Delete reservation (admin only)
  app.delete("/api/admin/reservations/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteReservation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      res.status(500).json({ message: "Failed to delete reservation" });
    }
  });

  // ========== STATS ROUTES (Admin) ==========
  
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const [allDevis, allFactures, allReservations] = await Promise.all([
        storage.getAllDevis(),
        storage.getAllFactures(),
        storage.getAllReservations()
      ]);
      
      const stats = {
        devis: {
          total: allDevis.length,
          en_attente: allDevis.filter(d => d.status === 'en_attente').length,
          accepte: allDevis.filter(d => d.status === 'accepte').length,
          refuse: allDevis.filter(d => d.status === 'refuse').length,
        },
        factures: {
          total: allFactures.length,
          brouillon: allFactures.filter(f => f.status === 'brouillon').length,
          envoyee: allFactures.filter(f => f.status === 'envoyee').length,
          payee: allFactures.filter(f => f.status === 'payee').length,
        },
        reservations: {
          total: allReservations.length,
          confirmee: allReservations.filter(r => r.status === 'confirmee').length,
          en_cours: allReservations.filter(r => r.status === 'en_cours').length,
          terminee: allReservations.filter(r => r.status === 'terminee').length,
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}