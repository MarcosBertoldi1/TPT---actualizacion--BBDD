// ==========================================
// 0. MENÚ DE USUARIO, MODO OSCURO Y TAMAÑO DE LETRA (NUEVO)
//    - Hay "sesión" cuando existe el correo guardado en localStorage ('tptUsuario'),
//      que escribe js/sesion.js a partir de Firebase.
//    - Sin sesión: la página se ve con el tema claro y la letra normal, y no hay controles.
//    - Con sesión: se aplican (y se pueden cambiar) el tema y el tamaño de letra.
// ==========================================
(function () {
    const raiz = document.documentElement;

    const TAMANOS = [16, 18, 20, 22];
    const NOMBRES = ['normal', 'grande', 'muy grande', 'máximo'];
    let nivel = parseInt(localStorage.getItem('tamanoLetra'), 10);
    if (!(nivel >= 0 && nivel < TAMANOS.length)) nivel = 0;

    const aplicarLetra = () => {
        const px = TAMANOS[nivel] + 'px';
        raiz.style.fontSize = px;                      // escala todo lo que usa rem
        raiz.style.setProperty('--fuente-base', px);   // escala el texto del <body>
    };
    const quitarLetra = () => {
        raiz.style.fontSize = '';
        raiz.style.removeProperty('--fuente-base');
    };
    const temaGuardadoOscuro = () => {
        const g = localStorage.getItem('tema');
        return g ? g === 'oscuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    };
    const ponerTema = (oscuro) => {
        if (oscuro) raiz.setAttribute('data-tema', 'oscuro');
        else raiz.removeAttribute('data-tema');
        const sw = document.getElementById('btnTema');
        if (sw) sw.setAttribute('aria-checked', oscuro ? 'true' : 'false');
    };

    // --- Panel del usuario ---
    const panel = () => document.getElementById('usuarioPanel');
    const botonAvatar = () => document.getElementById('btnUsuario');
    const cerrarPanel = () => {
        const p = panel(), b = botonAvatar();
        if (p) p.hidden = true;
        if (b) b.setAttribute('aria-expanded', 'false');
    };

    const actualizarBotonesLetra = () => {
        const menos = document.getElementById('btnLetraMenos');
        const mas = document.getElementById('btnLetraMas');
        const txt = document.getElementById('letraNivel');
        if (menos) menos.disabled = nivel === 0;
        if (mas) mas.disabled = nivel === TAMANOS.length - 1;
        if (txt) txt.textContent = NOMBRES[nivel];
    };

    // --- Mostrar u ocultar todo según haya sesión ---
    function mostrarSesion(email) {
        if (email) {
            raiz.setAttribute('data-sesion', 'activa');
            const c = email.trim().charAt(0).toUpperCase();
            raiz.style.setProperty('--inicial', '"' + (/[A-Z0-9]/.test(c) ? c : '?') + '"');
            const el = document.getElementById('usuarioEmail');
            if (el) {
                el.textContent = '';
                const i = email.indexOf('@');
                if (i > 0) el.append(email.slice(0, i + 1), document.createElement('wbr'), email.slice(i + 1));   // si no entra, se parte después de la arroba
                else el.textContent = email;
            }
            aplicarLetra();
            ponerTema(temaGuardadoOscuro());
            actualizarBotonesLetra();
        } else {
            raiz.removeAttribute('data-sesion');
            raiz.style.removeProperty('--inicial');
            quitarLetra();
            ponerTema(false);
            cerrarPanel();
        }
    }
    window.tptSesion = { mostrar: mostrarSesion };   // lo usa js/sesion.js cuando Firebase confirma la sesión

    mostrarSesion(localStorage.getItem('tptUsuario'));

    document.addEventListener('DOMContentLoaded', () => {
        mostrarSesion(localStorage.getItem('tptUsuario'));   // por si el script se cargó antes que el HTML

        const avatar = botonAvatar();
        if (avatar) {
            avatar.addEventListener('click', (e) => {
                e.stopPropagation();
                const abrir = panel().hidden;
                panel().hidden = !abrir;
                avatar.setAttribute('aria-expanded', abrir ? 'true' : 'false');
            });
            document.addEventListener('click', (e) => {
                const menu = document.getElementById('usuarioMenu');
                if (menu && !menu.contains(e.target)) cerrarPanel();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') { cerrarPanel(); avatar.focus(); }
            });
        }

        const sw = document.getElementById('btnTema');
        if (sw) {
            sw.addEventListener('click', () => {
                const oscuro = raiz.getAttribute('data-tema') !== 'oscuro';
                localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro');
                ponerTema(oscuro);
            });
        }

        const cambiarLetra = (delta) => {
            nivel = Math.max(0, Math.min(TAMANOS.length - 1, nivel + delta));
            localStorage.setItem('tamanoLetra', nivel);
            aplicarLetra();
            actualizarBotonesLetra();
        };
        const mas = document.getElementById('btnLetraMas');
        const menos = document.getElementById('btnLetraMenos');
        if (mas) mas.addEventListener('click', () => cambiarLetra(1));
        if (menos) menos.addEventListener('click', () => cambiarLetra(-1));
        actualizarBotonesLetra();

        const salir = document.getElementById('btnSalir');
        if (salir) {
            salir.addEventListener('click', () => {
                if (window.tptSesionListo) {
                    window.dispatchEvent(new CustomEvent('tpt-salir'));   // js/sesion.js cierra la sesión en Firebase
                } else {                                                  // sin Firebase (ej. archivo abierto con doble clic)
                    localStorage.removeItem('tptUsuario');
                    localStorage.removeItem('rolUsuario');
                    location.reload();
                }
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