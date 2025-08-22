import nodemailer from 'nodemailer';
import twilio from 'twilio';
import type { InsertNotification, User } from '@shared/schema';
import { storage } from './storage';

interface NotificationTemplates {
  devisCreated: (customerName: string, devisId: string) => { subject: string; html: string; sms: string };
  devisAccepted: (customerName: string, devisId: string, price: string) => { subject: string; html: string; sms: string };
  devisRejected: (customerName: string, devisId: string, reason?: string) => { subject: string; html: string; sms: string };
  factureCreated: (customerName: string, factureId: string, amount: string) => { subject: string; html: string; sms: string };
  reservationConfirmed: (customerName: string, reservationId: string, date: string) => { subject: string; html: string; sms: string };
  reminderReservation: (customerName: string, reservationId: string, date: string) => { subject: string; html: string; sms: string };
  welcome: (customerName: string) => { subject: string; html: string; sms: string };
  gdprConsent: (customerName: string) => { subject: string; html: string };
}

const templates: NotificationTemplates = {
  devisCreated: (customerName: string, devisId: string) => ({
    subject: `Votre devis ${devisId} a été reçu`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">MY JANTES</h2>
        <h3>Bonjour ${customerName},</h3>
        <p>Nous avons bien reçu votre demande de devis <strong>${devisId}</strong>.</p>
        <p>Notre équipe étudie votre demande et vous enverra une réponse sous 24-48h.</p>
        <p>Vous pouvez suivre l'état de votre devis sur notre site web.</p>
        <br>
        <p>Cordialement,<br>L'équipe MY JANTES</p>
        <hr>
        <small>MY JANTES - Spécialiste de la rénovation de jantes aluminium</small>
      </div>
    `,
    sms: `MY JANTES: Votre devis ${devisId} a été reçu. Réponse sous 24-48h. Merci de votre confiance !`
  }),

  devisAccepted: (customerName: string, devisId: string, price: string) => ({
    subject: `Votre devis ${devisId} a été accepté`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">MY JANTES</h2>
        <h3>Excellente nouvelle ${customerName} !</h3>
        <p>Votre devis <strong>${devisId}</strong> a été validé pour un montant de <strong>${price}€</strong>.</p>
        <p>Vous pouvez maintenant prendre rendez-vous pour vos travaux.</p>
        <p><a href="https://myjantes.fr/reservations" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Prendre rendez-vous</a></p>
        <br>
        <p>Cordialement,<br>L'équipe MY JANTES</p>
      </div>
    `,
    sms: `MY JANTES: Votre devis ${devisId} est accepté (${price}€). Prenez RDV sur notre site. Merci !`
  }),

  devisRejected: (customerName: string, devisId: string, reason?: string) => ({
    subject: `Votre devis ${devisId} - Information importante`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">MY JANTES</h2>
        <h3>Bonjour ${customerName},</h3>
        <p>Nous avons étudié votre devis <strong>${devisId}</strong>.</p>
        ${reason ? `<p>Malheureusement, nous ne pouvons pas donner suite pour la raison suivante : ${reason}</p>` : '<p>Nous ne pouvons malheureusement pas donner suite à votre demande.</p>'}
        <p>N'hésitez pas à nous contacter pour d'autres projets.</p>
        <br>
        <p>Cordialement,<br>L'équipe MY JANTES</p>
      </div>
    `,
    sms: `MY JANTES: Votre devis ${devisId} ne peut être traité. Contactez-nous pour plus d'infos.`
  }),

  factureCreated: (customerName: string, factureId: string, amount: string) => ({
    subject: `Votre facture ${factureId} est disponible`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">MY JANTES</h2>
        <h3>Bonjour ${customerName},</h3>
        <p>Votre facture <strong>${factureId}</strong> d'un montant de <strong>${amount}€</strong> est disponible.</p>
        <p>Vous pouvez la consulter et la télécharger depuis votre espace client.</p>
        <p><a href="https://myjantes.fr/factures" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir la facture</a></p>
        <br>
        <p>Cordialement,<br>L'équipe MY JANTES</p>
      </div>
    `,
    sms: `MY JANTES: Votre facture ${factureId} (${amount}€) est disponible sur votre espace client.`
  }),

  reservationConfirmed: (customerName: string, reservationId: string, date: string) => ({
    subject: `Votre rendez-vous ${reservationId} est confirmé`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">MY JANTES</h2>
        <h3>Bonjour ${customerName},</h3>
        <p>Votre rendez-vous <strong>${reservationId}</strong> est confirmé pour le <strong>${date}</strong>.</p>
        <p>Nous vous attendons dans nos ateliers à Liévin.</p>
        <p><strong>Adresse :</strong> Liévin, France<br>
        <strong>Téléphone :</strong> 03 21 44 XX XX</p>
        <br>
        <p>Cordialement,<br>L'équipe MY JANTES</p>
      </div>
    `,
    sms: `MY JANTES: RDV ${reservationId} confirmé le ${date}. Rendez-vous à Liévin. Merci !`
  }),

  reminderReservation: (customerName: string, reservationId: string, date: string) => ({
    subject: `Rappel : Votre rendez-vous demain`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">MY JANTES</h2>
        <h3>Bonjour ${customerName},</h3>
        <p>Petit rappel : vous avez rendez-vous demain (${date}) pour votre réservation <strong>${reservationId}</strong>.</p>
        <p>Nous vous attendons dans nos ateliers à Liévin.</p>
        <p>En cas d'empêchement, merci de nous prévenir au 03 21 44 XX XX.</p>
        <br>
        <p>À bientôt,<br>L'équipe MY JANTES</p>
      </div>
    `,
    sms: `MY JANTES: Rappel RDV demain ${date} pour ${reservationId}. En cas d'empêchement: 03 21 44 XX XX`
  }),

  welcome: (customerName: string) => ({
    subject: `Bienvenue chez MY JANTES !`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">MY JANTES</h2>
        <h3>Bienvenue ${customerName} !</h3>
        <p>Merci de nous avoir fait confiance en créant votre compte.</p>
        <p>Vous pouvez maintenant :</p>
        <ul>
          <li>Demander des devis en ligne</li>
          <li>Prendre rendez-vous</li>
          <li>Consulter vos factures</li>
          <li>Suivre vos dossiers</li>
        </ul>
        <p><a href="https://myjantes.fr" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Découvrir nos services</a></p>
        <br>
        <p>Cordialement,<br>L'équipe MY JANTES</p>
      </div>
    `,
    sms: `MY JANTES: Bienvenue ${customerName} ! Votre compte est créé. Découvrez nos services sur myjantes.fr`
  }),

  gdprConsent: (customerName: string) => ({
    subject: `Gestion de vos données personnelles`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">MY JANTES</h2>
        <h3>Bonjour ${customerName},</h3>
        <p>Conformément au RGPD, nous souhaitons vous informer sur l'utilisation de vos données personnelles.</p>
        <h4>Vos données sont utilisées pour :</h4>
        <ul>
          <li>Le traitement de vos demandes de devis</li>
          <li>La gestion de vos rendez-vous</li>
          <li>L'envoi de notifications (avec votre consentement)</li>
          <li>L'amélioration de nos services</li>
        </ul>
        <p>Vous pouvez à tout moment modifier vos préférences de notification dans votre espace client.</p>
        <p><a href="https://myjantes.fr/profile" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Gérer mes préférences</a></p>
        <br>
        <p>Cordialement,<br>L'équipe MY JANTES</p>
      </div>
    `
  })
};

