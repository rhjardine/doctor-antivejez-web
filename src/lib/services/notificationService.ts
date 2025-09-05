// src/lib/services/notificationService.ts

// Interfaz que define cómo debe ser un proveedor de SMS
interface SmsProvider {
  send(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Implementación específica para Twilio
class TwilioProvider implements SmsProvider {
  private client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  
  async send(to: string, message: string) {
    // Lógica para enviar SMS con Twilio
  }
}

// Implementación futura para CentauroSMS
class CentauroProvider implements SmsProvider {
  async send(to: string, message: string) {
    // Lógica para enviar SMS con Centauro usando fetch/axios
  }
}

// Función principal que elige el proveedor según una variable de entorno
export function getSmsProvider(): SmsProvider {
  if (process.env.SMS_PROVIDER === 'CENTAURO') {
    return new CentauroProvider();
  }
  // Twilio es el proveedor por defecto
  return new TwilioProvider();
}