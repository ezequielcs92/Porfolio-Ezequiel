# Portfolio — Ezequiel Contreras

Landing personal de diseño y desarrollo web, ecommerce, software a medida y mantenimiento mensual.

## Características
- Diseño negro, rojo y blanco con tipografía Poppins.
- Hero con retrato en perspectiva 2.5D y seguimiento del puntero.
- Animaciones de títulos, tarjetas, transiciones y secciones vinculadas al scroll nativo.
- Portfolio de 24 proyectos, con atribución de los trabajos realizados a través de Nómada Digital Web.
- Contacto personal, WhatsApp flotante y formulario para preparar una consulta.
- Diseño responsive y respeto a la preferencia de movimiento reducido del sistema.

## Ejecutar localmente
Requiere Node.js. No hay dependencias de runtime ni paso de compilación.

```sh
node serve.cjs
```

Abrir **http://127.0.0.1:4173**. El servidor de vista previa escucha solo en localhost y sirve una lista cerrada de archivos públicos. Detener con Ctrl+C.

## Estructura
| Archivo | Función |
| --- | --- |
| `index.html` | Contenido, servicios y portfolio |
| `styles.css` | Estilos base |
| `motion.css`, `jack.css`, `amplify.css` | Movimiento, hero y escala visual |
| `motion.js` | Animaciones e interacción |
| `script.js`, `config.js` | Formulario, menú y datos públicos de contacto |
| `ezequiel-portrait.webp`, `nomada-preview.webp` | Imágenes locales |
| `serve.cjs` | Servidor de vista previa sin dependencias |

## Contacto
Los datos de contacto son públicos y están en `config.js` y en los enlaces de `index.html`. Si se cambian, actualizar ambos lugares, incluido el botón flotante.

El formulario prepara el mensaje en el navegador; **no envía ni almacena consultas en un servidor**. El visitante abre WhatsApp o su aplicación de correo y confirma el envío. No colocar secretos ni claves en archivos del frontend.

## Recursos externos
Poppins se carga desde Google Fonts. Las capturas de los proyectos del portfolio se sirven desde la web de Nómada; necesitan conexión y dependen de la disponibilidad de esas URLs. El retrato y la captura del sitio de Nómada se incluyen localmente.

## Publicación
Es un sitio estático. Para desplegarlo, publicar los archivos HTML, CSS, JavaScript y recursos gráficos; no es necesario ejecutar `serve.cjs` en el hosting.

Esta versión conserva `noindex, nofollow` y `robots.txt` de vista previa. Revisarlos al habilitar indexación, y configurar metadata/canonical con el dominio definitivo. El repositorio no activa por sí solo un hosting o dominio.

No incluye documentación personal de planificación, notas locales ni generadores de imágenes con rutas de la máquina de desarrollo. No se declara una licencia sobre material de terceros: respetar los derechos y la atribución de las imágenes y marcas de cada proyecto.
