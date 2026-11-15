import { Injectable, OnDestroy, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceObserverService implements OnDestroy {
  // Reactive signals for real-time telemetry state
  readonly lastLongTaskDuration = signal<number>(0);
  readonly totalBlockingTime = signal<number>(0);
  readonly domNodeCount = signal<number>(0);
  readonly eventLoopLag = signal<number>(0);
  readonly isLongTaskSupported = signal<boolean>(false);

  private observer: PerformanceObserver | null = null;
  private lagIntervalId: ReturnType<typeof setInterval> | null = null;
  private domIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initLongTaskObserver();
    this.startEventLoopLagMonitor();
    this.startDomNodeCountMonitor();
  }

  /**
   * Initializes native PerformanceObserver API for 'longtask'
   */
  private initLongTaskObserver(): void {
    if (
      typeof window !== 'undefined' &&
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes &&
      PerformanceObserver.supportedEntryTypes.includes('longtask')
    ) {
      try {
        this.observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const duration = Number(entry.duration.toFixed(2));
            this.lastLongTaskDuration.set(duration);

            // Total Blocking Time: portion of the long task exceeding 50ms
            const blocking = Math.max(0, duration - 50);
            this.totalBlockingTime.update((current) => Number((current + blocking).toFixed(2)));
          }
        });

        this.observer.observe({ entryTypes: ['longtask'] });
        this.isLongTaskSupported.set(true);
      } catch (err) {
        console.warn('Unable to initialize PerformanceObserver for longtask:', err);
        this.isLongTaskSupported.set(false);
      }
    } else {
      console.warn('Long Tasks API is not supported in this browser environment.');
      this.isLongTaskSupported.set(false);
    }
  }

  /**
   * Monitors Event Loop lag via setTimeout(..., 0)
   */
  private startEventLoopLagMonitor(): void {
    this.lagIntervalId = setInterval(() => {
      const start = performance.now();
      setTimeout(() => {
        const elapsed = performance.now() - start;
        // Standard baseline immediate execution overhead is ~1-4ms
        const lag = Math.max(0, elapsed - 2);
        this.eventLoopLag.set(Number(lag.toFixed(2)));
      }, 0);
    }, 250);
  }

  /**
   * Periodic and reactive DOM node count monitoring
   */
  private startDomNodeCountMonitor(): void {
    this.updateDomNodeCount();
    this.domIntervalId = setInterval(() => {
      this.updateDomNodeCount();
    }, 1000);
  }

  /**
   * Immediately updates DOM element count
   */
  public updateDomNodeCount(): number {
    if (typeof document !== 'undefined') {
      const count = document.getElementsByTagName('*').length;
      this.domNodeCount.set(count);
      return count;
    }
    return 0;
  }

  /**
   * Manually records a task duration when
   * synthetic tasks or browser callbacks are not immediately triggered
   */
  public recordManualTask(durationMs: number): void {
    const duration = Number(durationMs.toFixed(2));
    this.lastLongTaskDuration.set(duration);
    const blocking = Math.max(0, duration - 50);
    this.totalBlockingTime.update((current) => Number((current + blocking).toFixed(2)));
  }

  /**
   * Resets blocking time accumulators
   */
  public resetMetrics(): void {
    this.lastLongTaskDuration.set(0);
    this.totalBlockingTime.set(0);
    this.updateDomNodeCount();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.lagIntervalId) {
      clearInterval(this.lagIntervalId);
      this.lagIntervalId = null;
    }
    if (this.domIntervalId) {
      clearInterval(this.domIntervalId);
      this.domIntervalId = null;
    }
  }
}
