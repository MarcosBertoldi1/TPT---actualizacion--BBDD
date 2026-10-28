// ==========================================
// 0. MODO OSCURO Y TAMAÑO DE LETRA (NUEVO)
// ==========================================
(function () {
    const raiz = document.documentElement;

    // --- Tamaño de letra: 4 niveles, se recuerda entre páginas ---
    const TAMANOS = [16, 18, 20, 22];
    const NOMBRES = ['normal', 'grande', 'muy grande', 'máximo'];
    let nivel = parseInt(localStorage.getItem('tamanoLetra'), 10);
    if (!(nivel >= 0 && nivel < TAMANOS.length)) nivel = 0;

    const aplicarLetra = () => {
        const px = TAMANOS[nivel] + 'px';
        raiz.style.fontSize = px;                      // escala todo lo que usa rem
        raiz.style.setProperty('--fuente-base', px);   // escala el texto del <body>
    };

    // --- Tema: solo se aplica en las páginas que ya tienen el interruptor (#btnTema).
    //     Así las páginas que todavía no migramos no se ven "a medias" en oscuro.
    //     Cuando estén todas migradas se puede sacar esa condición. ---
    const aplicarTema = () => {
        if (!document.getElementById('btnTema')) return;
        const guardado = localStorage.getItem('tema');
        const oscuro = guardado
            ? guardado === 'oscuro'
            : window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (oscuro) raiz.setAttribute('data-tema', 'oscuro');
        else raiz.removeAttribute('data-tema');
    };

    aplicarLetra();
    aplicarTema();

    document.addEventListener('DOMContentLoaded', () => {
        aplicarTema();   // por si el script se cargó antes que el HTML

        const btnTema = document.getElementById('btnTema');
        if (btnTema) {
            btnTema.setAttribute('aria-checked', raiz.getAttribute('data-tema') === 'oscuro');
            btnTema.addEventListener('click', () => {
                const oscuro = raiz.getAttribute('data-tema') !== 'oscuro';
                if (oscuro) raiz.setAttribute('data-tema', 'oscuro');
                else raiz.removeAttribute('data-tema');
                localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro');
                btnTema.setAttribute('aria-checked', oscuro);
            });
        }

        const btnLetra = document.getElementById('btnLetra');
        if (btnLetra) {
            const etiquetar = () => {
                btnLetra.dataset.nivel = nivel;
                const texto = `Tamaño de letra: ${NOMBRES[nivel]}. Tocá para pasar a ${NOMBRES[(nivel + 1) % NOMBRES.length]}`;
                btnLetra.setAttribute('aria-label', texto);
                btnLetra.title = texto;
            };
            etiquetar();
            btnLetra.addEventListener('click', () => {
                nivel = (nivel + 1) % TAMANOS.length;
                localStorage.setItem('tamanoLetra', nivel);
                aplicarLetra();
                etiquetar();
            });
        }
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. TU CÓDIGO ORIGINAL (NO SE TOCÓ NADA)
    // ==========================================
    const header = document.querySelector('.encabezado-principal');
    let esperandoFotograma = false;

    const evaluarScrollHeader = () => {
        // Verificamos si la pantalla es de un celular (menor a 768px de ancho)
        const esCelular = window.innerWidth < 768;

        if (esCelular) {
            // Lógica para celulares: achicamos al bajar más de 80px
            if (window.scrollY > 80) {
                header.classList.add('encabezado-compacto');
            } else {
                header.classList.remove('encabezado-compacto');
            }
        } else {
            // Lógica para PC: siempre garantizamos que tenga su tamaño original
            header.classList.remove('encabezado-compacto');
        }
        
        esperandoFotograma = false;
    };

    // Escuchamos el scroll
    window.addEventListener('scroll', () => {
        if (!esperandoFotograma) {
            window.requestAnimationFrame(evaluarScrollHeader);
            esperandoFotograma = true;
        }
    });

    // NUEVO: Escuchamos si el usuario redimensiona la ventana
    window.addEventListener('resize', () => {
        if (!esperandoFotograma) {
            window.requestAnimationFrame(evaluarScrollHeader);
            esperandoFotograma = true;
        }
    });
    
    // Evaluamos al cargar la página
    evaluarScrollHeader();

    // ==========================================
    // 2. NUEVA LÓGICA DE ROLES (Evita editar los HTML)
    // ==========================================
    const rolActual = localStorage.getItem('rolUsuario') || 'alumno';
    
    // Buscamos la lista (ul) del menú y el enlace de Materiales
    const ulMenu = document.querySelector('.navegacion-principal ul');
    const linkMateriales = document.querySelector('a[href="materiales.html"]');

    // Si el que inició sesión es profesor o admin...
    if (rolActual === 'profesor' || rolActual === 'admin') {
        
        // A. Ocultamos la pestaña "Materiales" a los profesores
        if (linkMateriales) {
            linkMateriales.parentElement.style.display = 'none';
        }

        // B. Verificamos que no exista ya el botón para no duplicarlo, y lo creamos
        if (ulMenu && !document.getElementById('nav-panel-profesor')) {
            const liProfesor = document.createElement('li');
            liProfesor.id = 'nav-panel-profesor';
            
            // Creamos el enlace. (Le puse un color distinto o negrita para que resalte)
            liProfesor.innerHTML = '<a href="panel-profesor.html" style="font-weight: bold; color: var(--color-primario);">Panel Profesor</a>'; 
            
            // Lo insertamos en el menú justo después de donde estaba "Materiales"
            if (linkMateriales) {
                linkMateriales.parentElement.after(liProfesor);
            } else {
                ulMenu.appendChild(liProfesor);
            }
        }
    }
});