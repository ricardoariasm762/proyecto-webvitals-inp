# Índice de Documentación Técnica - NEXUS//HUD

Este directorio contiene la documentación completa de diseño, arquitectura, optimización y protocolos de comunicación de la plataforma:

1. **[Guía de Arquitectura del Sistema](ARCHITECTURE.md)**:
   - Flujo de telemetría distribuida (Browser $\to$ Envoy $\to$ Spring Boot gRPC $\to$ ONNX $\to$ WebSockets STOMP $\to$ Angular).
   - Componentes principales del Frontend y Backend.
   - Despliegue en la nube con Docker Compose.

2. **[Guía de Optimización de INP (Interaction to Next Paint)](INP_OPTIMIZATION_GUIDE.md)**:
   - Definición de la métrica de Core Web Vitals y rangos de conformidad.
   - Desglose de los 3 sub-vectores: Input Delay, Processing Duration y Presentation Delay.
   - Estrategias aplicadas (`scheduler.yield()`, Web Workers, poda del DOM).

3. **[Integración de Protocol Buffers y gRPC-Web](PROTO_INTEGRATION.md)**:
   - Contratos binarios `.proto` sobre HTTP/2.
   - Configuración del proxy Envoy como puente L7 y resolución de encabezados CORS.
   - Generación de stubs y compatibilidad en navegadores.

4. **[Monitoreo del Event Loop y Detección de Bloqueos](EVENT_LOOP_MONITORING.md)**:
   - API nativa `PerformanceObserver` y cálculo de Total Blocking Time (TBT).
   - Algoritmo de muestreo adaptativo de `Event Loop Lag` con `setTimeout(..., 0)`.
