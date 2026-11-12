/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Laboratorio de Superposición de Ondas y Plano Cartesiano GeoGebra Multicanal
 * 
 * Características:
 * - Toggles accesibles (role="switch", aria-checked, min 44px, foco visible, estado claro con glifos)
 * - Toggles independientes por onda: Mostrar/Ocultar, Incluir en Suma (Σ), Gráfica Propia
 * - Modo Solista "Solo esta"
 * - Toggles globales: Modo segmentado (Superpuestas, Divididas, Solo Resultante), Mostrar Resultante, Mostrar Componentes, Mostrar/Ocultar Todas, Igualar Escala Y
 * - Modo Dividido sincronizado: eje x sincronizado, zoom/desplazamiento horizontal conjunto, inspector vertical x que cruza todos los paneles, bucle único de animación
 * - Sincronización bidireccional con modal a pantalla completa
 * - Exportación a imagen PNG respetando el modo actual (superpuesto o dividido)
 * - Exportación e Importación de configuración a JSON
 */

// =============================================================================
// MODELO DE DATOS DE COMPONENTE DE ONDA ARMÓNICA
// =============================================================================
class WaveComponent {
  constructor(data = {}) {
    this.id = data.id || `wave-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.name = data.name || 'Onda Armónica';
    this.A = typeof data.A === 'number' ? data.A : 1.20;       // Amplitud en metros
    this.f = typeof data.f === 'number' ? data.f : 0.50;       // Frecuencia en Hz
    this.wavelength = typeof data.wavelength === 'number' ? data.wavelength : 4.00; // Longitud de onda λ (m)
    this.phi = typeof data.phi === 'number' ? data.phi : 0.00; // Fase inicial en radianes
    this.direction = data.direction || 1;                      // +1 hacia la derecha, -1 hacia la izquierda
    this.color = data.color || '#00f0ff';
    this.lineWidth = data.lineWidth || 2.6;
    this.lineStyle = data.lineStyle || 'solid';                // 'solid', 'dashed', 'dotted'

    // LOS 3 TOGGLES PRINCIPALES POR ONDA
    this.visible = data.visible !== undefined ? !!data.visible : true;           // 1. Mostrar/Ocultar en gráfica
    this.includeInSum = data.includeInSum !== undefined ? !!data.includeInSum : true; // 2. Incluir en suma resultante
    this.ownPanel = data.ownPanel !== undefined ? !!data.ownPanel : true;        // 3. Panel propio en modo dividido

    // Escala y origen Y independientes (para cuando no están igualadas las escalas)
    this.scaleY = data.scaleY || 65;
    this.originY = null;
  }

  // Cálculo del valor de elongación y(x, t)
  // y(x, t) = A * cos(k * dir * x - omega * t + phi)
  calculate(x, t) {
    const k = (2 * Math.PI) / (this.wavelength || 4.0);
    const omega = 2 * Math.PI * this.f;
    return this.A * Math.cos(k * this.direction * x - omega * t + this.phi);
  }

  // Obtener texto legible de la ecuación
  getEquationString() {
    const k = ((2 * Math.PI) / (this.wavelength || 4.0)).toFixed(2);
    const omega = (2 * Math.PI * this.f).toFixed(2);
    const phiSign = this.phi >= 0 ? '+' : '-';
    const phiVal = Math.abs(this.phi).toFixed(2);
    const dirSign = this.direction >= 0 ? '-' : '+';
    const phiPart = Math.abs(this.phi) > 0.01 ? ` ${phiSign} ${phiVal}` : '';
    return `y(x,t) = ${this.A.toFixed(2)} · cos(${k}x ${dirSign} ${omega}t${phiPart})`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      A: this.A,
      f: this.f,
      wavelength: this.wavelength,
      phi: this.phi,
      direction: this.direction,
      color: this.color,
      lineWidth: this.lineWidth,
      lineStyle: this.lineStyle,
      visible: this.visible,
      includeInSum: this.includeInSum,
      ownPanel: this.ownPanel
    };
  }
}

// =============================================================================
// ESTADO GLOBAL COMPARTIDO DE SUPERPOSICIÓN DE ONDAS
// =============================================================================
class WaveSuperpositionState {
  constructor(options = {}) {
    this.waves = [];
    this.initDefaultWaves(options);

    // Modos globales de visualización
    this.viewMode = options.viewMode || 'superposed'; // 'superposed' | 'divided' | 'only-resultant'
    this.showResultant = options.showResultant !== undefined ? options.showResultant : true;
    this.showComponents = options.showComponents !== undefined ? options.showComponents : true;
    this.matchYScale = options.matchYScale !== undefined ? options.matchYScale : false;

    // Vista y navegación de ejes GeoGebra (EJE X SINCRONIZADO GLOBALMENTE)
    this.scaleX = options.scaleX || 65; // Píxeles por metro
    this.scaleY = options.scaleY || 65; // Píxeles por metro (escala global de referencia)
    this.originX = options.originX || 70; // Desplazamiento horizontal en píxeles
    this.originY = options.originY || null;

    // Configuración estética GeoGebra
    this.showGrid = options.showGrid !== undefined ? options.showGrid : true;
    this.showSecondaryGrid = options.showSecondaryGrid !== undefined ? options.showSecondaryGrid : true;
    this.showAxes = options.showAxes !== undefined ? options.showAxes : true;
    this.showLabels = options.showLabels !== undefined ? options.showLabels : true;

    // Animación y tiempo
    this.t = 0;
    this.isPlaying = true;
    this.timeScale = 1.0;

    // Inspector de posición x sincronizado
    this.inspectorX = null;     // Coordenada x en metros donde se posiciona la línea guía
    this.inspectorActive = false;

    // Memoria para restaurar después de modo solista
    this.soloActiveWaveId = null;
    this.previousVisibilityState = null;

    // Escuchadores de cambio de estado
    this.listeners = [];
  }

  initDefaultWaves(options) {
    if (options.waves && Array.isArray(options.waves) && options.waves.length > 0) {
      this.waves = options.waves.map(w => new WaveComponent(w));
    } else {
      this.waves = [
        new WaveComponent({
          id: 'w1',
          name: 'Onda 1 (Fundamental)',
          A: 1.20,
          f: 0.50,
          wavelength: 4.00,
          phi: 0.00,
          direction: 1,
          color: '#00f0ff',
          lineWidth: 2.8,
          lineStyle: 'solid',
          visible: true,
          includeInSum: true,
          ownPanel: true
        }),
        new WaveComponent({
          id: 'w2',
          name: 'Onda 2 (Segundo Armónico)',
          A: 0.80,
          f: 1.00,
          wavelength: 2.00,
          phi: 0.00,
          direction: 1,
          color: '#d4af37',
          lineWidth: 2.6,
          lineStyle: 'solid',
          visible: true,
          includeInSum: true,
          ownPanel: true
        }),
        new WaveComponent({
          id: 'w3',
          name: 'Onda 3 (Tercer Armónico)',
          A: 0.50,
          f: 1.50,
          wavelength: 1.33,
          phi: 0.00,
          direction: 1,
          color: '#c084fc',
          lineWidth: 2.4,
          lineStyle: 'solid',
          visible: true,
          includeInSum: true,
          ownPanel: true
        })
      ];
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify(event, data) {
    this.listeners.forEach(cb => {
      try {
        cb(event, data);
      } catch (err) {
        console.error('Error en listener de estado:', err);
      }
    });
  }

  // CÁLCULO DE LA RESULTANTE: Solo incluye ondas con includeInSum === true
  // ¡Ocultar una onda (visible=false) NO la excluye de la suma!
  calculateResultant(x, t) {
    let sum = 0;
    for (const wave of this.waves) {
      if (wave.includeInSum) {
        sum += wave.calculate(x, t);
      }
    }
    return sum;
  }

  // Obtener amplitud teórica máxima de la suma
  getResultantMaxAmplitude() {
    let sumA = 0;
    for (const wave of this.waves) {
      if (wave.includeInSum) {
        sumA += Math.abs(wave.A);
      }
    }
    return sumA || 1.0;
  }

  // Modos solistas ("Solo esta")
  toggleSoloWave(waveId) {
    if (this.soloActiveWaveId === waveId) {
      // Restaurar estado anterior
      if (this.previousVisibilityState) {
        this.waves.forEach(w => {
          if (this.previousVisibilityState[w.id] !== undefined) {
            w.visible = this.previousVisibilityState[w.id];
          }
        });
      }
      this.soloActiveWaveId = null;
      this.previousVisibilityState = null;
    } else {
      // Guardar estado previo y aislar la onda seleccionada
      this.previousVisibilityState = {};
      this.waves.forEach(w => {
        this.previousVisibilityState[w.id] = w.visible;
        w.visible = (w.id === waveId);
      });
      this.soloActiveWaveId = waveId;
    }
    this.notify('solo-toggled', { waveId });
  }

  // Mostrar todas
  showAllWaves() {
    this.soloActiveWaveId = null;
    this.waves.forEach(w => { w.visible = true; });
    this.notify('visibility-changed');
  }

  // Ocultar todas
  hideAllWaves() {
    this.soloActiveWaveId = null;
    this.waves.forEach(w => { w.visible = false; });
    this.notify('visibility-changed');
  }

  // Presets pedagógicos
  applyPreset(presetName) {
    this.soloActiveWaveId = null;
    if (presetName === 'constructive') {
      this.waves = [
        new WaveComponent({ id: 'w1', name: 'Onda Coherente 1', A: 1.0, f: 0.5, wavelength: 4.0, phi: 0.0, direction: 1, color: '#00f0ff', visible: true, includeInSum: true, ownPanel: true }),
        new WaveComponent({ id: 'w2', name: 'Onda Coherente 2', A: 1.0, f: 0.5, wavelength: 4.0, phi: 0.0, direction: 1, color: '#d4af37', visible: true, includeInSum: true, ownPanel: true })
      ];
    } else if (presetName === 'destructive') {
      this.waves = [
        new WaveComponent({ id: 'w1', name: 'Onda Directa', A: 1.0, f: 0.5, wavelength: 4.0, phi: 0.0, direction: 1, color: '#00f0ff', visible: true, includeInSum: true, ownPanel: true }),
        new WaveComponent({ id: 'w2', name: 'Onda Desfasada 180° (π)', A: 1.0, f: 0.5, wavelength: 4.0, phi: Math.PI, direction: 1, color: '#f97316', visible: true, includeInSum: true, ownPanel: true })
      ];
    } else if (presetName === 'beats') {
      this.waves = [
        new WaveComponent({ id: 'w1', name: 'Frecuencia f₁ = 0.8 Hz', A: 1.0, f: 0.8, wavelength: 4.0, phi: 0.0, direction: 1, color: '#00f0ff', visible: true, includeInSum: true, ownPanel: true }),
        new WaveComponent({ id: 'w2', name: 'Frecuencia f₂ = 1.0 Hz', A: 1.0, f: 1.0, wavelength: 4.0, phi: 0.0, direction: 1, color: '#c084fc', visible: true, includeInSum: true, ownPanel: true })
      ];
    } else if (presetName === 'standing') {
      this.waves = [
        new WaveComponent({ id: 'w1', name: 'Onda Incidente (→)', A: 1.0, f: 0.5, wavelength: 4.0, phi: 0.0, direction: 1, color: '#00f0ff', visible: true, includeInSum: true, ownPanel: true }),
        new WaveComponent({ id: 'w2', name: 'Onda Reflejada (←)', A: 1.0, f: 0.5, wavelength: 4.0, phi: 0.0, direction: -1, color: '#d4af37', visible: true, includeInSum: true, ownPanel: true })
      ];
    } else if (presetName === 'fourier') {
      this.waves = [
        new WaveComponent({ id: 'w1', name: '1.er Armónico (f)', A: 1.27, f: 0.5, wavelength: 4.0, phi: 0.0, direction: 1, color: '#00f0ff', visible: true, includeInSum: true, ownPanel: true }),
        new WaveComponent({ id: 'w2', name: '3.er Armónico (3f)', A: 0.42, f: 1.5, wavelength: 1.33, phi: 0.0, direction: 1, color: '#d4af37', visible: true, includeInSum: true, ownPanel: true }),
        new WaveComponent({ id: 'w3', name: '5.º Armónico (5f)', A: 0.25, f: 2.5, wavelength: 0.80, phi: 0.0, direction: 1, color: '#c084fc', visible: true, includeInSum: true, ownPanel: true })
      ];
    }
    this.notify('preset-applied', { presetName });
  }

  // Exportar a JSON
  toJSON() {
    return {
      version: '2.0',
      timestamp: new Date().toISOString(),
      viewMode: this.viewMode,
      showResultant: this.showResultant,
      showComponents: this.showComponents,
      matchYScale: this.matchYScale,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      originX: this.originX,
      t: this.t,
      waves: this.waves.map(w => w.toJSON())
    };
  }

  // Importar desde JSON
  fromJSON(jsonObj) {
    if (!jsonObj || !Array.isArray(jsonObj.waves)) return false;
    if (jsonObj.viewMode) this.viewMode = jsonObj.viewMode;
    if (jsonObj.showResultant !== undefined) this.showResultant = !!jsonObj.showResultant;
    if (jsonObj.showComponents !== undefined) this.showComponents = !!jsonObj.showComponents;
    if (jsonObj.matchYScale !== undefined) this.matchYScale = !!jsonObj.matchYScale;
    if (typeof jsonObj.scaleX === 'number') this.scaleX = jsonObj.scaleX;
    if (typeof jsonObj.scaleY === 'number') this.scaleY = jsonObj.scaleY;
    if (typeof jsonObj.originX === 'number') this.originX = jsonObj.originX;

    this.waves = jsonObj.waves.map(w => new WaveComponent(w));
    this.notify('json-loaded');
    return true;
  }
}

// Instancia singleton compartida globalmente (para sincronizar modal y página principal)
window.sharedWaveState = window.sharedWaveState || new WaveSuperpositionState();

// =============================================================================
// CONTROLADOR PRINCIPAL DEL MOTOR GEOGEBRA MULTICANAL
// =============================================================================
class GeoGebraGraph {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isModal = !!options.isModal;
    this.options = Object.assign({
      modalTargetId: 'geogebra-fullscreen-modal',
      isModal: false
    }, options);

    // Conectar al estado global compartido
    this.state = window.sharedWaveState;

    // Estado local de interacción
    this.isPanning = false;
    this.activePanTarget = null;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Referencias DOM
    this.panels = new Map(); // id -> { canvas, ctx, width, height, wrap }

    // Inicializar interfaz
    this.initDOM();
    this.bindEvents();

    // Suscribirse a cambios en el estado compartido
    this.state.subscribe((event) => {
      this.handleStateChange(event);
    });

    // Iniciar bucle de animación si no está activo globalmente
    if (!window.geoGebraSharedLoopRunning) {
      window.geoGebraSharedLoopRunning = true;
      this.startSharedAnimationLoop();
    }

    // Primer render
    this.render();
  }

  // Manejar cuando la página 10 se vuelve visible
  handlePageVisible() {
    this.resizeCanvases();
    this.render();
  }

  // ===========================================================================
  // CONSTRUCCIÓN DEL DOM
  // ===========================================================================
  initDOM() {
    this.container.innerHTML = `
      <!-- 1. BARRA SUPERIOR DE HERRAMIENTAS GEOGEBRA -->
      <div class="geogebra-toolbar" role="toolbar" aria-label="Herramientas del Plano Cartesiano">
        <div class="geogebra-tool-group">
          <button type="button" class="geogebra-btn" data-action="pan" data-tooltip="Modo Mover / Pan (Arrastrar en cualquier panel)" aria-label="Modo Mover Pan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
          </button>
          <button type="button" class="geogebra-btn" data-action="zoom-in" data-tooltip="Acercar Eje X (Zoom In sincronizado)" aria-label="Acercar Zoom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button type="button" class="geogebra-btn" data-action="zoom-out" data-tooltip="Alejar Eje X (Zoom Out sincronizado)" aria-label="Alejar Zoom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button type="button" class="geogebra-btn" data-action="reset" data-tooltip="Restablecer Vista Original (Origen y Escalas)" aria-label="Restablecer Vista">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <button type="button" class="geogebra-btn" data-action="select" data-tooltip="Modo Seleccionar / Inspeccionar Puntos" aria-label="Seleccionar punto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
          </button>
          <button type="button" class="geogebra-btn" data-action="palette" data-tooltip="Paleta de Estilos Gráficos (Color, Grosor, Trazos)" aria-label="Estilos Gráficos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"/></svg>
          </button>
        </div>

        <div class="geogebra-tool-group">
          <!-- Presets Pedagógicos de Superposición -->
          <select class="geogebra-select-preset" aria-label="Cargar Experimento Preset de Ondas" title="Cargar Experimento">
            <option value="" disabled selected>✦ Cargar Experimento ✦</option>
            <option value="constructive">Interferencia Constructiva (Coherente)</option>
            <option value="destructive">Interferencia Destructiva (Desfase π)</option>
            <option value="beats">Batimiento / Pulsaciones (Δf = 0.2 Hz)</option>
            <option value="standing">Ondas Estacionarias (Incidente + Reflejada)</option>
            <option value="fourier">Síntesis de Fourier (1.er, 3.er y 5.º Armónicos)</option>
          </select>

          <!-- Cuadrícula y Ejes -->
          <button type="button" class="geogebra-btn ${this.state.showGrid ? 'active' : ''}" data-action="toggle-grid" data-tooltip="Mostrar/Ocultar Cuadrícula Milimetrada" aria-label="Alternar Cuadrícula">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
          </button>
          <button type="button" class="geogebra-btn ${this.state.showAxes ? 'active' : ''}" data-action="toggle-axes" data-tooltip="Mostrar/Ocultar Ejes Graduados" aria-label="Alternar Ejes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M9 6l3-3 3 3"/><path d="M18 9l3 3-3 3"/></svg>
          </button>

          <!-- Guardar / Cargar JSON y Exportar Imagen -->
          <button type="button" class="geogebra-btn" data-action="export-img" data-tooltip="Exportar Imagen PNG (Respeta vista actual)" aria-label="Exportar Imagen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span style="font-size:0.72rem;">PNG</span>
          </button>
          <button type="button" class="geogebra-btn" data-action="export-json" data-tooltip="Guardar Configuración en JSON" aria-label="Guardar JSON">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span style="font-size:0.72rem;">JSON</span>
          </button>
          <button type="button" class="geogebra-btn" data-action="import-json" data-tooltip="Cargar Configuración desde JSON" aria-label="Cargar JSON">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
          <input type="file" class="hidden-json-input" accept=".json" style="display:none;" />

          ${!this.isModal ? `
          <button type="button" class="geogebra-btn" data-action="expand" data-tooltip="Ampliar a Pantalla Completa (Modal)" aria-label="Ampliar Pantalla Completa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
          </button>
          ` : ''}
        </div>
      </div>

      <!-- 2. BARRA DE TOGGLES GLOBALES Y MODO DE VISTA -->
      <div class="geogebra-global-bar">
        <!-- Control Segmentado de Modo de Vista (3 opciones) -->
        <div class="geogebra-segmented-control" role="tablist" aria-label="Modo de Visualización de Gráficas">
          <button type="button" class="segmented-option ${this.state.viewMode === 'superposed' ? 'active' : ''}" 
                  role="tab" aria-selected="${this.state.viewMode === 'superposed'}" data-mode="superposed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12c4-8 8-8 12 0s8 8 12 0"/><path d="M2 12c4 8 8 8 12 0s8-8 12 0" opacity="0.6"/></svg>
            <span>Superpuestas</span>
          </button>
          <button type="button" class="segmented-option ${this.state.viewMode === 'divided' ? 'active' : ''}" 
                  role="tab" aria-selected="${this.state.viewMode === 'divided'}" data-mode="divided">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/></svg>
            <span>Divididas</span>
          </button>
          <button type="button" class="segmented-option ${this.state.viewMode === 'only-resultant' ? 'active' : ''}" 
                  role="tab" aria-selected="${this.state.viewMode === 'only-resultant'}" data-mode="only-resultant">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 18l6-12h10"/><path d="M2 12c5-7 10-7 15 0s5 7 10 0"/></svg>
            <span>Solo Resultante</span>
          </button>
        </div>

        <!-- Toggles y Botones Globales (>= 44px de alto) -->
        <div class="global-toggles-cluster">
          <!-- Toggle Global: Mostrar Resultante -->
          <button type="button" class="geogebra-toggle-switch toggle-sigma" role="switch" 
                  aria-checked="${this.state.showResultant}" aria-label="Mostrar u Ocultar Onda Resultante" data-global-toggle="resultant">
            <span class="toggle-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16l-7 8 7 8H4"/></svg>
            </span>
            <span class="toggle-label-text">Mostrar Resultante</span>
            <span class="toggle-track" aria-hidden="true">
              <span class="toggle-thumb">
                <svg class="toggle-glyph-svg" viewBox="0 0 24 24">
                  ${this.state.showResultant ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                </svg>
              </span>
            </span>
            <span class="toggle-state-badge">${this.state.showResultant ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Toggle Global: Mostrar Componentes -->
          <button type="button" class="geogebra-toggle-switch" role="switch" 
                  aria-checked="${this.state.showComponents}" aria-label="Mostrar u Ocultar Todas las Ondas Componentes" data-global-toggle="components">
            <span class="toggle-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            </span>
            <span class="toggle-label-text">Mostrar Componentes</span>
            <span class="toggle-track" aria-hidden="true">
              <span class="toggle-thumb">
                <svg class="toggle-glyph-svg" viewBox="0 0 24 24">
                  ${this.state.showComponents ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                </svg>
              </span>
            </span>
            <span class="toggle-state-badge">${this.state.showComponents ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Toggle Global: Igualar Escala Y -->
          <button type="button" class="geogebra-toggle-switch toggle-panel" role="switch" 
                  aria-checked="${this.state.matchYScale}" aria-label="Igualar o Independizar Escala del Eje Y" data-global-toggle="match-y">
            <span class="toggle-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="8 7 12 3 16 7"/><polyline points="8 17 12 21 16 17"/></svg>
            </span>
            <span class="toggle-label-text">Igualar Escala Y</span>
            <span class="toggle-track" aria-hidden="true">
              <span class="toggle-thumb">
                <svg class="toggle-glyph-svg" viewBox="0 0 24 24">
                  ${this.state.matchYScale ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                </svg>
              </span>
            </span>
            <span class="toggle-state-badge">${this.state.matchYScale ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Botones Mostrar Todas y Ocultar Todas -->
          <div style="display:flex; gap:6px;">
            <button type="button" class="geogebra-btn" data-action="show-all" title="Mostrar Todas las Ondas" aria-label="Mostrar Todas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Mostrar todas</span>
            </button>
            <button type="button" class="geogebra-btn" data-action="hide-all" title="Ocultar Todas las Ondas" aria-label="Ocultar Todas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <span>Ocultar todas</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 3. BARRA DE REPRODUCCIÓN TEMPORAL t (STICKY EN SCROLL Y MÓVIL) -->
      <div class="geogebra-playback-bar">
        <div class="playback-controls-group">
          <button type="button" class="playback-btn ${this.state.isPlaying ? 'active' : ''}" data-action="toggle-play" aria-label="Reproducir o Pausar Onda">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              ${this.state.isPlaying 
                ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' 
                : '<polygon points="5 3 19 12 5 21 5 3"/>'}
            </svg>
            <span class="playback-btn-text">${this.state.isPlaying ? 'Pausa' : 'Play'}</span>
          </button>
          <button type="button" class="playback-btn" data-action="rewind" title="Rebobinar a t = 0" aria-label="Rebobinar a tiempo cero">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>
          <button type="button" class="playback-btn" data-action="step-back" title="Paso atrás (-0.05 s)" aria-label="Paso atrás">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" class="playback-btn" data-action="step-forward" title="Paso adelante (+0.05 s)" aria-label="Paso adelante">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="playback-slider-wrap">
          <span style="font-size:0.75rem; color:var(--text-secondary); font-family:var(--font-mono);">t:</span>
          <input type="range" class="playback-slider" min="0" max="20" step="0.02" value="${this.state.t.toFixed(2)}" aria-label="Control deslizante de tiempo t" />
          <span class="playback-time-badge">t = ${this.state.t.toFixed(2)} s</span>
        </div>

        <div style="display:flex; align-items:center; gap:6px;">
          <label style="font-size:0.72rem; color:var(--text-secondary);">Velocidad:</label>
          <select class="speed-select" aria-label="Velocidad de reproducción">
            <option value="0.25">0.25×</option>
            <option value="0.5">0.5×</option>
            <option value="1.0" selected>1.0×</option>
            <option value="2.0">2.0×</option>
          </select>
        </div>
      </div>

      <!-- 4. ESCENARIO GRÁFICO DINÁMICO (SUPERPUESTO o DIVIDIDO) -->
      <div class="geogebra-stage-wrap">
        <!-- Contenedor inyectado según el modo de vista -->
        <div class="stage-dynamic-content"></div>
      </div>

      <!-- 5. BARRA INFERIOR DE INSPECTOR Y COORDENADAS SINCRONIZADAS -->
      <div class="geogebra-infobar">
        <div class="geogebra-coords">
          <span class="geogebra-coords-cursor">
            ${this.state.inspectorX !== null 
              ? `Inspector x = ${this.state.inspectorX.toFixed(2)} m` 
              : `Mueve el cursor sobre cualquier gráfica`}
          </span>
          <span class="inspector-live-readouts"></span>
        </div>
        <div class="geogebra-eqn-preview">
          Resultante: $\\sum y_i(x,t)$ | Presiona Espacio/Enter en los toggles para activarlos
        </div>
      </div>

      <!-- 6. LISTA DE COMPONENTES ARMÓNICAS (ONDAS) CON LOS 3 TOGGLES DEDICADOS -->
      <div class="geogebra-components-section">
        <div class="components-section-header">
          <div class="components-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c4-8 8-8 12 0s8 8 12 0"/></svg>
            <span>Componentes Armónicas y Parámetros de Onda</span>
            <span style="font-size:0.75rem; color:var(--text-secondary); font-family:var(--font-mono); font-weight:normal;">
              (${this.state.waves.length} componentes)
            </span>
          </div>
          <button type="button" class="geogebra-btn" data-action="add-wave" style="padding:0 12px; height:36px; border-color:var(--border-gold);" aria-label="Añadir Nueva Onda">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <strong style="color:var(--gold-light);">+ Añadir Onda</strong>
          </button>
        </div>

        <div class="waves-list-container">
          <!-- Renderizado dinámico de tarjetas de onda -->
        </div>
      </div>
    `;

    this.renderStage();
    this.renderWaveCards();
  }

  // ===========================================================================
  // RENDERIZADO DEL ESCENARIO (SUPERPUESTO vs DIVIDIDO vs SOLO RESULTANTE)
  // ===========================================================================
  renderStage() {
    const stageContainer = this.container.querySelector('.stage-dynamic-content');
    if (!stageContainer) return;

    this.panels.clear();

    if (this.state.viewMode === 'superposed' || this.state.viewMode === 'only-resultant') {
      // Lienzo único
      stageContainer.innerHTML = `
        <div class="geogebra-canvas-wrap" data-panel-type="single">
          <canvas class="geogebra-canvas"></canvas>
        </div>
      `;
      const wrap = stageContainer.querySelector('.geogebra-canvas-wrap');
      const canvas = stageContainer.querySelector('.geogebra-canvas');
      this.panels.set('main', {
        id: 'main',
        wrap,
        canvas,
        ctx: canvas.getContext('2d'),
        type: this.state.viewMode
      });
    } else if (this.state.viewMode === 'divided') {
      // Contenedor apilado de paneles independientes (Modo Dividido)
      // Muestra un panel por cada onda visible con panel propio, más uno para la resultante
      let panelsHTML = '<div class="geogebra-divided-container">';

      // Paneles para cada onda visible con ownPanel === true
      const visibleWaves = this.state.waves.filter(w => w.visible && w.ownPanel);

      visibleWaves.forEach((wave, idx) => {
        panelsHTML += `
          <div class="geogebra-panel-card" data-wave-id="${wave.id}">
            <div class="geogebra-panel-header">
              <div class="panel-header-title-box">
                <span class="panel-color-pill" style="background:${wave.color};"></span>
                <span class="panel-wave-title">${wave.name}</span>
                <span class="panel-eqn-text">${wave.getEquationString()}</span>
              </div>
              <div class="panel-live-val" data-wave-val="${wave.id}">y = 0.00 m</div>
            </div>
            <div class="geogebra-panel-canvas-wrap" data-panel-id="${wave.id}">
              <canvas class="geogebra-panel-canvas"></canvas>
            </div>
          </div>
        `;
      });

      // Panel propio para la resultante al final si showResultant está activo
      if (this.state.showResultant) {
        panelsHTML += `
          <div class="geogebra-panel-card panel-resultant" data-panel-id="resultant">
            <div class="geogebra-panel-header" style="background:rgba(220,38,38,0.12); border-bottom-color:rgba(239,68,68,0.3);">
              <div class="panel-header-title-box">
                <span class="panel-color-pill" style="background:#ef4444; box-shadow:0 0 10px #ef4444;"></span>
                <span class="panel-wave-title" style="color:#f87171;">Onda Resultante (Superposición $\\sum y_i$)</span>
                <span class="panel-eqn-text" style="color:#fca5a5; border-color:rgba(239,68,68,0.3);">
                  $y_{\\text{res}}(x,t) = \\sum_{i \\in \\Sigma} y_i$
                </span>
              </div>
              <div class="panel-live-val" data-wave-val="resultant" style="color:#f87171; font-weight:700;">y_res = 0.00 m</div>
            </div>
            <div class="geogebra-panel-canvas-wrap" data-panel-id="resultant">
              <canvas class="geogebra-panel-canvas"></canvas>
            </div>
          </div>
        `;
      }

      if (visibleWaves.length === 0 && !this.state.showResultant) {
        panelsHTML += `
          <div style="text-align:center; padding:40px; color:var(--text-secondary); font-family:var(--font-mono);">
            ✦ Todas las gráficas están ocultas. Activa el toggle "Mostrar" en las componentes o "Mostrar Resultante" arriba. ✦
          </div>
        `;
      }

      panelsHTML += '</div>';
      stageContainer.innerHTML = panelsHTML;

      // Registrar referencias a cada panel
      visibleWaves.forEach(wave => {
        const wrap = stageContainer.querySelector(`.geogebra-panel-canvas-wrap[data-panel-id="${wave.id}"]`);
        if (wrap) {
          const canvas = wrap.querySelector('.geogebra-panel-canvas');
          this.panels.set(wave.id, {
            id: wave.id,
            wave,
            wrap,
            canvas,
            ctx: canvas.getContext('2d'),
            type: 'wave'
          });
        }
      });

      if (this.state.showResultant) {
        const wrap = stageContainer.querySelector('.geogebra-panel-canvas-wrap[data-panel-id="resultant"]');
        if (wrap) {
          const canvas = wrap.querySelector('.geogebra-panel-canvas');
          this.panels.set('resultant', {
            id: 'resultant',
            wrap,
            canvas,
            ctx: canvas.getContext('2d'),
            type: 'resultant'
          });
        }
      }
    }

    this.resizeCanvases();
    this.bindCanvasInteractions();
    this.render();
  }

  // ===========================================================================
  // RENDERIZADO DE LAS TARJETAS DE ONDA Y SUS 3 TOGGLES OBLIGATORIOS
  // ===========================================================================
  renderWaveCards() {
    const listContainer = this.container.querySelector('.waves-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = this.state.waves.map((wave, idx) => {
      const isSolo = this.state.soloActiveWaveId === wave.id;
      return `
        <div class="wave-component-card" data-wave-id="${wave.id}" style="border-left: 4px solid ${wave.color};">
          <!-- Cabecera de la Onda -->
          <div class="wave-card-top">
            <div class="wave-title-group">
              <span class="wave-color-dot" style="background:${wave.color};" title="Color de la curva"></span>
              <span class="wave-name">${wave.name}</span>
              <span class="wave-formula-badge">${wave.getEquationString()}</span>
            </div>

            <!-- Botón "Solo esta" (modo solista) -->
            <button type="button" class="btn-solo-wave ${isSolo ? 'active' : ''}" 
                    data-wave-id="${wave.id}" data-action="solo" aria-label="Aislar solo ${wave.name} (Modo Solista)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              <span>${isSolo ? '★ Solista Activo' : 'Solo esta'}</span>
            </button>
          </div>

          <!-- FILA DE LOS 3 TOGGLES OBLIGATORIOS (>= 44px de alto, deslizantes, role=switch, aria-checked) -->
          <div class="wave-toggles-row">
            <!-- 1. MOSTRAR / OCULTAR (Icono de ojo): Oculta o muestra la curva en el gráfico -->
            <button type="button" class="geogebra-toggle-switch" role="switch" 
                    aria-checked="${wave.visible}" aria-label="Mostrar u ocultar ${wave.name} en el gráfico" 
                    data-wave-id="${wave.id}" data-toggle-type="visible">
              <span class="toggle-icon">
                ${wave.visible 
                  ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
                  : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                }
              </span>
              <span class="toggle-label-text">Mostrar</span>
              <span class="toggle-track" aria-hidden="true">
                <span class="toggle-thumb">
                  <svg class="toggle-glyph-svg" viewBox="0 0 24 24">
                    ${wave.visible ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                  </svg>
                </span>
              </span>
              <span class="toggle-state-badge">${wave.visible ? 'ON' : 'OFF'}</span>
            </button>

            <!-- 2. INCLUIR EN LA SUMA (Icono Σ): Incluye o excluye la onda de la resultante -->
            <button type="button" class="geogebra-toggle-switch toggle-sigma" role="switch" 
                    aria-checked="${wave.includeInSum}" aria-label="Incluir o excluir ${wave.name} de la suma resultante" 
                    data-wave-id="${wave.id}" data-toggle-type="sum">
              <span class="toggle-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16l-7 8 7 8H4"/></svg>
              </span>
              <span class="toggle-label-text">Incluir en suma (Σ)</span>
              <span class="toggle-track" aria-hidden="true">
                <span class="toggle-thumb">
                  <svg class="toggle-glyph-svg" viewBox="0 0 24 24">
                    ${wave.includeInSum ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                  </svg>
                </span>
              </span>
              <span class="toggle-state-badge">${wave.includeInSum ? 'ON' : 'OFF'}</span>
            </button>

            <!-- 3. GRÁFICA PROPIA (Icono de paneles): En modo dividido, la onda se dibuja en su propio panel -->
            <button type="button" class="geogebra-toggle-switch toggle-panel" role="switch" 
                    aria-checked="${wave.ownPanel}" aria-label="Dibujar ${wave.name} en panel propio en modo dividido" 
                    data-wave-id="${wave.id}" data-toggle-type="panel">
              <span class="toggle-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/></svg>
              </span>
              <span class="toggle-label-text">Gráfica propia</span>
              <span class="toggle-track" aria-hidden="true">
                <span class="toggle-thumb">
                  <svg class="toggle-glyph-svg" viewBox="0 0 24 24">
                    ${wave.ownPanel ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                  </svg>
                </span>
              </span>
              <span class="toggle-state-badge">${wave.ownPanel ? 'ON' : 'OFF'}</span>
            </button>

            ${this.state.waves.length > 1 ? `
            <button type="button" class="geogebra-btn" data-wave-id="${wave.id}" data-action="delete-wave" 
                    title="Eliminar esta onda" style="margin-left:auto; width:34px; height:34px; color:#f87171;" aria-label="Eliminar ${wave.name}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            ` : ''}
          </div>

          <!-- PARÁMETROS DINÁMICOS: Amplitud, Frecuencia, Longitud de Onda, Fase y Sentido -->
          <div class="wave-params-grid">
            <div class="param-item">
              <label>
                <span>Amplitud A (m)</span>
                <strong>${wave.A.toFixed(2)} m</strong>
              </label>
              <input type="range" class="param-slider" min="0.1" max="3.0" step="0.05" value="${wave.A}" 
                     data-wave-id="${wave.id}" data-param="A" aria-label="Amplitud de ${wave.name}" />
            </div>

            <div class="param-item">
              <label>
                <span>Frecuencia f (Hz)</span>
                <strong>${wave.f.toFixed(2)} Hz</strong>
              </label>
              <input type="range" class="param-slider" min="0.1" max="3.0" step="0.05" value="${wave.f}" 
                     data-wave-id="${wave.id}" data-param="f" aria-label="Frecuencia de ${wave.name}" />
            </div>

            <div class="param-item">
              <label>
                <span>Longitud λ (m)</span>
                <strong>${wave.wavelength.toFixed(2)} m</strong>
              </label>
              <input type="range" class="param-slider" min="0.5" max="8.0" step="0.1" value="${wave.wavelength}" 
                     data-wave-id="${wave.id}" data-param="wavelength" aria-label="Longitud de onda de ${wave.name}" />
            </div>

            <div class="param-item">
              <label>
                <span>Fase inicial φ (rad)</span>
                <strong>${wave.phi.toFixed(2)} rad</strong>
              </label>
              <input type="range" class="param-slider" min="-3.14" max="3.14" step="0.1" value="${wave.phi}" 
                     data-wave-id="${wave.id}" data-param="phi" aria-label="Fase de ${wave.name}" />
            </div>

            <div class="param-item" style="grid-column: 1 / -1; display:flex; flex-direction:row; align-items:center; justify-content:space-between;">
              <span style="font-size:0.75rem; color:var(--text-secondary);">Sentido de propagación:</span>
              <div style="display:flex; gap:8px;">
                <button type="button" class="geogebra-btn ${wave.direction === 1 ? 'active' : ''}" 
                        data-wave-id="${wave.id}" data-action="set-dir" data-dir="1" style="height:28px; font-size:0.75rem;" aria-label="Propagación a la derecha">
                  → Derecha (+x)
                </button>
                <button type="button" class="geogebra-btn ${wave.direction === -1 ? 'active' : ''}" 
                        data-wave-id="${wave.id}" data-action="set-dir" data-dir="-1" style="height:28px; font-size:0.75rem;" aria-label="Propagación a la izquierda">
                  ← Izquierda (-x)
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.bindCardEvents();
  }

  // ===========================================================================
  // REDIMENSIONAMIENTO ADAPTATIVO DE LIENZOS
  // ===========================================================================
  resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;
    this.panels.forEach(p => {
      if (!p.wrap || !p.canvas) return;
      const rect = p.wrap.getBoundingClientRect();
      const w = Math.max(rect.width, 100);
      const h = Math.max(rect.height, 120);

      p.canvas.width = w * dpr;
      p.canvas.height = h * dpr;
      p.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      p.ctx.scale(dpr, dpr);
      p.width = w;
      p.height = h;

      if (p.type === 'wave' && p.wave) {
        if (!p.wave.originY) p.wave.originY = h / 2;
      }
    });

    if (!this.state.originY) {
      this.state.originY = 200;
    }
  }

  // ===========================================================================
  // GESTIÓN DE EVENTOS DE INTERACCIÓN
  // ===========================================================================
  bindEvents() {
    window.addEventListener('resize', () => {
      this.resizeCanvases();
      this.render();
    });

    // Control Segmentado de Modo de Vista (Superpuestas, Divididas, Solo Resultante)
    this.container.querySelectorAll('.segmented-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode && this.state.viewMode !== mode) {
          this.state.viewMode = mode;
          this.updateSegmentedUI();
          this.renderStage();
          this.state.notify('view-mode-changed', { mode });
        }
      });
    });

    // Toggles Globales
    this.container.querySelectorAll('[data-global-toggle]').forEach(el => {
      const toggleAction = () => {
        const type = el.getAttribute('data-global-toggle');
        if (type === 'resultant') {
          this.state.showResultant = !this.state.showResultant;
        } else if (type === 'components') {
          this.state.showComponents = !this.state.showComponents;
        } else if (type === 'match-y') {
          this.state.matchYScale = !this.state.matchYScale;
        }
        this.updateGlobalTogglesUI();
        if (this.state.viewMode === 'divided') {
          this.renderStage();
        } else {
          this.render();
        }
        this.state.notify('global-toggle-changed', { type });
      };

      el.addEventListener('click', toggleAction);

      // Accesibilidad por teclado (Espacio y Enter)
      el.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleAction();
        }
      });
    });

    // Herramientas de la barra superior
    this.container.querySelectorAll('.geogebra-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        this.handleToolbarAction(action, btn);
      });
    });

    // Selector de presets pedagógicos
    const presetSelect = this.container.querySelector('.geogebra-select-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          this.state.applyPreset(val);
          this.renderStage();
          this.renderWaveCards();
          e.target.value = ''; // restablecer placeholder
        }
      });
    }

    // Controles de Reproducción
    const playBtn = this.container.querySelector('.playback-btn[data-action="toggle-play"]');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.state.isPlaying = !this.state.isPlaying;
        playBtn.classList.toggle('active', this.state.isPlaying);
        playBtn.querySelector('.playback-btn-text').textContent = this.state.isPlaying ? 'Pausa' : 'Play';
        playBtn.querySelector('svg').innerHTML = this.state.isPlaying 
          ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' 
          : '<polygon points="5 3 19 12 5 21 5 3"/>';
      });
    }

    const rewindBtn = this.container.querySelector('.playback-btn[data-action="rewind"]');
    if (rewindBtn) {
      rewindBtn.addEventListener('click', () => {
        this.state.t = 0;
        this.updatePlaybackSlider();
        this.render();
      });
    }

    const stepBackBtn = this.container.querySelector('.playback-btn[data-action="step-back"]');
    if (stepBackBtn) {
      stepBackBtn.addEventListener('click', () => {
        this.state.t = Math.max(0, this.state.t - 0.05);
        this.updatePlaybackSlider();
        this.render();
      });
    }

    const stepFwdBtn = this.container.querySelector('.playback-btn[data-action="step-forward"]');
    if (stepFwdBtn) {
      stepFwdBtn.addEventListener('click', () => {
        this.state.t += 0.05;
        this.updatePlaybackSlider();
        this.render();
      });
    }

    const slider = this.container.querySelector('.playback-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        this.state.t = parseFloat(e.target.value);
        this.updatePlaybackSlider();
        this.render();
      });
    }

    const speedSelect = this.container.querySelector('.speed-select');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.state.timeScale = parseFloat(e.target.value) || 1.0;
      });
    }

    // JSON Input Oculto
    const jsonInput = this.container.querySelector('.hidden-json-input');
    if (jsonInput) {
      jsonInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              this.state.fromJSON(data);
              this.updateSegmentedUI();
              this.updateGlobalTogglesUI();
              this.renderStage();
              this.renderWaveCards();
            } catch (err) {
              alert('Error al leer el archivo JSON: ' + err.message);
            }
          };
          reader.readAsText(file);
        }
      });
    }
  }

  // Eventos de los paneles de lienzo (Zoom sincrónico, Pan sincrónico, Inspector vertical x)
  bindCanvasInteractions() {
    this.panels.forEach(p => {
      const canvas = p.canvas;
      if (!canvas) return;

      // Movimiento del ratón para INSPECTOR DE POSICIÓN X
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const x = (mouseX - this.state.originX) / this.state.scaleX;

        this.state.inspectorX = x;
        this.state.inspectorActive = true;
        this.updateInspectorReadout();
        this.render(); // Redibuja todos los paneles para mostrar la línea sincronizada
      });

      canvas.addEventListener('mouseleave', () => {
        this.state.inspectorActive = false;
        this.render();
      });

      // Arrastre / Pan sincronizado
      canvas.addEventListener('mousedown', (e) => {
        this.isPanning = true;
        this.activePanTarget = p;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        p.wrap.classList.add('panning');
      });

      // Zoom con rueda del ratón SINCRONIZADO EN EL EJE X
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        this.applySynchronizedZoom(factor, e.clientX, e.clientY, p);
      }, { passive: false });

      // Gestos táctiles para móviles
      let touchStartX = 0;
      let touchStartY = 0;
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          this.isPanning = true;
          this.activePanTarget = p;
          this.lastMouseX = e.touches[0].clientX;
          this.lastMouseY = e.touches[0].clientY;
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (this.isPanning && e.touches.length === 1) {
          const dx = e.touches[0].clientX - this.lastMouseX;
          const dy = e.touches[0].clientY - this.lastMouseY;
          this.lastMouseX = e.touches[0].clientX;
          this.lastMouseY = e.touches[0].clientY;

          // Desplazamiento horizontal sincronizado en todos los paneles
          this.state.originX += dx;

          // Desplazamiento vertical en el panel activo
          if (p.type === 'wave' && p.wave && !this.state.matchYScale) {
            p.wave.originY = (p.wave.originY || p.height / 2) + dy;
          } else {
            this.state.originY += dy;
          }

          this.render();
        }
      }, { passive: true });

      canvas.addEventListener('touchend', () => {
        this.isPanning = false;
      });
    });

    // Listeners globales de ventana para soltar pan
    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        // Desplazamiento horizontal sincronizado en todos los paneles
        this.state.originX += dx;

        // Desplazamiento vertical
        if (this.activePanTarget && this.activePanTarget.type === 'wave' && this.activePanTarget.wave && !this.state.matchYScale) {
          this.activePanTarget.wave.originY = (this.activePanTarget.wave.originY || this.activePanTarget.height / 2) + dy;
        } else {
          this.state.originY += dy;
        }

        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        if (this.activePanTarget && this.activePanTarget.wrap) {
          this.activePanTarget.wrap.classList.remove('panning');
        }
      }
    });
  }

  // Zoom sincronizado en el eje X
  applySynchronizedZoom(factor, clientX, clientY, targetPanel) {
    const rect = targetPanel.canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const newScaleX = Math.min(Math.max(this.state.scaleX * factor, 15), 450);

    // Ajustar el origen X para hacer zoom centrado en la posición del cursor
    this.state.originX = mouseX - (mouseX - this.state.originX) * (newScaleX / this.state.scaleX);
    this.state.scaleX = newScaleX;

    // Zoom en Y si está igualada la escala o en el panel específico
    if (this.state.matchYScale) {
      const newScaleY = Math.min(Math.max(this.state.scaleY * factor, 15), 450);
      this.state.originY = mouseY - (mouseY - this.state.originY) * (newScaleY / this.state.scaleY);
      this.state.scaleY = newScaleY;
    } else if (targetPanel && targetPanel.wave) {
      const currentScaleY = targetPanel.wave.scaleY || 65;
      const newScaleY = Math.min(Math.max(currentScaleY * factor, 15), 450);
      const currentOriginY = targetPanel.wave.originY || targetPanel.height / 2;
      targetPanel.wave.originY = mouseY - (mouseY - currentOriginY) * (newScaleY / currentScaleY);
      targetPanel.wave.scaleY = newScaleY;
    }

    this.render();
  }

  // Eventos de las tarjetas de onda (Toggles individuales, Sliders, Solo, Eliminar)
  bindCardEvents() {
    // 1, 2, 3: TOGGLES POR ONDA
    this.container.querySelectorAll('.wave-component-card [data-toggle-type]').forEach(btn => {
      const toggleAction = () => {
        const waveId = btn.getAttribute('data-wave-id');
        const toggleType = btn.getAttribute('data-toggle-type');
        const wave = this.state.waves.find(w => w.id === waveId);
        if (!wave) return;

        if (toggleType === 'visible') {
          wave.visible = !wave.visible; // 1. Mostrar/Ocultar curva
        } else if (toggleType === 'sum') {
          wave.includeInSum = !wave.includeInSum; // 2. Incluir en suma
        } else if (toggleType === 'panel') {
          wave.ownPanel = !wave.ownPanel; // 3. Panel propio
        }

        this.renderWaveCards();
        if (this.state.viewMode === 'divided') {
          this.renderStage();
        } else {
          this.render();
        }
        this.state.notify('wave-toggle-changed', { waveId, toggleType });
      };

      btn.addEventListener('click', toggleAction);

      // Accesibilidad con teclado: Espacio o Enter
      btn.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleAction();
        }
      });
    });

    // Botón "Solo esta"
    this.container.querySelectorAll('.btn-solo-wave').forEach(btn => {
      btn.addEventListener('click', () => {
        const waveId = btn.getAttribute('data-wave-id');
        this.state.toggleSoloWave(waveId);
        this.renderWaveCards();
        if (this.state.viewMode === 'divided') {
          this.renderStage();
        } else {
          this.render();
        }
      });
    });

    // Sliders de parámetros
    this.container.querySelectorAll('.param-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const waveId = slider.getAttribute('data-wave-id');
        const param = slider.getAttribute('data-param');
        const wave = this.state.waves.find(w => w.id === waveId);
        if (!wave) return;

        const val = parseFloat(e.target.value);
        wave[param] = val;

        // Actualizar etiqueta del valor
        const labelStrong = slider.parentElement.querySelector('label strong');
        if (labelStrong) {
          const unit = param === 'A' || param === 'wavelength' ? ' m' : (param === 'f' ? ' Hz' : ' rad');
          labelStrong.textContent = `${val.toFixed(2)}${unit}`;
        }

        // Actualizar badge de fórmula
        const card = slider.closest('.wave-component-card');
        const badge = card && card.querySelector('.wave-formula-badge');
        if (badge) {
          badge.textContent = wave.getEquationString();
        }

        this.render();
      });
    });

    // Sentido de propagación
    this.container.querySelectorAll('.geogebra-btn[data-action="set-dir"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const waveId = btn.getAttribute('data-wave-id');
        const dir = parseInt(btn.getAttribute('data-dir'), 10) || 1;
        const wave = this.state.waves.find(w => w.id === waveId);
        if (wave) {
          wave.direction = dir;
          this.renderWaveCards();
          this.render();
        }
      });
    });

    // Eliminar onda
    this.container.querySelectorAll('.geogebra-btn[data-action="delete-wave"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const waveId = btn.getAttribute('data-wave-id');
        this.state.waves = this.state.waves.filter(w => w.id !== waveId);
        this.renderWaveCards();
        this.renderStage();
        this.state.notify('wave-deleted', { waveId });
      });
    });
  }

  // Acciones de la barra superior
  handleToolbarAction(action, btn) {
    if (action === 'zoom-in') {
      const centerX = this.container.offsetWidth / 2;
      const centerY = 200;
      this.applySynchronizedZoom(1.2, centerX, centerY, null);
    } else if (action === 'zoom-out') {
      const centerX = this.container.offsetWidth / 2;
      const centerY = 200;
      this.applySynchronizedZoom(0.833, centerX, centerY, null);
    } else if (action === 'reset') {
      this.state.scaleX = 65;
      this.state.scaleY = 65;
      this.state.originX = 70;
      this.state.originY = 200;
      this.panels.forEach(p => {
        if (p.wave) {
          p.wave.scaleY = 65;
          p.wave.originY = p.height / 2;
        }
      });
      this.render();
    } else if (action === 'palette') {
      const panel = this.container.querySelector('.geogebra-style-panel');
      if (panel) panel.classList.toggle('show');
    } else if (action === 'select') {
      this.toolMode = this.toolMode === 'select' ? 'pan' : 'select';
      btn.classList.toggle('active', this.toolMode === 'select');
    } else if (action === 'toggle-grid') {
      this.state.showGrid = !this.state.showGrid;
      btn.classList.toggle('active', this.state.showGrid);
      this.render();
    } else if (action === 'toggle-axes') {
      this.state.showAxes = !this.state.showAxes;
      btn.classList.toggle('active', this.state.showAxes);
      this.render();
    } else if (action === 'show-all') {
      this.state.showAllWaves();
      this.renderWaveCards();
      if (this.state.viewMode === 'divided') this.renderStage();
      else this.render();
    } else if (action === 'hide-all') {
      this.state.hideAllWaves();
      this.renderWaveCards();
      if (this.state.viewMode === 'divided') this.renderStage();
      else this.render();
    } else if (action === 'add-wave') {
      const newNum = this.state.waves.length + 1;
      const colors = ['#00f0ff', '#d4af37', '#c084fc', '#10b981', '#f97316', '#ec4899', '#38bdf8'];
      const pickColor = colors[(newNum - 1) % colors.length];
      this.state.waves.push(new WaveComponent({
        id: `wave-${Date.now()}`,
        name: `Onda ${newNum}`,
        A: 1.00,
        f: 0.50 * newNum,
        wavelength: (4.0 / newNum) || 2.0,
        phi: 0.0,
        direction: 1,
        color: pickColor,
        visible: true,
        includeInSum: true,
        ownPanel: true
      }));
      this.renderWaveCards();
      this.renderStage();
      this.state.notify('wave-added');
    } else if (action === 'export-img') {
      this.exportImage();
    } else if (action === 'export-json') {
      this.exportJSON();
    } else if (action === 'import-json') {
      const fileInput = this.container.querySelector('.hidden-json-input');
      if (fileInput) fileInput.click();
    } else if (action === 'expand') {
      this.openModal();
    }
  }

  // ===========================================================================
  // ACTUALIZACIONES DE UI
  // ===========================================================================
  updateSegmentedUI() {
    this.container.querySelectorAll('.segmented-option').forEach(btn => {
      const mode = btn.getAttribute('data-mode');
      const active = mode === this.state.viewMode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active);
    });
  }

  updateGlobalTogglesUI() {
    const resToggle = this.container.querySelector('[data-global-toggle="resultant"]');
    if (resToggle) {
      resToggle.setAttribute('aria-checked', this.state.showResultant);
      resToggle.querySelector('.toggle-state-badge').textContent = this.state.showResultant ? 'ON' : 'OFF';
      resToggle.querySelector('.toggle-glyph-svg').innerHTML = this.state.showResultant 
        ? '<polyline points="20 6 9 17 4 12"/>' 
        : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    }

    const compToggle = this.container.querySelector('[data-global-toggle="components"]');
    if (compToggle) {
      compToggle.setAttribute('aria-checked', this.state.showComponents);
      compToggle.querySelector('.toggle-state-badge').textContent = this.state.showComponents ? 'ON' : 'OFF';
      compToggle.querySelector('.toggle-glyph-svg').innerHTML = this.state.showComponents 
        ? '<polyline points="20 6 9 17 4 12"/>' 
        : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    }

    const matchYToggle = this.container.querySelector('[data-global-toggle="match-y"]');
    if (matchYToggle) {
      matchYToggle.setAttribute('aria-checked', this.state.matchYScale);
      matchYToggle.querySelector('.toggle-state-badge').textContent = this.state.matchYScale ? 'ON' : 'OFF';
      matchYToggle.querySelector('.toggle-glyph-svg').innerHTML = this.state.matchYScale 
        ? '<polyline points="20 6 9 17 4 12"/>' 
        : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    }
  }

  updatePlaybackSlider() {
    const slider = this.container.querySelector('.playback-slider');
    const badge = this.container.querySelector('.playback-time-badge');
    if (slider) slider.value = this.state.t.toFixed(2);
    if (badge) badge.textContent = `t = ${this.state.t.toFixed(2)} s`;
  }

  updateInspectorReadout() {
    if (this.state.inspectorX === null) return;
    const x = this.state.inspectorX;
    const t = this.state.t;

    // Actualizar lecturas en los paneles divididos
    this.state.waves.forEach(w => {
      const valEl = this.container.querySelector(`.panel-live-val[data-wave-val="${w.id}"]`);
      if (valEl) {
        const yVal = w.calculate(x, t);
        valEl.textContent = `y(${x.toFixed(2)} m) = ${yVal.toFixed(2)} m`;
      }
    });

    const resValEl = this.container.querySelector('.panel-live-val[data-wave-val="resultant"]');
    if (resValEl) {
      const resVal = this.state.calculateResultant(x, t);
      resValEl.textContent = `y_res(${x.toFixed(2)} m) = ${resVal.toFixed(2)} m`;
    }

    // Actualizar barra inferior
    const readoutWrap = this.container.querySelector('.inspector-live-readouts');
    if (readoutWrap) {
      const res = this.state.calculateResultant(x, t);
      readoutWrap.innerHTML = `
        <span style="color:#ef4444; margin-left:8px; font-weight:700;">y_res = ${res.toFixed(2)} m</span>
      `;
    }
  }

  handleStateChange(event) {
    if (event === 'view-mode-changed') {
      this.updateSegmentedUI();
      this.renderStage();
    } else if (event === 'visibility-changed' || event === 'solo-toggled' || event === 'wave-toggle-changed') {
      this.renderWaveCards();
      if (this.state.viewMode === 'divided') this.renderStage();
      else this.render();
    } else {
      this.render();
    }
  }

  // ===========================================================================
  // BUCLE ÚNICO CENTRAL DE ANIMACIÓN
  // ===========================================================================
  startSharedAnimationLoop() {
    let lastTime = performance.now();
    const animate = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (this.state.isPlaying) {
        this.state.t += dt * this.state.timeScale;
        if (this.state.t > 20.0) {
          this.state.t = 0; // bucle suave de 20 segundos
        }
        this.updatePlaybackSlider();
      }

      this.render();
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // ===========================================================================
  // RENDERIZADO GRÁFICO DEL PLANO CARTESIANO GEOGEBRA
  // ===========================================================================
  render() {
    if (this.state.viewMode === 'superposed') {
      this.renderSuperposed();
    } else if (this.state.viewMode === 'divided') {
      this.renderDividedPanels();
    } else if (this.state.viewMode === 'only-resultant') {
      this.renderOnlyResultant();
    }
  }

  // 1. MODO SUPERPUESTAS: Todas las ondas y la resultante en un solo plano
  renderSuperposed() {
    const mainPanel = this.panels.get('main');
    if (!mainPanel || !mainPanel.ctx) return;

    const ctx = mainPanel.ctx;
    const w = mainPanel.width;
    const h = mainPanel.height;
    const ox = this.state.originX;
    const oy = this.state.originY || (h / 2);
    const sx = this.state.scaleX;
    const sy = this.state.scaleY;

    this.drawGridAndAxes(ctx, w, h, ox, oy, sx, sy, 'Posición x (m)', 'Elongación y (m)');

    const t = this.state.t;

    // Curvas componentes si están activadas globalmente
    if (this.state.showComponents) {
      for (const wave of this.state.waves) {
        if (!wave.visible) continue; // ¡Ocultar onda quita su curva!

        ctx.save();
        ctx.lineWidth = wave.lineWidth;
        ctx.strokeStyle = wave.color;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 6;
        if (wave.lineStyle === 'dashed') ctx.setLineDash([8, 4]);
        else if (wave.lineStyle === 'dotted') ctx.setLineDash([2, 4]);

        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= w; px += 2) {
          const x = (px - ox) / sx;
          const y = wave.calculate(x, t);
          const py = oy - y * sy;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // Curva Resultante si está activada
    if (this.state.showResultant) {
      ctx.save();
      ctx.lineWidth = 3.4;
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= w; px += 2) {
        const x = (px - ox) / sx;
        const y = this.state.calculateResultant(x, t);
        const py = oy - y * sy;
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // Inspector de posición x sincronizado
    if (this.state.inspectorX !== null) {
      this.drawInspectorLine(ctx, w, h, ox, oy, sx, sy, t, 'superposed');
    }
  }

  // 2. MODO DIVIDIDAS: Un plano por cada onda visible + resultante al final
  renderDividedPanels() {
    const t = this.state.t;
    const ox = this.state.originX;
    const sx = this.state.scaleX;

    this.panels.forEach(p => {
      if (!p.ctx) return;
      const ctx = p.ctx;
      const w = p.width;
      const h = p.height;

      // Escala Y y origen Y específicos del panel
      let sy = this.state.scaleY;
      let oy = this.state.originY || (h / 2);

      if (p.type === 'wave' && p.wave && !this.state.matchYScale) {
        sy = p.wave.scaleY || 65;
        oy = p.wave.originY || (h / 2);
      }

      this.drawGridAndAxes(ctx, w, h, ox, oy, sx, sy, 'Posición x (m)', 'y (m)');

      if (p.type === 'wave' && p.wave) {
        const wave = p.wave;
        ctx.save();
        ctx.lineWidth = wave.lineWidth || 2.8;
        ctx.strokeStyle = wave.color;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= w; px += 2) {
          const x = (px - ox) / sx;
          const y = wave.calculate(x, t);
          const py = oy - y * sy;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // Marcas de amplitud ±A
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        const yMax = oy - wave.A * sy;
        const yMin = oy + wave.A * sy;
        ctx.beginPath();
        ctx.moveTo(0, yMax); ctx.lineTo(w, yMax);
        ctx.moveTo(0, yMin); ctx.lineTo(w, yMin);
        ctx.stroke();

        ctx.font = '9px "Fira Code", monospace';
        ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
        ctx.fillText(`+A = ${wave.A.toFixed(2)} m`, ox + 8, yMax - 4);
        ctx.fillText(`-A = -${wave.A.toFixed(2)} m`, ox + 8, yMin + 10);
        ctx.restore();

        // Punto de inspector en este panel
        if (this.state.inspectorX !== null) {
          this.drawPanelInspectorPoint(ctx, w, h, ox, oy, sx, sy, t, wave);
        }

      } else if (p.type === 'resultant') {
        ctx.save();
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= w; px += 2) {
          const x = (px - ox) / sx;
          const y = this.state.calculateResultant(x, t);
          const py = oy - y * sy;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.restore();

        // Punto de inspector en el panel resultante
        if (this.state.inspectorX !== null) {
          this.drawPanelInspectorPoint(ctx, w, h, ox, oy, sx, sy, t, null);
        }
      }
    });
  }

  // 3. MODO SOLO RESULTANTE
  renderOnlyResultant() {
    const mainPanel = this.panels.get('main');
    if (!mainPanel || !mainPanel.ctx) return;

    const ctx = mainPanel.ctx;
    const w = mainPanel.width;
    const h = mainPanel.height;
    const ox = this.state.originX;
    const oy = this.state.originY || (h / 2);
    const sx = this.state.scaleX;
    const sy = this.state.scaleY;

    this.drawGridAndAxes(ctx, w, h, ox, oy, sx, sy, 'Posición x (m)', 'Elongación Resultante y_res (m)');

    const t = this.state.t;

    ctx.save();
    ctx.lineWidth = 3.6;
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px += 2) {
      const x = (px - ox) / sx;
      const y = this.state.calculateResultant(x, t);
      const py = oy - y * sy;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    if (this.state.inspectorX !== null) {
      this.drawInspectorLine(ctx, w, h, ox, oy, sx, sy, t, 'resultant');
    }
  }

  // ===========================================================================
  // DIBUJO DE CUADRÍCULA Y EJES ESTILO GEOGEBRA
  // ===========================================================================
  drawGridAndAxes(ctx, w, h, ox, oy, sx, sy, xLabel, yLabel) {
    // Fondo oscuro ultra-científico
    ctx.fillStyle = '#080a10';
    ctx.fillRect(0, 0, w, h);

    // 1. CUADRÍCULA SECUNDARIA (Papel Milimetrado de Alta Resolución)
    if (this.state.showGrid && this.state.showSecondaryGrid) {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
      const subStepX = sx / 5;
      const subStepY = sy / 5;

      ctx.beginPath();
      for (let x = ((ox % subStepX) + subStepX) % subStepX; x < w; x += subStepX) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = ((oy % subStepY) + subStepY) % subStepY; y < h; y += subStepY) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
    }

    // 2. CUADRÍCULA PRINCIPAL
    if (this.state.showGrid) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.14)';

      ctx.beginPath();
      for (let x = ((ox % sx) + sx) % sx; x < w; x += sx) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = ((oy % sy) + sy) % sy; y < h; y += sy) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
    }

    // 3. EJES CARTESIANOS GRADUADOS
    if (this.state.showAxes) {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';

      ctx.beginPath();
      // Eje X
      if (oy >= 0 && oy <= h) {
        ctx.moveTo(0, oy); ctx.lineTo(w, oy);
        // Flecha X
        ctx.moveTo(w - 7, oy - 3); ctx.lineTo(w, oy); ctx.lineTo(w - 7, oy + 3);
      }
      // Eje Y
      if (ox >= 0 && ox <= w) {
        ctx.moveTo(ox, h); ctx.lineTo(ox, 0);
        // Flecha Y
        ctx.moveTo(ox - 3, 7); ctx.lineTo(ox, 0); ctx.lineTo(ox + 3, 7);
      }
      ctx.stroke();

      // MARCAS Y NUMERACIÓN
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillStyle = 'rgba(243, 198, 143, 0.85)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const minX = Math.floor((0 - ox) / sx);
      const maxX = Math.ceil((w - ox) / sx);
      for (let i = minX; i <= maxX; i++) {
        if (i === 0) continue;
        const px = ox + i * sx;
        if (px >= 0 && px <= w) {
          ctx.beginPath();
          ctx.moveTo(px, oy - 4); ctx.lineTo(px, oy + 4);
          ctx.stroke();
          ctx.fillText(i.toString(), px, oy + 6);
        }
      }

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const minY = Math.floor((oy - h) / sy);
      const maxY = Math.ceil(oy / sy);
      for (let j = minY; j <= maxY; j++) {
        if (j === 0) continue;
        const py = oy - j * sy;
        if (py >= 0 && py <= h) {
          ctx.beginPath();
          ctx.moveTo(ox - 4, py); ctx.lineTo(ox + 4, py);
          ctx.stroke();
          ctx.fillText(j.toString(), ox - 7, py);
        }
      }

      // Origen '0'
      ctx.fillText('0', ox - 6, oy + 6);

      // Etiquetas de ejes
      if (this.state.showLabels) {
        ctx.font = '11px "Inter", sans-serif';
        ctx.fillStyle = '#f5d77f';
        ctx.textAlign = 'right';
        ctx.fillText(xLabel, w - 12, oy - 12);
        ctx.textAlign = 'left';
        ctx.fillText(yLabel, ox + 8, 14);
      }
    }
  }

  // ===========================================================================
  // INSPECTOR DE POSICIÓN X SINCRONIZADO
  // ===========================================================================
  drawInspectorLine(ctx, w, h, ox, oy, sx, sy, t, mode) {
    const x = this.state.inspectorX;
    const px = ox + x * sx;
    if (px < 0 || px > w) return;

    // Línea vertical que cruza el plano
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(px, 0); ctx.lineTo(px, h);
    ctx.stroke();
    ctx.restore();

    // Puntos en cada curva visible
    if (mode === 'superposed' && this.state.showComponents) {
      for (const wave of this.state.waves) {
        if (!wave.visible) continue;
        const y = wave.calculate(x, t);
        const py = oy - y * sy;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Punto en la resultante
    if (this.state.showResultant) {
      const yRes = this.state.calculateResultant(x, t);
      const pyRes = oy - yRes * sy;

      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, pyRes, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawPanelInspectorPoint(ctx, w, h, ox, oy, sx, sy, t, wave) {
    const x = this.state.inspectorX;
    const px = ox + x * sx;
    if (px < 0 || px > w) return;

    // Línea vertical guía que cruza este panel
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.beginPath();
    ctx.moveTo(px, 0); ctx.lineTo(px, h);
    ctx.stroke();
    ctx.restore();

    const y = wave ? wave.calculate(x, t) : this.state.calculateResultant(x, t);
    const py = oy - y * sy;
    const color = wave ? wave.color : '#ef4444';

    // Punto brillante
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();

    // Etiqueta flotante
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(`y = ${y.toFixed(2)} m`, px + 8, py - 6);
    ctx.restore();
  }

  // ===========================================================================
  // EXPORTACIÓN A IMAGEN Y A JSON
  // ===========================================================================
  // Exportar a Imagen PNG respetando el modo actual (superpuesto o dividido)
  exportImage() {
    if (this.state.viewMode === 'superposed' || this.state.viewMode === 'only-resultant') {
      const mainPanel = this.panels.get('main');
      if (!mainPanel || !mainPanel.canvas) return;

      const link = document.createElement('a');
      link.download = `ondas_${this.state.viewMode}_fisica3.png`;
      link.href = mainPanel.canvas.toDataURL('image/png');
      link.click();
    } else if (this.state.viewMode === 'divided') {
      // Combinar verticalmente todos los paneles en un solo lienzo de alta resolución
      const exportCanvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;

      let totalWidth = 0;
      let totalHeight = 0;
      const panelCanvases = [];

      this.panels.forEach((p, key) => {
        if (p.canvas) {
          totalWidth = Math.max(totalWidth, p.canvas.width);
          totalHeight += p.canvas.height + 40 * dpr; // espacio para cabecera
          panelCanvases.push(p);
        }
      });

      if (panelCanvases.length === 0) return;

      exportCanvas.width = totalWidth;
      exportCanvas.height = totalHeight;
      const expCtx = exportCanvas.getContext('2d');

      // Fondo
      expCtx.fillStyle = '#080a10';
      expCtx.fillRect(0, 0, totalWidth, totalHeight);

      let currentY = 0;
      panelCanvases.forEach(p => {
        // Título del panel
        expCtx.fillStyle = '#f5d77f';
        expCtx.font = `bold ${14 * dpr}px "Outfit", sans-serif`;
        const title = p.type === 'wave' && p.wave ? p.wave.name : 'Onda Resultante (Superposición)';
        expCtx.fillText(title, 20 * dpr, currentY + 24 * dpr);
        currentY += 35 * dpr;

        // Dibujar lienzo del panel
        expCtx.drawImage(p.canvas, 0, currentY);
        currentY += p.canvas.height + 10 * dpr;
      });

      const link = document.createElement('a');
      link.download = `ondas_divididas_fisica3.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    }
  }

  // Exportar configuración a JSON
  exportJSON() {
    const data = this.state.toJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'configuracion_ondas_fisica3.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ===========================================================================
  // MODAL A PANTALLA COMPLETA SINCRONIZADO
  // ===========================================================================
  openModal() {
    const modal = document.getElementById(this.options.modalTargetId);
    if (!modal) return;
    const modalMount = modal.querySelector('.modal-canvas-wrap');
    if (!modalMount) return;

    modal.classList.add('show');

    // Inicializar clon en el modal conectado al MISMO estado compartido
    if (!modalMount.graphInstance) {
      modalMount.graphInstance = new GeoGebraGraph(modalMount.id, {
        isModal: true,
        modalTargetId: this.options.modalTargetId
      });
    } else {
      modalMount.graphInstance.resizeCanvases();
      modalMount.graphInstance.renderStage();
      modalMount.graphInstance.renderWaveCards();
      modalMount.graphInstance.render();
    }

    const closeBtn = modal.querySelector('.btn-close-modal');
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.classList.remove('show');
        // Al cerrar el modal, redimensionar y renderizar la vista embebida
        this.resizeCanvases();
        this.renderStage();
        this.renderWaveCards();
        this.render();
      };
    }
  }
}

// Exponer globalmente
window.WaveComponent = WaveComponent;
window.WaveSuperpositionState = WaveSuperpositionState;
window.GeoGebraGraph = GeoGebraGraph;
