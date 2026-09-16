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
#
# El valor por defecto es 'base' porque es lo que cabe en el plan de 512 MB en
# el que corre hoy el servicio. Para otro tamano hay que reconstruir la imagen:
#
#   docker build -f services/whisper/Dockerfile --build-arg WHISPER_MODELO=small .
#
# NO basta con cambiar WHISPER_MODELO en el panel del proveedor. Una variable de
# servicio pisa el ENV de la imagen en tiempo de ejecucion, pero no cambia el
# modelo que se predescargo: el servicio arrancaria descargando el nuevo en cada
# arranque en frio. Eso ya paso, en silencio, y por eso app.py ahora lo detecta.
ARG WHISPER_MODELO=base
ENV WHISPER_MODELO=${WHISPER_MODELO}

# Se conserva aparte el modelo REALMENTE predescargado. Sirve de testigo: es la
# unica forma que tiene el arranque de saber si la variable de servicio diverge
# de la imagen, porque WHISPER_MODELO puede haber sido sobrescrito.
ENV WHISPER_MODELO_PREDESCARGADO=${WHISPER_MODELO}

RUN python -c "from faster_whisper import WhisperModel; WhisperModel('${WHISPER_MODELO}', device='cpu', compute_type='int8')"

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
