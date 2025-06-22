# Doctor AntiVejez WebApp

Sistema de gestión médica especializado en medicina antienvejecimiento con análisis avanzado de edad biológica.

## 🚀 Características Principales

- **Gestión de Pacientes**: CRUD completo con búsqueda y filtros avanzados
- **Test de Edad Biofísica**: Cálculo preciso usando 8 métricas con interpolación lineal
- **Dashboard Interactivo**: Estadísticas en tiempo real y gráficos dinámicos
- **Diseño Moderno**: UI/UX intuitiva con tema corporativo personalizado
- **Arquitectura Escalable**: Next.js 14 con Server Actions y Prisma ORM

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Server Actions, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Gráficos**: Recharts
- **Iconos**: React Icons (FontAwesome)

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 13+
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/doctor-antivejez-webapp.git
cd doctor-antivejez-webapp
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/doctor_antivejez"
NEXTAUTH_SECRET="tu-secret-key-super-segura"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Configurar la base de datos**
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

5. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Uso

### Credenciales de Prueba
- **Email**: admin@doctorantivejez.com
- **Contraseña**: admin123

### Flujo Principal
1. Iniciar sesión con las credenciales
2. Navegar al módulo "Historias" para gestionar pacientes
3. Crear un nuevo paciente con el botón "+ Nuevo Paciente"
4. Acceder al detalle del paciente y hacer clic en "Edad Biológica"
5. Realizar el test biofísico ingresando las 8 métricas
6. Calcular y guardar los resultados

## 🧪 Test de Edad Biofísica

El test evalúa 8 métricas biofísicas:

1. **% Grasa**: Composición corporal
2. **IMC**: Índice de Masa Corporal
3. **Reflejos Digitales**: Función neuromuscular (3 mediciones)
4. **Acomodación Visual**: Flexibilidad del enfoque ocular
5. **Balance Estático**: Equilibrio (3 mediciones)
6. **Hidratación Cutánea**: Turgencia de la piel
7. **Tensión Arterial Sistólica**: Presión arterial alta
8. **Tensión Arterial Diastólica**: Presión arterial baja

### Interpretación de Resultados

- **Verde (Rejuvenecido)**: ≥7 años menor que la edad cronológica
- **Amarillo (Normal)**: Entre -2 y +3 años de diferencia
- **Rojo (Envejecido)**: ≥7 años mayor que la edad cronológica

## 📂 Estructura del Proyecto

```
src/
├── app/                    # Páginas y rutas (App Router)
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI base
│   ├── layout/           # Sidebar, Header
│   ├── patients/         # Componentes de pacientes
│   └── biophysics/       # Test biofísico
├── lib/                   # Utilidades del servidor
│   └── actions/          # Server Actions
├── utils/                 # Utilidades del cliente
│   └── biofisica-calculations.ts  # Lógica de cálculo
└── types/                 # Definiciones TypeScript
```

## 🔐 Seguridad

- Autenticación con bcrypt para hash de contraseñas
- Validación de datos con Zod
- Protección de rutas con middleware
- Sanitización de inputs

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
vercel --prod
```

### Docker
```bash
docker build -t doctor-antivejez .
docker run -p 3000:3000 doctor-antivejez
```

## 📝 Licencia

Copyright © 2024 Doctor AntiVejez - Todos los derechos reservados

## 👥 Soporte

Para soporte técnico contactar a: soporte@doctorantivejez.com
