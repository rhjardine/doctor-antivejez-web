'use server';

import twilio from 'twilio';

// Interfaz que define el "contrato" para cualquier proveedor de SMS.
// Esto nos permite cambiar de proveedor en el futuro sin cambiar la lógica de negocio.
interface SmsProvider {
  send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Implementación específica para Twilio que CUMPLE con el contrato SmsProvider.
class TwilioProvider implements SmsProvider {
  // Inicializamos el cliente de Twilio solo si las credenciales existen.
  private client = process.env.TWILIO_SID && process.env.TWILIO_TOKEN 
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
    : null;

  async send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Verificación de seguridad: nos aseguramos de que el cliente y el número de origen estén configurados.
    if (!this.client || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Twilio credentials are not configured in environment variables.');
      return {
        success: false,
        error: 'El servicio de SMS no está configurado.',
      };
    }

    try {
      const response = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to, // El número de teléfono del destinatario
      });

      // Si la llamada a la API es exitosa, devolvemos un objeto que cumple el contrato.
      return {
        success: true,
        messageId: response.sid,
      };
    } catch (error: any) {
      console.error('Twilio send error:', error);
      // Si hay un error, devolvemos un objeto que cumple el contrato.
      return {
        success: false,
        error: error.message || 'Ocurrió un error al enviar el SMS.',
      };
    }
  }
}

// Implementación futura para CentauroSMS (aún como esqueleto)
class CentauroProvider implements SmsProvider {
  async send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`Simulating send to ${to} via CentauroSMS`);
    // Aquí iría la lógica con fetch/axios para la API de Centauro.
    // Por ahora, devolvemos un éxito simulado para cumplir el contrato.
    return { success: true, messageId: `centauro_${Date.now()}` };
  }
}

// Función principal que elige el proveedor según una variable de entorno.
// Esto nos da la flexibilidad de cambiar de proveedor fácilmente.
export function getSmsProvider(): SmsProvider {
  if (process.env.SMS_PROVIDER === 'CENTAURO') {
    return new CentauroProvider();
  }
  // Twilio es el proveedor por defecto.
  return new TwilioProvider();
}