# Guía de Despliegue en la Nube (Cloud Deployment Guide)

Este documento detalla la arquitectura de despliegue y la configuración para producción del proyecto **Auditor Predictivo de Event Loop e INP**, conectando el Frontend en **Vercel**, el Backend en **Render** y la **Extensión de Google Chrome**.

---

## 1. Mapa de Conectividad y Endpoints de Producción

| Componente | Plataforma de Despliegue | URL Base / Endpoint | Protocolo |
| :--- | :--- | :--- | :--- |
| **Backend REST & IA** | Render | `https://webvitals-backend.onrender.com/api/vitals` | HTTPS (TLS) |
| **Broker WebSockets** | Render | `wss://webvitals-backend.onrender.com/ws-vitals` | WSS (STOMP sobre TLS) |
| **Servidor gRPC** | Render / Envoy | `https://webvitals-backend.onrender.com` (o puerto `9090`) | HTTP/2 / gRPC-Web |
| **Frontend Dashboard** | Vercel | `https://proyecto-webvitals-inp.vercel.app` | HTTPS |
| **Extensión de Chrome** | Navegador Local (Cliente) | Side Panel embebido + Content Script | Chrome Extensions API v3 |

---

## 2. Configuración del Frontend (Angular 21 Standalone)

Los entornos de producción han sido externalizados en:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://webvitals-backend.onrender.com',
  apiUrl: 'https://webvitals-backend.onrender.com/api/vitals',
  wsUrl: 'wss://webvitals-backend.onrender.com/ws-vitals',
  grpcProxyUrl: 'https://webvitals-backend.onrender.com'
};
```

### Pasos para Desplegar en Vercel:
1. Iniciar sesión en [Vercel](https://vercel.com/) y pulsar **Add New Project**.
2. Conectar e importar el repositorio de GitHub: `proyecto-webvitals-inp`.
3. Configurar los parámetros del build:
   - **Framework Preset:** Angular
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/frontend/browser`
   - **Install Command:** `npm install`
4. Pulsar **Deploy**. Vercel generará el bundle de producción y asignará una URL segura (`https://<tu-app>.vercel.app`).

---

## 3. Configuración y Uso de la Extensión de Google Chrome

La extensión de Chrome captura en segundo plano las métricas de rendimiento (Long Tasks, Blocking Time, Event Loop Lag, DOM Node Count) de cualquier pestaña que navegue el usuario y las despacha automáticamente al backend en Render.

### Archivos clave:
- `extension/manifest.json`: Contiene los permisos de host autorizados para conectar con `https://webvitals-backend.onrender.com/*`.
- `extension/background.js`: Intenta despachar las métricas a Render en primer orden, manteniendo fallback a `localhost:8081` y cálculo heurístico si la red no está disponible.
- `extension/ui/`: Contiene el bundle compilado de Angular configurado con los endpoints de Render para el **Side Panel**.

### Pasos para Instalar en Chrome:
1. Abrir Google Chrome e ingresar a la URL: `chrome://extensions/`.
2. Activar la casilla **"Modo de desarrollador"** (Developer mode) en la esquina superior derecha.
3. Hacer clic en **"Cargar descomprimida"** (Load unpacked).
4. Seleccionar la carpeta:
   `c:\Users\DELL\Documents\Semestre 7\Desarrollo web\proyecto-webvitals-inp\extension`
5. Abrir cualquier página web (por ejemplo, YouTube, GitHub, sitios de noticias).
6. Abrir el **Side Panel** de la extensión haciendo clic en el icono de la barra de extensiones. El semáforo y osciloscopio se actualizarán en vivo reflejando las inferencias de ONNX emitidas por Render.
