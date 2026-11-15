# Monitoreo del Event Loop y Detección de Bloqueos en el Navegador

## 1. Detección de Tareas Largas (`longtask`)
La API nativa `PerformanceObserver` permite al cliente escuchar eventos de ejecución continua que superan el límite de 50 milisegundos:

```typescript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const duration = entry.duration;
    const blocking = Math.max(0, duration - 50); // Total Blocking Time (TBT)
  }
});
observer.observe({ entryTypes: ['longtask'] });
```

---

## 2. Medición de Latencia del Event Loop (`Event Loop Lag`)
El retardo o *lag* del bucle de eventos representa la demora entre la programación de una macro-tarea inmediata y el momento de su ejecución real. NEXUS//HUD lo evalúa adaptativamente utilizando `setTimeout(..., 0)`:

$$\text{Lag} = \max(0, (\text{now} - \text{start}) - \text{baseline})$$

Un retraso sostenido superior a 25ms indica que la cola de microtareas o el hilo de renderizado están saturados, anticipando una degradación inminente en la interacción del usuario (INP).
