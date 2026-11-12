/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Glosario Científico Interactivo con Búsqueda en Tiempo Real y Filtrado por Categorías
 */

const glossaryData = [
  {
    term: 'Movimiento Oscilatorio',
    category: 'Conceptos',
    def: 'Movimiento periódico en torno a una posición de equilibrio estable, en el cual una partícula o sistema físico se desplaza sucesivamente en uno y otro sentido impulsado por una fuerza restauradora.'
  },
  {
    term: 'Movimiento Periódico',
    category: 'Conceptos',
    def: 'Aquel movimiento que se repite exactamente de manera idéntica y regular a intervalos iguales de tiempo (período fundamental T), cumpliendo la condición x(t + T) = x(t).'
  },
  {
    term: 'Elongación (x)',
    category: 'Parámetros',
    def: 'Posición o coordenada instantánea de la partícula oscilante medida respecto a la posición de equilibrio central en cualquier instante de tiempo t. En el SI se expresa en metros (m).'
  },
  {
    term: 'Amplitud (A)',
    category: 'Parámetros',
    def: 'Máximo valor absoluto que puede alcanzar la elongación. Representa la distancia máxima desde la posición de equilibrio hasta el extremo de la trayectoria. Es una magnitud positiva expresada en metros (m).'
  },
  {
    term: 'Período (T)',
    category: 'Parámetros',
    def: 'Intervalo de tiempo que tarda el oscilador en completar un ciclo completo de oscilación (un vaivén de ida y vuelta). En el Sistema Internacional su unidad fundamental es el segundo (s).'
  },
  {
    term: 'Frecuencia (f)',
    category: 'Parámetros',
    def: 'Número de ciclos, vibraciones u oscilaciones completas realizadas por el sistema por unidad de tiempo. Se calcula como el inverso del período: f = 1/T. Su unidad en el SI es el Hertz (Hz).'
  },
  {
    term: 'Hertz (Hz)',
    category: 'Parámetros',
    def: 'Unidad de frecuencia del Sistema Internacional, nombrada en honor al físico Heinrich Rudolf Hertz. Equivale formalmente a un ciclo por segundo (1 Hz = 1 s⁻¹).'
  },
  {
    term: 'Frecuencia Angular (ω)',
    category: 'Cinemática',
    def: 'Medida del ritmo de cambio de la fase de la oscilación expresada en radianes por segundo (rad/s). Se relaciona con la frecuencia cíclica mediante la expresión ω = 2πf = 2π/T.'
  },
  {
    term: 'Movimiento Armónico Simple (MAS)',
    category: 'Dinámica',
    def: 'Movimiento oscilatorio unidimensional rectilíneo ideal, originado por una fuerza recuperadora neta directamente proporcional al desplazamiento y dirigida siempre hacia la posición de equilibrio.'
  },
  {
    term: 'Fuerza Restauradora (F_rest)',
    category: 'Dinámica',
    def: 'Fuerza interna de un sistema físico que tiende a restituir el equilibrio cuando el sistema es apartado de él. En el régimen elástico lineal obedece la Ley de Hooke: F = -k·x.'
  },
  {
    term: 'Constante Elástica (k)',
    category: 'Dinámica',
    def: 'Parámetro característico de la rigidez de un resorte o medio elástico. Expresa la fuerza requerida por unidad de deformación unitaria. Su unidad en el SI es Newtons por metro (N/m).'
  },
  {
    term: 'Constante de Fase (φ)',
    category: 'Cinemática',
    def: 'Ángulo inicial o fase en el instante t = 0 de la función de onda x(t) = A·cos(ωt + φ). Determina el estado inicial de posición y velocidad del oscilador al inicio del conteo temporal.'
  },
  {
    term: 'Energía Cinética (Ec)',
    category: 'Energía',
    def: 'Energía asociada a la velocidad del cuerpo oscilante: Ec = 1/2·m·v². Es máxima al cruzar el punto de equilibrio central (x = 0) y nula en los extremos de la oscilación (x = ±A).'
  },
  {
    term: 'Energía Potencial Elástica (Ep)',
    category: 'Energía',
    def: 'Energía almacenada en la deformación del medio elástico: Ep = 1/2·k·x². Es nula en el punto de equilibrio y alcanza su valor máximo en los extremos de retorno (x = ±A).'
  },
  {
    term: 'Energía Mecánica Total (Em)',
    category: 'Energía',
    def: 'Suma de la energía cinética y potencial del oscilador: Em = Ec + Ep = 1/2·k·A². En ausencia de disipación o fricción, se mantiene estrictamente constante durante todo el movimiento.'
  },
  {
    term: 'Isocronismo',
    category: 'Conceptos',
    def: 'Propiedad fundamental por la cual el período de un oscilador es independiente de la amplitud de las oscilaciones (para pequeñas amplitudes en péndulos y para cualquier amplitud en el MAS ideal).'
  },
  {
    term: 'Movimiento Ondulatorio',
    category: 'Conceptos',
    def: 'Propagación de una perturbación o estado vibratorio a través de un medio deformable o en el vacío, transfiriendo energía y momento sin transporte neto de materia.'
  },
  {
    term: 'Onda Mecánica',
    category: 'Conceptos',
    def: 'Onda que requiere estrictamente un medio material elástico deformable (gas, líquido o sólido) para propagarse mediante la interacción entre partículas adyacentes.'
  },
  {
    term: 'Onda Electromagnética',
    category: 'Conceptos',
    def: 'Perturbación electromagnética autopropagada consistente en campos eléctricos y magnéticos sinusoidales mutuamente perpendiculares, capaz de viajar en el vacío a la velocidad de la luz c.'
  },
  {
    term: 'Onda Transversal',
    category: 'Cinemática',
    def: 'Onda en la que la dirección de oscilación de las partículas del medio es perpendicular a la dirección de propagación de la perturbación.'
  },
  {
    term: 'Onda Longitudinal',
    category: 'Cinemática',
    def: 'Onda en la que la dirección de vibración de las partículas del medio es colineal o paralela a la dirección de propagación de la perturbación (como las ondas acústicas en fluidos).'
  },
  {
    term: 'Longitud de Onda (λ)',
    category: 'Parámetros',
    def: 'Distancia espacial mínima entre dos puntos idénticos sucesivos de una onda en el mismo estado de fase (por ejemplo, distancia entre dos crestas o dos valles contiguos). En el SI se mide en metros (m).'
  },
  {
    term: 'Número de Onda (k)',
    category: 'Parámetros',
    def: 'Magnitud espacial que expresa la cantidad de ciclos completos contenidos por unidad de longitud: k = 2π/λ. Su unidad en el SI es radianes por metro (rad/m).'
  },
  {
    term: 'Velocidad de Propagación (v)',
    category: 'Cinemática',
    def: 'Rapidez con la que se desplaza el frente de onda a través del medio: v = λ·f = λ/T = ω/k. En el SI se expresa en metros por segundo (m/s).'
  },
  {
    term: 'Principio de Superposición',
    category: 'Dinámica',
    def: 'Teorema físico que establece que cuando dos o más ondas coinciden en el espacio, la elongación resultante en cualquier punto y tiempo es la suma algebraica vectorial de las elongaciones individuales.'
  },
  {
    term: 'Interferencia Constructiva',
    category: 'Conceptos',
    def: 'Superposición de ondas armónicas coherentes en fase (desfase Δφ = 2nπ), produciendo una onda resultante con amplitud igual a la suma de las amplitudes componentes.'
  },
  {
    term: 'Interferencia Destructiva',
    category: 'Conceptos',
    def: 'Superposición de ondas en oposición de fase (desfase Δφ = (2n + 1)π), provocando una atenuación o anulación total de la amplitud resultante.'
  },
  {
    term: 'Fasor (Vector de Fase)',
    category: 'Cinemática',
    def: 'Vector rotatorio bidimensional de longitud igual a la amplitud A que gira en sentido antihorario con rapidez angular ω, cuya proyección sobre un eje coordenado representa la elongación instantánea del MAS.'
  }
];

