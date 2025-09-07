'use server';

import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

// ===== 1. DEFINIMOS LA INTERFAZ PARA PROVEEDORES DE EMAIL =====
interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ===== 2. IMPLEMENTAMOS EL PROVEEDOR DE SENDGRID =====
class SendGridProvider implements EmailProvider {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async send(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid credentials are not configured.');
      return { success: false, error: 'El servicio de Email no está configurado.' };
    }

    const msg = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      text: body, // Versión en texto plano
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`, // Versión HTML simple
    };

    try {
      const response = await sgMail.send(msg);
      // La respuesta de SendGrid es un array, el message-id está en los headers del primer elemento.
      const messageId = response[0]?.headers['x-message-id'];
      return { success: true, messageId };
    } catch (error: any) {
      console.error('SendGrid send error:', error.response?.body || error);
      return { success: false, error: error.message || 'Ocurrió un error al enviar el Email.' };
    }
  }
}

// ===== 3. CREAMOS LA FUNCIÓN PARA OBTENER EL PROVEEDOR DE EMAIL =====
export function getEmailProvider(): EmailProvider {
  // Por ahora solo tenemos SendGrid, pero la arquitectura permite añadir otros en el futuro.
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