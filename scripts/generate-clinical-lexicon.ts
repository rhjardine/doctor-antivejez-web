// Regenera src/lib/voice/clinical-lexicon.generated.ts desde el catálogo de la Guía.
// Uso: npm run voz:lexico
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { extraerTerminos, renderizarModulo, RUTA_CATALOGO } from '../src/lib/voice/lexicon-extractor';

const raiz = process.cwd();
const DESTINO = 'src/lib/voice/clinical-lexicon.generated.ts';

const terminos = extraerTerminos(readFileSync(path.join(raiz, RUTA_CATALOGO), 'utf8'));
writeFileSync(path.join(raiz, DESTINO), renderizarModulo(terminos), 'utf8');

console.log(`${terminos.length} términos → ${DESTINO}`);
