/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Simulador Físico de Alta Precisión del Movimiento Armónico Simple (MAS)
 * Resorte-Masa realista, vectores dinámicos (x, v, a, F), trazador sinusoidal y balance de energía en vivo.
 */

class HarmonicOscillatorSim {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.options = Object.assign({
      A: 1.2,       // Amplitud en metros
      m: 0.8,       // Masa en kg
      k: 20.0,      // Constante elástica en N/m
      phi: 0,       // Fase inicial en rad
      showVectors: true,
      timeScale: 1.0,
      syncWithGraph: true
    }, options);

    this.state = {
      t: 0,
      isRunning: true,
      A: this.options.A,
      m: this.options.m,
      k: this.options.k,
      phi: this.options.phi,
      showVectors: this.options.showVectors,
      timeScale: this.options.timeScale,
      history: [] // Historial de puntos para el trazador sinusoidal sincronizado
    };

    this.resizeCanvas();
    this.lastTimestamp = performance.now();
    this.initControls();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  initControls() {
    // Escuchar controles vinculados en el DOM si existen
    const sliderA = document.getElementById('sim-slider-A');
    const sliderM = document.getElementById('sim-slider-m');
    const sliderK = document.getElementById('sim-slider-k');
    const btnPlay = document.getElementById('sim-btn-play');
    const btnReset = document.getElementById('sim-btn-reset');
    const toggleVec = document.getElementById('sim-toggle-vectors');

    if (sliderA) {
      sliderA.addEventListener('input', (e) => {
        this.state.A = parseFloat(e.target.value);
        const valEl = document.getElementById('sim-val-A');
        if (valEl) valEl.textContent = `${this.state.A.toFixed(2)} m`;
        this.updatePhysicsParams();
      });
    }

    if (sliderM) {
      sliderM.addEventListener('input', (e) => {
        this.state.m = parseFloat(e.target.value);
        const valEl = document.getElementById('sim-val-m');
        if (valEl) valEl.textContent = `${this.state.m.toFixed(2)} kg`;
        this.updatePhysicsParams();
      });
    }

    if (sliderK) {
      sliderK.addEventListener('input', (e) => {
        this.state.k = parseFloat(e.target.value);
        const valEl = document.getElementById('sim-val-k');
        if (valEl) valEl.textContent = `${this.state.k.toFixed(1)} N/m`;
        this.updatePhysicsParams();
      });
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.state.isRunning = !this.state.isRunning;
        btnPlay.innerHTML = this.state.isRunning 
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Reanudar`;
        btnPlay.classList.toggle('active', this.state.isRunning);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.state.t = 0;
        this.state.history = [];
        if (window.notebookAudio) window.notebookAudio.playClick();
      });
    }

    if (toggleVec) {
      toggleVec.addEventListener('click', () => {
        this.state.showVectors = !this.state.showVectors;
        toggleVec.classList.toggle('active', this.state.showVectors);
        if (window.notebookAudio) window.notebookAudio.playClick();
      });
    }

    this.updatePhysicsParams();
  }

  updatePhysicsParams() {
    // Parámetros derivados rigurosos de la física
    const omega = Math.sqrt(this.state.k / this.state.m);
    const f = omega / (2 * Math.PI);
    const T = 1 / f;

    const elOmega = document.getElementById('sim-metric-omega');
    const elT = document.getElementById('sim-metric-T');
    const elF = document.getElementById('sim-metric-f');

    if (elOmega) elOmega.textContent = `${omega.toFixed(2)} rad/s`;
    if (elT) elT.textContent = `${T.toFixed(2)} s`;
    if (elF) elF.textContent = `${f.toFixed(2)} Hz`;
  }

  loop(timestamp) {
    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    if (this.state.isRunning) {
      // Limitar dt para evitar saltos bruscos si la pestaña pierde foco
      const step = Math.min(dt, 0.05) * this.state.timeScale;
      this.state.t += step;
    }

    this.render();
    requestAnimationFrame(this.loop);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Limpieza de lienzo con textura oscura
    ctx.fillStyle = '#090c14';
    ctx.fillRect(0, 0, w, h);

    // Ecuaciones cinemáticas del MAS
    const omega = Math.sqrt(this.state.k / this.state.m);
    const A = this.state.A;
    const t = this.state.t;
    const phi = this.state.phi;

    const x = A * Math.cos(omega * t + phi);
    const v = -A * omega * Math.sin(omega * t + phi);
    const a = -A * omega * omega * Math.cos(omega * t + phi);
    const F = -this.state.k * x;

    // Energías
    const Ec = 0.5 * this.state.m * v * v;
    const Ep = 0.5 * this.state.k * x * x;
    const Em = Ec + Ep;

    // Actualizar métricas en tiempo real en la interfaz si existen
    const liveX = document.getElementById('sim-live-x');
    const liveV = document.getElementById('sim-live-v');
    const liveA = document.getElementById('sim-live-a');
    const liveEc = document.getElementById('sim-live-ec');
    const liveEp = document.getElementById('sim-live-ep');
    const liveEm = document.getElementById('sim-live-em');

    if (liveX) liveX.textContent = `${x.toFixed(2)} m`;
    if (liveV) liveV.textContent = `${v.toFixed(2)} m/s`;
    if (liveA) liveA.textContent = `${a.toFixed(2)} m/s²`;
    if (liveEc) liveEc.textContent = `${Ec.toFixed(2)} J`;
    if (liveEp) liveEp.textContent = `${Ep.toFixed(2)} J`;
    if (liveEm) liveEm.textContent = `${Em.toFixed(2)} J`;

    // -------------------------------------------------------------
    // SECCIÓN 1: SISTEMA FÍSICO MASA-RESORTE (Lado Izquierdo / Superior)
    // -------------------------------------------------------------
    const splitX = Math.min(w * 0.48, 380); // Separador entre masa-resorte y osciloscopio
    const wallX = 35;
    const equilibriumX = wallX + 160; // Posición de equilibrio x = 0
    const pixelsPerMeter = 60;
    const massCenterX = equilibriumX + x * pixelsPerMeter;
    const massCenterY = 110;
    const massSize = 52;

    // Pared de anclaje sólida
    ctx.fillStyle = '#1e2433';
    ctx.fillRect(wallX - 16, massCenterY - 60, 16, 120);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(wallX - 16, massCenterY - 60, 16, 120);

    // Rayas diagonales de anclaje (hatch pattern)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let py = massCenterY - 50; py < massCenterY + 60; py += 12) {
      ctx.moveTo(wallX - 16, py);
      ctx.lineTo(wallX, py - 10);
    }
    ctx.stroke();

    // Línea de equilibrio punteada x = 0
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.beginPath();
    ctx.moveTo(equilibriumX, massCenterY - 70);
    ctx.lineTo(equilibriumX, massCenterY + 70);
    ctx.stroke();
    ctx.fillStyle = '#f3c68f';
    ctx.font = '10px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('x = 0 (Equilibrio)', equilibriumX, massCenterY + 84);
    ctx.restore();

    // Superficie deslizante horizontal pulida
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallX, massCenterY + massSize / 2);
    ctx.lineTo(splitX - 10, massCenterY + massSize / 2);
    ctx.stroke();

    // DIBUJO REALISTA DEL RESORTE (BOBINAS HELICOIDALES REALISTAS)
    const springStartX = wallX;
    const springEndX = massCenterX - massSize / 2;
    const coils = 14;
    const coilWidth = (springEndX - springStartX) / coils;
    const coilAmplitude = 16;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Gradiente metálico dorado para el resorte
    const gradSpring = ctx.createLinearGradient(springStartX, 0, springEndX, 0);
    gradSpring.addColorStop(0, '#d4af37');
    gradSpring.addColorStop(0.5, '#f5d77f');
    gradSpring.addColorStop(1, '#d4af37');
    ctx.strokeStyle = gradSpring;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(springStartX, massCenterY);
    for (let c = 0; c < coils; c++) {
      const cx1 = springStartX + (c + 0.25) * coilWidth;
      const cy1 = massCenterY - coilAmplitude;
      const cx2 = springStartX + (c + 0.75) * coilWidth;
      const cy2 = massCenterY + coilAmplitude;
      const cx3 = springStartX + (c + 1.0) * coilWidth;
      const cy3 = massCenterY;
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, cx3, cy3);
    }
    ctx.stroke();
    ctx.restore();

    // BLOQUE DE MASA OSCILANTE (DISEÑO METÁLICO CIENTÍFICO CON SOMBRAS SUAVES)
    const massLeft = massCenterX - massSize / 2;
    const massTop = massCenterY - massSize / 2;

    ctx.save();
    // Sombra del bloque
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;

    // Relleno metálico en degradé
    const blockGrad = ctx.createLinearGradient(massLeft, massTop, massLeft + massSize, massTop + massSize);
    blockGrad.addColorStop(0, '#2d3748');
    blockGrad.addColorStop(0.5, '#1a202c');
    blockGrad.addColorStop(1, '#171923');
    ctx.fillStyle = blockGrad;
    ctx.beginPath();
    ctx.roundRect(massLeft, massTop, massSize, massSize, 8);
    ctx.fill();

    // Borde iluminado
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Texto de la masa en el centro
    ctx.fillStyle = '#f5d77f';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.state.m.toFixed(1)} kg`, massCenterX, massCenterY);
    ctx.restore();

    // VECTORES FÍSICOS DINÁMICOS SOBRE LA MASA
    if (this.state.showVectors) {
      const vectorY = massCenterY - massSize / 2 - 14;

      // 1. Vector Velocidad v (Verde esmeralda)
      if (Math.abs(v) > 0.05) {
        this.drawVector(ctx, massCenterX, vectorY, v * 18, '#10b981', 'v');
      }

      // 2. Vector Aceleración a (Rojo intenso)
      if (Math.abs(a) > 0.1) {
        this.drawVector(ctx, massCenterX, vectorY - 16, a * 3.5, '#ef4444', 'a');
      }

      // 3. Vector Fuerza Restauradora F (Naranja)
      if (Math.abs(F) > 0.1) {
        this.drawVector(ctx, massCenterX, vectorY - 32, F * 1.5, '#f97316', 'F_rest');
      }
    }

    // -------------------------------------------------------------
    // SECCIÓN 2: TRAZADOR SINUSOIDAL SINCRONIZADO EN TIEMPO REAL
    // -------------------------------------------------------------
    const traceLeft = splitX + 25;
    const traceWidth = w - traceLeft - 20;
    const traceCenterY = massCenterY;
    const traceHeight = 160;

    // Fondo del trazador
    ctx.fillStyle = 'rgba(12, 16, 26, 0.6)';
    ctx.fillRect(traceLeft, traceCenterY - traceHeight / 2, traceWidth, traceHeight);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.strokeRect(traceLeft, traceCenterY - traceHeight / 2, traceWidth, traceHeight);

    // Eje central de tiempo
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(traceLeft, traceCenterY);
    ctx.lineTo(traceLeft + traceWidth, traceCenterY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Actualizar historial del trazador
    if (this.state.isRunning) {
      this.state.history.unshift(x);
      if (this.state.history.length > 300) {
        this.state.history.pop();
      }
    }

    // Dibujar onda histórica
    if (this.state.history.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const dx = traceWidth / 280;
      for (let i = 0; i < this.state.history.length; i++) {
        const px = traceLeft + i * dx;
        const py = traceCenterY - this.state.history[i] * 38;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Punto seguidor instantáneo en el origen del osciloscopio
      const currentY = traceCenterY - x * 38;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(traceLeft, currentY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Línea conectora horizontal entre la masa y el trazador
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(massCenterX, massCenterY);
      ctx.lineTo(traceLeft, currentY);
      ctx.stroke();
      ctx.restore();
    }

    // Título del osciloscopio
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Inter", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Registro Oscilográfico x(t)', traceLeft + traceWidth - 10, traceCenterY - traceHeight / 2 + 18);

    // -------------------------------------------------------------
    // SECCIÓN 2.5: CÍRCULO DE REFERENCIA (MCU -> MAS)
    // Demostración dinámica: El MAS es la proyección 1D del MCU
    // -------------------------------------------------------------
    const mcuCenterY = 245;
    const mcuRadius = Math.min(A * pixelsPerMeter, 100);

    ctx.save();
    // Ejes de referencia del círculo
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.beginPath();
    ctx.moveTo(equilibriumX - mcuRadius - 15, mcuCenterY);
    ctx.lineTo(equilibriumX + mcuRadius + 15, mcuCenterY);
    ctx.moveTo(equilibriumX, mcuCenterY - mcuRadius - 12);
    ctx.lineTo(equilibriumX, mcuCenterY + mcuRadius + 12);
    ctx.stroke();

    // Órbita circular del MCU
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(equilibriumX, mcuCenterY, mcuRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Partícula rotante en MCU a ángulo theta = omega * t + phi
    const theta = omega * t + phi;
    const particleX = equilibriumX + mcuRadius * Math.cos(theta);
    const particleY = mcuCenterY - mcuRadius * Math.sin(theta);

    // Vector Radio Vectorial R (Amplitud A)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(equilibriumX, mcuCenterY);
    ctx.lineTo(particleX, particleY);
    ctx.stroke();

    // Partícula orbital brillante
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(particleX, particleY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Línea de proyección vertical (Láser punteado) conectando MCU y la Masa oscilante
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(particleX, particleY);
    ctx.lineTo(massCenterX, massCenterY + massSize / 2);
    ctx.stroke();

    // Etiqueta del círculo MCU
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'left';
    ctx.fillText('Círculo de Referencia (MCU: θ = ωt + φ)', equilibriumX - mcuRadius, mcuCenterY + mcuRadius + 16);
    ctx.restore();

    // -------------------------------------------------------------
    // SECCIÓN 3: BALANZA DE ENERGÍA MECÁNICA EN TIEMPO REAL (Inferior)
    // -------------------------------------------------------------
    const energyBarTop = 340;
    const energyBarWidth = Math.min(w - 60, 420);
    const energyStartX = (w - energyBarWidth) / 2;
    const maxEm = Math.max(0.5 * this.state.k * A * A, 0.001);

    // Contenedor de la barra
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(energyStartX, energyBarTop, energyBarWidth, 18, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.stroke();

    // Segmento de Energía Cinética Ec (Verde)
    const ecWidth = (Ec / maxEm) * energyBarWidth;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(energyStartX, energyBarTop, ecWidth, 18, 9);
    ctx.fill();

    // Segmento de Energía Potencial Ep (Púrpura)
    const epWidth = (Ep / maxEm) * energyBarWidth;
    ctx.fillStyle = '#8a2be2';
    ctx.beginPath();
    ctx.roundRect(energyStartX + ecWidth, energyBarTop, Math.min(epWidth, energyBarWidth - ecWidth), 18, 9);
    ctx.fill();

    // Leyendas de Energía
    ctx.font = '10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`■ Ec = ${Ec.toFixed(2)} J`, energyStartX + 60, energyBarTop + 32);

    ctx.fillStyle = '#c084fc';
    ctx.fillText(`■ Ep = ${Ep.toFixed(2)} J`, energyStartX + energyBarWidth / 2, energyBarTop + 32);

    ctx.fillStyle = '#f3c68f';
    ctx.fillText(`■ Em = ${Em.toFixed(2)} J (Cte)`, energyStartX + energyBarWidth - 60, energyBarTop + 32);
  }

  // Utilidad para dibujar flechas vectoriales
  drawVector(ctx, fromX, fromY, length, color, label) {
    if (Math.abs(length) < 2) return;
    const toX = fromX + length;
    const toY = fromY;
    const arrowHead = length > 0 ? 6 : -6;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Cabeza de la flecha
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - arrowHead, toY - 4);
    ctx.lineTo(toX - arrowHead, toY + 4);
    ctx.closePath();
    ctx.fill();

    // Etiqueta vectorial
    ctx.font = 'bold 10px "Fira Code", monospace';
    ctx.fillText(label, toX + (length > 0 ? 5 : -14), toY + 3);
    ctx.restore();
  }
}

window.HarmonicOscillatorSim = HarmonicOscillatorSim;
