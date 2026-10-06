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

      // Guardar el último resultado para que la UI en Angular lo lea en tiempo real
      chrome.storage.local.set({
        latestEvaluation: {
          ...evaluationResult,
          url: telemetry.urlPath,
          timestamp: Date.now()
        }
      });
    }
  } catch (error) {
    console.warn('Backend Spring Boot no alcanzable en localhost:8081', error);
  }
}
