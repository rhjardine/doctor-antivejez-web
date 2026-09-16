# B2 — Prototipo de dictado sobre la Guía del Paciente

**Estado:** implementado, **apagado en producción** · **Alcance:** el campo Observaciones de la Guía

---

## 1. Qué hace y qué no

Permite al médico dictar la observación de la Guía en lugar de teclearla. El texto transcrito **no entra en el campo**: se muestra como propuesta, y solo si el médico pulsa *Aceptar* pasa al formulario.

**No hace:** no escribe en base de datos, no envía contexto del paciente a ningún proveedor, no reescribe con IA lo que el médico dijo, y no toca los tests biofísico ni bioquímico.

---

## 2. Tres pasos, no cuatro

El plan original preveía una etapa de estructuración con LLM entre la transcripción y la propuesta. **Se eliminó de B2.** Sobre texto libre no aporta nada y sí introduce riesgo de que un modelo generativo reescriba las palabras del médico. El dictado va del audio al texto y del texto a la propuesta, sin intermediario que interprete.

```
1. CAPTURA      MediaRecorder · el micrófono se abre al pulsar y se cierra al parar
2. TRANSCRIPCIÓN  Server Action → adaptador → texto
3. PROPUESTA    El médico revisa, corrige si hace falta, y acepta o descarta
```

La estructuración vuelve en B3.4 (marcar ítems y dosis por voz), donde sí hace falta, y allí se evalúa con su propio riesgo.

---

## 3. Encenderlo

Apagado por defecto. **Mergear B2 no activa nada.**

```bash
DICTADO_VOZ_ENABLED="true"              # servidor — es la que autoriza
NEXT_PUBLIC_DICTADO_VOZ_ENABLED="true"  # cliente — solo decide si se pinta el botón
DICTADO_VOZ_PROVEEDOR="whisper-local"   # "echo" | "whisper-local" | "whisper-openai"
WHISPER_URL="https://<servicio-whisper>"  # obligatoria con whisper-local
WHISPER_TOKEN="<el mismo secreto del servicio Whisper>"
```

Las dos variables de flag son necesarias, y no es redundancia: la del cliente decide si el botón se dibuja; la del servidor decide si la transcripción ocurre. `NEXT_PUBLIC_*` viaja al navegador y ahí es manipulable, así que **nunca autoriza nada**.

### Los tres adaptadores

| Adaptador | Qué hace | ¿Sale audio del sistema? |
|---|---|---|
| `echo` (por defecto) | Devuelve un texto de prueba con el tamaño recibido | **No** |
| `whisper-local` | El servicio autoalojado de `services/whisper/` | **No** — se queda en la infraestructura propia |
| `whisper-openai` | OpenAI Whisper (`whisper-1`, `language: 'es'`) | Sí, hacia un tercero |

Una configuración incompleta **degrada a `echo` con un aviso**, no lanza: un fallo de configuración debe apagar el dictado, no tumbar la Guía del paciente. Eso incluye `whisper-local` sin `WHISPER_URL`, `whisper-openai` sin `OPENAI_API_KEY`, y cualquier valor no reconocido.

> ⚠️ **El nombre `whisper` a secas es ambiguo y está desaconsejado.** Significaba OpenAI, y en la primera puesta en producción se puso creyendo que apuntaba al servicio autoalojado. Resultado: el audio nunca salió del servicio web —no había clave—, el dictado cayó a `echo`, y el médico interpretó dos veces el texto de prueba como un error del sistema. El alias sigue funcionando para no romper despliegues, pero **avisa en los logs y no se resuelve nunca hacia `whisper-local`**: adivinar la intención con PHI de por medio sería peor que degradar.

> ⚠️ **`whisper-openai` no se enciende en consulta real hasta que exista BAA/DPA firmado.** El audio de un dictado clínico es PHI aunque no se pronuncie el nombre del paciente. `whisper-local` existe precisamente para no tener que negociar ese acuerdo.

