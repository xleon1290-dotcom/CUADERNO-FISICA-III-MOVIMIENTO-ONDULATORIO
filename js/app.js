/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Controlador Principal de la Aplicación (SPA), Navegación, Dock y Teclado
 */

class NotebookApp {
  constructor() {
    this.currentPage = 1;
    this.totalPages = 14;
    this.pages = [];
    this.soundActive = false;
    this.animationsActive = true;
    this.studyMode = false;

    this.init();
  }

  init() {
    this.pages = Array.from(document.querySelectorAll('.book-page'));
    this.totalPages = this.pages.length || 13;

    this.bindDockEvents();
    this.bindKeyboardEvents();
    this.bindCoverEvents();
    this.bindTableOfContents();
    this.updateDockState();

    // Inicializar componentes interactivos
    setTimeout(() => {
      this.initPageComponents(this.currentPage);
    }, 100);
  }

  goToPage(pageNum) {
    if (pageNum < 1 || pageNum > this.totalPages || pageNum === this.currentPage) return;

    const previousPage = this.currentPage;
    this.currentPage = pageNum;

    // Actualizar clases de visualización
    this.pages.forEach((p, idx) => {
      const pNum = idx + 1;
      p.classList.toggle('active', pNum === this.currentPage);
    });

    // Reproducir sonido de página
    if (window.notebookAudio) {
      window.notebookAudio.playPageFlip();
    }

    // Actualizar controles y progreso
    this.updateDockState();

    // Desplazar suavemente la vista hacia la cabecera del cuaderno si el usuario ha hecho scroll hacia abajo
    const notebookEl = document.querySelector('.notebook-book');
    if (notebookEl && window.scrollY > notebookEl.offsetTop + 100) {
      notebookEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Inicializar o re-renderizar componentes de la página activa
    this.initPageComponents(this.currentPage);

    // Re-renderizar fórmulas KaTeX en la nueva página
    if (window.renderAllMath) {
      window.renderAllMath();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  updateDockState() {
    // Actualizar indicador textual y desplegable
    const pageSelect = document.getElementById('dock-page-select');
    if (pageSelect) {
      pageSelect.value = this.currentPage;
    }

    const currentSpan = document.getElementById('dock-current-page-num');
    if (currentSpan) {
      currentSpan.textContent = this.currentPage;
    }

    // Barra de progreso porcentual
    const fillBar = document.getElementById('dock-progress-fill');
    if (fillBar) {
      const percentage = (this.currentPage / this.totalPages) * 100;
      fillBar.style.width = `${percentage.toFixed(1)}%`;
    }

    // Botones de anterior y siguiente
    const btnPrev = document.getElementById('dock-btn-prev');
    const btnNext = document.getElementById('dock-btn-next');
    if (btnPrev) btnPrev.disabled = this.currentPage === 1;
    if (btnNext) btnNext.disabled = this.currentPage === this.totalPages;
  }

  bindDockEvents() {
    const btnPrev = document.getElementById('dock-btn-prev');
    const btnNext = document.getElementById('dock-btn-next');
    const btnHome = document.getElementById('dock-btn-home');
    const btnToc = document.getElementById('dock-btn-toc');
    const pageSelect = document.getElementById('dock-page-select');
    const btnSound = document.getElementById('dock-btn-sound');
    const btnFullscreen = document.getElementById('dock-btn-fullscreen');
    const btnStudy = document.getElementById('dock-btn-study');

    if (btnPrev) btnPrev.addEventListener('click', () => this.prevPage());
    if (btnNext) btnNext.addEventListener('click', () => this.nextPage());
    if (btnHome) btnHome.addEventListener('click', () => this.goToPage(1));
    if (btnToc) btnToc.addEventListener('click', () => this.goToPage(2));

    if (pageSelect) {
      pageSelect.addEventListener('change', (e) => {
        this.goToPage(parseInt(e.target.value));
      });
    }

    // Sonido
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        if (window.notebookAudio) {
          this.soundActive = window.notebookAudio.toggle();
          btnSound.classList.toggle('active', this.soundActive);
          btnSound.setAttribute('title', this.soundActive ? 'Desactivar Sonido' : 'Activar Sonido');
        }
      });
    }

    // Pantalla completa
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.warn(err));
          btnFullscreen.classList.add('active');
        } else {
          document.exitFullscreen().catch(err => console.warn(err));
          btnFullscreen.classList.remove('active');
        }
      });
    }

    // Modo estudio (ajusta espaciado y contraste máximo)
    if (btnStudy) {
      btnStudy.addEventListener('click', () => {
        this.studyMode = !this.studyMode;
        document.body.classList.toggle('study-mode-active', this.studyMode);
        btnStudy.classList.toggle('active', this.studyMode);
      });
    }
  }

  bindKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // Evitar si el usuario está escribiendo en un input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prevPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.goToPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.goToPage(this.totalPages);
      }
    });
  }

  bindCoverEvents() {
    const btnOpen = document.getElementById('btn-open-notebook');
    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        this.goToPage(2);
      });
    }
  }

  bindTableOfContents() {
    document.querySelectorAll('.toc-link-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = parseInt(item.getAttribute('data-target-page'));
        if (targetPage) {
          this.goToPage(targetPage);
        }
      });
    });
  }

  initPageComponents(pageNum) {
    // Inicialización según la página en la que se aterrice
    if (pageNum === 3 && !this.mindmapInitialized) {
      if (window.initMindmap) {
        window.initMindmap('mindmap-container');
        this.mindmapInitialized = true;
      }
    }

    if (pageNum === 4 && !this.timelineInitialized) {
      if (window.initTimeline) {
        window.initTimeline('timeline-mount');
        this.timelineInitialized = true;
      }
    }

    // Página 10: Plano Cartesiano GeoGebra para la Cinemática del MAS
    if (pageNum === 10) {
      if (!this.masPlotterInitialized) {
        if (window.MASGeoGebraPlotter) {
          window.activeMASPlotter = new window.MASGeoGebraPlotter('mas-geogebra-mount');
          this.masPlotterInitialized = true;
        }
      } else if (window.activeMASPlotter) {
        window.activeMASPlotter.resizeCanvas();
        window.activeMASPlotter.render();
      }
    }

    // Página 11: Simulador Físico Masa-Resorte y Proyección MCU
    if (pageNum === 11) {
      if (!this.simInitialized) {
        if (window.HarmonicOscillatorSim) {
          window.activeSim = new window.HarmonicOscillatorSim('sim-canvas');
          this.simInitialized = true;
        }
      } else if (window.activeSim) {
        window.activeSim.resizeCanvas();
      }
    }

    // Página 12: Superposición de Ondas y Plano GeoGebra Ondulatorio
    if (pageNum === 12) {
      if (!this.geogebraInitialized) {
        if (window.GeoGebraGraph) {
          window.activeGraph = new window.GeoGebraGraph('geogebra-graph-mount', {
            modalTargetId: 'geogebra-fullscreen-modal'
          });
          this.geogebraInitialized = true;
        }
      } else if (window.activeGraph) {
        window.activeGraph.handlePageVisible();
      }
    }

    // Página 13: Problemas Resueltos y Taller con Calculadoras
    if (pageNum === 13) {
      if (!this.pedagogyInitialized) {
        if (window.initPedagogicalCalculator) {
          window.initPedagogicalCalculator();
          this.pedagogyInitialized = true;
        }
      }
      if (!this.quizInitialized && window.initQuiz) {
        window.initQuiz('quiz-mount');
        this.quizInitialized = true;
      }
    }

    // Página 14: Glosario Científico y Referencias APA 7
    if (pageNum === 14 && !this.glossaryInitialized) {
      if (window.initGlossary) {
        window.initGlossary('glossary-mount');
        this.glossaryInitialized = true;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.notebookApp = new NotebookApp();
});
