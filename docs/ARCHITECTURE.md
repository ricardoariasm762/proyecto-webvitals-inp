# Arquitectura de NEXUS//HUD - Auditor Predictivo de INP y Event Loop

## 1. Visión General
NEXUS//HUD es una plataforma de telemetría y diagnóstico en tiempo real diseñada para medir y optimizar la métrica **Interaction to Next Paint (INP)** y evaluar la saturación del **Event Loop** en aplicaciones web modernas.

## 2. Componentes del Sistema

### 2.1 Core Services
* **`PerformanceObserverService`**: Captura eventos de `longtask` mediante la API nativa de PerformanceObserver, acumulando el Total Blocking Time (TBT), midiendo el `eventLoopLag` continuo a través de `setTimeout(..., 0)` adaptativo y monitoreando la densidad del árbol DOM.
* **`VitalsTelemetryService`**: Encargado del enlace bidireccional con el servicio de inferencia y la escucha de eventos de Chrome Extension mediante `chrome.storage.local`. Provee fallback heurístico en caso de desconexión.
* **`ThemeService`**: Motor reactivo con Angular Signals que gestiona modos `system`, `light` y `dark`. Escucha eventos del sistema mediante `window.matchMedia('(prefers-color-scheme: dark)')` y persiste el estado en `localStorage`.

### 2.2 Desacoplamiento de Cómputo (Web Workers)
* **`compute.worker.ts`**: Hilo de trabajo dedicado que recibe mensajes de ejecución pesada (cálculo de números primos) para demostrar la preservación del presupuesto de fotogramas a 60 FPS frente a ejecuciones bloqueantes en el Main Thread.

### 2.3 Dashboard UI/UX
* **Medidor de Arco SVG**: Representación analógica-digital reactiva del INP estimado con zonas óptima (<200ms), advertencia (200-500ms) y crítica (>500ms).
* **Osciloscopio Digital de 48 Barras**: Visualización del espectro de carga del hilo principal con líneas de umbral para 16.6ms (60 FPS) y 50ms (límite de Long Task).
* **Consola Táctica de Estrés**: Evaluador interactivo con control deslizante de intensidad y conmutador de inyección de 1,500 nodos DOM.
* **Motor de Prescripción IA con Terminal CRT**: Streaming de recomendaciones arquitectónicas y terminal interactiva de comandos (`execute_patch`, `worker`, `clear`, `reset`).

### 2.4 Extensión Google Chrome (Manifest V3)
* Integración como **Side Panel** (`ui/index.html`) con diseño responsivo protegido contra desbordamientos horizontales (`min-width: 0`, `overflow-x: hidden`).
