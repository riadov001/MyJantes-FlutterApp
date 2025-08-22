import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export class NotificationService {
  private static emailTransporter = nodemailer.createTransporter({
    service: 'gmail', // ou votre service email
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  private static twilioClient = process.env.TWILIO_ACCOUNT_SID ? 
    twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

  static async sendEmail(to: string, subject: string, message: string, userId?: string): Promise<boolean> {
    try {
      if (!process.env.EMAIL_USER) {
        console.log('Email service not configured');
        return false;
      }

      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: message
      });

      // Log notification
      if (userId) {
        await this.logNotification(userId, 'email', subject, message, 'sent');
      }

      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      if (userId) {
        await this.logNotification(userId, 'email', subject, message, 'failed');
      }
      return false;
    }
  }

  static async sendSMS(to: string, message: string, userId?: string): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        console.log('SMS service not configured');
        return false;
      }

      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });

      // Log notification
      if (userId) {
        await this.logNotification(userId, 'sms', null, message, 'sent');
      }

      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      if (userId) {
        await this.logNotification(userId, 'sms', null, message, 'failed');
      }
      return false;
    }
  }

  static async logNotification(userId: string, type: string, subject: string | null, message: string, status: string): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO notifications (user_id, type, subject, message, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, type, subject, message, status, status === 'sent' ? new Date() : null]);
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  static async getNotificationHistory(userId: string): Promise<any[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return [];
    }
  }

  // Templates d'email
  static async sendWelcomeEmail(user: any): Promise<boolean> {
    const subject = 'Bienvenue chez MY JANTES !';
    const message = `
      <h2>Bienvenue ${user.firstName || 'Cher client'} !</h2>
      <p>Votre compte MY JANTES a été créé avec succès.</p>
      <p>Vous pouvez maintenant:</p>
      <ul>
        <li>Demander des devis en ligne</li>
        <li>Réserver vos services</li>
        <li>Suivre l'avancement de vos commandes</li>
        <li>Consulter vos factures</li>
      </ul>
      <p>Merci de votre confiance !</p>
      <p><strong>L'équipe MY JANTES</strong></p>
    `;
    return this.sendEmail(user.email, subject, message, user.id);
  }

  static async sendDevisNotification(user: any, devisId: string): Promise<boolean> {
    const subject = `Nouveau devis ${devisId} - MY JANTES`;
    const message = `
      <h2>Votre demande de devis a été reçue</h2>
      <p>Bonjour ${user.firstName || 'Cher client'},</p>
      <p>Nous avons bien reçu votre demande de devis <strong>${devisId}</strong>.</p>
      <p>Nous vous contacterons rapidement avec une estimation détaillée.</p>
      <p>Cordialement,<br><strong>L'équipe MY JANTES</strong></p>
    `;
    return this.sendEmail(user.email, subject, message, user.id);
  }

  static async sendDevisStatusUpdate(user: any, devisId: string, status: string): Promise<boolean> {
    const statusMessages = {
      'accepte': 'accepté',
      'refuse': 'refusé',
      'expire': 'expiré'
    };
    
    const statusText = statusMessages[status as keyof typeof statusMessages] || status;
    const subject = `Devis ${devisId} ${statusText} - MY JANTES`;
    
    const message = `
      <h2>Mise à jour de votre devis</h2>
      <p>Bonjour ${user.firstName || 'Cher client'},</p>
      <p>Le statut de votre devis <strong>${devisId}</strong> a été mis à jour : <strong>${statusText}</strong></p>
      ${status === 'accepte' ? '<p>Nous vous contacterons prochainement pour planifier vos travaux.</p>' : ''}
      <p>Cordialement,<br><strong>L'équipe MY JANTES</strong></p>
    `;
    
    return this.sendEmail(user.email, subject, message, user.id);
  }

  static async sendInvoiceNotification(user: any, factureId: string): Promise<boolean> {
    const subject = `Facture ${factureId} - MY JANTES`;
    const message = `
      <h2>Votre facture est disponible</h2>
      <p>Bonjour ${user.firstName || 'Cher client'},</p>
      <p>Votre facture <strong>${factureId}</strong> est maintenant disponible.</p>
      <p>Vous pouvez la consulter dans votre espace client.</p>
      <p>Cordialement,<br><strong>L'équipe MY JANTES</strong></p>
    `;
    return this.sendEmail(user.email, subject, message, user.id);
  }
}