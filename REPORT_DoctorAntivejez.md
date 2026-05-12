# Informe técnico: Doctor Antivejez — Arquitectura e integración (Next.js & PWA)

**Fecha:** 2026-05-05

---

## Tabla de contenidos

- Resumen ejecutivo
- Alcance y objetivos
- Arquitectura general (diagramas)
- Componentes y responsabilidades
- Flujo de datos
- Modelado de datos (ejemplo Prisma)
- Contratos de API y endpoints recomendados
- Autenticación y autorización
- Sincronización offline (PWA)
- Almacenamiento de archivos
- Observabilidad y métricas
- CI/CD y despliegue
- Seguridad y cumplimiento
- Testing y QA
- Roadmap por fases
- Recomendaciones priorizadas
- Riesgos y mitigaciones
- Entregables y checklist
- Anexos (OpenAPI mínimo, Prisma models, snippets PWA)

---

## Resumen ejecutivo

Este informe documenta la arquitectura, la integración y las decisiones técnicas recomendadas para el proyecto **Doctor Antivejez** compuesto por:

- La plataforma principal de administración y backend: `Next.js` (repositorio: doctor-antivejez-web).
- La aplicación cliente orientada a pacientes: PWA construida con `Vite` + `React` (repositorio: DoctorAntivejez_Patients).

El objetivo es ofrecer una visión completa que permita: asegurar la integridad y seguridad de los datos, mejorar la experiencia PWA (offline, sincronización), definir contratos de API claros, y proponer un roadmap de implementación por fases.

---

## Alcance y objetivos

- Describir la arquitectura actual y la relación entre ambos proyectos.
- Proponer recomendaciones técnicas prioritarias.
- Definir un roadmap por fases con entregables.
- Dar ejemplos prácticos: modelos Prisma, endpoints, snippets de sincronización offline y pipeline CI/CD.

---

## Arquitectura general

```mermaid
graph TD
    subgraph Web[Doctor Antivejez Web (Next.js)]
        A[Next.js App]
        B[Prisma ORM]
        C[Base de Datos (SQL)]
        D[API REST/GraphQL]
        H[Auth / NextAuth or JWT]
    end
    subgraph PWA[Doctor Antivejez Patients (Vite/React)]
        E[Vite/React App]
        F[PWA Service Worker]
        G[API Client]
        I[IndexedDB (outbox/local cache)]
    end
    A -- "Expone API" --> D
    D -- "Acceso a datos" --> B
    B -- "Lee/Escribe" --> C
    E -- "Consume API" --> G
    G -- "Solicitudes HTTP" --> D
    F -- "Cache y Offline" --> E
    I -- "Cola de operaciones" --> F
    H -- "Auth & Tokens" --> D
    style Web fill:#cce5ff,stroke:#333,stroke-width:2px
    style PWA fill:#d4edda,stroke:#333,stroke-width:2px
```

**Notas**: La separación clara entre backend (Next.js) y cliente (PWA) permite reutilizar API y centralizar la lógica de negocio y la seguridad.

---

## Componentes y responsabilidades

- **Next.js (doctor-antivejez-web)**
  - Panel de administración, rutas API (`/api/*`), lógica de negocio y cron jobs/scripts (ver `scripts/` en el repo).
  - ORM: `Prisma` (modelo en `prisma/schema.prisma`).
  - Management de migraciones: `prisma migrate`.
- **PWA (DoctorAntivejez_Patients)**
  - Interfaz móvil/progresiva, caché y soporte offline mediante `Service Worker`.
  - Local store: `IndexedDB` (para sincronización y caché de datos críticos).
  - Consumo de la API del backend mediante cliente HTTP (fetch/axios) con manejo de reintentos y backoff.
- **Base de datos**
  - SQL relacional (Postgres recomendable) con backups automáticos y políticas de retención.

En el repo `doctor-antivejez-web` puedes revisar el esquema en: [prisma/schema.prisma](prisma/schema.prisma)

---

## Flujo de datos (alto nivel)

1. El usuario (PWA) realiza una operación (crear/actualizar registro).
2. Si hay conexión, la PWA envía la petición al endpoint correspondiente (`/api/...`).
3. El backend valida, aplica reglas de negocio y persiste con `Prisma` en la DB.
4. La PWA mantiene una copia en `IndexedDB` y una cola (`outbox`) para operaciones pendientes.
5. Cuando la PWA detecta reconexión, el Service Worker/Background Sync procesa la cola enviando las operaciones en orden.

---

## Modelado de datos — ejemplo (Prisma)

