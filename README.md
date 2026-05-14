# Portal de Soporte Interno OPC

## Descripción
Portal web de soporte interno para la empresa OPC. La aplicación permite a los empleados crear tickets, revisar el estado de sus solicitudes y consultar los detalles, mientras que los administradores pueden gestionar, asignar y exportar tickets.

## Cómo ejecutar
1. Descarga o clona el repositorio.
2. Abre `index.html` directamente en tu navegador.
3. No se requiere servidor ni compilación.

## Credenciales de prueba
- Empleado: `empleado@opc.com` / `pass123`
- Administrador: `admin@opc.com` / `admin123`

## Funcionalidades
- Inicio de sesión con roles `empleado` y `administrador`
- Manejo de sesión con `localStorage`
- Panel de empleado con lista de tickets propios
- Formulario para crear nuevo ticket con categoría, prioridad y descripción
- Panel de administrador con filtros por estado, categoría y prioridad
- Cambiar estado de ticket y asignar a agentes de soporte
- Agregar notas internas a los tickets
- Exportar listado de tickets a CSV
- Diseño responsivo y profesional con barra lateral
- Notificaciones tipo toast para acciones del usuario
- Datos almacenados 100% en el navegador (sin backend)

## Estructura de archivos
```
index.html
dashboard.html
admin.html
nuevo-ticket.html
detalle-ticket.html
css/
  estilos.css
js/
  auth.js
  tickets.js
  admin.js
  utils.js
assets/
  opc-logo.svg
README.md
```

## Capturas de pantalla
- Captura 1: Inicio de sesión
- Captura 2: Panel de empleado con tickets
- Captura 3: Panel de administrador con filtros
- Captura 4: Vista de detalle del ticket

## Tecnologías utilizadas
- HTML5
- CSS3
- JavaScript ES6+

## Licencia
MIT
