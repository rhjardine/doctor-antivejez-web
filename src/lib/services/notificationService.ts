// src/lib/services/notificationService.ts
const twilio = require('twilio');
import sgMail from '@sendgrid/mail';
import axios from 'axios';

// ==================================================================
// ===== SECCIÓN DE EMAIL =====
// ==================================================================
interface EmailProvider {
  send(to: string, subject: string, body: string, mediaUrls: string[] | null): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class SendGridProvider implements EmailProvider {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async send(to: string, subject: string, body: string, mediaUrls: string[] | null): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid credentials are not configured.');
      return { success: false, error: 'El servicio de Email no está configurado.' };
    }

    const msg: any = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
    };

    if (mediaUrls && mediaUrls.length > 0) {
      try {
        console.log(`[SendGrid] Procesando ${mediaUrls.length} adjunto(s)...`);
        
        const attachmentPromises = mediaUrls.map(async (url) => {
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          return {
            content: Buffer.from(response.data, 'binary').toString('base64'),
            filename: url.split('/').pop() || 'attachment',
            type: response.headers['content-type'],
            disposition: 'attachment',
          };
        });

        msg.attachments = await Promise.all(attachmentPromises);
        console.log(`[SendGrid] Todos los adjuntos procesados exitosamente.`);

      } catch (error) {
        console.error('Failed to fetch attachments for email:', error);
        return { success: false, error: 'No se pudieron adjuntar uno o más archivos al correo.' };
      }
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

export function getEmailProvider(): EmailProvider {
  return new SendGridProvider();
}

// ==================================================================
// ===== SECCIÓN DE SMS =====
// ==================================================================
interface SmsProvider {
  send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class TwilioSmsProvider implements SmsProvider {
  private client = process.env.TWILIO_SID && process.env.TWILIO_TOKEN 
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
    : null;

  async send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Twilio SMS credentials are not configured.');
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
      console.error('Twilio SMS send error:', error);
      return { success: false, error: error.message || 'Ocurrió un error al enviar el SMS.' };
    }
  }
}

export function getSmsProvider(): SmsProvider {
  return new TwilioSmsProvider();
}

// ==================================================================
// ===== SECCIÓN DE WHATSAPP =====
// ==================================================================
interface WhatsAppProvider {
  sendTemplate(to: string, templateSid: string, variables: { [key: string]: string }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class TwilioWhatsAppProvider implements WhatsAppProvider {
  private client = process.env.TWILIO_SID && process.env.TWILIO_TOKEN 
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
    : null;

  async sendTemplate(to: string, templateSid: string, variables: { [key: string]: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client || !process.env.TWILIO_WHATSAPP_NUMBER) {
      console.error('Twilio WhatsApp credentials are not configured.');
      return { success: false, error: 'El servicio de WhatsApp no está configurado.' };
    }

    const formattedTo = `whatsapp:${to}`;
    const formattedFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

    try {
      const response = await this.client.messages.create({
        contentSid: templateSid,
        from: formattedFrom,
        to: formattedTo,
        contentVariables: JSON.stringify(variables),
      });
      return { success: true, messageId: response.sid };
    } catch (error: any) {
      console.error('Twilio WhatsApp send error:', error);
      return { success: false, error: error.message || 'Ocurrió un error al enviar el WhatsApp.' };
    }
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  return new TwilioWhatsAppProvider();
}