Ejemplo de modelos básicos en `Prisma` (resumen):

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      String   @default("user")
  password  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Patient {
  id        Int      @id @default(autoincrement())
  name      String
  dob       DateTime
  dni       String?  @unique
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  observations Observation[]
}

model Observation {
  id         Int      @id @default(autoincrement())
  patientId  Int
  type       String
  value      String
  recordedAt DateTime @default(now())
  createdAt  DateTime @default(now())
  patient     Patient @relation(fields: [patientId], references: [id])
}

model Appointment {
  id         Int      @id @default(autoincrement())
  patientId  Int
  scheduled  DateTime
  status     String   @default("scheduled")
  createdAt  DateTime @default(now())
  patient     Patient @relation(fields: [patientId], references: [id])
}
```

---

## Contratos de API y endpoints recomendados

Recomiendo definir y versionar una spec OpenAPI (o GraphQL schema) desde el inicio. A continuación un listado mínimo funcional de endpoints REST:

- `POST /api/auth/login` — login, devuelve `accessToken` + `refreshToken`.
- `POST /api/auth/refresh` — rota y devuelve nuevo `accessToken`.
- `GET /api/patients` — lista paginada de pacientes.
- `GET /api/patients/:id` — detalle de paciente.
- `POST /api/patients` — crear paciente.
- `PUT /api/patients/:id` — actualizar paciente.
- `GET /api/patients/:id/observations` — historial clínico.
- `POST /api/appointments` — agendar cita.
- `POST /api/sync/outbox` — endpoint para procesar lotes sincronizados (opcional, para PWA).

Para cada endpoint se debe definir: esquema de request/response, códigos HTTP, autorización y límites (rate limit).

---

## Ejemplo mínimo OpenAPI (ver Anexo A)

Ver Anexo A al final del documento para una spec mínima en YAML que cubre `auth` y `patients`.

---

## Autenticación y autorización

- **Opción recomendada:** `NextAuth` para integración rápida con proveedores y sesiones, o **JWT con refresh tokens** si se requiere control total sobre tokens en la PWA.
- **Boilerplate de seguridad**:
  - `accessToken` de corta duración (ej. 15 min).
  - `refreshToken` almacenado de forma segura (server-side sessions o httpOnly cookie).
  - Rechazo de tokens revocados: mantener lista de revocación para refresh tokens.
  - Reglas de roles (`admin`, `clinician`, `patient`) y scopes por endpoint.

---

## Sincronización offline (PWA)

Arquitectura recomendada:

- **Local store:** `IndexedDB` para guardar datos del usuario, caché y `outbox` (cola de operaciones pendientes).
- **Service Worker:** cache de assets, estrategias `stale-while-revalidate` o `network-first` según el recurso.
- **Outbox pattern:** las operaciones de escritura se encolan con metadatos (uuid, timestamp, type, payload). Al reconectar, la app sincroniza en orden.
- **Reconciliación:** versionado por entidad (`version` o `updatedAt`) y resolución de conflictos (preferencias: `server-wins`, `client-wins`, o UI para merge manual).

Pseudocódigo cliente (simplificado):

```javascript
// Enqueue
async function enqueue(op) {
  const db = await openDB('doctor-antivejez', 1);
  await db.add('outbox', { id: genUUID(), ...op, status: 'pending' });
}

