// src/types/orthomolecular.ts

// Define la estructura para cada mineral o metal medido en el test.
export interface OrthomolecularElement {
  id: string; // ej: 'aluminio'
  name: string; // ej: 'Aluminio'
  value: number | null;
}

// Define la estructura completa de un resultado del test.
export interface OrthomolecularTestResult {
  id: string; // ID del registro en la base de datos
  patientId: string;
  createdAt: Date;
  elements: OrthomolecularElement[];
  orthomolecularAge: number;
}

// Define el esquema del formulario para la validación con Zod.
import * as z from 'zod';

export const orthomolecularTestSchema = z.object({
  // Se crea un objeto dinámico para los valores de los elementos.
  // La clave será el 'id' del elemento (ej: 'aluminio').
  elements: z.record(z.coerce.number().min(0, "El valor debe ser positivo").optional().nullable())
});

export type OrthomolecularTestFormValues = z.infer<typeof orthomolecularTestSchema>;
