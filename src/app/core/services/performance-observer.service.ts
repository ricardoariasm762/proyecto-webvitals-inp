import { Injectable, OnDestroy, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceObserverService implements OnDestroy {
  // Señales reactivas del estado de telemetría en tiempo real
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
   * Inicializa la API nativa de PerformanceObserver para 'longtask'
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

            // Total Blocking Time: parte de la tarea pesada que excede los 50ms
            const blocking = Math.max(0, duration - 50);
            this.totalBlockingTime.update((current) => Number((current + blocking).toFixed(2)));
          }
        });

        this.observer.observe({ entryTypes: ['longtask'] });
        this.isLongTaskSupported.set(true);
      } catch (err) {
        console.warn('No se pudo inicializar PerformanceObserver para longtask:', err);
        this.isLongTaskSupported.set(false);
      }
    } else {
      console.warn('La API de Long Tasks no es soportada en este entorno de navegador.');
      this.isLongTaskSupported.set(false);
    }
  }

  /**
   * Monitoreo de latencia del Event Loop con setTimeout(..., 0)
   */
  private startEventLoopLagMonitor(): void {
    this.lagIntervalId = setInterval(() => {
      const start = performance.now();
      setTimeout(() => {
        const elapsed = performance.now() - start;
        // La tolerancia base estándar de ejecución inmediata ronda 1-4ms
        const lag = Math.max(0, elapsed - 2);
        this.eventLoopLag.set(Number(lag.toFixed(2)));
      }, 0);
    }, 250);
  }

  /**
   * Conteo periódico y reactivo de nodos en el árbol DOM
   */
  private startDomNodeCountMonitor(): void {
    this.updateDomNodeCount();
    this.domIntervalId = setInterval(() => {
      this.updateDomNodeCount();
    }, 1000);
  }

  /**
   * Actualiza inmediatamente el conteo de elementos DOM
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
   * Permite registrar manualmente la duración de una tarea cuando
   * el navegador simula o no reporta a tiempo el callback de Long Task
   */
  public recordManualTask(durationMs: number): void {
    const duration = Number(durationMs.toFixed(2));
    this.lastLongTaskDuration.set(duration);
    const blocking = Math.max(0, duration - 50);
    this.totalBlockingTime.update((current) => Number((current + blocking).toFixed(2)));
  }

  /**
   * Reinicia los acumuladores de tiempo de bloqueo
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
