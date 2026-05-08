# NakamaGate

Plataforma full-stack para descubrir, organizar y reseñar anime y manga, con sistema social de amistades. Trabajo de Fin de Grado de **Yago Puente Souto**.

**🌐 Demo:** https://nakamagate.netlify.app

---

## Funcionalidades

### Autenticación
- Registro y login con email + contraseña (hash con bcrypt)
- Login con Google OAuth con flujo de onboarding (alias, preferencia de contenido adulto, aceptación de términos)
- Sesiones JWT con roles (admin / user)

### Descubrimiento de contenido
- Catálogo de anime y manga vía la API GraphQL de AniList
- Anime y manga del día (selección aleatoria estable durante 24 h, distinta de los más populares)
- Top 10 trending de anime y manga
- Próximos lanzamientos
- Recomendaciones por género rotadas diariamente

### Biblioteca personal
- Añadir títulos a favoritos con estado: *Watching*, *Completed*, *Pending*
- Filtrado por estado con paginación
- Búsqueda dentro de tu biblioteca
- Estadísticas de géneros y sistema de logros desbloqueables

### Sistema social
- Enviar / aceptar / eliminar solicitudes de amistad
- Visitar perfil público de otros usuarios (favoritos + reseñas)
- Estado persistente para solicitudes enviadas y recibidas

### Reseñas
- Reseñas con puntuación 1–5 estrellas y texto
- Editar / eliminar tus propias reseñas
- Ver todas las reseñas de un anime/manga

### Gestión de perfil
- Editar alias y avatar (subido a Cloudinary)
- Toggle de contenido adulto (limpia automáticamente favoritos no permitidos al desactivarlo)
- Borrado de cuenta con cascade real (amistades, reseñas y favoritos eliminados)

### Herramientas de administración
- Eliminar cuentas de otros usuarios (solo admin)

### UX
- Modo claro / oscuro
- Diseño responsive (móvil, tablet, escritorio)
- Cache por usuario en servidor con bloqueo de cache de navegador

---

## Stack tecnológico

**Backend**
- Python 3.11
- FastAPI (REST API)
- SQLModel + Alembic (ORM y migraciones)
- MySQL 8 (alojado en Aiven)
- bcrypt, PyJWT (autenticación)
- fastapi-cache2 (cache en memoria)
- slowapi (rate limiting)
- Cloudinary (hosting de imágenes)
- AniList GraphQL API (datos de anime/manga)

**Frontend**
- React 18 + TypeScript
- Vite 7
- Tailwind CSS + shadcn/ui
- React Router v6
- Axios

**Infraestructura**
- Backend: Render (contenedor Docker)
- Frontend: Netlify
- Base de datos: Aiven (plan gratuito)
- Registro de imágenes: Docker Hub

---

## Estructura del proyecto

```
NakamaGate/
├── backend/
│   ├── alembic/              # Migraciones de BD
│   ├── clients/              # Clientes de APIs externas (AniList)
│   ├── models/               # Modelos SQLModel
│   ├── repositories/         # Capa de acceso a BD
│   ├── routes/               # Endpoints FastAPI
│   ├── services/             # Lógica de negocio
│   │   └── adapter/          # Adaptador AniList → formato app
│   ├── tests/                # Tests del backend
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── ca.pem                # Certificado SSL de Aiven
│   ├── database.py
│   ├── main.py               # Entrypoint de FastAPI
│   ├── security.py           # Helpers JWT
│   ├── seed.py               # Creación idempotente del admin
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── _redirects        # Redirección SPA para Netlify
│   ├── src/
│   │   ├── api/              # Cliente Axios + interceptors
│   │   ├── components/       # Componentes UI reutilizables
│   │   ├── config/           # Variables de entorno
│   │   ├── context/          # AuthContext (estado global)
│   │   ├── pages/            # Páginas/rutas
│   │   └── utils/            # Helpers
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## Desarrollo local

### Requisitos previos

- Python 3.11+
- Node.js 20+
- Una base de datos MySQL (Aiven free tier o local con Docker)
- Docker Desktop (opcional, para arrancar el backend en contenedor)

### 1. Backend

Crea `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://usuario:contraseña@host:puerto/dbname
SECRET_KEY=clave-aleatoria-generada-con-secrets
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
GOOGLE_CLIENT_ID=tu-google-oauth-client-id
```

Genera una `SECRET_KEY` segura:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Instala y arranca:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate              # Windows
# source .venv/bin/activate          # macOS/Linux
pip install -r requirements.txt

# Aplica migraciones
alembic upgrade head

# Crea el admin (idempotente)
cd ..
python -m backend.seed

# Arranca la API
uvicorn backend.main:app --reload
# http://localhost:8000/docs
```

