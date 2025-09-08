// src/lib/services/notificationService.ts
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

// Interfaz para la estructura del adjunto, consistente con la API de SendGrid
interface Attachment {
  content: string; // Contenido en Base64
  filename: string;
  type: string;
  disposition: 'attachment';
  content_id: string;
}

// ===== Interfaz para Proveedores de Email (actualizada para aceptar adjuntos) =====
interface EmailProvider {
  send(to: string, subject: string, body: string, attachment: Attachment | null): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ===== Implementación del Proveedor de SendGrid (actualizada para manejar adjuntos) =====
class SendGridProvider implements EmailProvider {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async send(to: string, subject: string, body: string, attachment: Attachment | null): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid credentials are not configured.');
      return { success: false, error: 'El servicio de Email no está configurado.' };
    }

    // Usamos 'any' para poder añadir la propiedad 'attachments' de forma condicional
    const msg: any = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      text: body, // Versión en texto plano
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`, // Versión HTML simple
    };

    // Si se proporciona un adjunto, lo añadimos al objeto del mensaje
    if (attachment) {
      msg.attachments = [attachment];
    }

    try {
      const response = await sgMail.send(msg);
      const messageId = response[0]?.headers['x-message-id'];
      return { success: true, messageId };
    } catch (error: any) {
      console.error('SendGrid send error:', error.response?.body || error);
      return { success: false, error: error.message || 'Ocurrió un error al enviar el Email.' };
    }
  }
}

// ===== Función para Obtener el Proveedor de Email =====
export function getEmailProvider(): EmailProvider {
  return new SendGridProvider();
}

// ==================================================================
// ===== CÓDIGO DE SMS (SIN CAMBIOS) =====
// ==================================================================
interface SmsProvider {
  send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class TwilioProvider implements SmsProvider {
  private client = process.env.TWILIO_SID && process.env.TWILIO_TOKEN 
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
    : null;

  async send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Twilio credentials are not configured in environment variables.');
      return { success: false, error: 'El servicio de SMS no está configurado.' };
    }
    try {
      const response = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
      });
      return { success: true, messageId: response.sid };
    } catch (error: any) {
      console.error('Twilio send error:', error);
      return { success: false, error: error.message || 'Ocurrió un error al enviar el SMS.' };
    }
  }
}

class CentauroProvider implements SmsProvider {
  async send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`Simulating send to ${to} via CentauroSMS`);
    return { success: true, messageId: `centauro_${Date.now()}` };
  }
}

export function getSmsProvider(): SmsProvider {
  if (process.env.SMS_PROVIDER === 'CENTAURO') {
    return new CentauroProvider();
  }
  return new TwilioProvider();
}