# Guía de Optimización de INP (Interaction to Next Paint)

## 1. Definición de la Métrica INP
INP evalúa la capacidad de respuesta general de una página observando la latencia de todas las interacciones de clic, toque y teclado a lo largo de la visita del usuario.

* **Bueno (Good)**: `<= 200 ms`
* **Necesita Mejora (Needs Improvement)**: `> 200 ms` y `<= 500 ms`
* **Pobre (Poor)**: `> 500 ms`

## 2. Fases de una Interacción
Una interacción se descompone en tres sub-vectores:
1. **Input Delay**: Tiempo entre la acción física del usuario y el inicio de ejecución del callback en el hilo principal. Mitigación: Fragmentar tareas largas mediante `scheduler.yield()` o `requestIdleCallback()`.
2. **Processing Time**: Tiempo de ejecución síncrono del manejador de eventos. Mitigación: Desacoplar algoritmos de procesamiento pesado hacia Web Workers.
3. **Presentation Delay**: Tiempo necesario para recalcular estilo, layout y componer el siguiente fotograma. Mitigación: Reducir la profundidad y densidad del árbol DOM y evitar el layout thrashing (lecturas y escrituras intercaladas del DOM).

## 3. Estrategias Implementadas en NEXUS//HUD
* **Despacho Concurrente a Web Workers**: Descarga del cómputo intensivo garantizando 0ms de retardo en el Event Loop.
* **Técnica de Fragmentación con `scheduler.yield()`**: Permite ceder el control al navegador para pintar actualizaciones intermedias antes de continuar la microtarea.
* **Control de Densidad DOM**: Purgado periódico de nodos fuera de pantalla para mantener tiempos de recálculo de estilo menores a 5ms.
