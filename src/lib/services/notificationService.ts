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

// ===== Interfaz para Proveedores de Email =====
interface EmailProvider {
  send(to: string, subject: string, body: string, attachment: Attachment | null): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ===== Implementación del Proveedor de SendGrid =====
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

    const msg: any = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
    };

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

export function getEmailProvider(): EmailProvider {
  return new SendGridProvider();
}

// ===== Interfaz para Proveedores de SMS =====
interface SmsProvider {
  send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ===== Implementación del Proveedor de Twilio SMS =====
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
  // Aquí se podría añadir lógica para otros proveedores de SMS en el futuro
  return new TwilioSmsProvider();
}

// ===== INICIO DE LA NUEVA SECCIÓN DE WHATSAPP =====

// ===== 1. DEFINIMOS LA INTERFAZ PARA WHATSAPP =====
interface WhatsAppProvider {
  sendTemplate(to: string, templateName: string, variables: { [key: string]: string }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ===== 2. IMPLEMENTAMOS EL PROVEEDOR DE WHATSAPP CON TWILIO =====
class TwilioWhatsAppProvider implements WhatsAppProvider {
  private client = process.env.TWILIO_SID && process.env.TWILIO_TOKEN 
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
    : null;

  async sendTemplate(to: string, templateName: string, variables: { [key: string]: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client || !process.env.TWILIO_WHATSAPP_NUMBER) {
      console.error('Twilio WhatsApp credentials are not configured.');
      return { success: false, error: 'El servicio de WhatsApp no está configurado.' };
    }

    const formattedTo = `whatsapp:${to}`;
    const formattedFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
    const contentVariables = JSON.stringify(variables);

    try {
      const response = await this.client.messages.create({
        contentSid: 'HXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Placeholder for your actual template SID
        // Nota: Una vez que la plantilla es aprobada, es más robusto usar su SID (ej. 'HX...') que su nombre.
        // Por ahora, el SDK puede resolver el nombre, pero el SID es preferible.
        // contentSid: templateName, 
        from: formattedFrom,
        to: formattedTo,
        contentVariables: contentVariables,
      });
      return { success: true, messageId: response.sid };
    } catch (error: any) {
      console.error('Twilio WhatsApp send error:', error);
      return { success: false, error: error.message || 'Ocurrió un error al enviar el WhatsApp.' };
    }
  }
}

// ===== 3. CREAMOS LA FUNCIÓN PARA OBTENER EL PROVEEDOR DE WHATSAPP =====
export function getWhatsAppProvider(): WhatsAppProvider {
  return new TwilioWhatsAppProvider();
}
// ===== FIN DE LA NUEVA SECCIÓN DE WHATSAPP =====