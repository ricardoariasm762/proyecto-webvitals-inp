import { Injectable, signal } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { VitalsAuditorServiceClient } from '../../../proto/vitals_telemetry_grpc_web_pb';
import { TelemetryFrame, OptimizationVerdict } from '../../../proto/vitals_telemetry_pb';
import {
  OptimizationRecommendationResponse,
  PerformanceTelemetryRequest
} from '../models/vitals.model';

@Injectable({
  providedIn: 'root'
})
export class VitalsGrpcClientService {
  // Envoy proxy translator for gRPC-Web on port 8080
  private readonly envoyProxyUrl = 'http://localhost:8080';
  private readonly client: VitalsAuditorServiceClient;

  readonly isSending = signal<boolean>(false);
  readonly lastVerdict = signal<OptimizationRecommendationResponse | null>(null);
  readonly clientStatus = signal<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');

  constructor() {
    this.client = new VitalsAuditorServiceClient(this.envoyProxyUrl, null, null);
  }

  /**
   * Builds a Protobuf TelemetryFrame from standard browser performance model
   */
  public buildTelemetryFrame(request: PerformanceTelemetryRequest): TelemetryFrame {
    const frame = new TelemetryFrame();
    frame.setSessionId(request.sessionId);
    frame.setUrlPath(request.urlPath || (typeof window !== 'undefined' ? window.location.pathname : '/'));
    frame.setLongTaskDurationMs(request.longTaskDurationMs || 0);
    frame.setBlockingTimeMs(request.blockingTimeMs || 0);
    frame.setDomNodeCount(request.domNodeCount || 0);
    frame.setEventLoopLagMs(request.eventLoopLagMs || 0);
    frame.setTimestampEpoch(Date.now());
    return frame;
  }

  /**
   * Sends binary telemetry through Envoy to gRPC EvaluateSingleFrame
   */
  public evaluateTelemetry(request: PerformanceTelemetryRequest): Observable<OptimizationRecommendationResponse> {
    const frame = this.buildTelemetryFrame(request);
    this.isSending.set(true);
    this.clientStatus.set('SENDING');

    return from(this.evaluateSingleFrame(frame)).pipe(
      map((verdict: OptimizationVerdict): OptimizationRecommendationResponse => {
        const category = verdict.getVitalsCategory() as 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
        return {
          predictedInpMs: Number(verdict.getPredictedInpMs().toFixed(2)),
          vitalsCategory: category || 'GOOD',
          architecturalAdvice: verdict.getArchitecturalAdvice(),
          offloadToWorker: verdict.getOffloadToWorker(),
          yieldMainThread: verdict.getYieldMainThread()
        };
      }),
      tap({
        next: (response) => {
          this.isSending.set(false);
          this.clientStatus.set('SUCCESS');
          this.lastVerdict.set(response);
        },
        error: (err) => {
          this.isSending.set(false);
          this.clientStatus.set('ERROR');
          console.warn('gRPC-Web call via Envoy failed:', err);
        }
      })
    );
  }

  /**
   * Sends a TelemetryFrame directly returning OptimizationVerdict promise
   */
  public evaluateSingleFrame(frame: TelemetryFrame): Promise<OptimizationVerdict> {
    return this.client.evaluateSingleFrame(frame);
  }
}
