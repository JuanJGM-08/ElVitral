#  Documentación de la Suite de Pruebas

## Descripción General

Esta suite de pruebas está desarrollada utilizando **Jest** y **Supertest**, con el objetivo de validar el comportamiento de la API sin depender de una base de datos real.

Para ello se utilizan **mocks** sobre los módulos de autenticación (`auth.js`) y base de datos (`db.js`), permitiendo simular distintos escenarios de éxito y error. De esta manera es posible verificar la lógica del backend de forma aislada, asegurando que cada endpoint responda correctamente bajo diferentes condiciones.

---

# ¿Cómo funcionan los tests?

Cada archivo corresponde a un módulo diferente de la API.

La estructura general es la siguiente:

1. Se mockea la conexión a la base de datos (`query`).
2. Se mockean las funciones de autenticación cuando el endpoint las requiere.
3. Se simulan respuestas mediante `mockResolvedValueOnce()`.
4. Se realizan peticiones HTTP utilizando **Supertest**.
5. Se valida:
   - Código HTTP esperado.
   - Respuesta JSON.
   - Consultas ejecutadas sobre la base de datos.
   - Parámetros enviados a las consultas SQL.
   - Llamadas a funciones auxiliares como sanitización, generación de tokens o validación de permisos.

Gracias a este enfoque, las pruebas no dependen de MySQL ni de un sistema de autenticación real, lo que permite ejecutarlas de forma rápida y repetible.

---

# Comportamiento de cada archivo

---

# auth.test.js

## Objetivo

Validar el flujo general de autenticación.

## Casos cubiertos

- Registro de un usuario.
- Login con contraseña incorrecta.
- Consulta del usuario autenticado mediante `/api/auth/me`.

## Observaciones

Actualmente la mayoría de las peticiones se encuentran comentadas, por lo que los escenarios están definidos pero no ejecutan pruebas reales. Este archivo funciona principalmente como una base para futuras pruebas de autenticación.

---

# register.test.js

## Objetivo

Validar el proceso completo de registro de usuarios.

## Casos cubiertos

- Registro exitoso.
- Validación de campos obligatorios.
- Correo electrónico ya registrado.
- Sanitización del correo.
- Sanitización del nombre.
- Generación del hash de la contraseña.
- Inserción del usuario en la base de datos.

Este módulo presenta una buena cobertura para el flujo principal del registro.

---

# login.test.js

## Objetivo

Validar el inicio de sesión.

## Casos cubiertos

- Inicio de sesión exitoso.
- Contraseña incorrecta.
- Usuario inexistente.
- Credenciales vacías.

Además valida:

- generación del token JWT.
- creación de la cookie de autenticación.
- sanitización del correo.
- que no se consulte la base de datos cuando los datos enviados son inválidos.

Es uno de los módulos más completos de la suite.

---

# catalogo.test.js

## Objetivo

Validar la consulta del catálogo público.

## Casos cubiertos

- Obtención correcta de productos.
- Catálogo vacío.
- Verificación de que únicamente se devuelven productos activos.

Garantiza el correcto funcionamiento del endpoint público encargado de listar productos.

---

# productos-crud.test.js

## Objetivo

Validar las operaciones CRUD para administradores.

## Casos cubiertos

### Crear producto

- Creación correcta.
- Creación sin descripción.
- Creación con distintos datos.
- Validación de campos obligatorios.

### Actualizar producto

- Actualización correcta.

### Eliminar producto

- Eliminación correcta.

También se verifica que las consultas SQL ejecutadas sean las esperadas.

---

# inventario.test.js

## Objetivo

Validar la gestión del inventario.

## Casos cubiertos

- Consulta de movimientos.
- Registro de entradas.
- Actualización del stock.
- Cantidades inválidas.
- Restricción de acceso cuando el usuario no posee permisos de administrador.

Algunas pruebas continúan comentadas y podrían habilitarse posteriormente.

---

# cotizacion.test.js

## Objetivo

Validar el proceso completo de creación de cotizaciones.

## Casos cubiertos

### Autenticación

- Usuario autenticado.
- Usuario no autenticado.

### Validaciones

- Cliente incompleto.
- Correo inválido.
- Lista de productos vacía.
- Productos inexistentes.

### Reglas de negocio

- Cálculo del subtotal.
- Cálculo del total.
- Inserción de la cotización.
- Inserción del detalle.
- Generación del código único.

Es el módulo con mayor cobertura y donde se concentra la mayor cantidad de reglas de negocio.

---

# cotizaciones.test.js

## Objetivo

Preparar pruebas para el módulo de cotizaciones.

