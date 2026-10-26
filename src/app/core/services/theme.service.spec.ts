import { TestBed } from '@angular/core/testing';
import { ThemeService, ThemeMode } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe iniciar por defecto en modo system', () => {
    expect(service.themeMode()).toBe('system');
  });

  it('debe cambiar de modo a light y persistir en localStorage', () => {
    service.setMode('light');
    expect(service.themeMode()).toBe('light');
    expect(service.effectiveTheme()).toBe('light');
    expect(localStorage.getItem('nexus-theme-mode')).toBe('light');
  });

  it('debe cambiar de modo a dark y persistir en localStorage', () => {
    service.setMode('dark');
    expect(service.themeMode()).toBe('dark');
    expect(service.effectiveTheme()).toBe('dark');
    expect(localStorage.getItem('nexus-theme-mode')).toBe('dark');
  });

  it('debe alternar modos secuencialmente con cycleMode', () => {
    service.setMode('system');
    service.cycleMode();
    expect(service.themeMode()).toBe('light');
    service.cycleMode();
    expect(service.themeMode()).toBe('dark');
    service.cycleMode();
    expect(service.themeMode()).toBe('system');
  });

  it('debe calcular descripcion adecuada para cada tema', () => {
    service.setMode('dark');
    expect(service.themeDescription()).toBe('MODO OSCURO');
    service.setMode('light');
    expect(service.themeDescription()).toBe('MODO CLARO');
  });
});
