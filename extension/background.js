// background.js
let activeTabId = null;
let activeTabUrl = '';

// Open Side Panel when user clicks the extension action icon
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
    console.warn('Failed to configure openPanelOnActionClick:', err);
  });
}

// Track active tab switching
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  activeTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(activeTabId);
    activeTabUrl = tab.url || '';
  } catch (e) {
    // The tab might be temporarily inaccessible
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    activeTabUrl = changeInfo.url;
  }
});

// Listen to messages emitted by content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'METRICS_SNAPSHOT') {
    // Process and dispatch telemetry for the tab currently viewed by the user
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

const PRIMARY_BACKEND_URL = 'https://webvitals-backend.onrender.com/api/vitals/evaluate';
const LOCAL_BACKEND_URL = 'http://localhost:8081/api/vitals/evaluate';

async function dispatchToBackend(telemetry) {
  try {
    // Attempt dispatch to cloud backend on Render first, fallback to localhost if needed
    let response;
    try {
      response = await fetch(PRIMARY_BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry)
      });
    } catch (netErr) {
      // If cloud is unavailable, try local backend
      response = await fetch(LOCAL_BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry)
      });
    }

    if (response && response.ok) {
      const evaluationResult = await response.json();

      // Persist the evaluation result into local storage for Angular consumption
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
    console.warn('Backend unavailable (Render/Local). Calculating local estimation...');
  }

  // Contingency fallback: If remote backend is unreachable, calculate local heuristic estimation
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
