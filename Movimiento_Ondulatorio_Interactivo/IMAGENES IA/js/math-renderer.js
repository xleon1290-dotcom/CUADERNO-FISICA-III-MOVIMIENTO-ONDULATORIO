/**
 * CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3
 * Módulo de Renderizado Matemático con KaTeX
 */

function renderAllMath() {
  if (typeof katex === 'undefined') {
    console.warn('KaTeX no disponible aún. Reintentando...');
    setTimeout(renderAllMath, 300);
    return;
  }

  // Renderizar bloques con clase .math-render
  document.querySelectorAll('.math-render').forEach(el => {
    const tex = el.getAttribute('data-tex') || el.textContent;
    const isDisplay = el.classList.contains('display-mode') || el.tagName === 'DIV';
    try {
      katex.render(tex, el, {
        displayMode: isDisplay,
        throwOnError: false
      });
    } catch (err) {
      console.error('Error renderizando KaTeX:', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderAllMath();
});

window.renderAllMath = renderAllMath;
