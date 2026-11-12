/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Módulo Pedagógico: Calculadora en 6 Pasos (Azul/Rojo/Naranja) y Quiz de Autoevaluación
 */

// --------------------------------------------------------------------------
// 1. CALCULADORA PEDAGÓGICA INTERACTIVA DE 6 PASOS
// --------------------------------------------------------------------------
function initPedagogicalCalculator() {
  // Calculadora rápida en vivo
  const calcMass = document.getElementById('calc-mass');
  const calcK = document.getElementById('calc-k');
  const calcAmp = document.getElementById('calc-amp');
  const calcOut = document.getElementById('calc-live-output');

  function updateLiveCalc() {
    if (!calcMass || !calcK || !calcAmp || !calcOut) return;
    const m = parseFloat(calcMass.value) || 0.4;
    const k = parseFloat(calcK.value) || 64.0;
    const A = parseFloat(calcAmp.value) || 0.12;

    const omega = Math.sqrt(k / m);
    const T = (2 * Math.PI) / omega;
    const f = 1 / T;
    const vMax = A * omega;
    const aMax = A * omega * omega;
    const Em = 0.5 * k * A * A;

    calcOut.innerHTML = `✓ <strong>ω = ${omega.toFixed(2)} rad/s</strong> | <strong>T = ${T.toFixed(2)} s</strong> | <strong>f = ${f.toFixed(2)} Hz</strong> | <strong>v_máx = ${vMax.toFixed(2)} m/s</strong> | <strong>a_máx = ${aMax.toFixed(2)} m/s²</strong> | <strong>Em = ${Em.toFixed(3)} J</strong>`;
  }

  if (calcMass) calcMass.addEventListener('input', updateLiveCalc);
  if (calcK) calcK.addEventListener('input', updateLiveCalc);
  if (calcAmp) calcAmp.addEventListener('input', updateLiveCalc);
  updateLiveCalc();

  const mInput = document.getElementById('calc-input-m');
  const kInput = document.getElementById('calc-input-k');
  const AInput = document.getElementById('calc-input-A');
  const btnSolve = document.getElementById('calc-btn-solve');
  const resultsContainer = document.getElementById('calc-results-steps');

  if (!mInput || !kInput || !AInput || !btnSolve || !resultsContainer) return;

  function solveProblem() {
    const m = parseFloat(mInput.value) || 0.5;
    const k = parseFloat(kInput.value) || 50.0;
    const A = parseFloat(AInput.value) || 0.15;

    // Cálculos físicos exactos
    const omega = Math.sqrt(k / m);
    const f = omega / (2 * Math.PI);
    const T = 1 / f;
    const vMax = A * omega;
    const aMax = A * omega * omega;
    const Em = 0.5 * k * A * A;

    resultsContainer.innerHTML = `
      <!-- IDENTIFICACIÓN DEL PROBLEMA -->
      <div class="pedagogy-identification">
        <div class="data-card-blue">
          <span class="card-badge">🔵 Paso 1 — Datos Conocidos</span>
          <div class="value-item">Masa del bloque: <strong>m = ${m.toFixed(2)} kg</strong></div>
          <div class="value-item">Constante del resorte: <strong>k = ${k.toFixed(1)} N/m</strong></div>
          <div class="value-item">Amplitud de oscilación: <strong>A = ${A.toFixed(3)} m (${(A * 100).toFixed(1)} cm)</strong></div>
          <div class="value-item">Fase inicial supuesta: <strong>φ = 0 rad (suelta desde reposo en +A)</strong></div>
        </div>

        <div class="unknown-card-red">
          <span class="card-badge">🔴 Paso 2 — Incógnitas a Determinar</span>
          <div class="value-item">Frecuencia angular: <strong>ω = ? (rad/s)</strong></div>
          <div class="value-item">Período de oscilación: <strong>T = ? (s)</strong></div>
          <div class="value-item">Frecuencia cíclica: <strong>f = ? (Hz)</strong></div>
          <div class="value-item">Rapidez máxima: <strong>v_max = ? (m/s)</strong></div>
          <div class="value-item">Aceleración máxima: <strong>a_max = ? (m/s²)</strong></div>
          <div class="value-item">Energía mecánica total: <strong>E_m = ? (J)</strong></div>
        </div>
      </div>

      <!-- DESARROLLO DE PASOS 3 AL 6 -->
      <div class="pedagogy-steps-container">
        
        <!-- PASO 3: FÓRMULAS -->
        <div class="pedagogy-step-item">
          <div class="step-label">
            <span class="step-num-pill">3</span>
            <span>Paso 3 — Fórmulas Fundamentales KaTeX</span>
          </div>
          <div class="step-content">
            <p>Para un oscilador armónico simple horizontal sin rozamiento, las ecuaciones rectoras son:</p>
            <div class="formula-callout">
              <div class="math-render display-mode" data-tex="\\omega = \\sqrt{\\frac{k}{m}}, \\quad T = \\frac{2\\pi}{\\omega}, \\quad f = \\frac{1}{T}"></div>
              <div class="formula-legend">Relaciones dinámicas fundamentales del MAS.</div>
            </div>
            <div class="formula-callout">
              <div class="math-render display-mode" data-tex="v_{\\max} = A\\omega, \\quad a_{\\max} = A\\omega^2, \\quad E_m = \\frac{1}{2}kA^2"></div>
              <div class="formula-legend">Extremos cinemáticos y energía mecánica total conservativa.</div>
            </div>
          </div>
        </div>

        <!-- PASO 4: SUSTITUCIÓN Y DESARROLLO (INCÓGNITAS CAMBIAN A NARANJA) -->
        <div class="pedagogy-step-item">
          <div class="step-label">
            <span class="step-num-pill">4</span>
            <span>Paso 4 — Sustitución y Desarrollo Numérico Paso a Paso</span>
          </div>
          <div class="step-content">
            <p>1. <strong>Cálculo de la Frecuencia Angular (ω):</strong></p>
            <div class="formula-callout">
              <div class="math-render display-mode" data-tex="\\omega = \\sqrt{\\frac{${k.toFixed(1)} \\text{ N/m}}{${m.toFixed(2)} \\text{ kg}}} = \\sqrt{${(k / m).toFixed(2)}} \\approx ${omega.toFixed(3)} \\text{ rad/s}"></div>
            </div>

            <p>2. <strong>Cálculo del Período de Oscilación (T):</strong></p>
            <div class="formula-callout">
              <div class="math-render display-mode" data-tex="T = \\frac{2\\pi}{${omega.toFixed(3)} \\text{ rad/s}} = \\frac{6.2832}{${omega.toFixed(3)}} \\approx ${T.toFixed(3)} \\text{ s}"></div>
            </div>

            <p>3. <strong>Cálculo de la Frecuencia (f):</strong></p>
            <div class="formula-callout">
              <div class="math-render display-mode" data-tex="f = \\frac{1}{${T.toFixed(3)} \\text{ s}} \\approx ${f.toFixed(3)} \\text{ Hz}"></div>
            </div>

            <p>4. <strong>Cinemática Extrema (v_max y a_max):</strong></p>
            <div class="formula-callout">
              <div class="math-render display-mode" data-tex="v_{\\max} = (${A.toFixed(3)} \\text{ m}) \\cdot (${omega.toFixed(3)} \\text{ rad/s}) = ${vMax.toFixed(3)} \\text{ m/s}"></div>
            </div>
            <div class="formula-callout">
              <div class="math-render display-mode" data-tex="a_{\\max} = (${A.toFixed(3)} \\text{ m}) \\cdot (${omega.toFixed(3)} \\text{ rad/s})^2 = ${aMax.toFixed(3)} \\text{ m/s}^2"></div>
            </div>

            <p>5. <strong>Energía Mecánica Total (E_m):</strong></p>
            <div class="formula-callout">
              <div class="math-render display-mode" data-tex="E_m = \\frac{1}{2} (${k.toFixed(1)} \\text{ N/m}) (${A.toFixed(3)} \\text{ m})^2 = ${Em.toFixed(4)} \\text{ J}"></div>
            </div>

            <!-- TARJETA NARANJA: INCÓGNITAS RESUELTAS CON ÉXITO -->
            <div class="solved-card-orange">
              <span class="card-badge">🟠 Incógnitas Resueltas y Determinadas</span>
              <div class="value-item">✓ Frecuencia angular: <strong>ω = ${omega.toFixed(3)} rad/s</strong></div>
              <div class="value-item">✓ Período: <strong>T = ${T.toFixed(3)} segundos</strong></div>
              <div class="value-item">✓ Frecuencia: <strong>f = ${f.toFixed(3)} Hertz (Hz)</strong></div>
              <div class="value-item">✓ Rapidez máxima (en x = 0): <strong>v_max = ${vMax.toFixed(3)} m/s</strong></div>
              <div class="value-item">✓ Aceleración máxima (en x = ±A): <strong>a_max = ${aMax.toFixed(3)} m/s²</strong></div>
              <div class="value-item">✓ Energía Mecánica Total: <strong>E_m = ${Em.toFixed(4)} Joules (J)</strong></div>
            </div>
          </div>
        </div>

        <!-- PASO 5: VALIDACIÓN -->
        <div class="pedagogy-step-item">
          <div class="step-label">
            <span class="step-num-pill">5</span>
            <span>Paso 5 — Validación Dimensional y Coherencia Física</span>
          </div>
          <div class="step-content">
            <ul style="padding-left:20px; line-height:1.7;">
              <li><strong>Análisis dimensional de ω:</strong> $[\\sqrt{N / (m \\cdot kg)}] = [\\sqrt{(kg \\cdot m / s^2) / (m \\cdot kg)}] = [\\sqrt{s^{-2}}] = s^{-1} = \\text{rad/s}$ (Correcto).</li>
              <li><strong>Comprobación del Período:</strong> $T \\cdot f = ${T.toFixed(3)} \\times ${f.toFixed(3)} = ${(T * f).toFixed(3)} \\approx 1.00$ (Coherencia exacta).</li>
              <li><strong>Límites físicos:</strong> Como no existe amortiguamiento, la energía mecánica se conserva de manera estricta durante todas las oscilaciones.</li>
            </ul>
          </div>
        </div>

        <!-- PASO 6: CONCLUSIÓN -->
        <div class="pedagogy-step-item">
          <div class="step-label">
            <span class="step-num-pill">6</span>
            <span>Paso 6 — Conclusión e Interpretación Física</span>
          </div>
          <div class="step-content">
            <p>El sistema oscilador masa-resorte ejecuta un Movimiento Armónico Simple con una rapidez angular de <strong>${omega.toFixed(2)} rad/s</strong>, completando cada oscilación completa en exactamente <strong>${T.toFixed(2)} s</strong> (${f.toFixed(2)} ciclos por cada segundo).</p>
            <p style="margin-top:8px;">Cuando la masa pasa por el punto de equilibrio central ($x = 0$), toda la energía potencial se ha transferido a energía cinética ($v = v_{\\max} = ${vMax.toFixed(2)} \\text{ m/s}$ y $a = 0$). En contraste, en los extremos de máximo estiramiento o compresión ($x = \\pm ${A.toFixed(2)} \\text{ m}$), la velocidad se anula instantáneamente y la fuerza restauradora genera la máxima aceleración ($a = ${aMax.toFixed(2)} \\text{ m/s}^2$).</p>
          </div>
        </div>

      </div>
    `;

    if (window.renderAllMath) window.renderAllMath();
    if (window.notebookAudio) window.notebookAudio.playSuccess();
  }

  btnSolve.addEventListener('click', solveProblem);
  solveProblem(); // Resolver con los valores por defecto iniciales
}