// Sync
async function syncOutbox() {
  const db = await openDB('doctor-antivejez', 1);
  const ops = await db.getAllFromIndex('outbox', 'status', 'pending');
  for (const op of ops) {
    try {
      await api.post('/api/sync/outbox', op);
      await db.delete('outbox', op.id);
    } catch (err) {
      // reintentar con backoff o dejar para siguiente sincronización
    }
  }
}
```

Service Worker (background sync minimal):

```javascript
self.addEventListener('sync', function(event) {
  if (event.tag === 'outbox-sync') {
    event.waitUntil(syncOutboxFromSW());
  }
});
```

Notas:
- Background Sync no está disponible en todos los navegadores; usar un fallback con reconexión en la app.
- Mantener idempotencia en endpoints backend para evitar duplicados (usar `operationId`/UUID).

---

## Almacenamiento de archivos y multimedia

- Usar almacenamiento externo (S3 o compatible) y servir vía CDN.
- Uploads: realizar `POST /api/uploads/init` que devuelve URL firmada para subir directamente al bucket.
- Mantener metadatos en la DB y versiones si aplica.

---

## Observabilidad y métricas

- Logs estructurados (JSON) con niveles y contexto (requestId, userId).
- Métricas clave: latencia (p95/p99), tasas de error, throughput, número de items en cola outbox.
- Tracing distribuido (OpenTelemetry) para endpoints con largos procesos asíncronos.
- Alertas sobre: errores 5xx, cola de sincronización en PWA con backlog, backups fallidos.

---

## CI/CD y despliegue (sugerido)

- Pipelines:
  - PR: lint, tests unitarios, build (Next + PWA), run tests estáticos.
  - Merge a `main`: deploy a `staging` y notificación.
  - Release: despliegue a `production` con migraciones revisadas.

Ejemplo resumido para `GitHub Actions` (ver Anexo B para snippet):

- Jobs: `install`, `test`, `build-next`, `build-pwa`, `deploy`.

Recomendación de hosting:
- Backend: Vercel (Next) o contenedores Docker en Cloud (si usan servicios externos o cron jobs).
- PWA: Netlify, Vercel o hosting estático con CDN.

---

## Seguridad y cumplimiento

- TLS obligatorio en todas las comunicaciones.
- Cifrado en reposo según sensibilidad de datos (si requiere medida legal).
- Role-based access control (RBAC). Minimizar datos mostrados a pacientes.
- Revisiones de dependencias y escaneo de vulnerabilidades (Dependabot, Snyk).

---

## Testing y QA

- Unit tests para lógica de negocio y componentes.
- Integration tests para endpoints críticos (`auth`, `patients`, `sync`).
- E2E para flujos primarios (admin create patient, patient view, PWA offline → sync).
- Contract tests (Pact) entre backend y PWA para evitar roturas de contrato.

---

## Roadmap por fases (estimaciones)

- **Fase 0 — Inventario & Preparación (1 sprint)**
  - Revisar `prisma/schema.prisma`, endpoints existentes y contratos.
- **Fase 1 — Seguridad y Datos (2 sprints)**
  - Auth robusto, roles, migraciones y backups.
- **Fase 2 — PWA Offline & Sync (2–3 sprints)**
  - Implementar `outbox`, Service Worker, pruebas offline.
- **Fase 3 — Observabilidad y Escalado (1–2 sprints)**
  - Monitoring, tracing y alertas.
- **Fase 4 — Hardening & QA (1–2 sprints)**
  - Tests e2e, audit de seguridad y despliegue estable.

---

## Recomendaciones priorizadas (resumen)

1. **Autenticación y control de accesos** (imprescindible).
2. **Integridad y migraciones reproducibles** (Prisma migrations + backups).
3. **Sincronización offline** (outbox + reconciliación).
4. **Definir y versionar API (OpenAPI/GraphQL)**.
5. **Observabilidad** (logs, métricas, tracing).

---

## Riesgos y mitigaciones

- Conflictos por sincronización offline → versionado por entidad y resolución de conflictos.
- Fugas de datos sensibles → revisiones de acceso + cifrado.
- Dependencias externas críticas → abstracción y plan de fallback.

---

## Entregables y checklist (sugerido)

- Informe técnico (este documento).
- Spec OpenAPI v1 (`openapi.yml`).
- Ejemplos de modelos Prisma y migraciones reproducibles.
- PoC PWA: `outbox` + `sync` en `DoctorAntivejez_Patients`.
- Pipeline CI/CD (workflows YAML).

---

## Próximos pasos (opciones)

- Opción 1: Genero la `openapi.yml` mínima y la guardo en `doctor-antivejez-web/spec/`.
- Opción 2: Creo un PoC pequeño de la cola `outbox` en la PWA (archivos y prueba local).
- Opción 3: Creo el workflow de `GitHub Actions` propuesto y lo añado al repo.

Indica la opción que prefieres y la implemento.

---

## Anexos

### Anexo A — OpenAPI mínimo (extracto)

```yaml
openapi: 3.0.1
info:
  title: Doctor Antivejez API
  version: v1
paths:
  /api/auth/login:
    post:
      summary: Login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: OK
  /api/patients:
    get:
      summary: Lista de pacientes
      parameters:
        - in: query
          name: page
          schema:
            type: integer
      responses:
        '200':
          description: Lista paginada
```

### Anexo B — GitHub Actions (snippet)

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm run test --if-present
      - run: npm run build --if-present
```

### Anexo C — Snippet PWA: outbox (idb)

```javascript
import { openDB } from 'idb';

export async function initDB() {
  return openDB('doctor-antivejez', 1, {
    upgrade(db) {
      db.createObjectStore('outbox', { keyPath: 'id' });
    }
  });
}

export async function enqueueOp(op) {
  const db = await initDB();
  await db.add('outbox', { id: op.id, ...op, status: 'pending' });
}

export async function getPending() {
  const db = await initDB();
  return db.getAll('outbox');
}
```

---

_Informe generado y listo para revisión._
