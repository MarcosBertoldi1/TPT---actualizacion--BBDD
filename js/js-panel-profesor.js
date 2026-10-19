import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Mapeo centralizado de Materias y sus Módulos
const modulosPorMateria = {
    "Lógica Computacional": [
        "Introducción",
        "Estructuras Lógicas: Variables y Conectivos",
        "Tablas de Verdad y sus Conectores",
        "Leyes Lógicas y Equivalencias",
        "Álgebra de Boole",
        "Mapas de Karnaugh (M.K)",
        "Ejercicios Prácticos"
    ],
    "Organización de las Computadoras": [
        "Sistemas de Numeración",
        "Arquitectura de Von Neumann",
        "Álgebra de Boole y Circuitos Combinacionales",
        "Memorias y Almacenamiento",
        "Microprocesadores e Instrucciones"
    ],
    "Laboratorio de Algoritmos": [
        "Variables y Tipos de Datos",
        "Estructuras Condicionales",
        "Estructuras Repetitivas (Bucles)",
        "Arreglos y Vectores",
        "Funciones y Procedimientos"
    ]
};

const formSubir = document.getElementById('form-subir-profesor');
const mensajeEstado = document.getElementById('mensaje-estado');
const contenedorPendientes = document.getElementById('contenedor-pendientes');
const contenedorPublicados = document.getElementById('contenedor-publicados');
const selectMateria = document.getElementById('materia');
const selectModulo = document.getElementById('modulo-profesor');

let usuarioActual = null;
let rolActual = localStorage.getItem('rolUsuario');

// Actualiza las opciones del desplegable de módulos según la materia
function actualizarSelectModulos(materiaSeleccionada, selectTarget) {
    selectTarget.innerHTML = '';
    
    if (materiaSeleccionada && modulosPorMateria[materiaSeleccionada]) {
        selectTarget.disabled = false;
        selectTarget.innerHTML = '<option value="">-- Seleccionar Módulo --</option>';
        
        modulosPorMateria[materiaSeleccionada].forEach(modulo => {
            const option = document.createElement('option');
            option.value = modulo;
            option.textContent = modulo;
            selectTarget.appendChild(option);
        });
    } else {
        selectTarget.disabled = true;
        selectTarget.innerHTML = '<option value="">-- Primero elige una materia --</option>';
    }
}

if (selectMateria && selectModulo) {
    selectMateria.addEventListener('change', (e) => {
        actualizarSelectModulos(e.target.value, selectModulo);
    });
}

// Verificar acceso
onAuthStateChanged(auth, (user) => {
    if (user && (rolActual === 'profesor' || rolActual === 'admin')) {
        usuarioActual = user;
        cargarPendientes();
        cargarPublicados();
    } else {
        window.location.href = '/index.html';
    }
});

// Guardar material DIRECTO del Profesor
if (formSubir) {
    formSubir.addEventListener('submit', async (e) => {
        e.preventDefault();
        mensajeEstado.textContent = 'Publicando material...';
        mensajeEstado.style.color = '#0056b3';

        const titulo = document.getElementById('titulo').value;
        const materia = selectMateria.value;
        const modulo = selectModulo.value;
        const urlYoutube = document.getElementById('input-youtube').value;
        const descripcion = document.getElementById('descripcion').value;

        try {
            await addDoc(collection(db, "materiales"), {
                titulo: titulo,
                materia: materia,
                modulo: modulo, 
                tipo: 'youtube',
                url: urlYoutube,
                descripcion: descripcion,
                subidoPor: 'Profesor - ' + usuarioActual.email,
                fecha: serverTimestamp(),
                estado: 'aprobado'
            });

            formSubir.reset();
            actualizarSelectModulos('', selectModulo);
            mensajeEstado.textContent = '¡Material publicado exitosamente en ' + modulo + '!';
            mensajeEstado.style.color = '#10b981';
            setTimeout(() => { mensajeEstado.textContent = ''; }, 4000);
            
            cargarPublicados(); // Recargar la lista de publicados
            
        } catch (error) {
            console.error("Error al guardar:", error);
            mensajeEstado.textContent = 'Error al publicar: ' + error.message;
            mensajeEstado.style.color = '#ef4444';
        }
    });
}

