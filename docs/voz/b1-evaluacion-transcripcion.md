# B1 — Evaluación comparativa de transcripción de voz

**Fase:** B1 del plan de agente de voz clínico · **Estado:** instrumental listo, corpus pendiente
**Decisión que habilita:** qué proveedor de transcripción se contrata, con evidencia y no por catálogo.

---

## 1. Qué decide esta evaluación, y qué no

Decide **un** punto: qué proveedor transcribe con fidelidad suficiente la terminología del
vademécum del Dr. Méndez. No decide la arquitectura del agente (eso es B2), ni qué campos se
dictan (B3), ni si el agente escribe solo — **nunca escribe solo**: el paso de confirmación
humana del plan no es negociable y no depende de qué proveedor gane.

---

## 2. La métrica: recall clínico, no WER

El WER (Word Error Rate) global es la métrica estándar de la industria y es **insuficiente aquí**.

En un dictado de 20 palabras, fallar `Transfer Tri Factor` y acertar todo lo demás da un
WER del 15% —una cifra que cualquier proveedor presentaría como buena— mientras el único
dato con consecuencia clínica quedó mal. Un producto mal transcrito es una indicación errónea.

Por eso la cifra que decide es el **recall clínico**:

```
recall clínico = (términos recuperados exactos + recuperados por alias) / términos dictados
```

El WER global se calcula igualmente y se reporta, pero como contexto.

### Los cuatro estados de un término

| Estado | Significado | ¿Cuenta como acierto? |
|---|---|---|
| **exacto** | Recuperado literalmente (ignorando tildes, mayúsculas y puntuación) | Sí |
| **alias** | Recuperado en una variante hablada que **el equipo declaró** equivalente | Sí |
| **aproximado** | Reconocible pero mal escrito (`telomeras` por `Telomeros`) | **No** |
| **perdido** | Nada suficientemente parecido en la transcripción | No |

**Un casi-acierto no es un acierto.** `Mega GH cuatro` no es `MegaGH4`: es otro nombre.
Los aproximados se cuentan aparte porque dicen *cómo* falla el proveedor —dato accionable—,
no para inflar la nota.

### Los alias los decide una persona, no el algoritmo

Si el equipo considera que `mega gh 4` es una transcripción aceptable de `MegaGH4`,
se declara como alias en el manifiesto y pasa a contar como acierto. Esa es una decisión
clínica y editorial, deliberadamente fuera del algoritmo: un medidor que decidiera por sí
mismo qué variantes son "suficientemente parecidas" estaría midiendo su propia tolerancia.

---

## 3. El léxico sale del catálogo real, no de una lista inventada

`src/lib/voice/clinical-lexicon.generated.ts` contiene **162 términos** extraídos
automáticamente del catálogo de la Guía del Paciente
(`src/components/patient-guide/PatientGuide.tsx`), que es la fuente que el médico ya usa.

- Regenerar: `npm run voz:lexico`
- La sincronía se verifica en CI (`clinical-lexicon.test.ts`): si el catálogo cambia y el
  léxico no, **el test falla**. El léxico no puede quedarse obsoleto en silencio.

---

## 4. Protocolo del corpus

### Base legal — antes de grabar

> **Ningún audio con datos de paciente sale hacia un proveedor sin BAA/DPA firmado.**

Durante B1 esto se resuelve de la única forma limpia: **el corpus no contiene PHI**.
Son dictados representativos construidos para la prueba, con nombres de producto y
posología reales pero **sin nombre, cédula, fecha de nacimiento ni dato identificable
de ningún paciente**. La referencia se escribe antes de grabar, y se dicta esa referencia.

### Composición

15–20 dictados, grabados por el Dr. Méndez con su voz, su micrófono y el ruido ambiente
habitual de consulta — no en condiciones de estudio, porque no es ahí donde se va a usar.

Reparto sugerido:

| Bloque | Cantidad | Contenido |
|---|---|---|
| Productos del vademécum propio | 6 | `MegaGH4`, `StemCell Enhancer`, `Transfer Tri Factor`, `Telomeros`, `Oligocell`, `Exosoma Serum` |
| Sueros y terapias | 4 | `Quelación`, `Bioxigenación`, `Cámara Hiperbárica`, `Factores Autólogos PRP` |
| Homeopáticos y flores de Bach | 3 | Nombres en inglés dentro de frase en español (`Rescue Remedy`, `Star of Bethlehem`) |
| Posología y frecuencia | 4 | "dos veces al día", "en ayunas", "días alternos", cantidades y unidades |
| Observación libre | 3 | Texto corrido como el que hoy escribe a mano en la Guía |

Los bloques 1 y 3 son los que más discriminan: nombres propios y anglicismos dentro de
frase en español es exactamente donde un modelo genérico se rompe.

### Registro

Por cada dictado se anota: `id`, la **referencia** (lo que se dijo, transcrito por una
persona), los términos del vademécum que contiene, y la duración. Esa lista de términos la
declara quien graba — no se detecta automáticamente, porque un detector automático mediría
su propia inferencia en lugar de medir al proveedor.

---

## 5. Cómo se ejecuta

Las transcripciones se obtienen fuera de esta herramienta (cada proveedor con su SDK o su
consola), se vuelcan al manifiesto, y el informe se genera sin red ni claves:

```bash
npm run voz:evaluar -- docs/voz/manifiesto-real.json
```

