# Servicio de transcripcion autoalojado.
#
# Existe por una razon concreta: con Whisper propio el audio de un dictado
# clinico NO sale de la infraestructura del cliente. Eso cierra la cuestion del
# acuerdo de tratamiento de datos en lugar de gestionarla.
FROM python:3.11-slim

# ffmpeg es obligatorio: MediaRecorder emite WebM/Opus y faster-whisper lo
# decodifica a traves de ffmpeg. Sin esto el servicio arranca y falla en la
# primera peticion, que es la peor forma de fallar.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# IMPORTANTE: el contexto de build es la RAIZ DEL REPOSITORIO, no este
# directorio. Se hace asi para no duplicar el lexico: el servicio consume
# exactamente el mismo JSON generado que usa el medidor, sin copias que
# se desincronicen en silencio.
#
#   docker build -f services/whisper/Dockerfile .
#
# En Render: Root Directory vacio, Dockerfile Path = services/whisper/Dockerfile
COPY services/whisper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/whisper/app.py .
COPY src/lib/voice/clinical-lexicon.generated.json ./clinical-lexicon.generated.json

# El modelo se descarga en el build, no en el arranque. Si se descargara al
# arrancar, el primer dictado del dia esperaria varios minutos y el medico
# pensaria que esta roto.
ARG WHISPER_MODELO=small
ENV WHISPER_MODELO=${WHISPER_MODELO}
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('${WHISPER_MODELO}', device='cpu', compute_type='int8')"

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
