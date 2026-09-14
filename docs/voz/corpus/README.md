# Corpus de evaluación

**Ningún archivo de este directorio puede contener datos de un paciente real.**
Ni nombre, ni cédula, ni fecha de nacimiento, ni nada identificable. Son dictados
construidos para medir precisión, con posología y nombres de producto reales.

## Qué grabar

15–20 dictados, con la voz del Dr., su micrófono y el ruido ambiente habitual de
consulta — no en condiciones de estudio, porque no es ahí donde se va a usar.

| Bloque | Cantidad | Contenido |
|---|---|---|
| Productos del vademécum propio | 6 | `MegaGH4`, `StemCell Enhancer`, `Transfer Tri Factor`, `Telomeros`, `Oligocell`, `Exosoma Serum` |
| Sueros y terapias | 4 | `Quelación`, `Bioxigenación`, `Cámara Hiperbárica`, `Factores Autólogos PRP` |
| Homeopáticos y flores de Bach | 3 | Nombres en inglés dentro de frase en español (`Rescue Remedy`, `Star of Bethlehem`) |
| Posología y frecuencia | 4 | «dos veces al día», «en ayunas», «días alternos», cantidades y unidades |
| Observación libre | 3 | Texto corrido como el que hoy escribe a mano en la Guía |

Los bloques 1 y 3 son los que más discriminan: nombres propios y anglicismos
dentro de frase en español es donde un modelo genérico se rompe.

## Cómo

1. Grabar cada dictado en un archivo (`d01.webm`, `d02.webm`…) en `audio/`.
2. Escribir en `referencias.json` **lo que se dijo**, palabra por palabra, y
   declarar los términos del vademécum que contiene. Esa lista la declara quien
   graba: si un detector automático dedujera qué términos «debía» haber, estaría
   midiendo su propia inferencia en lugar de medir al transcriptor.
3. Transcribir y medir:

```bash
DICTADO_VOZ_PROVEEDOR=whisper-local WHISPER_URL=http://localhost:10000 \
  npm run voz:corpus -- docs/voz/corpus/referencias.json docs/voz/corpus/audio

npm run voz:evaluar -- docs/voz/manifiesto-real.json
```

Los `.webm` y el manifiesto generado no se versionan: son audio de trabajo.
