# 🏢 WorkFlex

> **Sistema Integrado de Reserva de Espacios de Coworking** — Encuentra, reserva y trabaja sin fricciones.

WorkFlex es una plataforma web que automatiza la reserva de espacios de trabajo para nómadas digitales, freelancers y equipos remotos. Este monorepo contiene el MVP completo: una API REST en NestJS y una aplicación web en Next.js.

<p align="center">
  <em>Desarrollado por <strong>Beyond Studios</strong> · Jose Abrego · Kevin Rodriguez · Giuseppe Toscano</em>
</p>

---

## ✨ Características

| Módulo | Estado |
| --- | --- |
| 🔐 Autenticación (registro, login, sesión con JWT) | ✅ Implementado |
| 🔎 Motor de búsqueda y catálogo (filtros por ciudad, tipo y precio) | ✅ Implementado |
| 📅 Motor de reservas con prevención de sobrecupo (overbooking) | ✅ Implementado |
| 📬 Notificaciones por correo (email + PDF) | ✅ Implementado |
| 🚀 Despliegue (Vercel + Render) | ⏳ En desarrollo |

**Motor de búsqueda:** filtra espacios por ciudad, costo y categoría (oficina privada o escritorio).

**Motor de reservas:** selecciona fecha y horario viendo la disponibilidad en vivo. Antes de insertar una reserva se valida en la base de datos que no exista otra reserva para el mismo espacio en el rango solicitado; si existe, se devuelve un error `409 Conflict`, impidiendo el sobrecupo.

**Notificaciones:** tras una reserva exitosa se genera un **PDF** (PDFKit) con el comprobante y se envía un **correo** (Nodemailer) al usuario. Si no hay SMTP configurado, el envío se omite en modo desarrollo y solo se registra en los logs.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js (App Router) · React · Tailwind CSS · Axios
- **Backend:** NestJS · Prisma ORM · JWT
- **Base de datos:** PostgreSQL 16
- **Calidad:** Jest (unitarias) · ESLint · TypeScript

---

## 📂 Estructura del Monorepo

```text
WorkFlex/
├── backend/       # API REST (NestJS + Prisma + PostgreSQL)
│   ├── prisma/    # Esquema de datos, migraciones y seed
│   └── src/
│       ├── auth/          # Registro, login, guard JWT
│       ├── spaces/        # Catálogo y búsqueda de espacios
│       ├── reservations/  # Reservas y prevención de overbooking
│       └── prisma/        # Conexión a la base de datos
├── frontend/      # Aplicación web (Next.js + Tailwind CSS)
│   ├── app/       # Rutas (/, /login, /register, /search, /spaces/[id], /dashboard)
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
├── docker-compose.yml  # PostgreSQL local
└── README.md
```

---

## 🚀 Instalación y Ejecución Local

### Requisitos previos
- Node.js 20+
- Docker (para la base de datos PostgreSQL)

### 1. Levantar la base de datos
```bash
docker compose up -d
```

### 2. Backend (API en `http://localhost:3000/api`)
```bash
cd backend
npm install
cp .env.example .env          # configurar credenciales
npx prisma migrate deploy     # aplicar esquema de base de datos
npx prisma db seed            # (opcional) cargar espacios de ejemplo
npm run start:dev
```

### 3. Frontend (web en `http://localhost:3001`)
```bash
cd frontend
npm install
cp .env.example .env.local    # apuntar NEXT_PUBLIC_API_URL al backend
npm run dev -- -p 3001        # el puerto 3000 lo usa el backend
```

Abre **http://localhost:3001**, crea una cuenta y explora el flujo completo: búsqueda → detalle del espacio → reserva → dashboard.

---

## 📡 API REST

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Estado del servicio | Público |
| `POST` | `/api/auth/register` | Crear cuenta | Público |
| `POST` | `/api/auth/login` | Iniciar sesión | Público |
| `GET` | `/api/auth/me` | Perfil del usuario | 🔒 Token |
| `GET` | `/api/spaces` | Catálogo con filtros | Público |
| `GET` | `/api/spaces/cities` | Ciudades disponibles | Público |
| `GET` | `/api/spaces/:id` | Detalle de un espacio | Público |
| `GET` | `/api/spaces/:id/availability` | Disponibilidad por día | Público |
| `POST` | `/api/reservations` | Crear reserva (`409` si hay conflicto) | 🔒 Token |
| `GET` | `/api/reservations` | Reservas del usuario | 🔒 Token |
| `PATCH` | `/api/reservations/:id/cancel` | Cancelar reserva | 🔒 Token |

### Filtros de búsqueda (`GET /api/spaces`)
| Parámetro | Descripción |
| --- | --- |
| `city` | Ciudad (coincidencia parcial, insensible a mayúsculas) |
| `q` | Texto libre sobre nombre o descripción |
| `type` | `DESK` o `PRIVATE_OFFICE` (acepta minúsculas) |
| `minPrice` / `maxPrice` | Rango de precio por hora en dólares |

