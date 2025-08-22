import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for status types
export const devisStatusEnum = pgEnum('devis_status', ['en_attente', 'accepte', 'refuse', 'expire']);
export const factureStatusEnum = pgEnum('facture_status', ['brouillon', 'envoyee', 'payee', 'annulee']);
export const reservationStatusEnum = pgEnum('reservation_status', ['confirmee', 'en_cours', 'terminee', 'annulee']);
export const userRoleEnum = pgEnum('user_role', ['client', 'admin']);

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For password-based authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  address: text("address"),
  city: varchar("city"),
  postalCode: varchar("postal_code"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('client').notNull(),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  smsConsent: boolean("sms_consent").default(false),
  emailConsent: boolean("email_consent").default(false),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Devis (Quotes) table
export const devis = pgTable("devis", {
  id: varchar("id").primaryKey().default(sql`'DEVIS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('devis_seq')::text, 4, '0')`),
  userId: varchar("user_id").references(() => users.id),
  vehicleType: varchar("vehicle_type").notNull(),
  rimSize: varchar("rim_size").notNull(),
  rimQuantity: integer("rim_quantity").notNull(),
  serviceType: varchar("service_type").notNull(),
  description: text("description"),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  photos: text("photos").array(),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  status: devisStatusEnum("status").default('en_attente').notNull(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Factures (Invoices) table
export const factures = pgTable("factures", {
  id: varchar("id").primaryKey().default(sql`'FACT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('factures_seq')::text, 4, '0')`),
  devisId: varchar("devis_id").references(() => devis.id),
  userId: varchar("user_id").references(() => users.id),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  items: jsonb("items").notNull(), // Array of invoice items
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('20.00'),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: factureStatusEnum("status").default('brouillon').notNull(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reservations table
export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`'RES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('reservations_seq')::text, 4, '0')`),
  devisId: varchar("devis_id").references(() => devis.id),
  userId: varchar("user_id").references(() => users.id),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  serviceDate: timestamp("service_date").notNull(),
  serviceType: varchar("service_type").notNull(),
  vehicleInfo: text("vehicle_info"),
  specialInstructions: text("special_instructions"),
  photos: text("photos").array(), // Photos for reservation
  status: reservationStatusEnum("status").default('confirmee').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work Sessions table for tracking time spent on vehicles
export const workSessions = pgTable("work_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").references(() => reservations.id),
  factureId: varchar("facture_id").references(() => factures.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  description: text("description"),
  beforePhotos: text("before_photos").array(),
  afterPhotos: text("after_photos").array(),
  totalMinutes: integer("total_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table for tracking sent notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // 'email', 'sms', 'push'
  subject: varchar("subject"),
  message: text("message").notNull(),
  status: varchar("status").default('pending'), // 'pending', 'sent', 'failed', 'delivered'
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Consent logs for GDPR compliance
export const consentLogs = pgTable("consent_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  consentType: varchar("consent_type").notNull(), // 'sms', 'email', 'data_processing'
  granted: boolean("granted").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  devis: many(devis),
  factures: many(factures),
  reservations: many(reservations),
  notifications: many(notifications),
  consentLogs: many(consentLogs),
}));

export const devisRelations = relations(devis, ({ one, many }) => ({
  user: one(users, {
    fields: [devis.userId],
    references: [users.id],
  }),
  factures: many(factures),
  reservations: many(reservations),
}));

export const facturesRelations = relations(factures, ({ one, many }) => ({
  user: one(users, {
    fields: [factures.userId],
    references: [users.id],
  }),
  devis: one(devis, {
    fields: [factures.devisId],
    references: [devis.id],
  }),
  workSessions: many(workSessions),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  devis: one(devis, {
    fields: [reservations.devisId],
    references: [devis.id],
  }),
  workSessions: many(workSessions),
}));

export const workSessionsRelations = relations(workSessions, ({ one }) => ({
  reservation: one(reservations, {
    fields: [workSessions.reservationId],
    references: [reservations.id],
  }),
  facture: one(factures, {
    fields: [workSessions.factureId],
    references: [factures.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const consentLogsRelations = relations(consentLogs, ({ one }) => ({
  user: one(users, {
    fields: [consentLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  confirmPassword: z.string().optional(),
});

export const insertDevisSchema = createInsertSchema(devis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFactureSchema = createInsertSchema(factures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkSessionSchema = createInsertSchema(workSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertConsentLogSchema = createInsertSchema(consentLogs).omit({
  id: true,
  createdAt: true,
});

// Update schemas
export const updateUserSchema = insertUserSchema.partial();
export const updateDevisSchema = insertDevisSchema.partial();
export const updateFactureSchema = insertFactureSchema.partial();
export const updateReservationSchema = insertReservationSchema.partial();
export const updateWorkSessionSchema = insertWorkSessionSchema.partial();

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Devis = typeof devis.$inferSelect;
export type InsertDevis = z.infer<typeof insertDevisSchema>;
export type UpdateDevis = z.infer<typeof updateDevisSchema>;

export type Facture = typeof factures.$inferSelect;
export type InsertFacture = z.infer<typeof insertFactureSchema>;
export type UpdateFacture = z.infer<typeof updateFactureSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type UpdateReservation = z.infer<typeof updateReservationSchema>;

export type WorkSession = typeof workSessions.$inferSelect;
export type InsertWorkSession = z.infer<typeof insertWorkSessionSchema>;
export type UpdateWorkSession = z.infer<typeof updateWorkSessionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ConsentLog = typeof consentLogs.$inferSelect;
export type InsertConsentLog = z.infer<typeof insertConsentLogSchema>;