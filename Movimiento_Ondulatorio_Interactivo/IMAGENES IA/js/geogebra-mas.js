/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Módulo: Plano Cartesiano GeoGebra para la Cinemática del Movimiento Armónico Simple (MAS)
 * 
 * Cumple con todos los requerimientos de la cátedra:
 * - Cuadrícula mayor y menor estilo papel milimetrado
 * - Reglas sobre los ejes, marcas (ticks), subdivisiones y números sobre las marcas
 * - Manejo perfecto de transformaciones de escala (coordenadas mundo <-> pantalla)
 * - Panel flotante con botones e iconos elegantes: Zoom In, Zoom Out, Pan/Mano, Reset, Selector magnético, Paleta de estilos
 * - Re-escalamiento manual de los ejes X e Y arrastrando directamente con el ratón o dedos
 * - Graficación sincrónica de:
 *   1. Elongación x(t) = A * cos(omega * t + phi) [Azul Neón]
 *   2. Velocidad v(t) = -A * omega * sin(omega * t + phi) [Verde Esmeralda]
 *   3. Aceleración a(t) = -A * omega^2 * cos(omega * t + phi) [Rojo Carmesí]
 *   4. Espacio de Fases: Órbita elíptica (x vs v)
 */

class MASGeoGebraPlotter {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      A: 1.5,          // Amplitud en metros
      omega: 2.0,      // Frecuencia angular en rad/s
      phi: 0.0,        // Fase inicial en rad
      scaleX: 65,      // Píxeles por segundo (eje t)
      scaleY: 65,      // Píxeles por unidad (eje magnitudes)
      showX: true,     // Mostrar curva x(t)
      showV: true,     // Mostrar curva v(t)
      showA: true,     // Mostrar curva a(t)
      showPhase: false,// Modo espacio de fases
      showSubgrid: true,// Papel milimetrado menor
      lineWidth: 2.8,
      lineStyle: 'solid',
      showVectors: true
    }, options);

    this.state = {
      A: this.options.A,
      omega: this.options.omega,
      phi: this.options.phi,
      scaleX: this.options.scaleX,
      scaleY: this.options.scaleY,
      originX: 80,
      originY: 220,
      showX: this.options.showX,
      showV: this.options.showV,
      showA: this.options.showA,
      showPhase: this.options.showPhase,
      showGrid: true,
      showSubgrid: this.options.showSubgrid,
      showAxes: true,
      lineWidth: this.options.lineWidth,
      lineStyle: this.options.lineStyle,
      showVectors: this.options.showVectors,
      colorX: '#38bdf8',  // Azul datos
      colorV: '#10b981',  // Verde velocidad
      colorA: '#f43f5e',  // Rojo aceleración
      toolMode: 'pan',    // 'pan', 'select'
      selectedPoint: null,// { t, x, v, a }
      hoverAxis: null,    // 'x', 'y' or null
      isPlaying: true,
      timeScale: 1.0,
      t: 0
    };

    // Estados de interacción
    this.isPanning = false;
    this.isScalingX = false;
    this.isScalingY = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.initDOM();
    this.resizeCanvas();
    this.bindEvents();

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.render();
    });
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="geogebra-widget mas-geogebra-board">
        <!-- BARRA SUPERIOR DE HERRAMIENTAS ESTILO GEOGEBRA -->
        <div class="geogebra-toolbar" role="toolbar" aria-label="Herramientas del Plano Cartesiano GeoGebra">
          <div class="geogebra-tool-group">
            <button type="button" class="geogebra-btn active" data-action="pan" data-tooltip="Modo Mover / Arrastrar lienzo" aria-label="Modo Mover Pan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
            </button>
            <button type="button" class="geogebra-btn" data-action="select" data-tooltip="Modo Seleccionar / Inspeccionar punto exacto (t, x, v, a)" aria-label="Seleccionar punto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
            </button>
            <button type="button" class="geogebra-btn" data-action="zoom-in" data-tooltip="Acercar plano (Zoom In)" aria-label="Acercar Zoom">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button type="button" class="geogebra-btn" data-action="zoom-out" data-tooltip="Alejar plano (Zoom Out)" aria-label="Alejar Zoom">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button type="button" class="geogebra-btn" data-action="reset" data-tooltip="Restablecer Vista Original 1:1" aria-label="Restablecer Vista">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button type="button" class="geogebra-btn" data-action="palette" data-tooltip="Paleta de Estilos Gráficos (Colores, Grosor, Trazos, Vectores)" aria-label="Paleta de Estilos">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"/></svg>
            </button>
          </div>

          <!-- TOGGLES DE CURVAS CINEMÁTICAS -->
          <div class="geogebra-tool-group">
            <button type="button" class="geogebra-btn ${this.state.showX ? 'active' : ''}" data-curve="x" style="color:var(--pedagogy-blue-text); border-color:var(--pedagogy-blue-border);" title="Alternar Elongación x(t)">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#38bdf8; margin-right:4px;"></span>
              <span>x(t)</span>
            </button>
            <button type="button" class="geogebra-btn ${this.state.showV ? 'active' : ''}" data-curve="v" style="color:#34d399; border-color:#10b981;" title="Alternar Velocidad v(t)">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981; margin-right:4px;"></span>
              <span>v(t)</span>
            </button>
            <button type="button" class="geogebra-btn ${this.state.showA ? 'active' : ''}" data-curve="a" style="color:#f87171; border-color:#ef4444;" title="Alternar Aceleración a(t)">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#f43f5e; margin-right:4px;"></span>
              <span>a(t)</span>
            </button>
            <button type="button" class="geogebra-btn ${this.state.showPhase ? 'active' : ''}" data-action="toggle-phase" title="Modo Diagrama de Espacio de Fases (x vs v)">
              <span>Espacio Fases</span>
            </button>
          </div>

          <div class="geogebra-tool-group">
            <span style="font-size:0.75rem; color:var(--gold-light); font-family:var(--font-mono); background:rgba(212,175,55,0.1); padding:3px 8px; border-radius:4px; border:1px solid rgba(212,175,55,0.25);">
              ↔️ / ↕️ Arrastra sobre los ejes para re-escalar
            </span>
          </div>
        </div>

        <!-- CONTENEDOR DEL LIENZO -->
        <div class="geogebra-canvas-wrap" style="position:relative; width:100%; height:440px; background:#080a10;">
          <canvas class="geogebra-canvas" style="display:block; width:100%; height:100%;"></canvas>

          <!-- PANEL FLOTANTE DE ESTILOS -->
          <div class="geogebra-style-panel mas-style-panel">
            <div class="style-panel-title">
              <span>🎨 Paleta de Estilos GeoGebra</span>
              <button type="button" class="btn-close-style" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.2rem;">&times;</button>
            </div>
            <div class="style-row">
              <label>Color de la Elongación x(t)</label>
              <div class="color-swatches" data-target="colorX">
                <span class="color-swatch active" data-color="#38bdf8" style="background:#38bdf8;"></span>
                <span class="color-swatch" data-color="#00f0ff" style="background:#00f0ff;"></span>
                <span class="color-swatch" data-color="#60a5fa" style="background:#60a5fa;"></span>
                <span class="color-swatch" data-color="#a855f7" style="background:#a855f7;"></span>
              </div>
            </div>
            <div class="style-row">
              <label>Color de la Velocidad v(t)</label>
              <div class="color-swatches" data-target="colorV">
                <span class="color-swatch active" data-color="#10b981" style="background:#10b981;"></span>
                <span class="color-swatch" data-color="#22c55e" style="background:#22c55e;"></span>
                <span class="color-swatch" data-color="#06b6d4" style="background:#06b6d4;"></span>
                <span class="color-swatch" data-color="#eab308" style="background:#eab308;"></span>
              </div>
            </div>
            <div class="style-row">
              <label>Color de la Aceleración a(t)</label>
              <div class="color-swatches" data-target="colorA">
                <span class="color-swatch active" data-color="#f43f5e" style="background:#f43f5e;"></span>
                <span class="color-swatch" data-color="#ef4444" style="background:#ef4444;"></span>
                <span class="color-swatch" data-color="#f97316" style="background:#f97316;"></span>
                <span class="color-swatch" data-color="#ec4899" style="background:#ec4899;"></span>
              </div>
            </div>
            <div class="style-row">
              <label>Grosor de Trazo (<span class="stroke-val">${this.state.lineWidth}px</span>)</label>
              <input type="range" class="style-slider mas-stroke-slider" min="1" max="6" step="0.5" value="${this.state.lineWidth}" />
            </div>
            <div class="style-row">
              <label>Estilo de Línea</label>
              <div style="display:flex; gap:6px;">
                <button type="button" class="geogebra-btn ${this.state.lineStyle === 'solid' ? 'active' : ''}" data-style="solid" style="flex:1;">Sólida</button>
                <button type="button" class="geogebra-btn ${this.state.lineStyle === 'dashed' ? 'active' : ''}" data-style="dashed" style="flex:1;">Rayas</button>
                <button type="button" class="geogebra-btn ${this.state.lineStyle === 'dotted' ? 'active' : ''}" data-style="dotted" style="flex:1;">Puntos</button>
              </div>
            </div>
            <div class="style-row">
              <label>Opciones Avanzadas</label>
              <div style="display:flex; flex-direction:column; gap:6px; font-size:0.8rem;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" class="toggle-subgrid" ${this.state.showSubgrid ? 'checked' : ''} /> Cuadrícula milimetrada fina
                </label>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                  <input type="checkbox" class="toggle-vectors" ${this.state.showVectors ? 'checked' : ''} /> Mostrar vectores de desfase y tangentes
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- BARRA INFERIOR DE PARÁMETROS DEL MAS Y TELEMETRÍA EN VIVO -->
        <div class="geogebra-playback-bar" style="background:rgba(10,13,22,0.98); border-top:1px solid rgba(212,175,55,0.2); padding:10px 16px;">
          <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; width:100%; justify-content:space-between;">
            
            <!-- PARÁMETROS: A, OMEGA, PHI -->
            <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:0.78rem; color:var(--text-secondary); font-family:var(--font-mono);">A:</label>
                <input type="range" class="mas-slider-A" min="0.2" max="3.0" step="0.1" value="${this.state.A}" style="width:90px;" />
                <span class="mas-val-A" style="font-size:0.78rem; color:var(--gold-light); font-family:var(--font-mono);">${this.state.A.toFixed(1)} m</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:0.78rem; color:var(--text-secondary); font-family:var(--font-mono);">&omega;:</label>
                <input type="range" class="mas-slider-omega" min="0.5" max="6.0" step="0.2" value="${this.state.omega}" style="width:90px;" />
                <span class="mas-val-omega" style="font-size:0.78rem; color:var(--gold-light); font-family:var(--font-mono);">${this.state.omega.toFixed(1)} rad/s</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <label style="font-size:0.78rem; color:var(--text-secondary); font-family:var(--font-mono);">&phi;:</label>
                <input type="range" class="mas-slider-phi" min="-3.14" max="3.14" step="0.1" value="${this.state.phi}" style="width:80px;" />
                <span class="mas-val-phi" style="font-size:0.78rem; color:var(--gold-light); font-family:var(--font-mono);">${this.state.phi.toFixed(2)} rad</span>
              </div>
            </div>

            <!-- VALORES INSTANTÁNEOS EN EL TIEMPO t -->
            <div class="mas-live-readouts" style="display:flex; align-items:center; gap:12px; font-family:var(--font-mono); font-size:0.78rem;">
              <span style="color:#38bdf8;">x(t) = <strong class="readout-x">0.00 m</strong></span>
              <span style="color:#10b981;">v(t) = <strong class="readout-v">0.00 m/s</strong></span>
              <span style="color:#f43f5e;">a(t) = <strong class="readout-a">0.00 m/s²</strong></span>
            </div>

            <!-- CONTROL DE REPRODUCCIÓN -->
            <div style="display:flex; align-items:center; gap:6px;">
              <button type="button" class="playback-btn btn-mas-play ${this.state.isPlaying ? 'active' : ''}" style="height:32px; padding:0 10px;">
                ${this.state.isPlaying ? 'Pausa' : 'Play'}
              </button>
              <button type="button" class="playback-btn btn-mas-reset" style="height:32px; padding:0 8px;" title="Reiniciar t = 0">
                ↺ t = 0
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('.geogebra-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.stylePanel = this.container.querySelector('.mas-style-panel');
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  bindEvents() {
    const canvas = this.canvas;

    // Detectar proximidad a ejes para cursor de re-escalamiento manual
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (!this.isPanning && !this.isScalingX && !this.isScalingY) {
        const distToXAxis = Math.abs(mouseY - this.state.originY);
        const distToYAxis = Math.abs(mouseX - this.state.originX);

        if (distToXAxis <= 18 && mouseX >= 0 && mouseX <= this.width) {
          canvas.style.cursor = 'ew-resize';
          this.state.hoverAxis = 'x';
        } else if (distToYAxis <= 18 && mouseY >= 0 && mouseY <= this.height) {
          canvas.style.cursor = 'ns-resize';
          this.state.hoverAxis = 'y';
        } else {
          canvas.style.cursor = this.state.toolMode === 'select' ? 'crosshair' : 'grab';
          this.state.hoverAxis = null;
        }
      }

      // Proceso de arrastre
      if (this.isScalingX) {
        const dx = e.clientX - this.lastMouseX;
        this.lastMouseX = e.clientX;
        this.state.scaleX = Math.max(15, Math.min(600, this.state.scaleX * (1 + dx * 0.008)));
        this.render();
      } else if (this.isScalingY) {
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseY = e.clientY;
        this.state.scaleY = Math.max(15, Math.min(600, this.state.scaleY * (1 - dy * 0.008)));
        this.render();
      } else if (this.isPanning) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.state.originX += dx;
        this.state.originY += dy;
        this.render();
      } else if (this.state.toolMode === 'select') {
        const t = (mouseX - this.state.originX) / this.state.scaleX;
        this.updateSelectedPoint(t);
        this.render();
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (this.state.hoverAxis === 'x') {
        this.isScalingX = true;
      } else if (this.state.hoverAxis === 'y') {
        this.isScalingY = true;
      } else if (this.state.toolMode === 'pan') {
        this.isPanning = true;
        canvas.style.cursor = 'grabbing';
      } else if (this.state.toolMode === 'select') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const t = (mouseX - this.state.originX) / this.state.scaleX;
        this.updateSelectedPoint(t);
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.isScalingX = false;
      this.isScalingY = false;
      if (canvas) {
        canvas.style.cursor = this.state.hoverAxis ? (this.state.hoverAxis === 'x' ? 'ew-resize' : 'ns-resize') : (this.state.toolMode === 'select' ? 'crosshair' : 'grab');
      }
    });

    // Zoom con rueda del ratón
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;

      const newScaleX = Math.max(15, Math.min(600, this.state.scaleX * factor));
      const newScaleY = Math.max(15, Math.min(600, this.state.scaleY * factor));

      this.state.originX = mouseX - (mouseX - this.state.originX) * (newScaleX / this.state.scaleX);
      this.state.originY = mouseY - (mouseY - this.state.originY) * (newScaleY / this.state.scaleY);
      this.state.scaleX = newScaleX;
      this.state.scaleY = newScaleY;

      this.render();
    }, { passive: false });

    // Gestos táctiles
    let initialTouchDist = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isPanning = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        this.isPanning = false;
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (this.isPanning && e.touches.length === 1) {
        const dx = e.touches[0].clientX - this.lastMouseX;
        const dy = e.touches[0].clientY - this.lastMouseY;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        this.state.originX += dx;
        this.state.originY += dy;
        this.render();
      } else if (e.touches.length === 2) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDist / (initialTouchDist || currentDist);
        initialTouchDist = currentDist;
        this.state.scaleX = Math.max(15, Math.min(600, this.state.scaleX * factor));
        this.state.scaleY = Math.max(15, Math.min(600, this.state.scaleY * factor));
        this.render();
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      this.isPanning = false;
    });

    // Botones de la barra de herramientas
    this.container.querySelectorAll('.geogebra-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'pan') {
          this.state.toolMode = 'pan';
          this.container.querySelectorAll('.geogebra-btn[data-action]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        } else if (action === 'select') {
          this.state.toolMode = 'select';
          this.container.querySelectorAll('.geogebra-btn[data-action]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        } else if (action === 'zoom-in') {
          this.state.scaleX *= 1.25;
          this.state.scaleY *= 1.25;
          this.render();
        } else if (action === 'zoom-out') {
          this.state.scaleX *= 0.8;
          this.state.scaleY *= 0.8;
          this.render();
        } else if (action === 'reset') {
          this.state.scaleX = 65;
          this.state.scaleY = 65;
          this.state.originX = 80;
          this.state.originY = this.height / 2 || 220;
          this.state.selectedPoint = null;
          this.render();
        } else if (action === 'palette') {
          if (this.stylePanel) {
            this.stylePanel.classList.toggle('show');
          }
        } else if (action === 'toggle-phase') {
          this.state.showPhase = !this.state.showPhase;
          btn.classList.toggle('active', this.state.showPhase);
          this.render();
        }
      });
    });

    // Cerrar panel de estilos
    const btnCloseStyle = this.container.querySelector('.btn-close-style');
    if (btnCloseStyle) {
      btnCloseStyle.addEventListener('click', () => {
        if (this.stylePanel) this.stylePanel.classList.remove('show');
      });
    }

    // Toggles de curvas individuales (x, v, a)
    this.container.querySelectorAll('.geogebra-btn[data-curve]').forEach(btn => {
      btn.addEventListener('click', () => {
        const curve = btn.getAttribute('data-curve');
        if (curve === 'x') this.state.showX = !this.state.showX;
        if (curve === 'v') this.state.showV = !this.state.showV;
        if (curve === 'a') this.state.showA = !this.state.showA;
        btn.classList.toggle('active');
        this.render();
      });
    });

    // Sliders de parámetros dinámicos
    const sA = this.container.querySelector('.mas-slider-A');
    const sOmega = this.container.querySelector('.mas-slider-omega');
    const sPhi = this.container.querySelector('.mas-slider-phi');

    if (sA) {
      sA.addEventListener('input', (e) => {
        this.state.A = parseFloat(e.target.value);
        this.container.querySelector('.mas-val-A').textContent = `${this.state.A.toFixed(1)} m`;
        this.render();
      });
    }

    if (sOmega) {
      sOmega.addEventListener('input', (e) => {
        this.state.omega = parseFloat(e.target.value);
        this.container.querySelector('.mas-val-omega').textContent = `${this.state.omega.toFixed(1)} rad/s`;
        this.render();
      });
    }

    if (sPhi) {
      sPhi.addEventListener('input', (e) => {
        this.state.phi = parseFloat(e.target.value);
        this.container.querySelector('.mas-val-phi').textContent = `${this.state.phi.toFixed(2)} rad`;
        this.render();
      });
    }

    // Botones de reproducción
    const btnPlay = this.container.querySelector('.btn-mas-play');
    const btnResetT = this.container.querySelector('.btn-mas-reset');

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.state.isPlaying = !this.state.isPlaying;
        btnPlay.textContent = this.state.isPlaying ? 'Pausa' : 'Play';
        btnPlay.classList.toggle('active', this.state.isPlaying);
      });
    }

    if (btnResetT) {
      btnResetT.addEventListener('click', () => {
        this.state.t = 0;
        this.render();
      });
    }

    // Estilos de la paleta
    this.container.querySelectorAll('.color-swatches span').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const parent = swatch.parentElement;
        const target = parent.getAttribute('data-target');
        const color = swatch.getAttribute('data-color');
        parent.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        if (target && this.state[target] !== undefined) {
          this.state[target] = color;
          this.render();
        }
      });
    });

    const strokeSlider = this.container.querySelector('.mas-stroke-slider');
    if (strokeSlider) {
      strokeSlider.addEventListener('input', (e) => {
        this.state.lineWidth = parseFloat(e.target.value);
        const valEl = this.container.querySelector('.stroke-val');
        if (valEl) valEl.textContent = `${this.state.lineWidth}px`;
        this.render();
      });
    }

    this.container.querySelectorAll('[data-style]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.lineStyle = btn.getAttribute('data-style');
        this.container.querySelectorAll('[data-style]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.render();
      });
    });

    const chkSubgrid = this.container.querySelector('.toggle-subgrid');
    if (chkSubgrid) {
      chkSubgrid.addEventListener('change', (e) => {
        this.state.showSubgrid = e.target.checked;
        this.render();
      });
    }

    const chkVec = this.container.querySelector('.toggle-vectors');
    if (chkVec) {
      chkVec.addEventListener('change', (e) => {
        this.state.showVectors = e.target.checked;
        this.render();
      });
    }
  }

  updateSelectedPoint(t) {
    const A = this.state.A;
    const omega = this.state.omega;
    const phi = this.state.phi;
    const x = A * Math.cos(omega * t + phi);
    const v = -A * omega * Math.sin(omega * t + phi);
    const a = -A * omega * omega * Math.cos(omega * t + phi);
    this.state.selectedPoint = { t, x, v, a };
  }

  loop(now) {
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (this.state.isPlaying) {
      this.state.t += dt * this.state.timeScale;
      if (this.state.t > 20.0) this.state.t = 0;
      this.updateLiveTelemetry();
      this.render();
    }

    requestAnimationFrame(this.loop);
  }

  updateLiveTelemetry() {
    const t = this.state.t;
    const A = this.state.A;
    const omega = this.state.omega;
    const phi = this.state.phi;

    const x = A * Math.cos(omega * t + phi);
    const v = -A * omega * Math.sin(omega * t + phi);
    const a = -A * omega * omega * Math.cos(omega * t + phi);

    const rx = this.container.querySelector('.readout-x');
    const rv = this.container.querySelector('.readout-v');
    const ra = this.container.querySelector('.readout-a');

    if (rx) rx.textContent = `${x.toFixed(2)} m`;
    if (rv) rv.textContent = `${v.toFixed(2)} m/s`;
    if (ra) ra.textContent = `${a.toFixed(2)} m/s²`;
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const ox = this.state.originX;
    const oy = this.state.originY;
    const sx = this.state.scaleX;
    const sy = this.state.scaleY;

    if (this.state.showPhase) {
      this.renderPhaseSpace(ctx, w, h, ox, oy, sx, sy);
    } else {
      this.renderKinematics(ctx, w, h, ox, oy, sx, sy);
    }
  }

  renderKinematics(ctx, w, h, ox, oy, sx, sy) {
    // 1. DIBUJAR CUADRÍCULA Y EJES ESTILO GEOGEBRA
    this.drawGridAndAxes(ctx, w, h, ox, oy, sx, sy, 'Tiempo t (s)', 'Cinemática [x, v, a]');

    const A = this.state.A;
    const omega = this.state.omega;
    const phi = this.state.phi;
    const lw = this.state.lineWidth;

    // Configurar estilo de línea
    const applyDash = () => {
      if (this.state.lineStyle === 'dashed') ctx.setLineDash([8, 4]);
      else if (this.state.lineStyle === 'dotted') ctx.setLineDash([2, 4]);
      else ctx.setLineDash([]);
    };

    // 2. CURVA DE ACELERACIÓN a(t) = -A * omega^2 * cos(omega * t + phi)
    if (this.state.showA) {
      ctx.save();
      ctx.lineWidth = lw;
      ctx.strokeStyle = this.state.colorA;
      ctx.shadowColor = this.state.colorA;
      ctx.shadowBlur = 6;
      applyDash();
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= w; px += 2) {
        const t = (px - ox) / sx;
        const a = -A * omega * omega * Math.cos(omega * t + phi);
        const py = oy - a * (sy * 0.25); // Factor 0.25 para mantener escala visual de aceleración
        if (!started) { ctx.moveTo(px, py); started = true; }
        else { ctx.lineTo(px, py); }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. CURVA DE VELOCIDAD v(t) = -A * omega * sin(omega * t + phi)
    if (this.state.showV) {
      ctx.save();
      ctx.lineWidth = lw;
      ctx.strokeStyle = this.state.colorV;
      ctx.shadowColor = this.state.colorV;
      ctx.shadowBlur = 8;
      applyDash();
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= w; px += 2) {
        const t = (px - ox) / sx;
        const v = -A * omega * Math.sin(omega * t + phi);
        const py = oy - v * (sy * 0.5); // Factor 0.5 para velocidad
        if (!started) { ctx.moveTo(px, py); started = true; }
        else { ctx.lineTo(px, py); }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. CURVA DE ELONGACIÓN x(t) = A * cos(omega * t + phi)
    if (this.state.showX) {
      ctx.save();
      ctx.lineWidth = lw + 0.5;
      ctx.strokeStyle = this.state.colorX;
      ctx.shadowColor = this.state.colorX;
      ctx.shadowBlur = 10;
      applyDash();
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= w; px += 2) {
        const t = (px - ox) / sx;
        const x = A * Math.cos(omega * t + phi);
        const py = oy - x * sy;
        if (!started) { ctx.moveTo(px, py); started = true; }
        else { ctx.lineTo(px, py); }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. MARCADOR TEMPORAL EN TIEMPO REAL t
    const curT = this.state.t;
    const curPx = ox + curT * sx;
    if (curPx >= 0 && curPx <= w) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.beginPath();
      ctx.moveTo(curPx, 0); ctx.lineTo(curPx, h);
      ctx.stroke();

      // Puntos sobre las curvas
      const curX = A * Math.cos(omega * curT + phi);
      const curV = -A * omega * Math.sin(omega * curT + phi);
      const curA = -A * omega * omega * Math.cos(omega * curT + phi);

      if (this.state.showX) {
        ctx.fillStyle = this.state.colorX;
        ctx.beginPath();
        ctx.arc(curPx, oy - curX * sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (this.state.showV) {
        ctx.fillStyle = this.state.colorV;
        ctx.beginPath();
        ctx.arc(curPx, oy - curV * (sy * 0.5), 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (this.state.showA) {
        ctx.fillStyle = this.state.colorA;
        ctx.beginPath();
        ctx.arc(curPx, oy - curA * (sy * 0.25), 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 6. INSPECTOR DE PUNTO SELECCIONADO
    if (this.state.selectedPoint) {
      const p = this.state.selectedPoint;
      const px = ox + p.t * sx;
      if (px >= 0 && px <= w) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, oy - p.x * sy, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Cuadro de texto flotante
        const text = `t = ${p.t.toFixed(2)} s | x = ${p.x.toFixed(2)} m | v = ${p.v.toFixed(2)} m/s`;
        ctx.font = '11px "Fira Code", monospace';
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(10, 15, 28, 0.92)';
        ctx.fillRect(px - tw / 2 - 8, oy - p.x * sy - 34, tw + 16, 22);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.strokeRect(px - tw / 2 - 8, oy - p.x * sy - 34, tw + 16, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(text, px, oy - p.x * sy - 19);
        ctx.restore();
      }
    }
  }

  renderPhaseSpace(ctx, w, h, ox, oy, sx, sy) {
    this.drawGridAndAxes(ctx, w, h, ox, oy, sx, sy, 'Posición x (m)', 'Velocidad normalizada v/ω (m)');

    const A = this.state.A;
    const omega = this.state.omega;
    const phi = this.state.phi;

    // Trayectoria elíptica en espacio de fases: (x/A)^2 + (v/(omega*A))^2 = 1
    ctx.save();
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = '#c084fc';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(ox, oy, A * sx, A * sy, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Punto orbital dinámico
    const curX = A * Math.cos(omega * this.state.t + phi);
    const curVNorm = -A * Math.sin(omega * this.state.t + phi);
    const px = ox + curX * sx;
    const py = oy - curVNorm * sy;

    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Flecha de sentido de circulación (sentido horario en espacio de fases estándar)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(px, py);
    ctx.stroke();

    ctx.font = '11px "Inter", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(`Fasor de Estado en t = ${this.state.t.toFixed(2)} s`, px + 10, py - 10);

    ctx.restore();
  }

  drawGridAndAxes(ctx, w, h, ox, oy, sx, sy, xLabel, yLabel) {
    // Fondo oscuro obsidiana
    ctx.fillStyle = '#080a10';
    ctx.fillRect(0, 0, w, h);

    // 1. CUADRÍCULA MENOR (Papel Milimetrado de Alta Resolución)
    if (this.state.showGrid && this.state.showSubgrid) {
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

    // 2. CUADRÍCULA MAYOR
    if (this.state.showGrid) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';

      ctx.beginPath();
      for (let x = ((ox % sx) + sx) % sx; x < w; x += sx) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = ((oy % sy) + sy) % sy; y < h; y += sy) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();
    }

    // 3. EJES CARTESIANOS CON REGLAS Y MARCAS
    if (this.state.showAxes) {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';

      ctx.beginPath();
      // Eje X
      if (oy >= 0 && oy <= h) {
        ctx.moveTo(0, oy); ctx.lineTo(w, oy);
        // Flecha X
        ctx.moveTo(w - 8, oy - 4); ctx.lineTo(w, oy); ctx.lineTo(w - 8, oy + 4);
      }
      // Eje Y
      if (ox >= 0 && ox <= w) {
        ctx.moveTo(ox, h); ctx.lineTo(ox, 0);
        // Flecha Y
        ctx.moveTo(ox - 4, 8); ctx.lineTo(ox, 0); ctx.lineTo(ox + 4, 8);
      }
      ctx.stroke();

      // GRADUACIÓN Y NÚMEROS SOBRE MARCAS
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillStyle = 'rgba(243, 198, 143, 0.9)';
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

      // Etiquetas de los ejes
      ctx.font = '11px "Inter", sans-serif';
      ctx.fillStyle = '#f5d77f';
      ctx.textAlign = 'right';
      ctx.fillText(xLabel, w - 12, oy - 12);
      ctx.textAlign = 'left';
      ctx.fillText(yLabel, ox + 8, 14);
    }
  }
}

window.MASGeoGebraPlotter = MASGeoGebraPlotter;
