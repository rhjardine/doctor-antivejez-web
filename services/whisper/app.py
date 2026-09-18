"""Servicio de transcripcion Whisper autoalojado.

El audio clinico no sale de la infraestructura: esa es la unica razon por la que
este servicio existe en lugar de llamar a una API de terceros.

Endpoints:
    GET  /health      estado y modelo cargado
    POST /transcribe  multipart con el campo 'audio' -> {texto, latenciaMs, modelo}
"""

import json
import logging
import os
import pathlib
import tempfile
import time

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO, format="[whisper] %(levelname)s %(message)s")
log = logging.getLogger("whisper")

# Por defecto 'base': es lo que cabe en el plan de 512 MB donde corre hoy.
# El Dockerfile siempre define WHISPER_MODELO, asi que este valor solo aplica
# ejecutando fuera de contenedor.
MODELO = os.environ.get("WHISPER_MODELO", "base")
IDIOMA = os.environ.get("WHISPER_IDIOMA", "es")
TOKEN = os.environ.get("WHISPER_TOKEN", "")
MAX_BYTES = int(os.environ.get("WHISPER_MAX_BYTES", 5 * 1024 * 1024))

# Presupuesto del initial_prompt de Whisper: ~224 tokens. El generador ya recorta
# la lista a ese orden de magnitud; aqui solo se lee lo que produjo.
_lexico = pathlib.Path(__file__).parent / "clinical-lexicon.generated.json"
if _lexico.exists():
    _datos = json.loads(_lexico.read_text(encoding="utf-8"))
    _terminos = _datos.get("prompt", [])
    # El initial_prompt es CONTEXTO PRECEDENTE, no un diccionario: el modelo
    # continua el patron de lo que lee. Una lista pelada separada por comas le
    # invita a seguir emitiendo elementos de esa lista, y eso fue exactamente lo
    # que ocurrio en produccion: el dictado volvio como "Adrenales, Aceite de
    # ricino, Antiviral c-Limon, ..." en bucle, sin relacion con lo dictado.
    #
    # Se enmarca como una frase con sujeto y punto final. El punto importa: sin
    # el, el modelo cree que la enumeracion sigue abierta y la continua.
    SESGO = (
        "Consulta de medicina antienvejecimiento. "
        "Se mencionan productos del vademecum: " + ", ".join(_terminos) + "."
    ) if _terminos else ""
    N_TERMINOS_SESGO = len(_terminos)
    log.info("Sesgo de vocabulario: %d terminos", N_TERMINOS_SESGO)
else:
    SESGO = ""
    N_TERMINOS_SESGO = 0
    log.warning("Sin clinical-lexicon.generated.json: se transcribe SIN sesgo de vademecum")

# El Dockerfile predescarga un modelo concreto y deja su nombre aqui. Si la
# variable de servicio pide otro, el modelo NO esta en la imagen y se baja de
# internet en cada arranque en frio: el primer dictado del dia se hace esperar
# y el fallo no se parece en nada a su causa. Se avisa antes de cargarlo.
PREDESCARGADO = os.environ.get("WHISPER_MODELO_PREDESCARGADO", "")
if PREDESCARGADO and PREDESCARGADO != MODELO:
    log.warning(
        "WHISPER_MODELO='%s' pero la imagen trae predescargado '%s': se descargara "
        "en cada arranque en frio. Reconstruya la imagen con "
        "--build-arg WHISPER_MODELO=%s",
        MODELO,
        PREDESCARGADO,
        MODELO,
    )

# El modelo se carga UNA vez al arrancar. Cargarlo por peticion anadiria
# decenas de segundos a cada dictado.
log.info("Cargando modelo '%s' (int8, cpu)...", MODELO)
_t0 = time.time()
modelo = WhisperModel(MODELO, device="cpu", compute_type="int8")
log.info("Modelo listo en %.1f s", time.time() - _t0)

