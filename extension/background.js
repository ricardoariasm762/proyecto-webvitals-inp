// background.js
let activeTabId = null;
let activeTabUrl = '';

// Abrir el Side Panel cuando el usuario hace clic en el ícono de la extensión
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
    console.warn('No se pudo configurar openPanelOnActionClick:', err);
  });
}

// Registrar cambios de pestaña activa
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  activeTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(activeTabId);
    activeTabUrl = tab.url || '';
  } catch (e) {
    // La pestaña podría no estar disponible temporalmente
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    activeTabUrl = changeInfo.url;
  }
});

// Escuchar los mensajes provenientes de los content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'METRICS_SNAPSHOT') {
    // Filtrar: procesar y enviar al backend la pestaña que el usuario está viendo actualmente
    if (sender.tab && (sender.tab.id === activeTabId || activeTabId === null)) {
      if (activeTabId === null) {
        activeTabId = sender.tab.id;
        activeTabUrl = sender.tab.url || message.url;
      }

      dispatchToBackend({
        sessionId: 'browser-session-global',
        urlPath: message.url,
        longTaskDurationMs: message.longTaskDurationMs,
        blockingTimeMs: message.blockingTimeMs,
        domNodeCount: message.domNodeCount,
        eventLoopLagMs: message.eventLoopLagMs
      });
    }
  }
});

async function dispatchToBackend(telemetry) {
  try {
    const response = await fetch('http://localhost:8081/api/vitals/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry)
    });

    if (response.ok) {
      const evaluationResult = await response.json();

      // Guardar el resultado en almacenamiento local para que Angular lo lea
      chrome.storage.local.set({
        latestEvaluation: {
          ...evaluationResult,
          url: telemetry.urlPath,
          timestamp: Date.now(),
          backendOffline: false
        }
      });
      return;
    }
  } catch (error) {
    console.warn('Backend Spring Boot no disponible en localhost:8081. Calculando estimación local...');
  }

  // Fallback de contingencia: Si el backend está apagado, la extensión calcula la estimación local
  const localEvaluation = calculateLocalFallback(telemetry);
  chrome.storage.local.set({
    latestEvaluation: {
      ...localEvaluation,
      url: telemetry.urlPath,
      timestamp: Date.now(),
      backendOffline: true
    }
  });
}

function calculateLocalFallback(telemetry) {
  const domPenalty = (telemetry.domNodeCount / 1000.0) * 8.5;
  const rawPredicted = 16.6 + (0.75 * telemetry.longTaskDurationMs) + (0.45 * telemetry.eventLoopLagMs) + domPenalty;
  const predictedInpMs = Number(Math.max(16.6, Math.min(rawPredicted, 900.0)).toFixed(2));

  let vitalsCategory = 'GOOD';
  let architecturalAdvice = '[Modo Local] Presupuesto de fotogramas óptimo. Las tareas se ejecutan sin degradación perceptible.';
  let offloadToWorker = false;
  let yieldMainThread = false;

  if (predictedInpMs > 500.0) {
    vitalsCategory = 'POOR';
    architecturalAdvice = '[Modo Local] Saturación crítica del Event Loop. Se recomienda trasladar el procesamiento intensivo a un Web Worker.';
    offloadToWorker = true;
    yieldMainThread = true;
  } else if (predictedInpMs > 200.0) {
    vitalsCategory = 'NEEDS_IMPROVEMENT';
    architecturalAdvice = '[Modo Local] Riesgo de retraso en la respuesta. Se aconseja fragmentar tareas mediante scheduler.yield().';
    yieldMainThread = true;
  }

  return {
    predictedInpMs,
    vitalsCategory,
    architecturalAdvice,
    offloadToWorker,
    yieldMainThread
  };
}