interface NotificationService {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
  sendSMS(to: string, message: string): Promise<boolean>;
  sendNotificationToUser(userId: string, type: 'email' | 'sms', templateKey: keyof NotificationTemplates, ...templateArgs: any[]): Promise<boolean>;
  sendTemplatedNotification(user: User, templateKey: keyof NotificationTemplates, ...templateArgs: any[]): Promise<{ emailSent: boolean; smsSent: boolean }>;
  logNotification(notification: InsertNotification): Promise<void>;
}

class EmailSMSNotificationService implements NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio | null;

  constructor() {
    // Email configuration
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // SMS configuration
    this.twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER || 'contact@myjantes.fr',
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      console.error('Twilio not configured');
      return false;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  async sendNotificationToUser(userId: string, type: 'email' | 'sms', templateKey: keyof NotificationTemplates, ...templateArgs: any[]): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        console.error('User not found:', userId);
        return false;
      }

      // Check consent
      if (type === 'email' && !user.emailConsent) {
        console.log('User has not consented to email notifications:', userId);
        return false;
      }
      if (type === 'sms' && !user.smsConsent) {
        console.log('User has not consented to SMS notifications:', userId);
        return false;
      }

      const template = templates[templateKey](...templateArgs);
      let success = false;

      if (type === 'email' && user.email) {
        success = await this.sendEmail(user.email, template.subject, template.html);
      } else if (type === 'sms' && user.phone) {
        success = await this.sendSMS(user.phone, template.sms);
      }

      // Log the notification
      await this.logNotification({
        userId,
        type,
        subject: type === 'email' ? template.subject : undefined,
        message: type === 'email' ? template.html : template.sms,
        status: success ? 'sent' : 'failed',
        sentAt: success ? new Date() : undefined,
      });

      return success;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }

  async sendTemplatedNotification(user: User, templateKey: keyof NotificationTemplates, ...templateArgs: any[]): Promise<{ emailSent: boolean; smsSent: boolean }> {
    const results = {
      emailSent: false,
      smsSent: false,
    };

    // Send email if user consented
    if (user.emailConsent && user.email) {
      results.emailSent = await this.sendNotificationToUser(user.id, 'email', templateKey, ...templateArgs);
    }

    // Send SMS if user consented and phone is verified
    if (user.smsConsent && user.phone && user.phoneVerified) {
      results.smsSent = await this.sendNotificationToUser(user.id, 'sms', templateKey, ...templateArgs);
    }

    return results;
  }

  async logNotification(notification: InsertNotification): Promise<void> {
    try {
      await storage.createNotification(notification);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }
}

export const notificationService = new EmailSMSNotificationService();
export { templates };