// --------------------------------------------------------------------------
// 2. QUIZ INTERACTIVO DE AUTOEVALUACIÓN
// --------------------------------------------------------------------------
const quizQuestions = [
  {
    q: '1. En un Movimiento Armónico Simple (MAS), ¿en qué posición es máxima la magnitud de la aceleración?',
    options: [
      { text: 'En la posición de equilibrio (x = 0)', correct: false },
      { text: 'En los puntos de máxima elongación (x = +A y x = -A)', correct: true },
      { text: 'A la mitad de la amplitud (x = A / 2)', correct: false },
      { text: 'La aceleración es constante en cualquier punto del recorrido', correct: false }
    ],
    feedback: 'Correcto. La aceleración es proporcional y opuesta a la elongación: a(t) = -ω²·x(t). Por tanto, la aceleración alcanza su magnitud máxima exactamente en los extremos donde |x| = A.'
  },
  {
    q: '2. ¿Cuál es el significado físico de una frecuencia de oscilación de 5 Hz (hertz)?',
    options: [
      { text: 'El cuerpo tarda 5 segundos en completar un ciclo', correct: false },
      { text: 'El oscilador recorre 5 metros en cada segundo', correct: false },
      { text: 'El oscilador ejecuta 5 ciclos completos cada segundo', correct: true },
      { text: 'La amplitud de la vibración se multiplica por 5', correct: false }
    ],
    feedback: 'Excelente. El Hertz (Hz = s⁻¹) mide el número de ciclos u oscilaciones completas por segundo. 5 Hz significa que se completan 5 ciclos enteros en un segundo (T = 0.2 s).'
  },
  {
    q: '3. Si cuadruplicamos la masa (m) de un oscilador masa-resorte ideal, ¿qué ocurre con su período T?',
    options: [
      { text: 'El período se reduce a la mitad (T / 2)', correct: false },
      { text: 'El período se duplica (2T)', correct: true },
      { text: 'El período se cuadruplica (4T)', correct: false },
      { text: 'El período no cambia porque no depende de la masa', correct: false }
    ],
    feedback: '¡Exacto! La fórmula del período es T = 2π√(m / k). Al multiplicar la masa por 4, √(4m) = 2√(m), por lo que el nuevo período es exactamente el doble.'
  },
  {
    q: '4. ¿Cuál es la diferencia de fase entre la función de posición x(t) y la función de velocidad v(t) en el MAS?',
    options: [
      { text: 'Están en fase (0 radianes)', correct: false },
      { text: 'Desfase de π/4 radianes (45°)', correct: false },
      { text: 'Desfase de π/2 radianes (90°)', correct: true },
      { text: 'Desfase de π radianes (180°)', correct: false }
    ],
    feedback: 'Correcto. Como v(t) = dx/dt = -Aω·sin(ωt) = Aω·cos(ωt + π/2), la velocidad está adelantada π/2 rad (un cuarto de período) respecto a la posición.'
  },
  {
    q: '5. En un oscilador armónico simple no amortiguado, ¿cuál de las siguientes cantidades se conserva constante en todo momento?',
    options: [
      { text: 'La energía cinética', correct: false },
      { text: 'La energía potencial', correct: false },
      { text: 'La energía mecánica total (Ec + Ep)', correct: true },
      { text: 'La fuerza restauradora', correct: false }
    ],
    feedback: '¡Impecable! La fuerza restauradora es conservativa. La energía fluctúa continuamente entre forma cinética y potencial, pero su suma total Em = 1/2·k·A² es invariante en el tiempo.'
  }
];

