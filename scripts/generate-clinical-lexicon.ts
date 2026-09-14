// Regenera el léxico clínico desde el catálogo de la Guía.
// Uso: npm run voz:lexico
//
// Emite DOS artefactos desde la misma extracción:
//   - clinical-lexicon.generated.ts   → lo consume el medidor (TypeScript)
//   - clinical-lexicon.generated.json → lo consume el servicio Whisper (Python)
// Que salgan del mismo sitio es lo que impide que el sesgo del transcriptor y
// la métrica que lo evalúa acaben midiendo vocabularios distintos.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  extraerTerminos,
  renderizarModulo,
  terminosParaPrompt,
  RUTA_CATALOGO,
} from '../src/lib/voice/lexicon-extractor';

const raiz = process.cwd();
const DESTINO_TS = 'src/lib/voice/clinical-lexicon.generated.ts';
const DESTINO_JSON = 'src/lib/voice/clinical-lexicon.generated.json';

const terminos = extraerTerminos(readFileSync(path.join(raiz, RUTA_CATALOGO), 'utf8'));
const prompt = terminosParaPrompt(terminos);

writeFileSync(path.join(raiz, DESTINO_TS), renderizarModulo(terminos), 'utf8');
writeFileSync(
  path.join(raiz, DESTINO_JSON),
  JSON.stringify({ fuente: RUTA_CATALOGO, terminos, prompt }, null, 2) + '\n',
  'utf8'
);

console.log(`${terminos.length} términos → ${DESTINO_TS}`);
console.log(`${prompt.length} términos de sesgo → ${DESTINO_JSON}`);
