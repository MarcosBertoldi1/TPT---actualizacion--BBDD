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
            liProfesor.innerHTML = '<a href="panel-profesor.html" style="font-weight: bold; color: #0056b3;">Panel Profesor</a>'; 
            
            // Lo insertamos en el menú justo después de donde estaba "Materiales"
            if (linkMateriales) {
                linkMateriales.parentElement.after(liProfesor);
            } else {
                ulMenu.appendChild(liProfesor);
            }
        }
    }
});