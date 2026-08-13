document.addEventListener('DOMContentLoaded', () => {
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
});