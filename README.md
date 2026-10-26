# NEXUS//HUD - Auditor Predictivo de INP y Event Loop

Panel interactivo de alta fidelidad y extensión de Google Chrome para diagnosticar, evaluar heurísticamente y predecir el impacto de interacciones de usuario en **Interaction to Next Paint (INP)** y **Web Vitals**.

Basado en el diseño HUD táctico de [Stitch](https://stitch.withgoogle.com/projects/5541299311833622140), adaptado con soporte para Modo Claro/Oscuro dinámico, detección de esquema de color del sistema y diseño 100% responsivo para Side Panel de extensiones.

---

## ⚡ Características Principales

- **Osciloscopio y Medidor Radial de INP**: Visualización gráfica SVG interactiva en tiempo real con gauge angular dinámico.
- **Detección Automática de Tema**: Soporte nativo para `Modo Claro`, `Modo Oscuro` y `Sincronización Automática` con las preferencias del sistema operativo (`prefers-color-scheme`).
- **Simulador de Estrés de Main Thread**: Pruebas de estrés controladas mediante bloqueo sincrónico de hilo principal y derivación a Web Workers (`compute.worker.ts`).
- **Terminal CLI Emulada**: Consola HUD integrada con comandos interactivos (`help`, `stress`, `clear`, `theme`, `status`).
- **Arquitectura de Micro-Extensión**: Empaquetado optimizado para Google Chrome Manifest V3 Side Panel y Popup.

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+ o 20+
- npm 9+

### Instalación

```bash
npm install
```

### Servidor de Desarrollo

```bash
npm start
```
Navega a `http://localhost:4200/`.

---

## 🛠️ Compilación y Empaquetado

### Compilar Aplicación Web

```bash
npm run build
```

### Empaquetar Extensión de Google Chrome (Manifest V3)

```bash
npm run build:extension
```
Los artefactos finales se sincronizarán automáticamente en la carpeta `extension/ui`. Para cargarla en el navegador:
1. Abre Google Chrome y ve a `chrome://extensions/`.
2. Activa el **Modo de desarrollador** (Developer Mode).
3. Haz clic en **Cargar descomprimida** (Load unpacked) y selecciona la carpeta `extension/`.

---

## 🧪 Pruebas Unitarias

Para ejecutar la suite de pruebas unitarias con Vitest:

```bash
npm test
```

---

## 📚 Documentación Técnica

- [Guía de Arquitectura del Sistema](file:///docs/ARCHITECTURE.md): Diagramas de flujo, servicios desacoplados, sincronización de temas y worker.
- [Guía de Optimización de INP](file:///docs/INP_OPTIMIZATION_GUIDE.md): Metodología de diagnóstico, desglose de fases (Input Delay, Processing Duration, Presentation Delay) y soluciones.