function initGlossary(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const categories = ['Todos', 'Conceptos', 'Parámetros', 'Cinemática', 'Dinámica', 'Energía'];
  let currentCat = 'Todos';
  let searchTerm = '';

  container.innerHTML = `
    <div class="glossary-wrapper">
      <div class="glossary-filter-bar">
        <input type="text" class="glossary-search-input" id="glossary-search" placeholder="🔍 Buscar término o concepto físico..." />
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${categories.map(cat => `
            <button class="glossary-category-btn ${cat === 'Todos' ? 'active' : ''}" data-cat="${cat}">${cat}</button>
          `).join('')}
        </div>
      </div>
      <div class="glossary-grid" id="glossary-grid-list"></div>
    </div>
  `;

  const searchInput = container.querySelector('#glossary-search');
  const catButtons = container.querySelectorAll('.glossary-category-btn');
  const gridList = container.querySelector('#glossary-grid-list');

  function renderList() {
    const filtered = glossaryData.filter(item => {
      const matchCat = currentCat === 'Todos' || item.category === currentCat;
      const matchSearch = searchTerm === '' || 
        item.term.toLowerCase().includes(searchTerm) || 
        item.def.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      gridList.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-secondary);">
          No se encontraron términos que coincidan con la búsqueda.
        </div>
      `;
      return;
    }

    gridList.innerHTML = filtered.map(item => `
      <div class="glossary-card">
        <div class="glossary-term">
          <span>${item.term}</span>
          <span class="glossary-cat-tag">${item.category}</span>
        </div>
        <p class="glossary-def">${item.def}</p>
      </div>
    `).join('') ;
  }

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderList();
  });

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.getAttribute('data-cat');
      renderList();
      if (window.notebookAudio) window.notebookAudio.playClick();
    });
  });

  renderList();
}

window.initGlossary = initGlossary;
