# ia-humanizer-orchestrator

## Descripción del proyecto

Este proyecto es un orquestador para la humanización de textos generados por inteligencia artificial. Permite transformar textos generados por IA en versiones más naturales y humanas, integrando varios pasos como traducción, mejora de escritura, parafraseo, eliminación de formato, humanización, traducción de vuelta y detección de IA.

## Arquitectura

- **Frontend** (Vite + React + TypeScript + shadcn-ui): página principal que orquesta el pipeline de 10 pasos contra el backend local vía `/api/...` (en desarrollo se usa el proxy de Vite hacia `http://localhost:3001`, sin URLs hardcodeadas).
- **Backend** (`humanizer-backend-complete.js` / `humanizer-backend-advanced.js`, Express en el puerto `PORT` o 3001): endpoints `POST /api/translate`, `/api/humanize`, `/api/improve-writing`, `/api/paraphrase`, `/api/detect-ai`.

## Configuración

1. Copia `.env.example` a `.env` (backend) y, si usas el paso Smodin desde el navegador, define `VITE_RAPIDAPI_SMODIN_KEY` en `.env.local` (frontend).
2. **Nunca subas claves reales al repositorio.** Si una clave se filtró (p. ej. en el historial de git), revócala y genera una nueva en el proveedor.

## ¿Cómo ejecutar?

Puedes trabajar localmente usando tu IDE favorito. Solo necesitas tener Node.js y npm instalados.

```sh
# 1. Clona el repositorio usando la URL de tu proyecto.
git clone https://github.com/Albonire/ia-humanizer.git

# 2. Entra en el directorio del proyecto.
cd ia-humanizer

# 3. Instala las dependencias necesarias.
npm i

# 4. En una terminal, arranca el backend:
npm run backend

# 5. En otra terminal, arranca el frontend con recarga automática:
npm run dev
```

Abre http://localhost:8080 y pega un texto para humanizarlo.

También puedes editar archivos directamente en GitHub o usar GitHub Codespaces para trabajar en la nube.

## ¿Cómo desplegar este proyecto?

Puedes desplegar el proyecto en cualquier plataforma compatible con Node.js. Solo asegúrate de instalar las dependencias y ejecutar el comando de build o start según tu entorno.

## Contribución

Si deseas contribuir, por favor abre un issue o pull request con tus sugerencias o mejoras.

---

© 2024. Proyecto desarrollado para la humanización de textos generados por IA.
