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

  it('debe crear el componente Dashboard correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar con 48 barras en el osciloscopio', () => {
    expect(component.oscBarHeights().length).toBe(48);
  });

  it('debe tener estado inicial en reposo (IDLE)', () => {
    expect(component.activeMode()).toBe('IDLE');
    expect(component.isProcessing()).toBe(false);
  });

  it('debe reiniciar metricas correctamente al llamar a resetBenchmark', () => {
    component.resetBenchmark();
    expect(component.lastCalculationDuration()).toBe(0);
    expect(component.activeMode()).toBe('IDLE');
    expect(component.stressNodeCount()).toBe(0);
  });

  it('debe permitir cambiar de ruta activa de navegacion', () => {
    component.setNav('heap-memory');
    expect(component.activeNavPath()).toBe('heap-memory');
  });

  it('debe procesar comandos CLI en la terminal', () => {
    component.cmdInput.set('clear');
    component.onCommandSubmit();
    expect(component.terminalLogs().length).toBe(0);
  });
});
