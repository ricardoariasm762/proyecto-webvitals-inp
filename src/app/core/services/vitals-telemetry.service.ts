import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  OptimizationRecommendationResponse,
  PerformanceTelemetryRequest
} from '../models/vitals.model';

declare const chrome: any;

@Injectable({
  providedIn: 'root'
})
export class VitalsTelemetryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8081/api/vitals';

  // Señales reactivas para la extensión de Chrome
  readonly currentAudit = signal<any>(null);
  readonly isRunningInExtension = signal<boolean>(false);

  constructor() {
    this.listenToExtensionStorage();
  }

  /**
   * Conecta con el almacenamiento local de Chrome si la app corre como Side Panel o Popup
   */
  private listenToExtensionStorage(): void {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      this.isRunningInExtension.set(true);

      // 1. Obtener la última evaluación almacenada
      chrome.storage.local.get(['latestEvaluation'], (result: any) => {
        if (result?.latestEvaluation) {
          this.currentAudit.set(result.latestEvaluation);
        }
      });

      // 2. Escuchar actualizaciones en vivo producidas por el service worker
      chrome.storage.onChanged.addListener((changes: any, area: string) => {
        if (area === 'local' && changes?.latestEvaluation) {
          this.currentAudit.set(changes.latestEvaluation.newValue);
        }
      });
    }
  }

  /**
   * Envía la telemetría recolectada al modelo de IA en Spring Boot
   */
  public evaluateTelemetry(request: PerformanceTelemetryRequest): Observable<OptimizationRecommendationResponse> {
    return this.http.post<OptimizationRecommendationResponse>(`${this.baseUrl}/evaluate`, request).pipe(
      catchError((error) => {
        console.warn('Backend Spring Boot no disponible en localhost:8081. Activando respuesta heurística local:', error);
        return of(this.calculateLocalFallback(request));
      })
    );
  }

  /**
   * Obtiene el histórico temporal de métricas de una sesión
   */
  public getSessionMetrics(sessionId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/metrics/session/${sessionId}`).pipe(
      catchError((error) => {
        console.warn('Error al consultar métricas históricas de la sesión:', error);
        return of([]);
      })
    );
  }

  /**
   * Comprobación rápida de estado del backend
   */
  public checkHealth(): Observable<{ status: string; service?: string }> {
    return this.http.get<{ status: string; service?: string }>(`${this.baseUrl}/health`).pipe(
      catchError(() => of({ status: 'OFFLINE' }))
    );
  }

  /**
   * Fallback heurístico en el cliente cuando el backend está temporalmente apagado
   */
  private calculateLocalFallback(request: PerformanceTelemetryRequest): OptimizationRecommendationResponse {
    const domPenalty = (request.domNodeCount / 1000.0) * 8.5;
    const rawPredicted = 16.6 + (0.75 * request.longTaskDurationMs) + (0.45 * request.eventLoopLagMs) + domPenalty;
    const predictedInpMs = Number(Math.max(16.6, Math.min(rawPredicted, 900.0)).toFixed(2));

    if (predictedInpMs <= 200.0) {
      return {
        predictedInpMs,
        vitalsCategory: 'GOOD',
        architecturalAdvice: '[Diagnóstico Local] Presupuesto de fotogramas óptimo. Las tareas pueden continuar en el Main Thread sin degradación perceptible.',
        offloadToWorker: false,
        yieldMainThread: false
      };
    } else if (predictedInpMs <= 500.0) {
      return {
        predictedInpMs,
        vitalsCategory: 'NEEDS_IMPROVEMENT',
        architecturalAdvice: '[Diagnóstico Local] Riesgo de retraso de renderizado. Fragmentar microtareas pesadas utilizando requestIdleCallback() o scheduler.yield().',
        offloadToWorker: false,
        yieldMainThread: true
      };
    } else {
      return {
        predictedInpMs,
        vitalsCategory: 'POOR',
        architecturalAdvice: '[Diagnóstico Local] Saturación crítica del Event Loop. Trasladar inmediatamente la ejecución del algoritmo intensivo a un Web Worker desacoplado.',
        offloadToWorker: true,
        yieldMainThread: true
      };
    }
  }
}
