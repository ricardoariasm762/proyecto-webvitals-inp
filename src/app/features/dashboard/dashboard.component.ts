import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerformanceObserverService } from '../../core/services/performance-observer.service';
import { VitalsTelemetryService } from '../../core/services/vitals-telemetry.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import {
  OptimizationRecommendationResponse,
  PerformanceSnapshot,
  PerformanceTelemetryRequest
} from '../../core/models/vitals.model';

export interface TerminalLog {
  id: string;
  time: string;
  level: 'CRITICAL' | 'ADVISORY' | 'OPTIMAL' | 'PREDICTION' | 'SYSTEM_EXEC';
  message: string;
  code?: string;
  highlight?: string;
}

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
  protected readonly theme = inject(ThemeService);
  private readonly telemetryService = inject(VitalsTelemetryService);

  @ViewChild('terminalContainer') private terminalContainer?: ElementRef<HTMLDivElement>;

  // Identificador de sesión único
  readonly sessionId = 'NEXUS-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // Navegación lateral activa
  readonly activeNavPath = signal<string>('runtime-telemetry');

  // Estados de control del benchmark
  readonly workloadIntensity = signal<number>(4_000_000);
  readonly isProcessing = signal<boolean>(false);
  readonly activeMode = signal<'IDLE' | 'MAIN_THREAD' | 'WORKER'>('IDLE');
  readonly lastCalculationDuration = signal<number>(0);
  readonly stressNodeCount = signal<number>(0);
  readonly triggerStatus = signal<string>('READY // LISTENING ON MOUSE & TOUCH');
  readonly triggerStatusClass = signal<string>('text-secondary-fixed');

  // Señales de la extensión de Chrome
  readonly currentAudit = this.telemetryService.currentAudit;
  readonly isRunningInExtension = this.telemetryService.isRunningInExtension;

  // Estado del backend y recomendación
  readonly backendStatus = signal<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');
  readonly latestRecommendation = signal<OptimizationRecommendationResponse>({
    predictedInpMs: 42.0,
    vitalsCategory: 'GOOD',
    architecturalAdvice: 'Sistema inicializado. Presupuesto de fotogramas óptimo (60 FPS). Tareas en régimen nominal.',
    offloadToWorker: false,
    yieldMainThread: false
  });

  // Historial de evaluaciones
  readonly history = signal<PerformanceSnapshot[]>([]);

  // Telemetría en tiempo real
  readonly currentFps = signal<number>(60);
  readonly syncUtc = signal<string>('');
  readonly epochCounter = signal<string>('+00:14:28.902');
  readonly heapUsedMb = signal<number>(48.2);
  readonly heapTotalMb = signal<number>(128.0);
  readonly longTasksCount = signal<number>(3);
  readonly frameDrops = signal<number>(2);
  readonly peakLatency = signal<number>(64.2);
  readonly avgLatency = signal<number>(11.8);

  // Oscilloscope cluster bars (48 barras continuas)
  readonly oscBarHeights = signal<number[]>(this.generateInitialOscBars());

  // Terminal Ticker Logs
  readonly terminalLogs = signal<TerminalLog[]>([
    {
      id: 'log-1',
      time: '[00:14:21.08]',
      level: 'CRITICAL',
      message: 'Defer microtasks via',
      code: 'scheduler.yield()',
      highlight: 'to prevent 64ms frame drop on pointerdown handler.'
    },
    {
      id: 'log-2',
      time: '[00:14:25.44]',
      level: 'ADVISORY',
      message: 'Detected layout thrashing in',
      code: '#inventory-grid',
      highlight: 'Batch offsetHeight reads before next requestAnimationFrame().'
    },
    {
      id: 'log-3',
      time: '[00:14:28.12]',
      level: 'OPTIMAL',
      message: 'Offloading compression routine to WebWorker#03 restored 16.6ms budget (INP stabilized at 42ms).'
    },
    {
      id: 'log-4',
      time: '[00:14:28.90]',
      level: 'PREDICTION',
      message: 'Projected next user interaction latency: 38ms (Confidence 99.4%). System within compliance.'
    }
  ]);

  // Entrada de comandos CLI
  readonly cmdInput = signal<string>('execute_patch --strategy=scheduler.yield()');

  // Math utilities for templates
  protected readonly mathMin = Math.min;
  protected readonly mathMax = Math.max;

  // Timers e IDs
  private worker: Worker | null = null;
  private fpsAnimFrameId: number | null = null;
  private lastFpsTimestamp = performance.now();
  private frameCount = 0;
  private clockIntervalId: ReturnType<typeof setInterval> | null = null;
  private epochIntervalId: ReturnType<typeof setInterval> | null = null;
  private oscIntervalId: ReturnType<typeof setInterval> | null = null;
  private epochSeconds = 868.902;

  // Señales calculadas
  readonly vitalsClass = computed(() => {
    const category = this.latestRecommendation().vitalsCategory;
    if (category === 'GOOD') return 'vitals-good';
    if (category === 'NEEDS_IMPROVEMENT') return 'vitals-warning';
    return 'vitals-poor';
  });

  readonly vitalsBadgeText = computed(() => {
    const category = this.latestRecommendation().vitalsCategory;
    if (category === 'GOOD') return '[GOOD < 200ms NOMINAL]';
    if (category === 'NEEDS_IMPROVEMENT') return '[WARNING 200-500ms JANK]';
    return '[CRITICAL > 500ms POOR]';
  });

  readonly budgetSlack = computed(() => {
    const inp = this.latestRecommendation().predictedInpMs;
    const slack = 200 - inp;
    return slack >= 0 ? `+${slack.toFixed(1)}ms AVAILABLE` : `${slack.toFixed(1)}ms EXCEEDED`;
  });

  // Gauge SVG Dash Offset calculation
  readonly gaugeTraceOffset = computed(() => {
    const inp = Math.max(16.6, Math.min(800, this.latestRecommendation().predictedInpMs));
    // 0 to 800ms mapped across the semi-circle (offset from 0 to -240)
    const ratio = (inp - 16.6) / (800 - 16.6);
    return -(4 + ratio * 230);
  });

  readonly gaugeTraceColor = computed(() => {
    const category = this.latestRecommendation().vitalsCategory;
    if (category === 'GOOD') return 'var(--primary-container)';
    if (category === 'NEEDS_IMPROVEMENT') return 'var(--tertiary-fixed-dim)';
    return 'var(--error)';
  });

  readonly inputDelayPercent = computed(() => {
    const lag = this.perf.eventLoopLag();
    return Math.min(100, (lag / 50) * 100);
  });

  readonly procTimeValue = computed(() => {
    if (this.lastCalculationDuration() > 0) {
      return this.lastCalculationDuration();
    }
    return Math.max(21.2, this.perf.lastLongTaskDuration());
  });

  readonly procTimePercent = computed(() => {
    return Math.min(100, (this.procTimeValue() / 100) * 100);
  });

  readonly presDelayValue = computed(() => {
    const nodes = this.perf.domNodeCount();
    return Number((16.0 + (nodes > 2500 ? 14.5 : nodes > 1500 ? 6.2 : 0)).toFixed(1));
  });

  readonly presDelayPercent = computed(() => {
    return Math.min(100, (this.presDelayValue() / 50) * 100);
  });

  readonly targetUrl = computed(() => {
    const ext = this.currentAudit();
    if (ext?.url) return ext.url;
    return 'https://dev-core.local:8080';
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
        if (audit.backendOffline) {
          this.backendStatus.set('OFFLINE');
        } else if (audit.backendOffline === false) {
          this.backendStatus.set('ONLINE');
        }
      }
    });
  }

  ngOnInit(): void {
    this.checkBackendHealth();
    this.startClock();
    this.startEpochCounter();
    this.startFpsTracker();
    this.startOscilloscopeWave();
    this.initWorker();
    this.updateHeapMetrics();
    this.sendTelemetryToBackend(false);
  }

  private generateInitialOscBars(): number[] {
    const bars: number[] = [];
    for (let i = 0; i < 48; i++) {
      bars.push(Math.floor(Math.random() * 25) + 12);
    }
    return bars;
  }

  private startClock(): void {
    const updateTime = () => {
      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const min = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      this.syncUtc.set(`${yyyy}.${mm}.${dd}//${hh}:${min}:${ss}`);
    };
    updateTime();
    this.clockIntervalId = setInterval(updateTime, 1000);
  }

  private startEpochCounter(): void {
    this.epochIntervalId = setInterval(() => {
      this.epochSeconds += 0.103;
      const mins = Math.floor(this.epochSeconds / 60);
      const rawSec = this.epochSeconds % 60;
      const remSec = rawSec.toFixed(3);
      const formatted = `+00:${mins < 10 ? '0' : ''}${mins}:${rawSec < 10 ? '0' : ''}${remSec}`;
      this.epochCounter.set(formatted);
    }, 100);
  }

  private startOscilloscopeWave(): void {
    this.oscIntervalId = setInterval(() => {
      const current = [...this.oscBarHeights()];
      current.shift();
      const isStressed = this.isProcessing() && this.activeMode() === 'MAIN_THREAD';
      const baseHeight = isStressed ? Math.floor(Math.random() * 50) + 48 : Math.floor(Math.random() * 24) + 12;
      current.push(baseHeight);
      this.oscBarHeights.set(current);
    }, 120);
  }

  private updateHeapMetrics(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      this.heapUsedMb.set(Number((mem.usedJSHeapSize / (1024 * 1024)).toFixed(1)));
      this.heapTotalMb.set(Number((mem.jsHeapSizeLimit / (1024 * 1024)).toFixed(1)));
    } else {
      const baseUsed = 48.2 + (this.stressNodeCount() > 0 ? 18.5 : 0);
      this.heapUsedMb.set(Number(baseUsed.toFixed(1)));
    }
  }

  private checkBackendHealth(): void {
    this.telemetryService.checkHealth().subscribe((res) => {
      this.backendStatus.set(res.status === 'UP' ? 'ONLINE' : 'OFFLINE');
    });
  }

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
            this.triggerStatus.set('TASK DISPATCHED TO WORKER_03 [ZERO MAIN JANK]');
            this.triggerStatusClass.set('text-secondary-container');

            this.appendLog({
              time: this.getCurrentTimestamp(),
              level: 'OPTIMAL',
              message: `Parallel thread executed cleanly in ${data.durationMs}ms. 0ms main thread overhead recorded.`
            });

            this.sendTelemetryToBackend(true);
          }
        };

        this.worker.onerror = (err) => {
          console.error('Error en Web Worker:', err);
          this.isProcessing.set(false);
          this.triggerStatus.set('WORKER ERROR // EXECUTION FAILED');
          this.triggerStatusClass.set('text-error');
        };
      } catch (e) {
        console.warn('No se pudo instanciar el Web Worker:', e);
      }
    }
  }

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

  public runOnMainThread(): void {
    if (this.isProcessing()) return;

    this.isProcessing.set(true);
    this.activeMode.set('MAIN_THREAD');
    this.triggerStatus.set('EXECUTING SYNCHRONOUS REGEX BLOCK (128ms)...');
    this.triggerStatusClass.set('text-error animate-pulse');

    setTimeout(() => {
      const start = performance.now();
      const iterations = this.workloadIntensity();
      let primesCount = 0;

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

      const durationMs = Number((performance.now() - start).toFixed(2));
      this.lastCalculationDuration.set(durationMs);
      this.perf.recordManualTask(durationMs);
      this.isProcessing.set(false);
      this.longTasksCount.update((c) => c + 1);
      this.frameDrops.update((f) => f + 2);
      this.peakLatency.set(Math.max(this.peakLatency(), durationMs));

      this.appendLog({
        time: this.getCurrentTimestamp(),
        level: 'CRITICAL',
        message: `INP_SPIKE: Main thread blocked for ${durationMs}ms. Frame dropped. Pointer events delayed.`
      });

      this.sendTelemetryToBackend(false);

      setTimeout(() => {
        this.triggerStatus.set('SPIKE RESOLVED // AUTO-THROTTLE COOLED');
        this.triggerStatusClass.set('text-secondary-fixed');
      }, 1800);
    }, 40);
  }

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
    this.triggerStatus.set('DISPATCHING BACKGROUND THREAD TO POOL W#03...');
    this.triggerStatusClass.set('text-secondary-container');

    this.worker.postMessage({
      type: 'COMPUTE',
      iterations: this.workloadIntensity()
    });
  }

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

      this.appendLog({
        time: this.getCurrentTimestamp(),
        level: 'ADVISORY',
        message: 'Injected +1500 DOM nodes. Style recalculation cost increased by ~4.2ms.'
      });
    } else {
      container.innerHTML = '';
      this.stressNodeCount.set(0);

      this.appendLog({
        time: this.getCurrentTimestamp(),
        level: 'OPTIMAL',
        message: 'Purged stress DOM nodes. Tree pruned to nominal density.'
      });
    }

    this.perf.updateDomNodeCount();
    this.updateHeapMetrics();
    this.sendTelemetryToBackend(false);
  }

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
          ...prev.slice(0, 7)
        ]);
      },
      error: () => {
        this.backendStatus.set('OFFLINE');
      }
    });
  }

  public resetBenchmark(): void {
    this.perf.resetMetrics();
    this.lastCalculationDuration.set(0);
    this.activeMode.set('IDLE');
    this.longTasksCount.set(0);
    this.frameDrops.set(0);
    this.peakLatency.set(16.6);
    this.avgLatency.set(11.8);
    this.triggerStatus.set('READY // TELEMETRY RECALIBRATED');
    this.triggerStatusClass.set('text-secondary-fixed');

    const container = document.getElementById('dom-stress-mount');
    if (container) {
      container.innerHTML = '';
      this.stressNodeCount.set(0);
      this.perf.updateDomNodeCount();
    }
    this.updateHeapMetrics();
    this.sendTelemetryToBackend(false);

    this.appendLog({
      time: this.getCurrentTimestamp(),
      level: 'SYSTEM_EXEC',
      message: 'HUD Calibrator: Full state flushed. Metrics zeroed.'
    });
  }

  public setNav(path: string): void {
    this.activeNavPath.set(path);
  }

  public onCommandSubmit(): void {
    const cmd = this.cmdInput().trim();
    if (!cmd) return;

    if (cmd.startsWith('clear')) {
      this.terminalLogs.set([]);
      this.cmdInput.set('');
      return;
    }

    if (cmd.includes('scheduler.yield()')) {
      this.appendLog({
        time: this.getCurrentTimestamp(),
        level: 'SYSTEM_EXEC',
        message: `> ${cmd} [PATCH APPLIED: YIELD_INSERTED_OK]`
      });
      this.appendLog({
        time: this.getCurrentTimestamp(),
        level: 'OPTIMAL',
        message: 'Yield checkpoints inserted. Long tasks fragmented below 16.6ms threshold.'
      });
      this.cmdInput.set('');
      return;
    }

    if (cmd.includes('worker')) {
      this.runOnWebWorker();
      this.cmdInput.set('');
      return;
    }

    if (cmd.includes('reset')) {
      this.resetBenchmark();
      this.cmdInput.set('');
      return;
    }

    // Default command execution log
    this.appendLog({
      time: this.getCurrentTimestamp(),
      level: 'SYSTEM_EXEC',
      message: `> ${cmd} [COMMAND ACKNOWLEDGED // INGESTED]`
    });
    this.cmdInput.set('');
  }

  private appendLog(log: Omit<TerminalLog, 'id'>): void {
    const newEntry: TerminalLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      ...log
    };
    this.terminalLogs.update((logs) => [...logs, newEntry]);

    setTimeout(() => {
      if (this.terminalContainer) {
        this.terminalContainer.nativeElement.scrollTop = this.terminalContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  private getCurrentTimestamp(): string {
    const now = new Date();
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
    return `[00:${mm}:${ss}.${ms}]`;
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
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
    }
    if (this.epochIntervalId) {
      clearInterval(this.epochIntervalId);
    }
    if (this.oscIntervalId) {
      clearInterval(this.oscIntervalId);
    }
  }
}
