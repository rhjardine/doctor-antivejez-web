# Servicio Whisper autoalojado

Transcribe los dictados clínicos **sin que el audio salga de la infraestructura propia**.
Esa es su única razón de ser: cierra la cuestión del acuerdo de tratamiento de datos
en lugar de gestionarla. No hay tercero a quien confiar PHI, ni contrato que negociar.

---

## Qué hace

| Endpoint | Para qué |
|---|---|
| `GET /health` | Estado, modelo cargado, nº de términos de sesgo, si exige token |
| `POST /transcribe` | Multipart con campo `audio` → `{texto, latenciaMs, modelo}` |

El modelo se carga **una vez al arrancar**, no por petición. Cargarlo en cada
dictado añadiría decenas de segundos a cada uno.

## El sesgo del vademécum

Lo que distingue este servicio de un Whisper genérico es el `initial_prompt`:
se le pasan los nombres propios del vademécum para sesgar el decodificador.

Es la diferencia entre `Transfer Tri Factor` y «transferencia de factores».

Los términos salen de `src/lib/voice/clinical-lexicon.generated.json`, que se
genera del catálogo real de la Guía con `npm run voz:lexico`. **El mismo archivo
alimenta el sesgo del transcriptor y el medidor que lo evalúa** — si fueran dos
listas distintas, las cifras de B1 no significarían nada. Hay un test que lo verifica.

El presupuesto de `initial_prompt` es de ~224 tokens, así que no caben los 162
términos: entran 43, priorizando los nombres de producto que un modelo genérico
siempre falla. **Cuando la medición revele que pierde otro de forma sistemática,
se añade a `TERMINOS_SESGO_PRIORITARIO`** en `lexicon-extractor.ts`. Ese es el
bucle de realimentación: el sesgo aprende de lo medido, no de lo que yo suponga.

## Construir

El contexto de build es la **raíz del repositorio**, no este directorio — así el
servicio consume el mismo JSON generado sin copias que se desincronicen:

```bash
docker build -f services/whisper/Dockerfile -t whisper-antivejez .
docker run -p 10000:10000 -e WHISPER_TOKEN=un-secreto whisper-antivejez

# Para otro tamaño de modelo hay que reconstruir, no basta con la variable:
docker build -f services/whisper/Dockerfile --build-arg WHISPER_MODELO=small -t whisper-antivejez .
```

En Render (Docker): **Root Directory** vacío · **Dockerfile Path** `services/whisper/Dockerfile`.

## Variables

| Variable | Por defecto | Qué hace |
|---|---|---|
| `WHISPER_MODELO` | `base` | Tamaño del modelo. Es también `ARG` del Dockerfile: se descarga en el build |
| `WHISPER_MODELO_PREDESCARGADO` | *(lo fija el Dockerfile)* | Testigo del modelo que trae la imagen. No se define a mano |

> ⚠️ **Cambiar `WHISPER_MODELO` en el panel del proveedor no basta.** La variable de
> servicio pisa el `ENV` de la imagen en tiempo de ejecución, pero el modelo
> predescargado sigue siendo el del build: el servicio arranca bajándose el nuevo
> **en cada arranque en frío**. Hay que reconstruir con
> `--build-arg WHISPER_MODELO=<tamaño>`. Esto ocurrió en silencio en el primer
> despliegue; ahora el arranque lo avisa y `/health` lo expone en
> `modeloEnImagen`.
| `WHISPER_IDIOMA` | `es` | Sin esto, los nombres en inglés del vademécum disparan cambios de idioma |
| `WHISPER_TOKEN` | *(vacío)* | Token compartido. **Vacío = sin autenticación**, y avisa al arrancar |
| `WHISPER_MAX_BYTES` | `5242880` | Tope por dictado (5 MB) |

Y en el servicio web de Next.js, para que lo use:

```bash
DICTADO_VOZ_ENABLED=true
NEXT_PUBLIC_DICTADO_VOZ_ENABLED=true
DICTADO_VOZ_PROVEEDOR=whisper-local
WHISPER_URL=https://<este-servicio>
WHISPER_TOKEN=<el mismo secreto>
```

