import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { PerformanceObserverService } from '../../core/services/performance-observer.service';
import { VitalsTelemetryService } from '../../core/services/vitals-telemetry.service';
import { ThemeService } from '../../core/services/theme.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PerformanceObserverService,
        VitalsTelemetryService,
        ThemeService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the Dashboard component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 48 bars in the oscilloscope', () => {
    expect(component.oscBarHeights().length).toBe(48);
  });

  it('should have initial idle state (IDLE)', () => {
    expect(component.activeMode()).toBe('IDLE');
    expect(component.isProcessing()).toBe(false);
  });

  it('should reset metrics correctly when resetBenchmark is invoked', () => {
    component.resetBenchmark();
    expect(component.lastCalculationDuration()).toBe(0);
    expect(component.activeMode()).toBe('IDLE');
    expect(component.stressNodeCount()).toBe(0);
  });

  it('should allow switching active navigation path', () => {
    component.setNav('heap-memory');
    expect(component.activeNavPath()).toBe('heap-memory');
  });

  it('should process CLI commands in the terminal', () => {
    component.cmdInput.set('clear');
    component.onCommandSubmit();
    expect(component.terminalLogs().length).toBe(0);
  });
});
