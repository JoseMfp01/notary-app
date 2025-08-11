# Notaría — Gestión de Casos (Static App)

Esta carpeta contiene la app lista para publicar en **GitHub Pages** (o cualquier hosting estático).

## Estructura
- `index.html` — página principal.
- `styles.css` — estilo (tema oscuro).
- `script.js` — lógica de la app (casos, documentos, historial).

## Cómo publicar en GitHub Pages (paso a paso)
1. Crea un repositorio nuevo (público) en GitHub, por ejemplo `notary-app`.
2. Sube estos 3 archivos a la raíz del repo (`index.html`, `styles.css`, `script.js`).
3. Ve a **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Fuente: `main` y carpeta `/ (root)`.
6. Guarda: GitHub generará una URL como `https://tuusuario.github.io/notary-app/`.

> Los datos se guardan en el navegador del usuario (localStorage). Si recarga o vuelve a entrar en el mismo navegador/equipo, mantiene sus datos.