## Dimensionado — léalo antes de elegir plan

`faster-whisper` con cuantización `int8` sobre CPU. Cifras **aproximadas**,
a verificar en su despliegue concreto:

| Modelo | RAM aprox. | Precisión en terminología |
|---|---|---|
| `tiny` / `base` | 0,3–0,5 GB | Insuficiente: destroza los nombres de producto |
| `small` | ~1 GB | Punto de partida razonable — **es el que hay que medir** |
| `medium` | ~2–2,5 GB | Notablemente mejor con nombres propios, bastante más lento |

**El plan actual del servicio web (512 MB, 0,5 CPU) no puede alojarlo.** Este
servicio necesita el suyo propio, y eso cuesta dinero. No conviene elegir modelo
por intuición: mida primero con `small` y decida con la cifra delante.

## Cómo medir

```bash
# 1. El Dr. graba 15–20 dictados con terminología del vademécum,
#    SIN nombre ni dato de ningún paciente real.
# 2. Transcribir el corpus y construir el manifiesto:
DICTADO_VOZ_PROVEEDOR=whisper-local WHISPER_URL=http://localhost:10000 \
  npm run voz:corpus -- docs/voz/corpus/referencias.json docs/voz/corpus/audio

# 3. Medir el recall clínico:
npm run voz:evaluar -- docs/voz/manifiesto-real.json
```

El umbral propuesto está en `docs/voz/b1-evaluacion-transcripcion.md` §7.
Lo fija el médico, porque es quien asume la consecuencia de un error.

## El bucle de repetición — leído caro, documentado aquí

En la primera prueba real el médico dictó dos minutos y recibió esto:

```
Adrenales, Aceite de ricino, Adrenales, Antiviral c-Limón, Aceite de ricino,
Adrenales, Antiviral c-Limón, Aceite de ricino, Adrenales, ...
```

No era su voz. El modelo continuaba **la lista del vademécum que este servicio le
pasa como `initial_prompt`**. Tres causas, las tres de configuración:

1. **`temperature=0.0` a secas.** La escalera de temperaturas no es «creatividad»:
   es la red de seguridad de Whisper. Si un segmento sale degenerado
   (`compression_ratio` sobre el umbral, o *logprob* media muy baja) se reintenta
   con la siguiente temperatura. Con un solo valor no hay peldaños y la salida
   degenerada se devuelve tal cual.
2. **`condition_on_previous_text` por omisión en `True`.** Cada segmento recibe
   como contexto lo decodificado antes, así que un bucle se hereda y se sostiene
   solo durante todo el audio.
3. **El `initial_prompt` era una lista pelada separada por comas.** El prompt es
   *contexto precedente*, no un diccionario: el modelo continúa su patrón. Ahora
   va enmarcado en una frase con punto final.

Además hay una segunda línea de defensa **en la aplicación**, no aquí:
`src/lib/voice/transcription-sanity.ts` mide variedad léxica y repetición de
trigramas, y descarta la transcripción antes de enseñársela al médico. Un modelo
siempre puede tropezar; entregarle una pared de nombres repetidos *como si fueran
sus palabras* es peor que decirle que falló.

## Latencia medida

Primer dato real, no estimación: **406 KB de audio (≈2 min) → 37 s** con `base`
en 0,5 CPU. Es utilizable para dictados cortos y molesto para los largos. Conviene
tenerlo delante al decidir si se sube de modelo: `small` acierta más, pero sobre
el mismo plan tardaría bastante más.

## Lo que este servicio NO resuelve

- **No hay arranque instantáneo.** Cargar el modelo lleva su tiempo; si el
  servicio se suspende por inactividad, el primer dictado del día espera.
  Para uso clínico conviene que no se suspenda.
- **No mide su propia precisión.** Para eso está `npm run voz:evaluar`.
- **No sustituye la confirmación humana.** El médico sigue revisando la
  propuesta antes de que nada entre en la historia clínica.