### Disponibilidad (`GET /api/spaces/:id/availability?date=YYYY-MM-DD`)
Devuelve los horarios de 09:00 a 18:00 marcando cada franja como `available: true/false`.

### Ejemplo — crear reserva
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "spaceId": "cmsphqt700004l0sb5zg1j6fd",
    "startAt": "2026-08-12T14:00:00.000Z",
    "endAt": "2026-08-12T16:00:00.000Z"
  }'
```

---

## 📋 Scripts útiles

| Proyecto | Comando | Descripción |
| --- | --- | --- |
| Backend | `npm run start:dev` | Servidor de desarrollo con recarga |
| Backend | `npm test` | Pruebas unitarias (Jest) |
| Backend | `npm run lint` | ESLint |
| Backend | `npx prisma db seed` | Cargar espacios de ejemplo |
| Frontend | `npm run dev -- -p 3001` | Servidor de desarrollo |
| Frontend | `npm run lint` | ESLint |
| Frontend | `npm run build` | Build de producción |

---

## 🚀 Despliegue (Fase 6)

> **✅ En producción:** API → `https://workflex-api.onrender.com/api` · Web → `https://work-flex-phi.vercel.app` · Base de datos → Supabase (PostgreSQL).

El despliegue usa el tier gratuito de **Supabase** (base de datos), **Render** (API) y **Vercel** (web). Todo se despliega desde la rama `main` (ver flujo de git más abajo).

### 1. Base de datos — Supabase (gratis)
1. Crea una cuenta en [supabase.com](https://supabase.com) y un nuevo proyecto.
2. En **Project Settings → Database → Connection string**, copia la URL de PostgreSQL (modo `pooler`, puerto 6543).
3. Guarda esa URL: será el `DATABASE_URL` de producción.

### 2. Backend — Render (gratis)
1. Crea una cuenta en [render.com](https://render.com) con GitHub.
2. **New → Blueprint** y selecciona el repo. Render detectará `backend/render.yaml` (Web Service `workflex-api`).
3. Define en el dashboard las variables marcadas como manuales:
   - `DATABASE_URL` → la URL de Supabase del paso anterior.
   - `JWT_SECRET` → genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
   - `MAIL_*` → opcional; deja `MAIL_ENABLED=false` si no usarás correo.
4. **Deploy.** Render ejecutará `prisma generate`, `prisma migrate deploy` y el build automáticamente.
5. La API queda en `https://workflex-api.onrender.com/api` (el plan gratis duerme tras 15 min de inactividad).

> Nota: si prefieres migración manual, desde el shell de Render ejecuta `npx prisma db seed` para cargar los espacios de ejemplo.

### 3. Frontend — Vercel (gratis)
1. Crea una cuenta en [vercel.com](https://vercel.com) con GitHub.
2. **Add New → Project** e importa el repo.
3. En **Root Directory** selecciona `frontend`.
4. En **Environment Variables** (Production) agrega:
   - `NEXT_PUBLIC_API_URL` → `https://workflex-api.onrender.com/api`
5. **Deploy.** La web queda en una URL `https://<proyecto>.vercel.app`.

### Flujo de git
- Se desarrolla en `develop` con feature branches y PRs hacia `develop`.
- Antes de desplegar, haz merge de `develop` a `main`:
  ```bash
  git checkout main && git pull && git merge develop && git push
  ```
- Render y Vercel vuelven a desplegar automáticamente al recibir cambios en `main`.

---

## 🗺️ Roadmap (ciclo de 12 semanas)

| Fase | Descripción | Estado |
| --- | --- | --- |
| 1 | Planificación y diseño (prototipo en Figma, ERD, repos) | ✅ Completada |
| 2 | Configuración base y autenticación (registro, login, JWT) | ✅ Completada |
| 3 | Motor de búsqueda y catálogo | ✅ Completada |
| 4 | Motor de reservas y prevención de overbooking | ✅ Completada |
| 5 | Notificaciones (correo y PDF) | ✅ Completada |
| 6 | Pruebas y despliegue (Vercel, Render, Supabase) | ✅ Completada |

---

## 🤝 Equipo de Desarrollo

| Miembro | Rol |
| --- | --- |
| **Giuseppe Toscano** | Líder de Proyecto (PM) — gestión de tiempos, pruebas y QA |
| **Kevin Rodriguez** | Desarrollador Backend — APIs y lógica de negocio |
| **Jose Abrego** | Diseñador UX/UI & Lógica Web — flujo de usuario e interfaz |

---

## 📌 Notas

- Los secretos (`JWT_SECRET`, credenciales) se mantienen fuera del repositorio mediante archivos `.env` (ver `.env.example`).
- Para activar los correos, completa `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` y `MAIL_FROM` en `.env` (ej. Gmail con contraseña de aplicación). Sin esos valores, el envío se omite en modo dev.
- El flujo de trabajo usa ramas `main` y `develop` con Pull Requests hacia `develop`.
- Proyecto de desarrollo académico, sin fines comerciales.
