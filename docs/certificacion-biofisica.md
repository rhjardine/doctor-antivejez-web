# Certificación del Motor de Edad Biofísica — Fase A

**Fecha:** 2026-08-15
**Alcance:** certificar sin alterar (Plan v2, §4)
**Fuente normativa:** *Tabla de Cálculo de Edad Biofísica* — Centro Médico Doctor Antivejez
**Suite:** `src/utils/biofisica-certification.test.ts`
**Resultado:** **226/226 pruebas en verde** · motor **no modificado**

---

## 1. Qué se hizo y qué no

| | |
|---|---|
| ✅ Se hizo | Transcribir la tabla oficial a una suite de valores dorados y verificar celda por celda que el motor la reproduce |
| ✅ Se hizo | Fijar una red de no regresión para todos los hitos posteriores (§7) |
| ✅ Se hizo | Documentar el comportamiento de las ambigüedades congeladas |
| ❌ **No** se hizo | Modificar `PreciseBiophysicalAgeCalculator`, baremos, interpolación, redondeos o promedios |
| ❌ **No** se hizo | Añadir el pulso en reposo (§1.1 — fuera de alcance por decisión del dueño) |
| ❌ **No** se hizo | Tocar el test bioquímico (§2.1) |
| ❌ **No** se hizo | Recalcular o migrar resultados históricos (§2.4) |

**Diferencia neta sobre la lógica de cálculo: cero líneas.**

---

## 2. Criterio de aceptación (ratificado — conflicto C1, Opción 3)

La interpolación lineal dentro del septenio queda **ratificada como correcta**. Por tanto:

> Una prueba pasa si la edad devuelta **cae dentro del septenio oficial** correspondiente al valor de entrada. Los rangos de doble umbral deben devolver el **mismo septenio** que su rango principal.

Las aserciones usan **puntos interiores** de cada banda (25% y 75%), nunca los extremos: en la tabla oficial el límite superior de una banda coincide con el inferior de la siguiente, de modo que un extremo es legítimamente ambiguo y no sirve como evidencia.

---

## 3. Resultado de la certificación — 14 septenios × 8 parámetros

| Parámetro | Rango principal | Doble umbral | Estado |
|---|---|---|---|
| % grasa masculino | 14/14 | 8/8 | ✅ Conforme |
| % grasa masculino deportivo | 14/14 | — | ✅ Conforme |
| % grasa femenino | 14/14 | 8/8 | ✅ Conforme |
| % grasa femenino deportivo | 14/14 | — | ✅ Conforme |
| Índice de Masa Corporal | 14/14 | ⚠️ congelado (§1.4) | ✅ Conforme en rango principal |
| Reflejos digitales | 14/14 | — | ✅ Conforme (inverso) |
| Acomodación visual | 14/14 | — | ✅ Conforme |
| Balance estático | 14/14 | — | ✅ Conforme (inverso) |
| Hidratación cutánea | 14/14 | — | ✅ Conforme |
| Tensión arterial sistólica | 14/14 | 12/12 | ✅ Conforme |
| Tensión arterial diastólica | 14/14 | 8/8 | ✅ Conforme |

**Conclusión:** el motor reproduce fielmente la tabla oficial en los 8 parámetros en uso clínico, incluidos todos los rangos de doble umbral.

### 3.1 Valores dorados ratificados por el dueño (§4.1)

Los 11 casos de la instrucción se verificaron y **todos pasan**:

| Caso | Esperado | Estado |
|---|---|---|
| % grasa masculino 10–14 | 21-28 | ✅ |
| IMC 18–22 | 21-28 | ✅ |
| Reflejos digitales 35–30 | 35-42 | ✅ |
| Balance estático 15–12 | 49-56 | ✅ |
| Hidratación cutánea 32–64 | 63-70 | ✅ |
| Tensión sistólica 140–150 | 49-56 | ✅ |
| Tensión sistólica 90–85 (umbral bajo) | 49-56 | ✅ |
| % grasa femenino 38–41 | 63-70 | ✅ |
| % grasa femenino 17.99–15 (umbral bajo) | 63-70 | ✅ |
| Tensión diastólica 130–140 | 98-105 | ✅ |
| Tensión diastólica 44–41 (umbral bajo) | 98-105 | ✅ |

Se verifica además que cada par principal/bajo devuelve **exactamente el mismo septenio**.

### 3.2 Semántica clínica (§1.5)

| Invariante | Estado |
|---|---|
| Edad máxima = 120 años | ✅ Verificado en los 6 parámetros con tope superior |
| Ningún parámetro supera 120 | ✅ Verificado sobre toda la tabla |
| Parámetros inversos: valor alto = menor edad | ✅ Verificado (reflejos, balance) |
| Edad biofísica = promedio de **8** baremos entre 8 | ✅ Verificado |
| Diferencial = edad biofísica − edad cronológica | ✅ Verificado |
| El motor no expone ningún parámetro de pulso | ✅ Verificado (§1.1) |

