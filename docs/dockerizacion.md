# Dockerización de El Vitral

## Servicios

El proyecto se ejecuta mediante Docker Compose con cuatro servicios:

- `frontend`: aplicación Next.js.
- `backend`: API Node.js.
- `database`: MySQL 8.4.
- `phpmyadmin`: administración visual de la base de datos.

## Puertos

| Servicio | Dirección |
|---|---|
| Frontend | http://localhost:3001 |
| Backend y Swagger | http://localhost:4000/api-docs |
| phpMyAdmin | http://localhost:8080 |
| MySQL | localhost:3306 |

## Ejecución

1. Crear `.env` a partir de `.env.example`.
2. Configurar credenciales de MySQL, JWT, Google Maps y reCAPTCHA.
3. Ejecutar:

```powershell
docker compose up --build -d
```

4. Verificar los servicios:

```powershell
docker compose ps
```

## Persistencia

La base de datos usa el volumen `el-vitral_mysql_data`. Los datos se conservan al ejecutar:

```powershell
docker compose down
```

No se debe usar `docker compose down -v` salvo que se quiera eliminar toda la base de datos.

## Validación realizada

- Se construyeron las imágenes `el-vitral-frontend` y `el-vitral-backend`.
- MySQL crea la base `el_vitral_db`, tablas y productos iniciales.
- phpMyAdmin permite consultar la base Docker.
- Frontend, backend y MySQL se conectan mediante Docker Compose.

## Pendientes funcionales

- Pruebas completas de usuario, cotizaciones, pedidos y administrador.
- Recuperación de contraseña.
- Envío real de correos electrónicos.
- Incorporar la tabla `mensajes_chat` al esquema si la funcionalidad de chat se requiere.