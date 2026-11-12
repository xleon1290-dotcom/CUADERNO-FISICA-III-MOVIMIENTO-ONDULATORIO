================================================================================
CUADERNO DIGITAL INTERACTIVO DE FÍSICA 3: MOVIMIENTO ONDULATORIO
Universidad Tecnológica de Pereira (UTP) - Ingeniería
Autores: Angela Morales Osorio, Esley Bolaños, Ximena Leon
================================================================================

DESCRIPCIÓN DEL PROYECTO:
-------------------------
Este proyecto es una aplicación web interactiva y cuaderno digital de Física 3
dedicado al estudio del "Movimiento Ondulatorio y Principio de Superposición".
Combina rigor teórico universitario con simulaciones dinámicas en tiempo real,
plano cartesiano interactivo estilo GeoGebra, resolución metodológica de ejercicios
en 5 pasos con codificación cromática (Azul = Datos, Rojo = Incógnitas,
Naranja = Resultados resueltos), glosario científico y referencias bajo normas APA 7.

ESTRUCTURA DE ARCHIVOS (100% AUTÓNOMA Y PORTABLE):
--------------------------------------------------
Movimiento_Ondulatorio_Interactivo/
│
├── index.html                           <- Aplicación principal (abre con doble clic)
├── README.txt                           <- Este archivo de instrucciones
│
└── imagenes/
    ├── portada_movimiento_ondulatorio.png  <- Portada oficial de la UTP
    ├── portada_movimiento_ondulatorio.jpeg <- Copia de compatibilidad
    └── hoja_movimiento_ondulatorio.png    <- Hoja interior oficial de fondo

REQUISITOS Y EJECUCIÓN:
-----------------------
- NO requiere instalar servidores web (Node, Python, Apache, etc.).
- Funciona directamente haciendo DOBLE CLIC en "index.html".
- Compatible con cualquier navegador moderno:
  * Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, Opera, Brave.
- Totalmente portable a otros dispositivos:
  * Computadores Windows, macOS y Linux.
  * Teléfonos y tablets Android (abrir con Chrome/Firefox).
  * iPhone y iPad (abrir con Safari/Chrome).
- Utiliza ÚNICAMENTE rutas relativas locales ("imagenes/..."), por lo que la
  carpeta completa puede copiarse a una memoria USB, comprimirse en ZIP o enviarse
  por correo sin que se rompan enlaces ni imágenes.

CARACTERÍSTICAS INTERACTIVAS:
-----------------------------
1. Portada oficial ilustrada con botón interactivo de apertura.
2. Índice interactivo con salto directo a cada una de las 12 páginas.
3. Reseña histórica con línea de tiempo interactiva (Huygens, Newton, d'Alembert, Euler, Young, Fourier, Maxwell, Hertz).
4. Mapa mental interactivo del Movimiento Ondulatorio con nodos explorables.
5. Fundamentos teóricos, magnitudes y Tabla 1 con unidades en el Sistema Internacional.
6. Demostración matemática rigurosa de la Ecuación Diferencial de Onda unidimensional.
7. Cinemática y dinámica ondulatoria (velocidad y aceleración transversal, potencia transmitida y Tabla 2).
8. Plano Cartesiano Interactivo "Estilo GeoGebra" con cuadrícula milimetrada, inspección de coordenadas y paleta de estilos.
9. Laboratorio Virtual de Simulación de Ondas (OndaLab Pro):
   - Superposición de ondas y cálculo en tiempo real de la onda resultante ΣY(x, t).
   - Control de tiempo (reproducir, pausar, paso a paso, velocidad 0.25x a 4x).
   - Presets didácticos: Interferencia constructiva, destructiva, onda estacionaria, batimiento, paquete gaussiano.
   - Vectores de propagación direccionales.
   - Ventana ampliada / modal en pantalla completa sincronizada en tiempo real.
   - Teclado virtual científico para ingreso de funciones matemáticas.
10. Taller de ejercicios resueltos con el protocolo cromático de 5 pasos y calculadoras dinámicas en vivo.
11. Glosario científico interactivo con buscador instantáneo y filtros alfabéticos.
12. Referencias bibliográficas formateadas bajo normas APA 7.ª edición con sangría francesa.
13. Efectos de sonido sintéticos de pase de página (mediante Web Audio API, sin dependencias externas).
14. Navegación por teclado (Flechas Izquierda/Derecha, Barra espaciadora para simulación, tecla F para pantalla completa).
15. Soporte gestual táctil (deslizar a la izquierda/derecha para cambiar de página en celulares).
