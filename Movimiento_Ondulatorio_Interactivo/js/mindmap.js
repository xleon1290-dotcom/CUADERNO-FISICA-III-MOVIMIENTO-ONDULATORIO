/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Mapa Mental Interactivo de Movimiento Oscilatorio y MAS
 */

const mindmapData = {
  nodes: [
    {
      id: 'oscilatorio',
      title: 'Movimiento Oscilatorio',
      category: 'core',
      x: 450, y: 70,
      desc: 'Movimiento de vaivén en torno a una posición de equilibrio estable, producido por una fuerza restauradora.',
      formula: 'F_{rest} = -\\nabla U(x)',
      vars: 'U(x): Energía Potencial con mínimo local.'
    },
    {
      id: 'periodico',
      title: 'Movimiento Periódico',
      category: 'core',
      x: 180, y: 160,
      desc: 'Aquel que se repite exactamente a intervalos regulares de tiempo.',
      formula: 'x(t + T) = x(t)',
      vars: 'T: Período fundamental de repetición.'
    },
    {
      id: 'periodo',
      title: 'Período (T)',
      category: 'param',
      x: 80, y: 280,
      desc: 'Tiempo mínimo empleado en completar un ciclo completo de oscilación.',
      formula: 'T = \\frac{1}{f} = \\frac{2\\pi}{\\omega}',
      vars: 'Unidad SI: segundos (s).'
    },
    {
      id: 'frecuencia',
      title: 'Frecuencia (f)',
      category: 'param',
      x: 230, y: 380,
      desc: 'Número de ciclos u oscilaciones completadas por unidad de tiempo.',
      formula: 'f = \\frac{1}{T} = \\frac{\\omega}{2\\pi}',
      vars: 'Unidad SI: Hertz (Hz) = 1 s⁻¹.'
    },
    {
      id: 'amplitud',
      title: 'Amplitud (A)',
      category: 'param',
      x: 720, y: 160,
      desc: 'Magnitud del desplazamiento máximo desde la posición de equilibrio.',
      formula: 'A = \\max(|x(t)|)',
      vars: 'Unidad SI: metros (m). Siempre positiva.'
    },
    {
      id: 'elongacion',
      title: 'Elongación (x)',
      category: 'param',
      x: 810, y: 280,
      desc: 'Posición instantánea de la partícula respecto al punto de equilibrio en cualquier instante t.',
      formula: '-A \\le x(t) \\le +A',
      vars: 'Unidad SI: metros (m). Puede ser positiva o negativa.'
    },
    {
      id: 'mas',
      title: 'Movimiento Armónico Simple (MAS)',
      category: 'core',
      x: 450, y: 250,
      desc: 'Movimiento periódico ideal originado por una fuerza restauradora proporcional y opuesta a la elongación.',
      formula: 'F = -k x \\implies \\frac{d^2x}{dt^2} + \\omega^2 x = 0',
      vars: 'k: constante recuperadora, m: masa del oscilador.'
    },
    {
      id: 'cinematica',
      title: 'Cinemática del MAS',
      category: 'kinematics',
      x: 450, y: 410,
      desc: 'Ecuaciones analíticas de posición x(t), velocidad v(t) y aceleración a(t).',
      formula: 'x(t) = A\\cos(\\omega t + \\phi)',
      vars: 'v(t) = -A\\omega\\sin(\\omega t + \\phi), \\quad a(t) = -\\omega^2 x(t)'
    }
  ],
  links: [
    { from: 'oscilatorio', to: 'periodico' },
    { from: 'oscilatorio', to: 'amplitud' },
    { from: 'oscilatorio', to: 'mas' },
    { from: 'periodico', to: 'periodo' },
    { from: 'periodico', to: 'frecuencia' },
    { from: 'periodo', to: 'frecuencia' },
    { from: 'amplitud', to: 'elongacion' },
    { from: 'mas', to: 'cinematica' },
    { from: 'mas', to: 'elongacion' },
    { from: 'mas', to: 'periodo' }
  ]
};

function initMindmap(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const svg = container.querySelector('.mindmap-svg-viewport');
  const detailsBox = container.querySelector('.mindmap-details-card');
  if (!svg || !detailsBox) return;

  let svgContent = '';

  // Dibujar líneas conectoras con gradiente
  mindmapData.links.forEach(link => {
    const fromNode = mindmapData.nodes.find(n => n.id === link.from);
    const toNode = mindmapData.nodes.find(n => n.id === link.to);
    if (fromNode && toNode) {
      svgContent += `
        <line x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" 
              stroke="rgba(212, 175, 55, 0.35)" stroke-width="2" stroke-dasharray="3,3" />
      `;
    }
  });

  // Dibujar nodos interactivos
  mindmapData.nodes.forEach(node => {
    const isCore = node.category === 'core';
    const fill = isCore ? 'url(#nodeGradCore)' : 'url(#nodeGradParam)';
    const stroke = isCore ? '#d4af37' : '#8a2be2';
    const radius = isCore ? 42 : 36;

    svgContent += `
      <g class="mindmap-node" data-id="${node.id}" transform="translate(${node.x}, ${node.y})">
        <circle r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" />
        <text text-anchor="middle" y="4" fill="#ffffff" font-family="'Outfit', sans-serif" font-size="11" font-weight="600">
          ${node.title.split(' ')[0]}
        </text>
        <text text-anchor="middle" y="18" fill="#f5d77f" font-family="'Outfit', sans-serif" font-size="9">
          ${node.title.split(' ').slice(1).join(' ')}
        </text>
      </g>
    `;
  });

  // Agregar defs de gradientes al SVG
  const defs = `
    <defs>
      <radialGradient id="nodeGradCore" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#2a203a" />
        <stop offset="100%" stop-color="#12101f" />
      </radialGradient>
      <radialGradient id="nodeGradParam" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1b283d" />
        <stop offset="100%" stop-color="#0a121e" />
      </radialGradient>
    </defs>
  `;

  svg.innerHTML = defs + svgContent;

  // Interacción de selección de nodo
  svg.querySelectorAll('.mindmap-node').forEach(nodeEl => {
    nodeEl.addEventListener('click', () => {
      svg.querySelectorAll('.mindmap-node').forEach(n => n.classList.remove('active-node'));
      nodeEl.classList.add('active-node');

      const nodeId = nodeEl.getAttribute('data-id');
      const node = mindmapData.nodes.find(n => n.id === nodeId);
      if (node) {
        showNodeDetails(node, detailsBox);
        if (window.notebookAudio) window.notebookAudio.playClick();
      }
    });
  });

  // Mostrar el primer nodo por defecto
  showNodeDetails(mindmapData.nodes[0], detailsBox);
}

function showNodeDetails(node, detailsBox) {
  detailsBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <h3 style="font-family:'Outfit',sans-serif; color:var(--gold-light); font-size:1.18rem;">${node.title}</h3>
      <span style="font-size:0.75rem; color:var(--cyan-accent); font-family:'Fira Code',monospace; background:rgba(0,240,255,0.1); padding:2px 8px; border-radius:4px;">Concepto Clave</span>
    </div>
    <p style="font-size:0.92rem; color:var(--text-primary); margin-bottom:12px; line-height:1.55;">${node.desc}</p>
    <div class="formula-callout" style="margin:10px 0; padding:10px;">
      <div class="math-render display-mode" data-tex="${node.formula}">${node.formula}</div>
      <div class="formula-legend">${node.vars}</div>
    </div>
  `;

  if (window.renderAllMath) {
    window.renderAllMath();
  }
}

window.initMindmap = initMindmap;
