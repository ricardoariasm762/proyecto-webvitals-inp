# Guía de Optimización de INP (Interaction to Next Paint)

## 1. Definición de la Métrica INP
**Interaction to Next Paint (INP)** evalúa la capacidad de respuesta general de una página observando la latencia de todas las interacciones discretas del usuario (clics, toques en pantalla y pulsaciones de teclas) a lo largo del ciclo de vida de la visita. La interacción con la mayor duración (descartando valores atípicos poco frecuentes) determina el puntaje final de INP.

* **Bueno (Cumplimiento)**: `<= 200 ms`
* **Necesita Mejora (Riesgo de Bloqueo)**: `> 200 ms` y `<= 500 ms`
* **Pobre (Bloqueo Crítico)**: `> 500 ms`

---

## 2. Sub-Vectores de Latencia de una Interacción
Toda interacción de usuario se descompone en tres fases secuenciales:

1. **Input Delay (Retardo de Entrada)**:
   - Tiempo transcurrido desde la acción física del usuario hasta el momento exacto en que el hilo principal comienza a ejecutar el callback asociado.
   - *Causas comunes*: Scripts de larga duración ejecutándose en segundo plano, congestión de la cola de tareas, microtareas sin ceder control.
   - *Estrategia de remediación*: Postergar microtareas no críticas utilizando `scheduler.yield()` o `requestIdleCallback()`.

2. **Processing Duration (Duración del Procesamiento)**:
   - Tiempo de ejecución síncrono requerido para procesar todos los callbacks de eventos registrados para esa acción.
   - *Causas comunes*: Bucles intensivos de CPU, parseo síncrono de grandes payloads JSON, algoritmos criptográficos o expresiones regulares pesadas.
   - *Estrategia de remediación*: Desacoplar algoritmos de computación intensiva hacia Web Workers dedicados (`Worker`).

3. **Presentation Delay (Retardo de Presentación)**:
   - Tiempo invertido en recalcular estilos, actualizar el diseño geométrico (reflow) y componer/renderizar los píxeles en la pantalla.
   - *Causas comunes*: Profundidad o densidad excesiva en el árbol DOM, layout thrashing (lecturas y escrituras intercaladas en el DOM), selectores CSS complejos o animaciones sobre propiedades que no pertenecen a la capa de composición.
   - *Estrategia de remediación*: Podar nodos del DOM innecesarios, agrupar lecturas de layout antes de invocar `requestAnimationFrame()` y limitar animaciones a propiedades de composición (`transform`, `opacity`).

---

## 3. Estrategias Implementadas en NEXUS//HUD

* **Telemetría Binaria de Alta Frecuencia**: Elimina el consumo de CPU de serialización y parseo de JSON en el cliente mediante el uso de Protocol Buffers binario (`TelemetryFrame`).
* **Despacho Concurrente a Web Workers**: Las rutinas de cómputo intensivo se ejecutan en `compute.worker.ts`, preservando el presupuesto de fotogramas de 16.6ms (60 FPS) y asegurando 0ms de retraso en el Event Loop.
* **Fragmentación de Tareas con `scheduler.yield()`**: La planificación cooperativa cede el control al motor de renderizado del navegador entre bloques de trabajo pesado.
* **Control de Densidad del Árbol DOM**: Herramientas interactivas de inyección y purga de nodos para mantener los tiempos de recálculo de estilo por debajo de 5ms.
* **Ciclo de Retroalimentación Push en Tiempo Real**: Reemplaza el polling periódico por notificaciones push inmediatas desde el broker STOMP de WebSockets, ahorrando ciclos de CPU tanto en el cliente como en el servidor.

