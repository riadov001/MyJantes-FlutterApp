import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import {
  insertDevisSchema,
  insertFactureSchema,
  insertReservationSchema,
  insertUserSchema,
  insertNotificationSchema,
  insertConsentLogSchema,
  updateDevisSchema,
  updateFactureSchema,
  updateReservationSchema,
  updateUserSchema,
} from "@shared/schema";
import { notificationService } from "./notificationService";

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

  // ========== USER MANAGEMENT ROUTES (Admin) ==========
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Search users (admin only)
  app.get("/api/admin/users/search", isAdmin, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      const results = await storage.searchUsers(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Get specific user (admin only)
  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user (admin only)
  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.params.id, validatedData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ========== NOTIFICATION ROUTES (Admin) ==========
  
  // Send notification to user (admin only)
  app.post("/api/admin/notifications", isAdmin, async (req, res) => {
    try {
      const { userId, type, message, subject } = req.body;
      
      if (!userId || !type || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let success = false;
      if (type === 'email') {
        const user = await storage.getUser(userId);
        if (user && user.email && user.emailConsent) {
          success = await notificationService.sendEmail(user.email, subject || 'Notification', message);
        }
      } else if (type === 'sms') {
        const user = await storage.getUser(userId);
        if (user && user.phone && user.smsConsent) {
          success = await notificationService.sendSMS(user.phone, message);
        }
      }

      // Log the notification
      await storage.createNotification({
        userId,
        type,
        subject: type === 'email' ? subject : undefined,
        message,
        status: success ? 'sent' : 'failed',
        sentAt: success ? new Date() : undefined,
      });

      res.json({ success, message: success ? 'Notification sent' : 'Failed to send notification' });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Get all notifications (admin only)
  app.get("/api/admin/notifications", isAdmin, async (req, res) => {
    try {
      const allNotifications = await storage.getAllNotifications();
      res.json(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get user notifications (admin only)
  app.get("/api/admin/notifications/:userId", isAdmin, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.params.userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ message: "Failed to fetch user notifications" });
    }
  });

  // ========== CONSENT MANAGEMENT ROUTES ==========
  
  // Update user consent
  app.put("/api/user/consent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emailConsent, smsConsent, dataProcessingConsent } = req.body;
      
      const updates: any = {};
      if (typeof emailConsent === 'boolean') updates.emailConsent = emailConsent;
      if (typeof smsConsent === 'boolean') updates.smsConsent = smsConsent;
      if (typeof dataProcessingConsent === 'boolean') updates.dataProcessingConsent = dataProcessingConsent;

      const updatedUser = await storage.updateUser(userId, updates);

      // Log consent changes
      for (const [consentType, granted] of Object.entries(updates)) {
        await storage.createConsentLog({
          userId,
          consentType: consentType.replace('Consent', ''),
          granted: granted as boolean,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating consent:", error);
      res.status(500).json({ message: "Failed to update consent" });
    }
  });

  // Get user consent history
  app.get("/api/user/consent-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consentHistory = await storage.getConsentLogsByUser(userId);
      res.json(consentHistory);
    } catch (error) {
      console.error("Error fetching consent history:", error);
      res.status(500).json({ message: "Failed to fetch consent history" });
    }
  });

  // ========== STATS ROUTES (Admin) ==========
  
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const [allDevis, allFactures, allReservations, allUsers] = await Promise.all([
        storage.getAllDevis(),
        storage.getAllFactures(),
        storage.getAllReservations(),
        storage.getAllUsers()
      ]);
      
      const stats = {
        users: {
          total: allUsers.length,
          emailConsent: allUsers.filter(u => u.emailConsent).length,
          smsConsent: allUsers.filter(u => u.smsConsent).length,
          emailVerified: allUsers.filter(u => u.emailVerified).length,
          phoneVerified: allUsers.filter(u => u.phoneVerified).length,
        },
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

  // ========== QUOTE GENERATION ROUTES ==========
  
  // Generate quote for devis (admin only)
  app.post("/api/admin/devis/:id/quote", isAdmin, async (req, res) => {
    try {
      const { estimatedPrice, description, validUntil } = req.body;
      const devis = await storage.getDevis(req.params.id);
      
      if (!devis) {
        return res.status(404).json({ message: "Devis not found" });
      }

      // Update devis with quote information
      const updatedDevis = await storage.updateDevis(req.params.id, {
        estimatedPrice,
        description: description || devis.description,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        status: 'accepte',
      });

      res.json({ 
        message: "Quote generated successfully", 
        devis: updatedDevis 
      });
    } catch (error) {
      console.error("Error generating quote:", error);
      res.status(500).json({ message: "Failed to generate quote" });
    }
  });

  // Get quote PDF for devis
  app.get("/api/devis/:id/quote", async (req, res) => {
    try {
      const devis = await storage.getDevis(req.params.id);
      
      if (!devis) {
        return res.status(404).json({ message: "Devis not found" });
      }

      if (devis.status !== 'accepte' || !devis.estimatedPrice) {
        return res.status(400).json({ message: "Quote not available for this devis" });
      }

      // Generate HTML quote
      const quoteHtml = generateQuoteHTML(devis);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(quoteHtml);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Utility functions
function generateQuoteNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`.toUpperCase();
}

function generateQuoteHTML(devis: any): string {
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const validDate = devis.validUntil ? new Date(devis.validUntil).toLocaleDateString('fr-FR') : 
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Devis MY JANTES #${devis.id.slice(-8)}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f9f9f9;
        }
        .header {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        .quote-container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .quote-header {
          background: #f8f9fa;
          padding: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .quote-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #dc2626;
          margin-bottom: 10px;
        }
        .quote-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 15px;
        }
        .date-item {
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .date-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .date-value {
          font-weight: 600;
          color: #111827;
        }
        .content {
          padding: 30px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h3 {
          color: #dc2626;
          border-bottom: 2px solid #fecaca;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .detail-item {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #dc2626;
        }
        .detail-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .detail-value {
          font-weight: 600;
          color: #111827;
          text-transform: capitalize;
        }
        .description {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin: 15px 0;
        }
        .price-section {
          background: linear-gradient(135deg, #059669, #047857);
          color: white;
          padding: 25px;
          border-radius: 10px;
          text-align: center;
          margin: 20px 0;
        }
        .price-label {
          font-size: 1.125rem;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        .price-value {
          font-size: 3rem;
          font-weight: bold;
          margin: 0;
        }
        .footer {
          background: #374151;
          color: white;
          padding: 25px;
          text-align: center;
          margin-top: 30px;
        }
        .footer h4 {
          margin: 0 0 15px 0;
          color: #dc2626;
        }
        .contact-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .print-btn:hover {
          background: #b91c1c;
        }
        @media print {
          body { background: white; padding: 0; }
          .print-btn { display: none; }
          .quote-container { box-shadow: none; }
        }
        @media (max-width: 768px) {
          .detail-grid { grid-template-columns: 1fr; }
          .quote-dates { grid-template-columns: 1fr; }
          .contact-info { grid-template-columns: 1fr; }
          .print-btn { position: static; margin-bottom: 20px; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">📄 Imprimer</button>
      
      <div class="header">
        <h1>MY JANTES</h1>
        <p>Spécialiste de la rénovation de jantes aluminium - Liévin</p>
      </div>

      <div class="quote-container">
        <div class="quote-header">
          <div class="quote-number">Devis N° ${devis.id.slice(-8).toUpperCase()}</div>
          <div class="quote-dates">
            <div class="date-item">
              <div class="date-label">Date d'émission</div>
              <div class="date-value">${currentDate}</div>
            </div>
            <div class="date-item">
              <div class="date-label">Valide jusqu'au</div>
              <div class="date-value">${validDate}</div>
            </div>
          </div>
        </div>

        <div class="content">
          <div class="section">
            <h3>👤 Informations client</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Nom</div>
                <div class="detail-value">${devis.customerName || 'Non spécifié'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${devis.customerEmail || 'Non spécifié'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Téléphone</div>
                <div class="detail-value">${devis.customerPhone || 'Non spécifié'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date de demande</div>
                <div class="detail-value">${new Date(devis.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>🚗 Détails du véhicule</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Type de véhicule</div>
                <div class="detail-value">${devis.vehicleType}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Taille des jantes</div>
                <div class="detail-value">${devis.rimSize}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Nombre de jantes</div>
                <div class="detail-value">${devis.rimQuantity} jante(s)</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Type de service</div>
                <div class="detail-value">${devis.serviceType}</div>
              </div>
            </div>
          </div>

          ${devis.description ? `
          <div class="section">
            <h3>📝 Description</h3>
            <div class="description">
              ${devis.description}
            </div>
          </div>
          ` : ''}

          <div class="price-section">
            <div class="price-label">Prix total TTC</div>
            <div class="price-value">${devis.estimatedPrice}€</div>
          </div>

          <div class="section">
            <h3>ℹ️ Conditions</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>Devis valable ${Math.ceil((new Date(validDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours</li>
              <li>Prix TTC, main d'œuvre et matériaux inclus</li>
              <li>Garantie qualité sur tous nos travaux</li>
              <li>Paiement à la livraison des jantes rénovées</li>
              <li>Délai de réalisation: 3 à 5 jours ouvrés</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer">
        <h4>MY JANTES - Contactez-nous</h4>
        <div class="contact-info">
          <div>
            <strong>📞 Téléphone</strong><br>
            03 21 44 XX XX
          </div>
          <div>
            <strong>📧 Email</strong><br>
            contact@myjantes.fr
          </div>
          <div>
            <strong>📍 Adresse</strong><br>
            Liévin, Pas-de-Calais
          </div>
        </div>
        <p style="margin-top: 20px; opacity: 0.8; font-size: 0.875rem;">
          MY JANTES - SIRET: XXX XXX XXX XXXXX - Spécialiste depuis plus de 10 ans
        </p>
      </div>

      <script>
        // Auto-print option (commented out for user choice)
        // window.onload = function() { window.print(); }
        
        // Add keyboard shortcut for printing
        document.addEventListener('keydown', function(e) {
          if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            window.print();
          }
        });
      </script>
    </body>
    </html>
  `;
}