# Instalación (rápida)
1. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

2. Instalar dependencias del backend

```bash
cd backend
npm install
```

## Variables de entorno

- Frontend: Crea un archivo `.env.local` en `/frontend` del proyecto.

1. Copia los siguientes valores y pégalos en el archivo:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### reCAPTCHA
2. Genera tus claves en Google reCAPTCHA:
   - Ve a https://www.google.com/recaptcha/admin
   - Registra tu sitio con reCAPTCHA v2 (Checkbox) o reCAPTCHA v3
   - Copia `SITE KEY` y `SECRET KEY`
3. Pega las claves en `.env.local`

### Google Maps
4. Obtén una API Key de Google Maps:
   - Ve a https://console.cloud.google.com/
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la API de Maps JavaScript
   - Crea una API Key con restricciones apropiadas
5. Pega la API Key en `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env.local`

- Backend: crea `backend/.env` (o exporta en tu entorno):

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=database_name
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_o_app_password
```


## Base de datos

Luego de haber creado las variables de entorno se crea la base de datos, entra a `/backend/database` y abre el archivo de `schema.sql`, copia todo el codigo del archivo y pegalo en la sección de `sql` de `phpMyAdmin` (si desea usar la seeder para tener con los productos puede copiar el codigo del archivo `seeder.sql` el cual se encuentra en la carpeta de database, luego entras en la base de datos en `phpMyAdmin` y entras en `sql` y pegas el codigo del archivo)


## Arrancar la aplicación

- Frontend (desarrollo):

```bash
cd frontend
npm run dev
# abre http://localhost:3000
```

- Backend: actualmente `backend/` contiene las rutas y helpers; no hay servidor HTTP generado automáticamente. Opciones:

1) Montar un servidor Node que importe los handlers en `backend/api/**` y escuche en un puerto (ej. 4000). Entonces:

```bash
cd backend
npm run start
```

Link al repositorio original: https://github.com/SimonSSL01/EL-VITRAL.git