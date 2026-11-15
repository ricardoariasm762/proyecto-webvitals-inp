// content-script.js
(() => {
  // Prevent duplicate execution inside nested iframes
  if (window.top !== window) return;

  let longTaskDurationSum = 0;
  let blockingTimeSum = 0;
  let eventLoopLag = 0;

  // 1. Monitor Long Tasks on the Main Thread (>50ms)
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTaskDurationSum += entry.duration;
        // Time exceeding 50ms is accumulated blocking time (TBT)
        blockingTimeSum += Math.max(0, entry.duration - 50);
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
  } catch (err) {
    // Some browsers or security contexts restrict longtask on system pages
  }

  // 2. Periodic sampling of Event Loop latency (Lag)
  const sampleEventLoopLag = () => {
    const start = performance.now();
    setTimeout(() => {
      const elapsed = performance.now() - start;
      eventLoopLag = Math.max(0, elapsed - 1.0); // Baseline tolerance adjustment
    }, 0);
  };
  setInterval(sampleEventLoopLag, 1000);

  // 3. Periodic telemetry dispatch to Background Service Worker
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

    // Reset window accumulator counters
    longTaskDurationSum = 0;
    blockingTimeSum = 0;

    chrome.runtime.sendMessage(payload).catch(() => {
      // Handle temporary background worker inactivity
    });
  }, 3000);
})();