## Casos preparados

- Creación de cotización.
- Usuario sin autenticar.
- Consulta de cotizaciones del usuario.

Actualmente las peticiones están comentadas, por lo que estas pruebas aún no forman parte de la ejecución de la suite.

---

# pedidos.test.js

## Objetivo

Validar la creación de pedidos.

## Casos cubiertos

- Creación correcta.
- Usuario no autenticado.
- Cotización perteneciente a otro usuario.
- Cotización inexistente.

También se verifica que la consulta SQL utilizada corresponda con la esperada.

---

# Cobertura actual

Actualmente la suite prueba correctamente los siguientes módulos:

- Registro de usuarios.
- Inicio de sesión.
- Autenticación básica.
- Catálogo público.
- CRUD de productos.
- Gestión del inventario.
- Creación de cotizaciones.
- Creación de pedidos.

La mayor parte de la lógica crítica del sistema está validada mediante pruebas unitarias y de integración ligera utilizando mocks.

---

# Casos faltantes detectados

Aunque la cobertura actual es buena, todavía existen escenarios importantes que no están siendo probados.

## Autenticación

Actualmente no existen pruebas para:

- Logout del usuario.
- Token expirado.
- Token inválido o alterado.
- Usuario inactivo.
- Usuario pendiente de aprobación.
- Acceso mediante cookies inválidas.
- Renovación de sesión.
- Errores internos durante la validación del token.

---

## Registro

Actualmente faltan pruebas para:

- Contraseñas menores a la longitud mínima.
- Correos con formato inválido.
- Teléfonos inválidos.
- Dirección vacía.
- Nombre con longitud excesiva.
- Caracteres especiales en los campos.
- Error durante el hash de la contraseña.
- Error interno de la base de datos durante el registro.

---

## Login

No se validan escenarios como:

- Login utilizando correos con mayúsculas.
- Login con espacios antes o después del correo.
- Usuario administrador.
- Usuario bloqueado.
- Usuario deshabilitado.
- Error interno de la base de datos.
- Error al generar el token.

---

## Catálogo

Actualmente faltan pruebas para:

- Productos inactivos.
- Productos sin stock.
- Filtros por categoría o tipo.
- Ordenamiento de resultados.
- Búsqueda por nombre.
- Manejo de errores internos del servidor.

---

## CRUD de Productos

Sería recomendable agregar pruebas para:

- Actualizar un producto inexistente.
- Eliminar un producto inexistente.
- Precio negativo.
- Stock negativo.
- Tipos de producto inválidos.
- Productos duplicados.
- Accesos sin permisos de administrador.
- Errores durante las consultas SQL.

---

## Inventario

Actualmente no se prueban escenarios como:

- Salidas de inventario.
- Stock insuficiente.
- Producto inexistente.
- Cantidades negativas.
- Movimientos con descripciones vacías.
- Errores de base de datos.
- Consultas vacías.
- Actualizaciones fallidas del stock.

---

## Cotizaciones

Aunque es el módulo más completo, aún sería conveniente probar:

- Cotizaciones con múltiples productos.
- Productos repetidos.
- Cantidades iguales a cero.
- Medidas negativas.
- Grosores inválidos.
- Productos inactivos.
- Productos sin precio.
- Errores durante la inserción de detalles.
- Rollback cuando falla una operación dentro de la transacción.
- Errores internos del servidor.
- Consulta de cotizaciones inexistentes.
- Actualización o eliminación de cotizaciones.

---

## Pedidos

Actualmente faltan escenarios como:

- Pedido generado desde una cotización vencida.
- Pedido duplicado utilizando la misma cotización.
- Cambio de estados del pedido.
- Cancelación de pedidos.
- Errores durante la creación del pedido.
- Consulta de pedidos inexistentes.
- Validación de permisos para administradores.

---

# Aspectos técnicos que podrían mejorarse

Además de ampliar la cobertura funcional, también sería recomendable mejorar la organización de la suite mediante:

- Eliminar pruebas que permanecen comentadas (`auth.test.js`, `cotizaciones.test.js` e `inventario.test.js`).
- Organizar las pruebas por endpoint utilizando bloques `describe`.
- Incorporar pruebas para respuestas HTTP 500.
- Ejecutar mediciones periódicas de cobertura mediante `jest --coverage`.
- Añadir pruebas de integración utilizando una base de datos temporal.
- Incorporar pruebas End-to-End (E2E) para validar el flujo completo del sistema desde el registro hasta la creación de pedidos.

Link al repositorio original: https://github.com/SimonSSL01/EL-VITRAL.git