### Cómo saber qué adaptador está corriendo

Sin leer el texto dictado, que es PHI:

- **En la pantalla**: si el texto no procede del audio, la propuesta muestra un aviso rojo, *«Esto NO es lo que usted dictó»*, aparte del contenido. No basta con que el texto se explique a sí mismo — eso ya se probó y se leyó como una avería.
- **En los logs del servicio web**: `[dictado] transcripcion ok | proveedor=…`. Si dice `echo`, no hubo transcripción.
- **En los logs del servicio Whisper**: debe aparecer un `POST /transcribe` por cada dictado. Si no aparece ninguno, el servicio web ni siquiera lo está llamando.

---

## 4. Decisiones de diseño, con su razón

1. **El cliente de OpenAI se construye dentro de la función, nunca al importar el módulo.** `src/lib/openai.ts` hace `throw` en la carga si falta `OPENAI_API_KEY`; importarlo aquí haría que un despliegue sin esa clave rompiera la aplicación entera en vez de deshabilitar solo el dictado.
2. **El orden de comprobaciones en la Server Action no es casual:** flag → autorización → validación del audio → proveedor. Con el flag apagado no se resuelve ni la sesión.
3. **`validatePatientAccess` es el mismo punto único que usa `savePatientGuide`.** Un endpoint de transcripción sin guard es un endpoint que transcribe el audio de cualquiera.
4. **No se distingue "no existe" de "no autorizado".** Devolver mensajes distintos le diría a un atacante que ese paciente existe.
5. **El texto dictado nunca se escribe en los logs.** Se registra proveedor, tamaño y latencia; el contenido es PHI y no tiene por qué acabar en los logs de Render. Hay una prueba que lo verifica.
6. **B2 no escribe en base de datos**, ni siquiera en `AIAnalysis` pese a que el modelo existe: registrar el dictado antes de que el médico confirme guardaría palabras que él podría estar descartando.
7. **Las constantes de audio viven fuera del archivo `'use server'`.** Cada export de un módulo de Server Actions es un punto de entrada invocable desde el cliente; solo deben salir de ahí funciones asíncronas.

### Divergencia consciente del plan

El plan decía *push-to-talk* (mantener pulsado). Se implementó **pulsar para iniciar, pulsar para detener**. Mantener el dedo treinta segundos mientras se habla con un paciente es incómodo y se suelta sin querer. La propiedad que importaba —que nunca escuche sin acción explícita, y que se vea claramente que está grabando— se conserva entera: el botón se pone rojo y dice «Detener y transcribir».

---

## 5. Prueba manual, con el flag encendido y `echo`

1. Abrir la Guía de un paciente. Con el flag apagado **no debe aparecer nada**: esa es la primera comprobación.
2. Encender ambos flags. Aparece el botón «Dictar» bajo Observaciones.
3. Pulsar: el navegador pide permiso de micrófono una vez; el botón se pone rojo.
4. Pulsar «Detener y transcribir»: aparece la propuesta. **El campo Observaciones sigue igual.**
5. Pulsar «Descartar»: el campo sigue exactamente igual. **Esta es la prueba que importa.** Si el texto llegó al campo antes de aceptar, B2 está mal.
6. Repetir y pulsar «Aceptar»: ahora sí, el texto entra en el campo.
7. Con texto previo en el campo, comprobar «Añadir al final» y «Reemplazar todo».

---

## 6. Qué falta antes de usarlo con pacientes

1. **Validación del médico.** Que la transcripción acierte no significa que dictar ahorre tiempo. Si no lo ahorra, B3 no se construye.
2. **Corpus de B1 y elección de proveedor** (`docs/voz/b1-evaluacion-transcripcion.md`, en el PR #9).
3. **BAA/DPA firmado** antes de encender `whisper`.
4. **`AuditLog` (A3)** antes de que lo usen varios médicos: hoy no queda registro persistente de qué se dictó ni de quién lo aceptó.
