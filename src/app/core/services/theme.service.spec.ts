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

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  it('should default to system mode initially', () => {
    expect(service.themeMode()).toBe('system');
  });

  it('should switch mode to light and persist in localStorage', () => {
    service.setMode('light');
    expect(service.themeMode()).toBe('light');
    expect(service.effectiveTheme()).toBe('light');
    expect(localStorage.getItem('nexus-theme-mode')).toBe('light');
  });

  it('should switch mode to dark and persist in localStorage', () => {
    service.setMode('dark');
    expect(service.themeMode()).toBe('dark');
    expect(service.effectiveTheme()).toBe('dark');
    expect(localStorage.getItem('nexus-theme-mode')).toBe('dark');
  });

  it('should cycle through modes sequentially with cycleMode', () => {
    service.setMode('system');
    service.cycleMode();
    expect(service.themeMode()).toBe('light');
    service.cycleMode();
    expect(service.themeMode()).toBe('dark');
    service.cycleMode();
    expect(service.themeMode()).toBe('system');
  });

  it('should compute appropriate UI description for each theme', () => {
    service.setMode('dark');
    expect(service.themeDescription()).toBe('MODO OSCURO');
    service.setMode('light');
    expect(service.themeDescription()).toBe('MODO CLARO');
  });
});
