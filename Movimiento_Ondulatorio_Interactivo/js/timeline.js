/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Línea de Tiempo y Reseña Histórica del Movimiento Oscilatorio y MAS
 */

const timelineMilestones = [
  {
    year: '1602',
    name: 'Galileo Galilei',
    epoch: 'Renacimiento Científico',
    title: 'Descubrimiento del Isocronismo del Péndulo',
    desc: 'Al observar el vaivén de las lámparas suspendidas en la Catedral de Pisa y cronometrar los pulsos con su propio ritmo cardíaco, Galileo dedujo que el período de oscilación de un péndulo de pequeña amplitud no depende de la masa ni de la amplitud de oscilación, sino exclusivamente de la longitud del hilo.',
    impact: 'Base experimental para el diseño de cronómetros científicos y la comprensión de la periodicidad armónica.'
  },
  {
    year: '1656',
    name: 'Christiaan Huygens',
    epoch: 'Revolución Científica',
    title: 'Invención del Reloj de Péndulo y Curvatura Cicloidal',
    desc: 'Huygens patentó el primer reloj de péndulo de precisión regulada, reduciendo los errores de medición del tiempo de 15 minutos diarios a menos de 10 segundos. En su obra "Horologium Oscillatorium" (1673) demostró geométricamente que la curva verdaderamente tautócrona e isócrona es la cicloide.',
    impact: 'Paso definitivo de la observación cualitativa al modelado matemático de oscilaciones.'
  },
  {
    year: '1678',
    name: 'Robert Hooke',
    epoch: 'Siglo XVII',
    title: 'Formulación de la Ley de Elasticidad',
    desc: 'Hooke formuló el célebre principio "Ut tensio, sic vis" (Como es la deformación, así es la fuerza), estableciendo formalmente la proporcionalidad directa entre el alargamiento de un cuerpo elástico y la fuerza recuperadora que genera (F = -k·x).',
    impact: 'Constituye la piedra angular de la dinámica de los sistemas masa-resorte y del concepto de fuerza restauradora lineal.'
  },
  {
    year: '1687',
    name: 'Isaac Newton',
    epoch: 'Física Clásica',
    title: 'Principia Mathematica y la Dinámica del MAS',
    desc: 'Al vincular su Segunda Ley del Movimiento (F = m·a) con fuerzas centrales y elásticas, Newton sentó las bases para plantear formalmente la ecuación del movimiento m·(d²x/dt²) = -k·x, abriendo la puerta a las ecuaciones diferenciales del movimiento periódico.',
    impact: 'Unificación de la cinemática cinemática y la dinámica de las oscilaciones bajo la gravitación y la mecánica universal.'
  },
  {
    year: '1739',
    name: 'Leonhard Euler',
    epoch: 'Siglo de las Luces',
    title: 'Solución Analítica del Oscilador Armónico Simple',
    desc: 'Euler resolvió sistemáticamente la ecuación diferencial del movimiento armónico simple libre y amortiguado mediante exponenciales complejas, estableciendo la célebre fórmula e^(iθ) = cos(θ) + i·sin(θ) y relacionando la frecuencia angular natural ω = √(k/m).',
    impact: 'Transformó el estudio de las oscilaciones en un cuerpo de cálculo infinitesimal y análisis armónico riguroso.'
  },
  {
    year: '1822',
    name: 'Jean-Baptiste Joseph Fourier',
    epoch: 'Siglo XIX',
    title: 'Análisis Armónico y Series de Fourier',
    desc: 'En su obra "Théorie analytique de la chaleur", Fourier demostró que cualquier oscilación periódica por compleja que sea puede expresarse como una superposición infinita de osciladores armónicos simples sinusoidales.',
    impact: 'Todo fenómeno oscilatorio complejo en acústica, electromagnetismo y mecánica cuántica se estudia a través del MAS.'
  }
];

function initTimeline(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="timeline-container">
      <div class="timeline-line"></div>
      ${timelineMilestones.map((m, index) => `
        <div class="timeline-item" data-index="${index}">
          <div class="timeline-dot" title="Ver hito histórico"></div>
          <div class="timeline-content-card">
            <span class="timeline-year-tag">${m.year} · ${m.epoch}</span>
            <h3 class="timeline-character-title">${m.name}: ${m.title}</h3>
            <p style="font-size:0.92rem; color:var(--text-primary); margin-bottom:10px; line-height:1.6;">
              ${m.desc}
            </p>
            <div style="font-size:0.82rem; color:var(--gold-light); border-top:1px dashed rgba(212,175,55,0.25); padding-top:8px;">
              <strong>Trascendencia Científica:</strong> ${m.impact}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.timeline-content-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (window.notebookAudio) window.notebookAudio.playClick();
    });
  });
}

window.initTimeline = initTimeline;
