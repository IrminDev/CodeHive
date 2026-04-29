<p align="center">
	<h1 align="center">CodeHive • Frontend</h1>
</p>

<p align="center">
	<em>Aplicación web (SSR) construida con React Router + Vite para consumir el backend de CodeHive.</em>
</p>

<p align="center">
	<img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js 20+" />
	<img src="https://img.shields.io/badge/React%20Router-7-CA4245?style=flat&logo=reactrouter&logoColor=white" alt="React Router 7" />
	<img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />
</p>

## Requisitos

- Node.js 20+

## Variables de entorno

Crear el archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:8080
```

## Ejecutar en desarrollo (local)

```bash
npm install
npm run dev
```

- App: `http://localhost:5173`

## Ejecutar en producción (local)

```bash
npm run build
npm run start
```

- App: `http://localhost:3000`

## Docker

Dev (por defecto):

```bash
docker compose up --build
```

Prod:

```bash
DOCKER_TARGET=prod docker compose up --build
```

Nota: si alguna llamada al backend se ejecuta desde el servidor SSR dentro del contenedor, `http://localhost:8080` apuntará al contenedor (no al host). En ese caso, ajusta `VITE_API_URL` a la IP del host o a `http://host.docker.internal:8080` (si está disponible en tu Docker).

## Scripts útiles

| Script              | Descripción                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Servidor de desarrollo       |
| `npm run build`     | Build de producción          |
| `npm run start`     | Servidor de producción       |
| `npm run typecheck` | Typegen + TypeScript         |
