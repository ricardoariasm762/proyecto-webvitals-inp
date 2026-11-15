# NEXUS//HUD - Auditor Predictivo de INP y Event Loop

Panel interactivo de telemetría de alta fidelidad y extensión de Google Chrome diseñado para diagnosticar, evaluar heurísticamente y predecir el impacto de interacciones de usuario en **Interaction to Next Paint (INP)** y **Core Web Vitals**.

Impulsado por una arquitectura híbrida distribuida de alto rendimiento:
- **gRPC + Protocol Buffers (Contract-First)**: Ingesta binaria de telemetría de alta frecuencia desde el navegador sobre HTTP/2 mediante Envoy gRPC-Web Proxy.
- **WebSockets (STOMP Fan-Out)**: Streaming bidireccional en tiempo real desde el broker de Spring Boot (`/ws-vitals` -> `/topic/vitals/{sessionId}`), eliminando la sobrecarga del polling.
- **Motor de Inferencia AI con ONNX Runtime**: Modelo de Machine Learning ejecutado en el backend que predice la latencia de INP directamente a partir de las métricas de telemetría.
- **Micro-Extensión y Aplicación Web**: HUD táctico 100% responsivo con sincronización dinámica de temas Claro/Oscuro/Automático y soporte para Side Panel en Chrome Manifest V3.

---

## ⚡ Características Principales

- **Osciloscopio y Medidor Radial de INP**: Visualización gráfica interactiva SVG en tiempo real con gauge angular dinámico que mapea el INP predicho frente al presupuesto de 60 FPS (16.6ms).
- **Telemetría Binaria de Alta Frecuencia (gRPC-Web)**: Métricas del navegador (`TelemetryFrame`) serializadas con Protocol Buffers y enrutadas a través del proxy Envoy hacia el backend Java en el puerto `9090`.
- **Notificaciones Push sin Latencia (WebSockets STOMP)**: Broker fan-out en tiempo real que emite las recomendaciones del modelo ONNX de forma instantánea a los clientes conectados en `/topic/vitals/{sessionId}`.
- **Detección Automática de Tema**: Soporte nativo para `Modo Claro`, `Modo Oscuro` y sincronización automática con las preferencias del sistema operativo (`prefers-color-scheme`).
- **Simulador de Estrés de Main Thread**: Benchmark controlado que ejecuta tareas CPU síncronas bloqueantes vs. derivación concurrente a Web Workers dedicados (`compute.worker.ts`).
- **Terminal CLI Emulada**: Consola HUD integrada con comandos interactivos de diagnóstico (`execute_patch`, `worker`, `clear`, `reset`).
- **Extensión Google Chrome (Manifest V3)**: Empaquetada para Side Panel y Popup con fallback heurístico automático si el backend remoto está desconectado.

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+ o 20+
- npm 9+
- Java 21+ y Maven (para el backend Spring Boot)
- Docker & Docker Compose (opcional, para despliegue completo en la nube)

### Configuración del Frontend

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo de Angular
npm start
```
Navega a `http://localhost:4200/`.

### Configuración del Backend (Spring Boot 3 + gRPC + WebSockets)

```bash
cd "../webvitals_backend"
./mvnw clean install
./mvnw spring-boot:run
```
- Endpoint REST / WebSocket: `http://localhost:8081` (STOMP: `/ws-vitals`)
- Servidor gRPC Nativo: `localhost:9090`

---

## ☁️ Despliegue en la Nube (Docker Compose)

Despliega la topología completa de producción de 4 contenedores con un solo comando:

```bash
docker-compose up --build
```

### Servicios Orquestados:
1. **`postgres`**: Base de datos relacional para sesiones de telemetría (`localhost:5432`).
2. **`backend`**: Microservicio Spring Boot 3 con el motor de inferencia ONNX, servidor gRPC (`:9090`) y broker WebSocket (`:8081`).
3. **`envoy`**: Proxy de capa 7 de alto rendimiento que traduce las peticiones del navegador `gRPC-Web` (`:8080`) a gRPC nativo HTTP/2 (`backend:9090`).
4. **`frontend`**: Contenedor Nginx que sirve la compilación optimizada de Angular para producción (`:80`).

---

## 🛠️ Compilación y Empaquetado

### Compilar Aplicación Web

```bash
npm run build
```

### Empaquetar Extensión de Google Chrome (Manifest V3)

```bash
npm run build:extension
```
Los artefactos finales se sincronizarán automáticamente en la carpeta `extension/ui`. Para cargarla en el navegador:
1. Abre Google Chrome y ve a `chrome://extensions/`.
2. Activa el **Modo de desarrollador** (Developer Mode).
3. Haz clic en **Cargar descomprimida** (Load unpacked) y selecciona la carpeta `extension/`.

---

## 🧪 Pruebas Unitarias

Ejecutar la suite de pruebas unitarias de frontend con Vitest:

```bash
npm test
```

Ejecutar las pruebas del backend con Maven:

```bash
cd "../webvitals_backend"
./mvnw test
```

---

## 📚 Documentación Técnica

- [Guía de Arquitectura del Sistema](file:///docs/ARCHITECTURE.md): Topología distribuida, puente Envoy gRPC-Web, broker STOMP fan-out y desacoplamiento de Web Workers.
- [Guía de Optimización de INP](file:///docs/INP_OPTIMIZATION_GUIDE.md): Desglose de sub-vectores de INP (Input Delay, Processing Duration, Presentation Delay) y estrategias de remediación arquitectónica.


