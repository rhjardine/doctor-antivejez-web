// prisma/run-import.ts

// ===== INICIO DE LA CORRECCIÓN =====
// Se reemplaza la ruta relativa por el alias '@' que está configurado
// en nuestro tsconfig.json principal. Esto hace que la importación sea
// más robusta y consistente con el resto de la aplicación.
import { importFromCsv } from '@/lib/scripts/import-from-csv';
// ===== FIN DE LA CORRECCIÓN =====

import path from 'path';

async function main() {
  const filePath = path.join(__dirname, 'data', 'persons.csv');
  
  console.log(`Cargando archivo desde: ${filePath}`);
  const result = await importFromCsv(filePath);
  
  if (result.success) {
    console.log('¡Importación exitosa!', result);
  } else {
    console.error('La importación falló:', result.error);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});