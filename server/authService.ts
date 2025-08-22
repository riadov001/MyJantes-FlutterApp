import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const SALT_ROUNDS = 12;

interface User {
  id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  role: string;
  emailConsent?: boolean;
  smsConsent?: boolean;
  dataProcessingConsent?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  role?: string;
  emailConsent?: boolean;
  smsConsent?: boolean;
  dataProcessingConsent?: boolean;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token: string): { userId: string; role: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    } catch {
      return null;
    }
  }

  static async createUser(userData: CreateUserData): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    const result = await pool.query(`
      INSERT INTO users (email, password, first_name, last_name, phone, address, city, postal_code, 
                        role, email_consent, sms_consent, data_processing_consent, email_verified, phone_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      userData.email,
      hashedPassword,
      userData.firstName || null,
      userData.lastName || null,
      userData.phone || null,
      userData.address || null,
      userData.city || null,
      userData.postalCode || null,
      userData.role || 'client',
      userData.emailConsent || false,
      userData.smsConsent || false,
      userData.dataProcessingConsent || false,
      false, // email_verified
      false  // phone_verified
    ]);

    return result.rows[0];
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      return null;
    }

    // Update last login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    return user;
  }

  static async getUserById(userId: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0] || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return this.getUserById(userId);
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async logConsent(userId: string, consentType: string, granted: boolean, ipAddress?: string, userAgent?: string): Promise<void> {
    await pool.query(`
      INSERT INTO consent_logs (user_id, consent_type, granted, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, consentType, granted, ipAddress || null, userAgent || null]);
  }
}