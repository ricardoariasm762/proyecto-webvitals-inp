import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { VitalsGrpcClientService } from './vitals-grpc-client.service';
import { PerformanceTelemetryRequest } from '../models/vitals.model';
import { OptimizationVerdict } from '../../../proto/vitals_telemetry_pb';

describe('VitalsGrpcClientService', () => {
  let service: VitalsGrpcClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VitalsGrpcClientService]
    });
    service = TestBed.inject(VitalsGrpcClientService);
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  it('should build a Protobuf TelemetryFrame with all attributes correctly mapped', () => {
    const request: PerformanceTelemetryRequest = {
      sessionId: 'NEXUS-GRPC-01',
      urlPath: '/dashboard',
      longTaskDurationMs: 85.4,
      blockingTimeMs: 35.4,
      domNodeCount: 1450,
      eventLoopLagMs: 12.8,
      optimizationApplied: false
    };

    const frame = service.buildTelemetryFrame(request);

    expect(frame.getSessionId()).toBe('NEXUS-GRPC-01');
    expect(frame.getUrlPath()).toBe('/dashboard');
    expect(frame.getLongTaskDurationMs()).toBeCloseTo(85.4, 1);
    expect(frame.getBlockingTimeMs()).toBeCloseTo(35.4, 1);
    expect(frame.getDomNodeCount()).toBeCloseTo(1450, 1);
    expect(frame.getEventLoopLagMs()).toBeCloseTo(12.8, 1);
    expect(frame.getTimestampEpoch()).toBeGreaterThan(0);
  });

  it('should serialize and deserialize TelemetryFrame in binary without loss of precision', () => {
    const request: PerformanceTelemetryRequest = {
      sessionId: 'BINARY-TEST',
      urlPath: '/benchmark',
      longTaskDurationMs: 120.0,
      blockingTimeMs: 70.0,
      domNodeCount: 2000,
      eventLoopLagMs: 25.5
    };

    const frame = service.buildTelemetryFrame(request);
    const bytes = frame.serializeBinary();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);

    const reconstructed = service.buildTelemetryFrame(request).constructor as any;
    const decoded = reconstructed.deserializeBinary(bytes);
    expect(decoded.getSessionId()).toBe('BINARY-TEST');
    expect(decoded.getLongTaskDurationMs()).toBeCloseTo(120.0, 1);
  });

  it('should handle simulated gRPC EvaluateSingleFrame responses correctly', async () => {
    const mockVerdict = new OptimizationVerdict();
    mockVerdict.setPredictedInpMs(45.5);
    mockVerdict.setVitalsCategory('GOOD');
    mockVerdict.setArchitecturalAdvice('Presupuesto nominal');
    mockVerdict.setOffloadToWorker(false);
    mockVerdict.setYieldMainThread(false);

    vi.spyOn(service, 'evaluateSingleFrame').mockResolvedValue(mockVerdict);

    const request: PerformanceTelemetryRequest = {
      sessionId: 'TEST-MOCK',
      urlPath: '/',
      longTaskDurationMs: 10,
      blockingTimeMs: 0,
      domNodeCount: 300,
      eventLoopLagMs: 2
    };

    const verdict = await firstValueFrom(service.evaluateTelemetry(request));
    expect(verdict.predictedInpMs).toBe(45.5);
    expect(verdict.vitalsCategory).toBe('GOOD');
    expect(verdict.offloadToWorker).toBe(false);
  });
});
