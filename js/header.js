document.addEventListener("DOMContentLoaded", () => {
    // Buscamos el archivo exactamente en la carpeta donde lo creaste
    fetch('/Mat/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - No se encontró /Mat/header.html`);
            }
            return response.text();
        })
        .then(data => {
            const container = document.getElementById('header-container');
            if (container) {
                container.innerHTML = data;
                inicializarHeaderYMenu();
            }
        })
        .catch(error => console.error('FALLO AL CARGAR EL ENCABEZADO:', error));
});

function inicializarHeaderYMenu() {
    const header = document.querySelector('.encabezado-principal');
    if (!header) return;

    // --- LÓGICA DE SCROLL ---
    let esperandoFotograma = false;
    const evaluarScrollHeader = () => {
        const esCelular = window.innerWidth < 768;
        if (esCelular) {
            if (window.scrollY > 80) {
                header.classList.add('encabezado-compacto');
            } else {
                header.classList.remove('encabezado-compacto');
            }
        } else {
            header.classList.remove('encabezado-compacto');
        }
        esperandoFotograma = false;
    };

    window.addEventListener('scroll', () => {
        if (!esperandoFotograma) {
            window.requestAnimationFrame(evaluarScrollHeader);
            esperandoFotograma = true;
        }
    });
    window.addEventListener('resize', () => {
        if (!esperandoFotograma) {
            window.requestAnimationFrame(evaluarScrollHeader);
            esperandoFotograma = true;
        }
    });
    evaluarScrollHeader();

    // --- LÓGICA DEL MENÚ DE USUARIO Y SESIÓN ---
    const btnMenuUsuario = document.getElementById('btnMenuUsuario');
    const wrapperUsuario = document.getElementById('wrapper-usuario');
    const dropdownUsuario = document.getElementById('dropdownUsuario');
    const btnLoginHeader = document.getElementById('btn-login-header'); // <-- Capturamos el botón de login
    
    // Selectores para inyectar los datos dinámicos
    const txtNombre = document.querySelector('.info-perfil h4');
    const txtRol = document.querySelector('.info-perfil p');
    const avatarGrande = document.getElementById('avatar-letra'); // <-- Ahora usa ID para no fallar
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    // 1. Leer quién inició sesión desde la memoria del navegador
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');
    
    if (usuarioGuardado) {
        // --- ESTADO: LOGUEADO ---
        if (wrapperUsuario) wrapperUsuario.style.display = 'block'; // Mostramos el menú
        if (btnLoginHeader) btnLoginHeader.style.display = 'none';  // Ocultamos "Iniciar sesión"

        const usuario = JSON.parse(usuarioGuardado);
        
        // Cambiar el nombre y el rol en el HTML
        if (txtNombre) txtNombre.textContent = usuario.nombre;
        if (txtRol) txtRol.textContent = usuario.rol;
        
        // Obtener la primera letra del nombre para el círculo
        const inicial = usuario.nombre.charAt(0).toUpperCase();
        if (btnMenuUsuario) btnMenuUsuario.textContent = inicial;
        if (avatarGrande) avatarGrande.textContent = inicial;
    } else {
        // --- ESTADO: NO LOGUEADO ---
        if (wrapperUsuario) wrapperUsuario.style.display = 'none';    // Ocultamos el menú
        if (btnLoginHeader) btnLoginHeader.style.display = 'inline-block'; // Mostramos "Iniciar sesión"
    }

    // 2. Abrir y cerrar el menú desplegable
    if (btnMenuUsuario && dropdownUsuario) {
        btnMenuUsuario.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownUsuario.classList.toggle('abierto');
            btnMenuUsuario.classList.toggle('activo');
        });

        document.addEventListener('click', (e) => {
            if (wrapperUsuario && !wrapperUsuario.contains(e.target)) {
                dropdownUsuario.classList.remove('abierto');
                btnMenuUsuario.classList.remove('activo');
            }
        });

        dropdownUsuario.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 3. Botón de Cerrar Sesión
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            // Borramos los datos del usuario de la memoria
            localStorage.removeItem('usuarioLogueado');
            localStorage.removeItem('rolUsuario'); // Por las dudas, borramos también el rol si lo usás en otro lado
            
            // Lo mandamos a la página de inicio
            window.location.href = '/index.html'; 
        });
    }

    // --- LÓGICA DEL MODO OSCURO ---
    const toggleTema = document.getElementById('toggleTemaMenu');
    if (localStorage.getItem('temaOscuro') === 'true') {
        document.body.classList.add('modo-oscuro');
        if (toggleTema) toggleTema.checked = true;
    }

    if (toggleTema) {
        toggleTema.addEventListener('change', () => {
            if (toggleTema.checked) {
                document.body.classList.add('modo-oscuro');
                localStorage.setItem('temaOscuro', 'true');
            } else {
                document.body.classList.remove('modo-oscuro');
                localStorage.setItem('temaOscuro', 'false');
            }
        });
    }

    // --- LÓGICA DEL TAMAÑO DE FUENTE ---
    const btnLetra = document.getElementById('btnAumentarLetra');
    let nivelFuente = parseInt(localStorage.getItem('nivelFuente') || '0', 10);

    function aplicarTamano() {
        document.documentElement.classList.remove('fuente-grande', 'fuente-muy-grande');
        if (nivelFuente === 1) document.documentElement.classList.add('fuente-grande');
        if (nivelFuente === 2) document.documentElement.classList.add('fuente-muy-grande');
        localStorage.setItem('nivelFuente', nivelFuente);
    }
    aplicarTamano();

    if (btnLetra) {
        btnLetra.addEventListener('click', () => {
            nivelFuente = (nivelFuente + 1) % 3;
            aplicarTamano();
        });
    }
}