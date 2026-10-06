import { TestBed } from '@angular/core/testing';
import { PerformanceObserverService } from './performance-observer.service';

describe('PerformanceObserverService', () => {
  let service: PerformanceObserverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerformanceObserverService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should record manual tasks and update total blocking time', () => {
    service.recordManualTask(120);
    expect(service.lastLongTaskDuration()).toBe(120);
    expect(service.totalBlockingTime()).toBe(70); // 120 - 50 = 70ms blocking
  });

  it('should reset metrics cleanly', () => {
    service.recordManualTask(150);
    service.resetMetrics();
    expect(service.lastLongTaskDuration()).toBe(0);
    expect(service.totalBlockingTime()).toBe(0);
  });
});
