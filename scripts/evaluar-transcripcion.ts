// Informe comparativo de proveedores de transcripción (B1).
//
// Uso: npm run voz:evaluar -- docs/voz/manifiesto-ejemplo.json
//
// No contacta con ningún proveedor: puntúa transcripciones ya obtenidas. La
// grabación y el envío ocurren fuera, bajo control humano y con la base legal
// correspondiente; aquí solo se mide, de forma reproducible y sin claves.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  compararProveedores,
  formatearTablaComparativa,
  formatearTerminosProblematicos,
  type ManifiestoEvaluacion,
} from '../src/lib/voice/comparison-report';

const ruta = process.argv[2];
if (!ruta) {
  console.error('Uso: npm run voz:evaluar -- <ruta-del-manifiesto.json>');
  process.exit(1);
}

const manifiesto = JSON.parse(
  readFileSync(path.resolve(process.cwd(), ruta), 'utf8')
) as ManifiestoEvaluacion;

if (!Array.isArray(manifiesto.dictados) || manifiesto.dictados.length === 0) {
  console.error('El manifiesto no contiene dictados.');
  process.exit(1);
}

const resumenes = compararProveedores(manifiesto);

console.log(`# Evaluación comparativa de transcripción\n`);
console.log(`Dictados en el corpus: **${manifiesto.dictados.length}**\n`);
console.log(`## Resultados\n`);
console.log(formatearTablaComparativa(resumenes));
console.log(`\n> La cifra que decide es **recall clínico**. El WER global es contexto:`);
console.log(`> acertar "el paciente" y fallar "Transfer Tri Factor" da un WER excelente`);
console.log(`> y una indicación equivocada.\n`);
console.log(`## Términos que cada proveedor no recupera\n`);
console.log(formatearTerminosProblematicos(resumenes));
