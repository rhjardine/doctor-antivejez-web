// Cierra el bucle de B1: audio grabado → transcripción → manifiesto medible.
//
// Uso:
//   DICTADO_VOZ_PROVEEDOR=whisper-local WHISPER_URL=http://localhost:10000 \
//   npm run voz:corpus -- docs/voz/corpus/referencias.json docs/voz/corpus/audio
//
// Sin esto, alguien tendría que pegar a mano cada transcripción en el
// manifiesto, que es justo donde se cuelan los errores de copia que luego
// contaminan la medición.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { seleccionarProveedor } from '../src/lib/voice/transcription-provider';
import type { Dictado, ManifiestoEvaluacion } from '../src/lib/voice/comparison-report';
import type { TerminoClinico } from '../src/lib/voice/term-accuracy';

interface Referencia {
  id: string;
  archivo: string;
  referencia: string;
  terminosEsperados: TerminoClinico[];
  duracionSegundos: number;
}

const [rutaReferencias, rutaAudio, rutaSalida = 'docs/voz/manifiesto-real.json'] =
  process.argv.slice(2);

if (!rutaReferencias || !rutaAudio) {
  console.error(
    'Uso: npm run voz:corpus -- <referencias.json> <directorio-audio> [salida.json]'
  );
  process.exit(1);
}

async function main(): Promise<void> {
const referencias = JSON.parse(readFileSync(rutaReferencias!, 'utf8')) as Referencia[];
const proveedor = seleccionarProveedor();

if (proveedor.nombre === 'echo') {
  console.error(
    'El proveedor resuelto es "echo", que no transcribe. Configure ' +
    'DICTADO_VOZ_PROVEEDOR y WHISPER_URL antes de grabar el corpus.'
  );
  process.exit(1);
}

console.error(`Proveedor: ${proveedor.nombre} · ${referencias.length} dictados\n`);

const dictados: Dictado[] = [];

for (const ref of referencias) {
  const ruta = path.resolve(rutaAudio!, ref.archivo);
  if (!existsSync(ruta)) {
    console.error(`  ${ref.id}: FALTA el audio (${ruta}) — se omite`);
    continue;
  }

  const bytes = new Uint8Array(readFileSync(ruta));
  const tipoMime = ruta.endsWith('.webm')
    ? 'audio/webm'
    : ruta.endsWith('.mp3')
      ? 'audio/mpeg'
      : ruta.endsWith('.wav')
        ? 'audio/wav'
        : 'audio/ogg';

  try {
    const r = await proveedor.transcribir(bytes, tipoMime);
    console.error(`  ${ref.id}: ${r.latenciaMs} ms · ${r.texto.slice(0, 60)}…`);

    dictados.push({
      id: ref.id,
      referencia: ref.referencia,
      terminosEsperados: ref.terminosEsperados,
      duracionSegundos: ref.duracionSegundos,
      transcripciones: {
        [r.proveedor]: { texto: r.texto, latenciaMs: r.latenciaMs },
      },
    });
  } catch (error) {
    // Un dictado fallido se OMITE, no se guarda como cadena vacía: una
    // transcripción vacía puntuaría como "lo perdió todo" y hundiría la
    // métrica por un problema de red.
    console.error(`  ${ref.id}: ERROR — ${(error as Error).message} — se omite`);
  }
}

const manifiesto: ManifiestoEvaluacion = { dictados };
writeFileSync(path.resolve(rutaSalida), JSON.stringify(manifiesto, null, 2) + '\n', 'utf8');

console.error(`\n${dictados.length}/${referencias.length} transcritos → ${rutaSalida}`);
console.error(`Ahora: npm run voz:evaluar -- ${rutaSalida}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
