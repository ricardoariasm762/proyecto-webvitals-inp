# Arquitectura del Sistema NEXUS//HUD - Auditor Predictivo de INP y Event Loop

## 1. Visión General
NEXUS//HUD es una plataforma de telemetría y diagnóstico predictivo en tiempo real junto con una extensión de Google Chrome, diseñada para medir, evaluar y optimizar la métrica **Interaction to Next Paint (INP)** y supervisar la saturación del **Event Loop** del navegador. Opera a través de un flujo distribuido híbrido que combina ingesta binaria de alta frecuencia mediante gRPC, notificaciones push bidireccionales en tiempo real mediante WebSockets y evaluación de Machine Learning en el servidor impulsada por ONNX Runtime.

---

## 2. Pipeline de Arquitectura Distribuida

```mermaid
flowchart LR
    subgraph Browser ["Entorno de Cliente (Navegador / Extensión Chrome)"]
        UI["Dashboard HUD / UI"]
        Obs["PerformanceObserverService"]
        Worker["Web Worker (compute.worker.ts)"]
        GrpcClient["VitalsGrpcClientService (gRPC-Web)"]
        WsClient["VitalsSocketService (Cliente STOMP)"]
    end

    subgraph Gateway ["Puerta de Enlace Edge (Proxy)"]
        Envoy["Envoy Proxy (:8080)"]
    end

    subgraph Backend ["Motor de Telemetría Spring Boot 3"]
        GrpcServer["VitalsGrpcServiceImpl (:9090)"]
        WsBroker["Broker WebSocket STOMP (:8081)"]
        AuditService["PerformanceAuditService"]
        Engine["InpInferenceEngine (ONNX Runtime)"]
        DB[(Base de Datos PostgreSQL)]
    end

    Obs -->|Long Tasks, TBT, Lag| GrpcClient
    GrpcClient -->|HTTP/2 Protobuf Binario| Envoy
    Envoy -->|gRPC Nativo| GrpcServer
    GrpcServer --> AuditService
    AuditService --> Engine
    AuditService --> DB
    AuditService -->|Fan-Out Push en Tiempo Real| WsBroker
    WsBroker -->|/topic/vitals/{sessionId}| WsClient
    WsClient -->|Veredicto en Vivo y Buffer de Osciloscopio| UI
```

---

## 3. Componentes Principales del Frontend

### 3.1 Servicios de Telemetría e Ingesta
* **`PerformanceObserverService`**: Captura entradas de `longtask` mediante la API nativa de PerformanceObserver, acumula el Total Blocking Time (TBT), mide continuamente la latencia del Event Loop mediante un `setTimeout(..., 0)` adaptativo y monitorea la densidad de nodos del árbol DOM.
* **`VitalsGrpcClientService`**: Serializa la telemetría en mensajes binarios `TelemetryFrame` de Protocol Buffers, enviándolos vía gRPC-Web hacia Envoy en el puerto `8080`.
* **`VitalsSocketService`**: Se suscribe dinámicamente a `/topic/vitals/{sessionId}` mediante `@stomp/stompjs` con reconexión automática resiliente cada 4 segundos, actualizando señales reactivas en vivo sin necesidad de short polling.
* **`VitalsTelemetryService`**: Proporciona transporte de respaldo HTTP REST (`/api/vitals/evaluate`) e interactúa con el almacenamiento local de Chrome (`chrome.storage.local`) cuando se ejecuta como Side Panel de extensión.
* **`ThemeService`**: Motor reactivo con Angular Signals que gestiona temas `system`, `light` y `dark`, escuchando consultas de medios del sistema operativo (`prefers-color-scheme: dark`) y persistiendo las preferencias en `localStorage`.

### 3.2 Desacoplamiento de Cómputo (Web Workers)
* **`compute.worker.ts`**: Descarga tareas intensivas de CPU (como cálculo de números primos y parseo de expresiones regulares) a un hilo secundario aislado, demostrando la preservación del presupuesto de 60 FPS y cero bloqueo del Event Loop.

### 3.3 Dashboard UI/UX
* **Medidor de Arco Radial SVG**: Indicador HUD analógico-digital reactivo que visualiza el INP estimado con rangos óptimo (<200ms), advertencia (200-500ms) y crítico (>500ms).
* **Osciloscopio Digital de 48 Barras**: Visualizador de espectro continuo de respuesta del hilo principal y umbrales de presupuesto de fotogramas.
* **Banco de Pruebas de Estrés**: Controles interactivos para regular la intensidad de carga de CPU y la inyección sintética de 1,500 elementos DOM.
* **Consola de Terminal CLI**: Terminal interactiva integrada que acepta comandos de remediación (`execute_patch`, `worker`, `clear`, `reset`).

---

## 4. Arquitectura del Backend y Motor de Inferencia

* **Spring Boot 3 + Java 21**: Servidor reactivo de alto rendimiento que expone simultáneamente endpoints gRPC y HTTP/WebSocket.
* **Contrato Protocol Buffers (`vitals_telemetry.proto`)**: Contrato binario `Contract-First` que define evaluación unaria (`EvaluateSingleFrame`) y streaming continuo (`StreamTelemetry`).
* **Inferencia ONNX Runtime (`InpInferenceEngine`)**: Evalúa el modelo de Machine Learning entrenado (Random Forest/XGBoost) para predecir la latencia de INP a partir de los vectores de telemetría.
* **Fan-Out Push en Tiempo Real**: Emite inmediatamente los veredictos de optimización hacia `/topic/vitals/{sessionId}` utilizando `SimpMessagingTemplate`.

---

## 5. Infraestructura Cloud-Ready (Topología Docker)

El sistema se orquesta mediante Docker Compose en 4 contenedores de producción:
1. **`postgres`**: Base de datos relacional para historial y sesiones de auditoría de telemetría.
2. **`backend`**: Aplicación Spring Boot que expone los puertos 8081 (HTTP/WebSocket) y 9090 (gRPC nativo).
3. **`envoy`**: Proxy de capa 7 que traduce las llamadas gRPC-Web del navegador en el puerto 8080 hacia el puerto 9090 del backend, gestionando las cabeceras CORS.
4. **`frontend`**: Contenedor Nginx de alto rendimiento que sirve la compilación de producción de Angular en el puerto 80.

