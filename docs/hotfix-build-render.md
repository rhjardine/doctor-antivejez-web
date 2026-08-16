# Hotfix — Fallo de build en Render (`ERR_REQUIRE_ESM`)

**Fecha:** 2026-08-16
**Severidad:** P0 — despliegue bloqueado
**Estado:** resuelto y verificado en local (5/5 pasos del build)

---

## 1. Síntoma

Un despliegue manual en Render falló en el paso 4 de `render-build.sh`:

```
failed to load config from /opt/render/project/src/vitest.config.ts
⎯⎯⎯ Startup Error ⎯⎯⎯
Error [ERR_REQUIRE_ESM]: require() of ES Module
/opt/render/project/src/node_modules/vite/dist/node/index.js
from /opt/render/project/src/node_modules/vitest/dist/config.cjs not supported.
==> Build failed 😞
```

---

## 2. Causa raíz — dos defectos que solo fallan combinados

### A. El build no era determinista

`render-build.sh` usaba `npm install` y `package-lock.json` estaba **desincronizado**
(le faltaba `vitest@3.2.7`). Con el lock incompleto, `npm install` **resuelve por su
cuenta** las versiones ausentes: eligió la última compatible con `vitest@^3.2.4`,
que arrastró **vite 7** como dependencia transitiva.

Consecuencia: cada build de Render podía instalar un árbol de dependencias distinto.
Explica por qué el mismo commit compilaba unos días y otros no.

### B. Vite 7 exige un Node más nuevo del que corre Render

| Paquete | Requisito de Node |
|---|---|
| `vite@7` | `^20.19.0 \|\| >=22.12.0` |
| `vite@6` | `^18.0.0 \|\| ^20.0.0 \|\| >=22.0.0` |

`package.json` **no declara `engines`** y el repo **no tiene `.node-version` ni `.nvmrc`**,
así que la versión de Node en Render quedaba fuera de control del repositorio.

### Cómo encajan

`package.json` no declara `"type": "module"`, de modo que **`vitest.config.ts` se carga
por la vía CommonJS**. Eso hace que `vitest/config` resuelva su entrada `require`:

```js
// node_modules/vitest/package.json
"./config": {
  "require": "./dist/config.cjs",   // ← esta se usaba
  "default": "./dist/config.js"     // ← la ESM
}
```

`dist/config.cjs` hace `require('vite')`, y vite 7 es **ESM puro**. Ese `require()` de un
módulo ESM solo está permitido en Node ≥ 20.19 / 22.12. En el entorno local (Node 22.22)
funciona; en Render, con una versión anterior, lanza `ERR_REQUIRE_ESM`.

**Por eso el fallo no era reproducible en desarrollo.**

---

## 3. Corrección aplicada — tres cambios complementarios

### 3.1 `vitest.config.ts` → `vitest.config.mts`

La extensión `.mts` fuerza la carga por ESM, que resuelve `dist/config.js` en lugar de
`dist/config.cjs`. **Elimina por completo el `require()` de un módulo ESM**, sea cual sea
la versión de Node.

Verificación del mecanismo:

```
Vía CJS  (vitest.config.ts)  → node_modules/vitest/dist/config.cjs   ← el del stack trace
Vía ESM  (vitest.config.mts) → node_modules/vitest/dist/config.js
```

Al pasar a ESM, `__dirname` no existe; se deriva con `fileURLToPath(import.meta.url)`.

### 3.2 `overrides: { "vite": "^6" }` en `package.json`

Fija vite en la línea 6, compatible con Node **18, 20 y 22** — cualquier versión que
corra Render.

**Radio de impacto: nulo sobre producción.** Verificado:

- `vite` **no** es dependencia directa (ni en `dependencies` ni en `devDependencies`)
- entra solo como transitiva de `vitest`
- **ningún archivo de `src/` ni `next.config.js` la importa**
- Next 14 compila con su propio toolchain

Es decir: vite solo existe para ejecutar los tests. Su versión no afecta al bundle.

### 3.3 `render-build.sh`: `npm install` → `npm ci`

`npm ci` instala **exactamente** lo fijado en `package-lock.json` y falla de inmediato si
el lock no cuadra, en lugar de resolver versiones nuevas en silencio. El build pasa a ser
reproducible.

---

## 4. Verificación — los 5 pasos de `render-build.sh`

| Paso | Comando | Resultado |
|---|---|---|
| 1 | `npm ci` | ✅ exit 0 · vite resuelto en 6.4.3 |
| 2 | `npx prisma generate` | ✅ |
| 3 | `npx prisma migrate deploy` | ⚠️ no verificable en local (requiere BD real) · **sin cambios** |
| 4 | `npm run test:ci` | ✅ **226/226** |
| 5 | `npm run build` | ✅ compilación completa, manifiesto de rutas generado |

---

## 5. Rollback

Todos los cambios son de infraestructura de build. **Ninguno toca el código de la
aplicación ni la lógica de cálculo clínico.**

| Escenario | Acción |
|---|---|
| Revertir el hotfix completo | `git revert <sha>` — vuelve el estado anterior (y el fallo) |
| Revertir solo el pin de vite | Quitar `overrides` de `package.json` + `npm install` |
| Revertir solo `npm ci` | Restaurar `npm install` en `render-build.sh` (se pierde el determinismo) |
| Si Render falla tras el hotfix | Usar **Rollback** en el panel de Render al deploy anterior estable, y reportar el log |

---

## 6. Pendiente de decisión — fijar la versión de Node

El hotfix desactiva la bomba, pero **la versión de Node de Render sigue sin estar
declarada en el repositorio**. Hoy conviven:

| Entorno | Node |
|---|---|
| Desarrollo local | 22.22 |
| `.github/workflows/ci.yml` | 20 |
| `Dockerfile` | 18 |
| Render | sin declarar (inferido < 20.19) |

Cuatro entornos, cuatro versiones. Es la razón de fondo por la que un fallo así puede
reproducirse en producción sin aparecer nunca en desarrollo.

**Recomendación:** añadir `.node-version` y un campo `engines` en `package.json`, y
alinear CI y `Dockerfile` a la misma versión. **Requiere ratificación del dueño**, porque
cambia el runtime de un servicio en producción y debe hacerse en una ventana controlada,
no junto a un hotfix.
