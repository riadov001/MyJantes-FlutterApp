import {
  users,
  devis,
  factures,
  reservations,
  type User,
  type UpsertUser,
  type InsertUser,
  type Devis,
  type InsertDevis,
  type UpdateDevis,
  type Facture,
  type InsertFacture,
  type UpdateFacture,
  type Reservation,
  type InsertReservation,
  type UpdateReservation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  
  // Devis operations
  getDevis(id: string): Promise<Devis | undefined>;
  getDevisByUser(userId: string): Promise<Devis[]>;
  getAllDevis(): Promise<Devis[]>;
  createDevis(devis: InsertDevis): Promise<Devis>;
  updateDevis(id: string, devis: UpdateDevis): Promise<Devis>;
  deleteDevis(id: string): Promise<void>;
  searchDevis(query: string): Promise<Devis[]>;
  
  // Factures operations
  getFacture(id: string): Promise<Facture | undefined>;
  getFacturesByUser(userId: string): Promise<Facture[]>;
  getAllFactures(): Promise<Facture[]>;
  createFacture(facture: InsertFacture): Promise<Facture>;
  updateFacture(id: string, facture: UpdateFacture): Promise<Facture>;
  deleteFacture(id: string): Promise<void>;
  searchFactures(query: string): Promise<Facture[]>;
  
  // Reservations operations
  getReservation(id: string): Promise<Reservation | undefined>;
  getReservationsByUser(userId: string): Promise<Reservation[]>;
  getAllReservations(): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: string, reservation: UpdateReservation): Promise<Reservation>;
  deleteReservation(id: string): Promise<void>;
  searchReservations(query: string): Promise<Reservation[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Devis operations
  async getDevis(id: string): Promise<Devis | undefined> {
    const [devisItem] = await db.select().from(devis).where(eq(devis.id, id));
    return devisItem;
  }

  async getDevisByUser(userId: string): Promise<Devis[]> {
    return await db
      .select()
      .from(devis)
      .where(eq(devis.userId, userId))
      .orderBy(desc(devis.createdAt));
  }

  async getAllDevis(): Promise<Devis[]> {
    return await db
      .select()
      .from(devis)
      .orderBy(desc(devis.createdAt));
  }

  async createDevis(devisData: InsertDevis): Promise<Devis> {
    const [newDevis] = await db
      .insert(devis)
      .values(devisData)
      .returning();
    return newDevis;
  }

  async updateDevis(id: string, devisData: UpdateDevis): Promise<Devis> {
    const [updatedDevis] = await db
      .update(devis)
      .set({ ...devisData, updatedAt: new Date() })
      .where(eq(devis.id, id))
      .returning();
    return updatedDevis;
  }

  async deleteDevis(id: string): Promise<void> {
    await db.delete(devis).where(eq(devis.id, id));
  }

  async searchDevis(query: string): Promise<Devis[]> {
    return await db
      .select()
      .from(devis)
      .where(
        or(
          ilike(devis.customerName, `%${query}%`),
          ilike(devis.customerEmail, `%${query}%`),
          ilike(devis.id, `%${query}%`),
          ilike(devis.serviceType, `%${query}%`)
        )
      )
      .orderBy(desc(devis.createdAt));
  }

  // Factures operations
  async getFacture(id: string): Promise<Facture | undefined> {
    const [factureItem] = await db.select().from(factures).where(eq(factures.id, id));
    return factureItem;
  }

  async getFacturesByUser(userId: string): Promise<Facture[]> {
    return await db
      .select()
      .from(factures)
      .where(eq(factures.userId, userId))
      .orderBy(desc(factures.createdAt));
  }

  async getAllFactures(): Promise<Facture[]> {
    return await db
      .select()
      .from(factures)
      .orderBy(desc(factures.createdAt));
  }

  async createFacture(factureData: InsertFacture): Promise<Facture> {
    const [newFacture] = await db
      .insert(factures)
      .values(factureData)
      .returning();
    return newFacture;
  }

  async updateFacture(id: string, factureData: UpdateFacture): Promise<Facture> {
    const [updatedFacture] = await db
      .update(factures)
      .set({ ...factureData, updatedAt: new Date() })
      .where(eq(factures.id, id))
      .returning();
    return updatedFacture;
  }

  async deleteFacture(id: string): Promise<void> {
    await db.delete(factures).where(eq(factures.id, id));
  }

  async searchFactures(query: string): Promise<Facture[]> {
    return await db
      .select()
      .from(factures)
      .where(
        or(
          ilike(factures.customerName, `%${query}%`),
          ilike(factures.customerEmail, `%${query}%`),
          ilike(factures.id, `%${query}%`)
        )
      )
      .orderBy(desc(factures.createdAt));
  }

  // Reservations operations
  async getReservation(id: string): Promise<Reservation | undefined> {
    const [reservationItem] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservationItem;
  }

  async getReservationsByUser(userId: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.userId, userId))
      .orderBy(desc(reservations.createdAt));
  }

  async getAllReservations(): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .orderBy(desc(reservations.createdAt));
  }

  async createReservation(reservationData: InsertReservation): Promise<Reservation> {
    const [newReservation] = await db
      .insert(reservations)
      .values(reservationData)
      .returning();
    return newReservation;
  }

  async updateReservation(id: string, reservationData: UpdateReservation): Promise<Reservation> {
    const [updatedReservation] = await db
      .update(reservations)
      .set({ ...reservationData, updatedAt: new Date() })
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation;
  }

  async deleteReservation(id: string): Promise<void> {
    await db.delete(reservations).where(eq(reservations.id, id));
  }

  async searchReservations(query: string): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(
        or(
          ilike(reservations.customerName, `%${query}%`),
          ilike(reservations.customerEmail, `%${query}%`),
          ilike(reservations.id, `%${query}%`),
          ilike(reservations.serviceType, `%${query}%`)
        )
      )
      .orderBy(desc(reservations.createdAt));
  }
}

export const storage = new DatabaseStorage();