### 2. Frontend

Crea `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=tu-google-oauth-client-id
```

Instala y arranca:
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### 3. Opcional: backend en Docker

```bash
docker compose up --build
# Backend en http://localhost:8000
```

El compose usa `backend/.env`. Si quieres una BD MySQL local en lugar de Aiven:
```bash
docker compose --profile local up
# (cambia DATABASE_URL en .env para apuntar a mysql:3306)
```

---

## Despliegue en producción

### Backend (Render + Docker Hub)

1. Construye y sube la imagen:
   ```bash
   docker build -t TU_USUARIO/nakamagate-backend:1.0.0 ./backend
   docker push TU_USUARIO/nakamagate-backend:1.0.0
   ```

2. En Render: **New → Web Service → Deploy an existing image**
   - Image URL: `docker.io/TU_USUARIO/nakamagate-backend:1.0.0`
   - Añade todas las variables del `.env` en el dashboard de Render
   - Añade `CORS_ORIGINS` con la URL del frontend:
     ```
     http://localhost:5173,https://tu-frontend.netlify.app
     ```

El entrypoint del contenedor ejecuta `alembic upgrade head` y `python -m backend.seed` en cada arranque (ambos idempotentes), así que la BD siempre queda sincronizada sin intervención manual.

### Frontend (Netlify)

1. Conecta tu repositorio de GitHub a Netlify
2. Build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Variables de entorno:
   - `VITE_API_URL` = URL de tu backend en Render
   - `VITE_GOOGLE_CLIENT_ID` = el client ID de Google OAuth
4. Deploy

El archivo `frontend/public/_redirects` es necesario para que las rutas de React Router funcionen tras refrescar.

### Google OAuth

En [Google Cloud Console](https://console.cloud.google.com/apis/credentials), edita tu OAuth 2.0 Client ID y añade a **Authorized JavaScript origins**:
- `http://localhost:5173` (desarrollo)
- `https://tu-frontend.netlify.app` (producción)

Los cambios tardan 5–10 min en propagarse.

---

## Cuenta de administrador por defecto

En el primer arranque del backend se crea automáticamente un único usuario admin. Para personalizarlo, edita `backend/seed.py`:

```python
ADMIN_EMAIL = "tu@email.com"
ADMIN_PASSWORD = "tu-contraseña-segura"
ADMIN_ALIAS = "admin"
```

La seed es idempotente: solo crea el usuario si no existe ya uno con ese email. Es seguro ejecutarla en cada despliegue.

---

## Notas de seguridad

- `backend/.env` está en `.gitignore` — las credenciales nunca llegan al repositorio
- Todas las rutas API (excepto `/auth/login`, `/auth/register`, `/auth/google`, `/auth/google/complete`) requieren JWT válido
- Contraseñas almacenadas como hashes bcrypt
- Tokens de Google validados contra `oauth2.googleapis.com/tokeninfo`
- Rate limiting en endpoints de auth (login: 5/min, register: 3/min, Google: 10/min)
- Cache con clave por usuario (sin fugas entre cuentas)
- Cache del navegador desactivado en endpoints específicos por usuario
- Inyección SQL prevenida por queries parametrizadas de SQLModel/SQLAlchemy
- React escapa automáticamente el contenido del usuario (sin XSS vía reseñas)

---

## Autor

**Yago Puente Souto** — [GitHub](https://github.com/Yuki2813)

Trabajo de Fin de Grado.
