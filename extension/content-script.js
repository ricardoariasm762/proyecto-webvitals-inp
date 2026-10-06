// content-script.js
(() => {
  // Evitar ejecuciones duplicadas en iframes anidados
  if (window.top !== window) return;

  let longTaskDurationSum = 0;
  let blockingTimeSum = 0;
  let eventLoopLag = 0;

  // 1. Monitoreo de Tareas Largas en el Main Thread (>50ms)
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTaskDurationSum += entry.duration;
        // El tiempo que supere los 50ms se considera bloqueo acumulado (TBT)
        blockingTimeSum += Math.max(0, entry.duration - 50);
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
  } catch (err) {
    // Algunos navegadores o contextos restringen longtask en páginas de sistema
  }

  // 2. Muestreo periódico de latencia del Event Loop (Lag)
  const sampleEventLoopLag = () => {
    const start = performance.now();
    setTimeout(() => {
      const elapsed = performance.now() - start;
      eventLoopLag = Math.max(0, elapsed - 1.0); // Ajuste de tolerancia
    }, 0);
  };
  setInterval(sampleEventLoopLag, 1000);

  // 3. Envío periódico de telemetría hacia el Background Service Worker
  setInterval(() => {
    const domCount = document.getElementsByTagName('*').length;
    const payload = {
      type: 'METRICS_SNAPSHOT',
      url: window.location.href,
      longTaskDurationMs: parseFloat(longTaskDurationSum.toFixed(2)),
      blockingTimeMs: parseFloat(blockingTimeSum.toFixed(2)),
      domNodeCount: domCount,
      eventLoopLagMs: parseFloat(eventLoopLag.toFixed(2))
    };

    // Reiniciar contadores acumulativos de ventana
    longTaskDurationSum = 0;
    blockingTimeSum = 0;

    chrome.runtime.sendMessage(payload).catch(() => {
      // Manejar desconexión temporal del background worker si está inactivo
    });
  }, 3000);
})();
