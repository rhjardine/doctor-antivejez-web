/**
 * Formatea el número de identificación de un paciente con un prefijo basado en su nacionalidad.
 * @param nationality - La nacionalidad del paciente ('Venezolano', 'Extranjero', 'Jurídico').
 * @param identification - El número de identificación del paciente.
 * @returns La identificación formateada (ej: "V-12345678").
 */
export function formatIdentification(nationality: string, identification: string): string {
  const prefixMap: { [key: string]: string } = {
    'Venezolano': 'V',
    'Extranjero': 'E',
    'Jurídico': 'J',
  };

  const prefix = prefixMap[nationality] || '';
  
  return prefix ? `${prefix}-${identification}` : identification;
}
