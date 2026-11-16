import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VitalsTelemetryService } from './vitals-telemetry.service';
import { PerformanceTelemetryRequest } from '../models/vitals.model';
import { environment } from '../../../environments/environment';

describe('VitalsTelemetryService', () => {
  let service: VitalsTelemetryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VitalsTelemetryService
      ]
    });

    service = TestBed.inject(VitalsTelemetryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should evaluate telemetry with backend response', () => {
    const request: PerformanceTelemetryRequest = {
      sessionId: 'sess-1',
      urlPath: '/',
      longTaskDurationMs: 80,
      blockingTimeMs: 30,
      domNodeCount: 1000,
      eventLoopLagMs: 15
    };

    service.evaluateTelemetry(request).subscribe((res) => {
      expect(res.vitalsCategory).toBe('GOOD');
      expect(res.predictedInpMs).toBe(110);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/evaluate`);
    expect(req.request.method).toBe('POST');
    req.flush({
      predictedInpMs: 110,
      vitalsCategory: 'GOOD',
      architecturalAdvice: 'Presupuesto óptimo',
      offloadToWorker: false,
      yieldMainThread: false
    });
  });

  it('should fallback gracefully when backend request fails', () => {
    const request: PerformanceTelemetryRequest = {
      sessionId: 'sess-offline',
      urlPath: '/',
      longTaskDurationMs: 700,
      blockingTimeMs: 650,
      domNodeCount: 3500,
      eventLoopLagMs: 120
    };

    service.evaluateTelemetry(request).subscribe((res) => {
      expect(res.vitalsCategory).toBe('POOR');
      expect(res.offloadToWorker).toBe(true);
      expect(res.architecturalAdvice).toContain('Diagnóstico Local');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/evaluate`);
    req.error(new ProgressEvent('error'));
  });

  it('should format and export telemetry snapshot array to JSON string', () => {
    const snapshots = [
      { timestamp: 1000, eventLoopLagMs: 5.5, longTaskDurationMs: 60.0 }
    ];
    const exported = service.exportTelemetryJson(snapshots);
    expect(exported).toContain('totalSnapshots');
    expect(exported).toContain('exportedAt');
    expect(JSON.parse(exported).totalSnapshots).toBe(1);
  });
});
