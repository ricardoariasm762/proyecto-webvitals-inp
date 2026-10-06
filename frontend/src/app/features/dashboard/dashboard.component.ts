import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerformanceObserverService } from '../../core/services/performance-observer.service';
import { VitalsTelemetryService } from '../../core/services/vitals-telemetry.service';
import {
  OptimizationRecommendationResponse,
  PerformanceSnapshot,
  PerformanceTelemetryRequest
} from '../../core/models/vitals.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected readonly perf = inject(PerformanceObserverService);
  private readonly telemetryService = inject(VitalsTelemetryService);

  // Identificador de sesión único
  readonly sessionId = 'sess-' + Math.random().toString(36).substring(2, 9);

  // Estados de control del benchmark
  readonly workloadIntensity = signal<number>(4_000_000);
  readonly isProcessing = signal<boolean>(false);
  readonly activeMode = signal<'IDLE' | 'MAIN_THREAD' | 'WORKER'>('IDLE');
  readonly lastCalculationDuration = signal<number>(0);
  readonly stressNodeCount = signal<number>(0);

  // Señales de la extensión de Chrome
  readonly currentAudit = this.telemetryService.currentAudit;
  readonly isRunningInExtension = this.telemetryService.isRunningInExtension;

  // Estado del backend y recomendación
  readonly backendStatus = signal<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');
  readonly latestRecommendation = signal<OptimizationRecommendationResponse>({
    predictedInpMs: 16.6,
    vitalsCategory: 'GOOD',
    architecturalAdvice: 'Sistema inicializado. Presupuesto de fotogramas óptimo (60 FPS).',
    offloadToWorker: false,
    yieldMainThread: false
  });

  // Historial de evaluaciones
  readonly history = signal<PerformanceSnapshot[]>([]);

  // Telemetría de FPS en tiempo real para evidenciar congelamiento de pantalla
  readonly currentFps = signal<number>(60);
  protected readonly mathMin = Math.min;

  private worker: Worker | null = null;
  private fpsAnimFrameId: number | null = null;
  private lastFpsTimestamp = performance.now();
  private frameCount = 0;

  // Señales calculadas
  readonly vitalsClass = computed(() => {
    const category = this.latestRecommendation().vitalsCategory;
    if (category === 'GOOD') return 'vitals-good';
    if (category === 'NEEDS_IMPROVEMENT') return 'vitals-warning';
    return 'vitals-poor';
  });

  readonly vitalsBadgeText = computed(() => {
    const category = this.latestRecommendation().vitalsCategory;
    if (category === 'GOOD') return 'ÓPTIMO (GOOD)';
    if (category === 'NEEDS_IMPROVEMENT') return 'MEJORABLE (NEEDS IMPROVEMENT)';
    return 'CRÍTICO (POOR)';
  });

  constructor() {
    effect(() => {
      const audit = this.currentAudit();
      if (audit && audit.predictedInpMs !== undefined) {
        this.latestRecommendation.set({
          predictedInpMs: audit.predictedInpMs,
          vitalsCategory: audit.vitalsCategory || 'GOOD',
          architecturalAdvice: audit.architecturalAdvice || '',
          offloadToWorker: Boolean(audit.offloadToWorker),
          yieldMainThread: Boolean(audit.yieldMainThread)
        });
      }
    });
  }

  ngOnInit(): void {
    this.checkBackendHealth();
    this.startFpsTracker();
    this.initWorker();
    // Primera evaluación base
    this.sendTelemetryToBackend(false);
  }

  /**
   * Comprueba el estado de conexión del backend en Spring Boot
   */
  private checkBackendHealth(): void {
    this.telemetryService.checkHealth().subscribe((res) => {
      this.backendStatus.set(res.status === 'UP' ? 'ONLINE' : 'OFFLINE');
    });
  }

  /**
   * Inicializa el Web Worker dedicado
   */
  private initWorker(): void {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('../../core/workers/compute.worker', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = ({ data }) => {
          if (data.status === 'done') {
            this.lastCalculationDuration.set(data.durationMs);
            this.isProcessing.set(false);
            // El Main Thread no se bloqueó, enviamos telemetría con mitigación aplicada
            this.sendTelemetryToBackend(true);
          }
        };

        this.worker.onerror = (err) => {
          console.error('Error en Web Worker:', err);
          this.isProcessing.set(false);
        };
      } catch (e) {
        console.warn('No se pudo instanciar el Web Worker:', e);
      }
    }
  }

  /**
   * Tracker continuo de FPS mediante requestAnimationFrame
   */
  private startFpsTracker(): void {
    const loop = (now: number) => {
      this.frameCount++;
      const delta = now - this.lastFpsTimestamp;
      if (delta >= 500) {
        const fps = Math.round((this.frameCount * 1000) / delta);
        this.currentFps.set(Math.min(60, Math.max(0, fps)));
        this.frameCount = 0;
        this.lastFpsTimestamp = now;
      }
      this.fpsAnimFrameId = requestAnimationFrame(loop);
    };
    this.fpsAnimFrameId = requestAnimationFrame(loop);
  }

  /**
   * Ejecuta el cómputo intensivo en el Main Thread (Bloqueante)
   */
  public runOnMainThread(): void {
    if (this.isProcessing()) return;

    this.isProcessing.set(true);
    this.activeMode.set('MAIN_THREAD');

    // Permitir un tick para que la interfaz muestre el estado de procesamiento antes del bloqueo
    setTimeout(() => {
      const start = performance.now();
      const iterations = this.workloadIntensity();
      let primesCount = 0;

      // Cómputo CPU intensivo síncrono que congela el Event Loop
      for (let i = 2; i <= iterations; i++) {
        let isPrime = true;
        const limit = Math.floor(Math.sqrt(i));
        for (let j = 2; j <= limit; j++) {
          if (i % j === 0) {
            isPrime = false;
            break;
          }
        }
        if (isPrime) primesCount++;
      }

      const durationMs = performance.now() - start;
      this.lastCalculationDuration.set(Number(durationMs.toFixed(2)));
      this.perf.recordManualTask(durationMs);
      this.isProcessing.set(false);

      // Evaluación y envío de telemetría sin optimización
      this.sendTelemetryToBackend(false);
    }, 40);
  }

  /**
   * Ejecuta el cómputo intensivo en el Web Worker (Desacoplado)
   */
  public runOnWebWorker(): void {
    if (this.isProcessing()) return;

    if (!this.worker) {
      this.initWorker();
    }

    if (!this.worker) {
      alert('Los Web Workers no están disponibles en este entorno.');
      return;
    }

    this.isProcessing.set(true);
    this.activeMode.set('WORKER');

    this.worker.postMessage({
      type: 'COMPUTE',
      iterations: this.workloadIntensity()
    });
  }

  /**
   * Inyecta o limpia 1,500 elementos DOM para evaluar el impacto de la densidad
   */
  public toggleDomStress(): void {
    const container = document.getElementById('dom-stress-mount');
    if (!container) return;

    if (this.stressNodeCount() === 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < 1500; i++) {
        const item = document.createElement('div');
        item.className = 'stress-node-chip';
        item.textContent = `node-${i}`;
        fragment.appendChild(item);
      }
      container.appendChild(fragment);
      this.stressNodeCount.set(1500);
    } else {
      container.innerHTML = '';
      this.stressNodeCount.set(0);
    }

    this.perf.updateDomNodeCount();
    this.sendTelemetryToBackend(false);
  }

  /**
   * Envía la telemetría actual al Backend para predicción de INP y auditoría
   */
  public sendTelemetryToBackend(optimizationApplied: boolean): void {
    const request: PerformanceTelemetryRequest = {
      sessionId: this.sessionId,
      urlPath: typeof window !== 'undefined' ? window.location.pathname : '/',
      longTaskDurationMs: this.perf.lastLongTaskDuration(),
      blockingTimeMs: this.perf.totalBlockingTime(),
      domNodeCount: this.perf.domNodeCount(),
      eventLoopLagMs: this.perf.eventLoopLag(),
      optimizationApplied
    };

    this.telemetryService.evaluateTelemetry(request).subscribe({
      next: (response) => {
        this.latestRecommendation.set(response);
        this.backendStatus.set('ONLINE');

        // Registrar en historial
        this.history.update((prev) => [
          {
            timestamp: Date.now(),
            eventLoopLagMs: request.eventLoopLagMs,
            longTaskDurationMs: request.longTaskDurationMs,
            blockingTimeMs: request.blockingTimeMs,
            domNodeCount: request.domNodeCount,
            predictedInpMs: response.predictedInpMs,
            category: response.vitalsCategory,
            mode: this.activeMode()
          },
          ...prev.slice(0, 7) // Guardar últimas 8 entradas
        ]);
      },
      error: () => {
        this.backendStatus.set('OFFLINE');
      }
    });
  }

  /**
   * Reinicia los contadores de telemetría
   */
  public resetBenchmark(): void {
    this.perf.resetMetrics();
    this.lastCalculationDuration.set(0);
    this.activeMode.set('IDLE');
    const container = document.getElementById('dom-stress-mount');
    if (container) {
      container.innerHTML = '';
      this.stressNodeCount.set(0);
      this.perf.updateDomNodeCount();
    }
    this.sendTelemetryToBackend(false);
  }

  ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.fpsAnimFrameId !== null) {
      cancelAnimationFrame(this.fpsAnimFrameId);
      this.fpsAnimFrameId = null;
    }
  }
}