function initQuiz(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="quiz-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <h3 style="font-family:'Outfit',sans-serif; color:var(--gold-light); font-size:1.25rem;">
          Autoevaluación Formativa: Dominio Conceptual del MAS
        </h3>
        <span id="quiz-score-badge" style="font-family:'Fira Code',monospace; font-size:0.85rem; background:rgba(212,175,55,0.15); color:var(--gold-light); padding:4px 12px; border-radius:12px; border:1px solid var(--border-gold);">
          Puntaje: 0 / ${quizQuestions.length}
        </span>
      </div>

      ${quizQuestions.map((item, qIdx) => `
        <div class="quiz-question-box" data-qindex="${qIdx}">
          <p class="quiz-question-title">${item.q}</p>
          <div class="quiz-options-list">
            ${item.options.map((opt, optIdx) => `
              <button class="quiz-option-btn" data-qindex="${qIdx}" data-optindex="${optIdx}">
                <span style="font-weight:700; color:var(--gold-light);">${String.fromCharCode(65 + optIdx)})</span>
                <span>${opt.text}</span>
              </button>
            `).join('')}
          </div>
          <div class="quiz-feedback-box" id="quiz-feedback-${qIdx}"></div>
        </div>
      `).join('')}
    </div>
  `;

  let score = 0;
  const answered = new Set();

  container.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qIdx = parseInt(btn.getAttribute('data-qindex'));
      const optIdx = parseInt(btn.getAttribute('data-optindex'));

      if (answered.has(qIdx)) return;
      answered.add(qIdx);

      const qData = quizQuestions[qIdx];
      const isCorrect = qData.options[optIdx].correct;
      const feedbackBox = document.getElementById(`quiz-feedback-${qIdx}`);

      // Marcar botones
      const siblings = container.querySelectorAll(`.quiz-option-btn[data-qindex="${qIdx}"]`);
      siblings.forEach((b, idx) => {
        if (qData.options[idx].correct) {
          b.classList.add('selected-correct');
        } else if (idx === optIdx && !isCorrect) {
          b.classList.add('selected-incorrect');
        }
      });

      if (isCorrect) {
        score++;
        feedbackBox.className = 'quiz-feedback-box show correct';
        feedbackBox.innerHTML = `<strong>✓ Correcto:</strong> ${qData.feedback}`;
        if (window.notebookAudio) window.notebookAudio.playSuccess();
      } else {
        feedbackBox.className = 'quiz-feedback-box show incorrect';
        feedbackBox.innerHTML = `<strong>✗ Incorrecto:</strong> ${qData.feedback}`;
        if (window.notebookAudio) window.notebookAudio.playClick();
      }

      const badge = document.getElementById('quiz-score-badge');
      if (badge) {
        badge.textContent = `Puntaje: ${score} / ${quizQuestions.length}`;
        if (score === quizQuestions.length) {
          badge.style.background = 'rgba(16, 185, 129, 0.2)';
          badge.style.color = '#10b981';
          badge.textContent = `¡Sobresaliente! ${score} / ${quizQuestions.length} ★`;
        }
      }
    });
  });
}

window.initPedagogicalCalculator = initPedagogicalCalculator;
window.initQuiz = initQuiz;
