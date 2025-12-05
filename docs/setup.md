# Configuración

## Requisitos

- Node.js 18+
- npm o pnpm
- Cuenta de Supabase

## Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/ciromora/hipoteca-piqueras.git
cd hipoteca-piqueras
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Configurar Supabase

#### Crear proyecto
1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar URL y anon key de **Project Settings > API**

#### Crear tablas
1. Ir a **SQL Editor**
2. Ejecutar el contenido de `schema.sql`

#### Configurar autenticación
1. Ir a **Authentication > Providers**
2. Habilitar **Email** (ya habilitado por defecto)
3. Habilitar **Google**:
   - Crear credenciales OAuth en Google Cloud Console
   - Configurar Client ID y Client Secret
   - Añadir redirect URL: `https://tu-proyecto.supabase.co/auth/v1/callback`

#### Configurar redirect URLs
En **Authentication > URL Configuration**:
- Site URL: `https://ciromora.github.io/hipoteca-piqueras/`
- Redirect URLs:
  - `https://ciromora.github.io/hipoteca-piqueras/`
  - `http://localhost:5173` (desarrollo)

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará en `http://localhost:5173`

## Despliegue

### GitHub Pages

El proyecto está configurado para desplegarse automáticamente con GitHub Actions.

#### Configurar secrets
En **Settings > Secrets and variables > Actions**, añadir:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

#### Workflow
El archivo `.github/workflows/deploy.yml` ejecuta:
1. Build con Vite
2. Deploy a rama `gh-pages`

#### Manual
```bash
npm run build
# Subir contenido de dist/ a gh-pages
```

### Otras plataformas

#### Vercel
```bash
npm run build
# Configurar dist como output directory
```

#### Netlify
```bash
npm run build
# Configurar dist como publish directory
```

## Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | Sí |

## Scripts NPM

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Ejecutar ESLint |

## Troubleshooting

### Error: Missing Supabase environment variables
Asegúrate de que `.env` existe y contiene las variables correctas.

### OAuth redirect no funciona
1. Verificar que la URL está en **Redirect URLs** de Supabase
2. Para localhost, usar `http://localhost:5173` (con http, no https)

### PWA no se instala
1. Verificar que estás en HTTPS (o localhost)
2. Comprobar que `manifest.json` es accesible
3. Revisar Service Worker en DevTools > Application

### RLS blocking queries
Verificar que las políticas RLS permiten acceso a usuarios autenticados:
```sql
CREATE POLICY "Allow authenticated users" ON tabla
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```