Formato del manifiesto: ver `docs/voz/manifiesto-ejemplo.json`.

> El ejemplo es **ilustrativo y sintético**. Sus proveedores se llaman `proveedor-a/b/c`
> a propósito: esas cifras **no** son una medición de Whisper, Deepgram ni Azure.

Salida del ejemplo, que muestra por qué esta evaluación existe:

| Proveedor | Recall clínico | WER global | Latencia mediana | USD/min |
|---|---|---|---|---|
| proveedor-a | 100,0% | 0,0% | 1200 ms | $0,0060 |
| proveedor-b | 60,0% | 13,0% | 850 ms | $0,0045 |
| proveedor-c | 30,0% | 20,3% | 640 ms | $0,0025 |

`proveedor-c` es el más rápido y el más barato, y pierde siete de cada diez términos
clínicos. `proveedor-b` presenta un WER del 13% —presentable en una ficha comercial— y
pierde el 40%. Elegir por precio o por WER habría elegido mal en ambos casos.

---

## 6. Candidatos a evaluar

Cuatro, por razones distintas:

| Candidato | Por qué está en la lista | Situación contractual |
|---|---|---|
| **OpenAI Whisper** (API) | `openai` v6 ya está en `package.json`; camino más corto | ⬜ *por verificar y fechar* |
| **Deepgram Nova** | Fuerte en español latinoamericano y en vocabulario personalizado | ⬜ *por verificar y fechar* |
| **Azure Speech** | Permite listas de frases propias (el vademécum) y ofrece acuerdos de tratamiento de datos maduros | ⬜ *por verificar y fechar* |
| **Whisper autoalojado** | Elimina la cuestión contractual: el audio no sale de la infraestructura. A cambio, coste de cómputo | No aplica proveedor externo |

**La columna contractual está deliberadamente vacía.** No la relleno con lo que recuerdo de
las condiciones de estos proveedores: son términos que cambian, y una afirmación
desactualizada sobre un BAA es exactamente el tipo de error que no se puede permitir aquí.
La rellena el equipo con la condición vigente, con enlace y fecha de consulta.

Los tres proveedores externos que soporten vocabulario personalizado deben evaluarse
**dos veces**: sin el léxico y con los 162 términos cargados. Esa diferencia suele ser
mayor que la diferencia entre proveedores.

---

## 7. Umbral de decisión

Lo propongo; lo fija el médico, porque es él quien asume la consecuencia de un error:

- **Recall clínico ≥ 95%** con el léxico cargado, sobre los bloques 1 y 3 (nombres propios).
- **Ningún término del bloque 1 perdido de forma sistemática** — un producto que el
  proveedor nunca acierta es un producto que no se podrá dictar, y eso hay que saberlo antes.
- **Latencia mediana ≤ 3 s** para un dictado de ~15 s. Por encima, el médico vuelve a mirar
  la pantalla y se pierde el motivo de todo esto.
- Coste y contrato: criterios de desempate, **no** de selección.

Si ningún proveedor alcanza el umbral con vocabulario personalizado, la conclusión legítima
es **no contratar todavía** y reducir el alcance de B3 a observación libre, donde un error
de transcripción lo ve el médico al confirmar y no cambia una posología.

---

## 8. Límites conocidos del medidor

Honestidad sobre la herramienta, para que nadie la lea como más de lo que es:

1. **La segmentación cuenta como fallo.** `MegaGH4` transcrito `mega gh 4` sale `perdido`
   (similitud 0,714). Es correcto por defecto —son cadenas distintas— y se corrige
   declarando el alias, que es una decisión humana explícita y trazable.
2. **Un "aproximado" puede ser en realidad otro producto.** `Exosomas` frente a
   `exosoma serum` puntúa 0,875 y se clasifica aproximado, pese a ser dos ítems distintos
   del catálogo. No infla el recall (los aproximados no suman), pero puede confundir en el
   diagnóstico: al revisar la lista de fallos hay que mirar el fragmento encontrado.
3. **No mide puntuación, ni diarización, ni detección de fin de dictado.** Son relevantes
   para B2 y se evalúan allí, con el prototipo delante.
4. **No mide números.** Las cifras de posología entran en el WER global pero no son términos
   del léxico. Es coherente con el alcance: **dictar valores de los tests biofísico y
   bioquímico queda fuera del agente**, por decisión ya tomada — un error de transcripción
   ahí produce una edad biológica errónea.

---

## 9. Qué queda listo tras B1

| Artefacto | Ruta |
|---|---|
| Léxico clínico generado (162 términos) | `src/lib/voice/clinical-lexicon.generated.ts` |
| Extractor del catálogo | `src/lib/voice/lexicon-extractor.ts` |
| Medidor de precisión por término | `src/lib/voice/term-accuracy.ts` |
| Agregación comparativa | `src/lib/voice/comparison-report.ts` |
| CLI de informe | `scripts/evaluar-transcripcion.ts` (`npm run voz:evaluar`) |
| Manifiesto de ejemplo | `docs/voz/manifiesto-ejemplo.json` |

Nada de esto toca la base de datos, la lógica de cálculo ni producción. No hay migraciones.
El motor biofísico queda intacto y la suite dorada, verde.

**Siguiente paso, y es del médico, no mío:** grabar el corpus. Sin audio real no hay
evaluación, y sin evaluación no hay decisión de proveedor defendible.
