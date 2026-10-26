import { Injectable, signal, effect, computed } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ActiveTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'nexus-theme-mode';

  // Modo configurado por el usuario ('system', 'light', 'dark')
  readonly themeMode = signal<ThemeMode>(this.getInitialMode());

  // Estado del sistema operativo
  readonly systemPrefersDark = signal<boolean>(this.checkSystemDark());

  // Tema efectivo final aplicado al DOM
  readonly effectiveTheme = computed<ActiveTheme>(() => {
    const mode = this.themeMode();
    if (mode === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return mode;
  });

  // Texto descriptivo para la UI
  readonly themeDescription = computed<string>(() => {
    const mode = this.themeMode();
    const effective = this.effectiveTheme();
    if (mode === 'system') {
      return `SISTEMA (${effective === 'dark' ? 'OSCURO' : 'CLARO'})`;
    }
    return mode === 'dark' ? 'MODO OSCURO' : 'MODO CLARO';
  });

  private mediaQueryList: MediaQueryList | null = null;
  private mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

  constructor() {
    this.initSystemListener();

    // Efecto reactivo para actualizar clases en <html> y <body>
    effect(() => {
      const active = this.effectiveTheme();
      this.applyThemeToDom(active);
    });
  }

  private getInitialMode(): ThemeMode {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    return 'system';
  }

  private checkSystemDark(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default oscuro
  }

  private initSystemListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(this.mediaQueryList.matches);

      this.mediaListener = (e: MediaQueryListEvent) => {
        this.systemPrefersDark.set(e.matches);
      };

      if (this.mediaQueryList.addEventListener) {
        this.mediaQueryList.addEventListener('change', this.mediaListener);
      } else if ((this.mediaQueryList as any).addListener) {
        (this.mediaQueryList as any).addListener(this.mediaListener);
      }
    }
  }

  public setMode(mode: ThemeMode): void {
    this.themeMode.set(mode);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, mode);
    }
  }

  public cycleMode(): void {
    const current = this.themeMode();
    if (current === 'system') {
      this.setMode('light');
    } else if (current === 'light') {
      this.setMode('dark');
    } else {
      this.setMode('system');
    }
  }

  private applyThemeToDom(theme: ActiveTheme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
    }
  }
}
