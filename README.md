<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# BetStats COP

BetStats stores account passwords securely and saves bets in MongoDB so they can be accessed from multiple devices.

## Desplegar en Vercel

1. Importa este repositorio en Vercel como un único proyecto.
2. En **Settings → Environment Variables**, agrega `MONGODB_URI` con la URI de MongoDB Atlas y `AUTH_SECRET` con una clave aleatoria privada de al menos 32 caracteres.
3. Despliega. Vercel construye el frontend Vite y publica las funciones serverless definidas en `api/` en el mismo dominio.
4. Abre el sitio y crea una cuenta desde **Regístrate**; luego inicia sesión con esa cuenta en tus otros dispositivos.

Las apuestas se almacenan en MongoDB y se separan por cuenta. Las funciones de registro, inicio/cierre de sesión y apuestas se ejecutan en Vercel; no se necesita desplegar ni mantener un servidor Express.

En **MongoDB Atlas**, permite conexiones desde Vercel (por ejemplo, agrega `0.0.0.0/0` en Network Access si no tienes IP de salida fija) y usa un usuario de base de datos con acceso limitado a la base de BetStats. Nunca pongas estas credenciales en variables `VITE_*` ni en el código del frontend.

Para probar la interfaz localmente, `npm run dev` inicia Vite, pero las rutas `/api` están alojadas en Vercel. Para probar todo el proyecto con el entorno serverless de Vercel, instala/usa Vercel CLI y ejecuta `vercel dev` con las variables configuradas.