app = FastAPI(title="Doctor Antivejez — Whisper autoalojado")


def _autorizar(cabecera: str | None) -> None:
    """Token compartido.

    Es defensa en profundidad, no la barrera principal: el servicio deberia
    estar en red privada y no expuesto a internet. Si TOKEN esta vacio no se
    exige nada, y eso queda registrado en el arranque para que no pase inadvertido.
    """
    if not TOKEN:
        return
    if cabecera != TOKEN:
        raise HTTPException(status_code=401, detail="No autorizado")


if not TOKEN:
    log.warning("WHISPER_TOKEN vacio: el endpoint no exige autenticacion")


@app.get("/health")
def health():
    return {
        "estado": "ok",
        "modelo": MODELO,
        "idioma": IDIOMA,
        # Se cuenta la lista de origen, no se deduce partiendo SESGO: ahora el
        # prompt lleva una frase alrededor y esa cuenta saldria mal.
        "terminosSesgo": N_TERMINOS_SESGO,
        "autenticacion": bool(TOKEN),
        # Expuesto a proposito: permite comprobar la divergencia imagen/servicio
        # desde fuera, sin tener que rebuscar en los logs de arranque.
        "modeloPredescargado": PREDESCARGADO or None,
        "modeloEnImagen": (not PREDESCARGADO) or PREDESCARGADO == MODELO,
    }


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    x_whisper_token: str | None = Header(default=None),
):
    _autorizar(x_whisper_token)

    contenido = await audio.read()
    if not contenido:
        raise HTTPException(status_code=400, detail="Audio vacio")
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Audio demasiado grande")

    inicio = time.time()

    # faster-whisper necesita una ruta o un file-like que ffmpeg pueda abrir.
    sufijo = pathlib.Path(audio.filename or "dictado.webm").suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=sufijo, delete=True) as tmp:
        tmp.write(contenido)
        tmp.flush()
        try:
            segmentos, _info = modelo.transcribe(
                tmp.name,
                language=IDIOMA,
                # Sesga el decodificador hacia el vademecum. Es la diferencia
                # entre "Transfer Tri Factor" y "transferencia de factores".
                initial_prompt=SESGO or None,
                # La escalera de temperaturas NO es "creatividad": es la red de
                # seguridad de Whisper. Cuando un segmento sale degenerado
                # —compression_ratio por encima del umbral, o logprob media
                # demasiado baja— se reintenta con la siguiente temperatura.
                # Estaba puesto en 0.0 a secas, que deja la escalera sin
                # peldanos: no habia a donde reintentar y la salida degenerada
                # se devolvia tal cual. Ese fue el bucle que vio el medico.
                temperature=[0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
                # Umbrales explicitos, no por omision: son los que deciden que
                # un segmento es degenerado y hay que reintentarlo.
                compression_ratio_threshold=2.4,
                log_prob_threshold=-1.0,
                # Por defecto es True: cada segmento recibe como contexto lo que
                # se decodifico antes. Si un segmento entra en bucle, el
                # siguiente lo hereda y el bucle se sostiene solo durante todo
                # el audio. Apagarlo cuesta algo de coherencia entre frases y
                # evita que un tropiezo contamine el dictado entero.
                condition_on_previous_text=False,
                vad_filter=True,
            )
            texto = " ".join(s.text.strip() for s in segmentos).strip()
        except Exception as e:  # noqa: BLE001
            log.error("Fallo transcribiendo: %s", e)
            raise HTTPException(status_code=500, detail="Error de transcripcion") from e

    latencia_ms = int((time.time() - inicio) * 1000)

    # Se registra el tamano y la latencia, NUNCA el texto: es informacion clinica
    # y no tiene por que quedar en los logs del proveedor de hosting.
    log.info("ok bytes=%d latenciaMs=%d", len(contenido), latencia_ms)

    return {"texto": texto, "latenciaMs": latencia_ms, "modelo": MODELO}