> **Nota sobre el signo del diferencial.** El motor calcula `diferencial = edad biofísica − edad cronológica`, de modo que un valor **negativo** indica rejuvenecimiento. La instrucción (§1.5) lo enuncia como `cronológica − biofísica`, que es el signo opuesto. Es una diferencia de **presentación, no de cálculo**, y se resolverá en la pista de UI (§5) al definir el semáforo, sin tocar el motor. Queda anotada para tu ratificación.

---

## 4. Desviaciones congeladas (§1.4) — pendientes de ratificación clínica

Se documentan sin resolver, conforme a la instrucción.

### 4.1 IMC — rango secundario desplazado un septenio

El documento oficial presenta una discontinuidad: salta de `15-14` a `13-12`, sin cubrir el intervalo `14-13`. El código cerró ese hueco insertando `14-13` y desplazando los tramos siguientes.

| Septenio | Tabla oficial | Código actual |
|---|---|---|
| 91-98 | 13-12 | 14-13 |
| 98-105 | 12-11 | 13-12 |
| 105-112 | 11-10 | 12-11 |
| 112-120 | 10-<9 | 11-10 |

**Comportamiento actual medido y fijado como línea base:**

| IMC | Edad devuelta hoy |
|---|---|
| 17 | 74 |
| 15,5 | 81 |
| 14,5 | 88 |
| 13,5 | 95 |
| 12,5 | 102 |
| 11,5 | 109 |
| 10,5 | 116 |
| 9,5 | 120 (bajo el umbral inferior del código) |

Estos valores están cubiertos por tests de **caracterización**, explícitamente marcados como *no ratificados*: fijan lo que el sistema hace hoy para que cualquier cambio accidental sea visible, sin declararlo clínicamente correcto.

**Impacto:** solo afecta a pacientes con IMC inferior a 15 (desnutrición). En la práctica clínica del centro es una población marginal.

### 4.2 Acomodación visual — valores fuera de la tabla

La tabla llega a **53 cm** (`50->53 → 112-120`). Un valor de 120 cm, observado en pantalla, queda por encima del máximo y el motor lo lleva al tope de 120 años.

Tras tu aclaración del método de medición (regla de madera soltada en el aire, medida en el punto de agarre), el requisito derivado es de **interfaz, no de motor**: validar el rango de entrada y advertir sobre valores fuera de tabla. Se implementa en §5.4 de la pista de UI.

---

## 5. Hallazgo operativo — el CI estaba roto

Al preparar el entorno, `npm ci` falló:

```
npm error `npm ci` can only install packages when your package.json and
npm error package-lock.json are in sync.
npm error Missing: vitest@3.2.7 from lock file
```

**Consecuencia:** el workflow `.github/workflows/ci.yml` —que ejecuta `npm ci` antes de los tests obligatorios— **no podía completarse**. El protocolo de no regresión (§7) depende de ese workflow, así que la certificación no tendría dónde ejecutarse.

`render-build.sh` usa `npm install` en vez de `npm ci`, por lo que **el despliegue de producción no estaba afectado**; el fallo era exclusivo de CI.

**Resolución:** se sincronizó `package-lock.json`. Verificado: `npm ci` termina con exit 0.

---

## 6. Protocolo de no regresión activado (§7)

A partir de este hito:

1. **Línea base:** 226 pruebas en verde (5 preexistentes + 221 de certificación).
2. **Cada PR posterior** debe dejar la suite al 100%. Si un cambio de UI o de la Guía altera un solo resultado de cálculo → **revertir y reportar**.
3. Ejecución: `npm run test:ci`.

---

## 7. Rollback

Este hito **no toca código de producción**: añade un archivo de tests y un documento, y sincroniza el lockfile. El riesgo funcional es nulo.

| Escenario | Acción |
|---|---|
| Revertir el hito completo | `git revert <sha>` — elimina tests y documento |
| Revertir solo el lockfile | `git checkout <sha-anterior> -- package-lock.json` (CI vuelve a fallar; producción no se ve afectada) |
| Producción | Sin exposición: Render despliega desde `main` y este trabajo vive en `claude/doctor-antivejez-audit-2nigiq` |

---

## 8. Pendientes para ratificación del dueño

1. **Signo del diferencial** (§3.2): el motor usa `biofísica − cronológica`; la instrucción enuncia `cronológica − biofísica`. Definir el criterio de presentación antes de implementar el semáforo.
2. **Rango secundario del IMC** (§4.1): ¿el hueco `14-13` es una errata del documento, o los tramos son los impresos?
3. **Umbrales numéricos del semáforo** (§5.2): quedan parametrizados en constantes configurables hasta tu ratificación.