// Cargar materiales pendientes de ALUMNOS
async function cargarPendientes() {
    if (!contenedorPendientes) return;
    contenedorPendientes.innerHTML = '<div class="loader-text">Buscando entregas pendientes...</div>';
    
    try {
        const q = query(collection(db, "materiales"), orderBy("fecha", "desc"));
        const querySnapshot = await getDocs(q);
        contenedorPendientes.innerHTML = '';

        let hayPendientes = false;

        querySnapshot.forEach((documento) => {
            const data = documento.data();
            if (data.estado === 'pendiente') {
                hayPendientes = true;
                
                let videoId = '';
                if(data.url.includes('v=')) {
                    videoId = data.url.split('v=')[1].split('&')[0];
                } else if(data.url.includes('youtu.be/')) {
                    videoId = data.url.split('youtu.be/')[1].split('?')[0];
                }

                const div = document.createElement('div');
                div.className = 'video-review-card';
                
                div.innerHTML = `
                    <div class="video-review-header">
                        <div class="video-review-info">
                            <h4>${data.titulo}</h4>
                            <span class="badge-materia">${data.materia}</span>
                            <div class="autor-text">Enviado por: <strong>${data.subidoPor}</strong></div>
                        </div>
                    </div>
                    
                    <div class="video-container">
                        <iframe width="100%" height="250" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    </div>
                    
                    <p style="font-size: 0.95rem; color: #334155; margin-bottom: 15px;">
                        <strong>Descripción:</strong> ${data.descripcion}
                    </p>
                    
                    <div class="review-actions" style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
                        <label style="display:block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem; color: #0f172a;">Confirmar Materia:</label>
                        <select id="materia-alumno-${documento.id}" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 10px;">
                            <option value="Lógica Computacional" ${data.materia === 'Lógica Computacional' ? 'selected' : ''}>Lógica Computacional</option>
                            <option value="Organización de las Computadoras" ${data.materia === 'Organización de las Computadoras' ? 'selected' : ''}>Organización de las Computadoras</option>
                            <option value="Laboratorio de Algoritmos" ${data.materia === 'Laboratorio de Algoritmos' ? 'selected' : ''}>Laboratorio de Algoritmos y Estructuras</option>
                        </select>

                        <label style="display:block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem; color: #0f172a;">Ubicar en Módulo:</label>
                        <select id="modulo-alumno-${documento.id}" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 15px;">
                        </select>

                        <textarea id="comentario-${documento.id}" rows="2" placeholder="Escribe tu corrección o feedback para el alumno..."></textarea>
                        <div class="action-buttons">
                            <button class="btn-success btn-aprobar" data-id="${documento.id}">Aprobar Video ✅</button>
                            <button class="btn-danger btn-rechazar" data-id="${documento.id}">Rechazar ❌</button>
                        </div>
                    </div>
                `;
                contenedorPendientes.appendChild(div);

                const selectMatAlumno = document.getElementById(`materia-alumno-${documento.id}`);
                const selectModAlumno = document.getElementById(`modulo-alumno-${documento.id}`);
                
                actualizarSelectModulos(selectMatAlumno.value, selectModAlumno);

                selectMatAlumno.addEventListener('change', (e) => {
                    actualizarSelectModulos(e.target.value, selectModAlumno);
                });
            }
        });

        if (!hayPendientes) {
            contenedorPendientes.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">🎉 ¡Todo al día! No hay videos pendientes de revisión.</div>';
        }

        // Aprobar
        document.querySelectorAll('.btn-aprobar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const comentario = document.getElementById(`comentario-${id}`).value;
                const materiaElegida = document.getElementById(`materia-alumno-${id}`).value;
                const moduloElegido = document.getElementById(`modulo-alumno-${id}`).value; 

                if (!moduloElegido) {
                    alert("Por favor, selecciona un módulo para asignar este video.");
                    return;
                }

                await updateDoc(doc(db, "materiales", id), { 
                    estado: 'aprobado',
                    materia: materiaElegida,
                    modulo: moduloElegido,
                    comentarioProfesor: comentario || 'Excelente aporte, aprobado.'
                });
                cargarPendientes(); 
                cargarPublicados();
            });
        });

        // Rechazar
        document.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const comentario = document.getElementById(`comentario-${id}`).value;
                await updateDoc(doc(db, "materiales", id), { 
                    estado: 'rechazado',
                    comentarioProfesor: comentario || 'Material no cumple con los requisitos.'
                });
                cargarPendientes();
            });
        });

    } catch (error) {
        console.error("Error al cargar pendientes:", error);
        contenedorPendientes.innerHTML = '<div style="color: #ef4444;">Error al cargar la base de datos.</div>';
    }
}

// Cargar y gestionar materiales PUBLICADOS (Con opción a ELIMINAR)
async function cargarPublicados() {
    if (!contenedorPublicados) return;
    contenedorPublicados.innerHTML = '<div class="loader-text">Cargando materiales publicados...</div>';

    try {
        const q = query(collection(db, "materiales"), where("estado", "==", "aprobado"));
        const querySnapshot = await getDocs(q);
        contenedorPublicados.innerHTML = '';

        if (querySnapshot.empty) {
            contenedorPublicados.innerHTML = '<p style="color: #64748b; text-align: center; padding: 15px;">No hay materiales publicados visiblemente en los módulos.</p>';
            return;
        }

        querySnapshot.forEach((documento) => {
            const data = documento.data();
            const div = document.createElement('div');
            div.className = 'video-review-card';
            div.style.marginBottom = '15px';
            
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1.05rem;">${data.titulo}</h4>
                        <span class="badge-materia">${data.materia}</span>
                        <span style="background: #e2e8f0; color: #334155; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; margin-left: 5px;">${data.modulo || 'General'}</span>
                        <div class="autor-text" style="margin-top: 5px;">Subido por: <strong>${data.subidoPor}</strong></div>
                    </div>
                    <button class="btn-danger btn-eliminar" data-id="${documento.id}" style="padding: 8px 14px; font-size: 0.85rem; border-radius: 6px;">
                        Eliminar 🗑️
                    </button>
                </div>
            `;
            contenedorPublicados.appendChild(div);
        });

        // Evento click para eliminar material
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const confirmar = confirm("¿Estás seguro de que deseas eliminar este material publicado? Dejará de aparecer en la vista de los alumnos.");
                
                if (confirmar) {
                    await deleteDoc(doc(db, "materiales", id));
                    cargarPublicados(); // Actualiza la lista automáticamente
                }
            });
        });

    } catch (error) {
        console.error("Error al cargar publicados:", error);
        contenedorPublicados.innerHTML = '<div style="color: #ef4444;">Error al cargar la lista de publicados.</div>';
    }
}