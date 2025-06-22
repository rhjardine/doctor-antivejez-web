export const APP_NAME = 'Doctor AntiVejez';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  HISTORIAS: '/historias',
  HISTORIAS_NUEVO: '/historias/nuevo',
  PROFESIONALES: '/profesionales',
  AGENTE_IA: '/agente-ia',
  EDAD_BIOLOGICA: '/edad-biologica',
  REPORTES: '/reportes',
  AJUSTES: '/ajustes',
} as const;

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

export const MARITAL_STATUS = [
  'Soltero/a',
  'Comprometido/a',
  'Casado/a',
  'Divorciado/a',
  'Viudo/a',
] as const;

export const NATIONALITIES = [
  'Venezolano',
  'Extranjero',
  'Jurídico',
] as const;

// Colores para los estados del test biofísico
export const STATUS_COLORS = {
  REJUVENECIDO: 'rgb(22, 163, 74)',   // Verde
  NORMAL: 'rgb(234, 179, 8)',         // Amarillo
  ENVEJECIDO: 'rgb(220, 38, 38)',     // Rojo
} as const;

// Rangos para determinar el estado
export const AGE_DIFF_RANGES = {
  REJUVENECIDO: -7,  // 7 años o más joven
  NORMAL_MIN: -2,    // Entre -2 y +3 años
  NORMAL_MAX: 3,
  ENVEJECIDO: 7,     // 7 años o más viejo
} as const;
