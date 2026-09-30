// Resolucion de destinatarios de una campana.
//
// Por que existe: `sendCampaign` recibia del cliente una lista de contactos con
// `name`, `email` y `phone` DENTRO, y enviaba a esos valores. Es decir, el
// telefono al que se manda un SMS lo elegia quien invocaba la accion. Con las
// credenciales de Twilio/WhatsApp del cliente detras, eso es un relay de envio
// masivo a cuenta ajena.
//
// La regla: del cliente se acepta UNICAMENTE el identificador. El nombre, el
// correo y el telefono se leen de la base, dentro del alcance del profesional.
// Logica pura, sin base ni sesion, para poder probarla.

/** Lo minimo que se acepta del cliente. */
export interface ContactoPedido {
  id?: unknown;
}

/** Un paciente ya leido de la base, dentro del alcance. */
export interface PacienteDestinatario {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/** Los canales por los que se puede contactar. Coincide con `Channel` del wizard. */
export type CanalDestinatario = 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface Destinatario {
  id: string;
  name: string;
  email: string;
  phone: string;
  consent: CanalDestinatario[];
}

/**
 * Identificadores utiles de lo que manda el cliente: cadenas no vacias, sin
 * repetidos y en un numero acotado.
 *
 * El tope no es decorativo: sin el, una sola peticion podia encolar un envio a
 * tantos destinatarios como quisiera quien la construyera.
 */
export const MAXIMO_DESTINATARIOS = 2000;

export function idsPedidos(contactos: readonly ContactoPedido[] | null | undefined): string[] {
  if (!Array.isArray(contactos)) return [];

  const vistos = new Set<string>();
  for (const contacto of contactos) {
    const id = typeof contacto?.id === 'string' ? contacto.id.trim() : '';
    if (id !== '') vistos.add(id);
    if (vistos.size >= MAXIMO_DESTINATARIOS) break;
  }
  // `Array.from` y no `[...vistos]`: el target de compilacion de este proyecto
  // no permite desestructurar un Set (TS2802).
  return Array.from(vistos);
}

/**
 * Construye los destinatarios a partir de los pacientes leidos de la base.
 *
 * Se descarta a quien no tiene por donde recibir: sin correo ni telefono el
 * envio falla de todos modos, y contarlo como destinatario deja la campana con
 * un `failedCount` que no dice nada.
 */
export function destinatariosDesdePacientes(
  pacientes: readonly PacienteDestinatario[]
): Destinatario[] {
  return pacientes
    .filter((p) => (p.email ?? '').trim() !== '' || (p.phone ?? '').trim() !== '')
    .map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`.trim(),
      email: p.email,
      phone: p.phone,
      consent: ['EMAIL', 'SMS', 'WHATSAPP'],
    }));
}

/**
 * Los identificadores pedidos que NO aparecieron en el alcance del profesional.
 *
 * Que haya alguno no es un detalle a ignorar: significa que la peticion
 * nombraba pacientes que no son de quien la envia.
 */
export function idsFueraDeAlcance(
  pedidos: readonly string[],
  encontrados: readonly PacienteDestinatario[]
): string[] {
  const disponibles = new Set(encontrados.map((p) => p.id));
  return pedidos.filter((id) => !disponibles.has(id));
}
