import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const formSubir = document.getElementById('form-subir-material');
const mensajeEstado = document.getElementById('mensaje-estado');
const contenedorMateriales = document.getElementById('contenedor-materiales');
const panelModeracion = document.getElementById('panel-moderacion');
const contenedorPendientes = document.getElementById('contenedor-pendientes');

let usuarioActual = null;
let rolActual = localStorage.getItem('rolUsuario') || 'alumno';

// 1. Verificamos quién está conectado
onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioActual = user;
        cargarMateriales(); // Cargamos los aprobados
        
        // Si es profe o admin, mostramos el panel de moderación
        if (rolActual === 'profesor' || rolActual === 'admin') {
            panelModeracion.style.display = 'block';
            cargarPendientes();
        }
    } else {
        window.location.href = 'login.html'; // Si no está logueado, lo echamos al login
    }
});

// 2. Guardar el formulario (Video de YouTube)
if (formSubir) {
    formSubir.addEventListener('submit', async (e) => {
        e.preventDefault();
        mensajeEstado.textContent = 'Enviando...';
        mensajeEstado.style.color = 'blue';

        const titulo = document.getElementById('titulo').value;
        const materia = document.getElementById('materia').value;
        const urlYoutube = document.getElementById('input-youtube').value;
        const descripcion = document.getElementById('descripcion').value;

        try {
            // Guardamos directo en Firestore Database
            await addDoc(collection(db, "materiales"), {
                titulo: titulo,
                materia: materia,
                tipo: 'youtube',
                url: urlYoutube,
                descripcion: descripcion,
                subidoPor: usuarioActual.email,
                fecha: serverTimestamp(),
                estado: 'pendiente' // <--- Clave para la moderación
            });

            formSubir.reset();
            mensajeEstado.textContent = '¡Material enviado! Esperando aprobación del profesor.';
            mensajeEstado.style.color = 'green';
            
            // Recargamos las listas por las dudas
            if (rolActual === 'profesor' || rolActual === 'admin') {
                cargarPendientes();
            }
        } catch (error) {
            console.error("Error al guardar:", error);
            mensajeEstado.textContent = 'Error al enviar: ' + error.message;
            mensajeEstado.style.color = 'red';
        }
    });
}

// 3. Cargar materiales APROBADOS para que todos los vean
async function cargarMateriales() {
    contenedorMateriales.innerHTML = '<p>Cargando...</p>';
    try {
        const q = query(collection(db, "materiales"), orderBy("fecha", "desc"));
        const querySnapshot = await getDocs(q);
        contenedorMateriales.innerHTML = '';

        let hayAprobados = false;

        querySnapshot.forEach((documento) => {
            const data = documento.data();
            if (data.estado === 'aprobado') {
                hayAprobados = true;
                
                // Extraer el ID del video de YouTube para la miniatura
                let videoId = '';
                if(data.url.includes('v=')) {
                    videoId = data.url.split('v=')[1].split('&')[0];
                } else if(data.url.includes('youtu.be/')) {
                    videoId = data.url.split('youtu.be/')[1].split('?')[0];
                }

                const div = document.createElement('div');
                div.style = 'border: 1px solid #ccc; padding: 15px; border-radius: 8px; margin-bottom: 10px; background: #fff;';
                div.innerHTML = `
                    <h4 style="margin: 0 0 5px 0; color: #0056b3;">${data.titulo}</h4>
                    <span style="background: #e9ecef; padding: 3px 8px; border-radius: 10px; font-size: 0.8em;">${data.materia}</span>
                    <p style="margin: 10px 0;">${data.descripcion}</p>
                    <a href="${data.url}" target="_blank" style="display: inline-block; background: #ff0000; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; font-weight: bold;">▶ Ver en YouTube</a>
                    <p style="font-size: 0.8em; color: #666; margin-top: 10px;">Aportado por: ${data.subidoPor}</p>
                    
                    <!-- NUEVO: SECCIÓN DE FEEDBACK EDUCATIVO -->
                    <div class="contenedor-feedback">
                        <div class="titulo-feedback">📊 Feedback: ¿Te sirvió este material?</div>
                        
                        <div class="botones-feedback">
                            <button class="btn-fb verde" onclick="alert('¡Excelente! Guardando estadística de aprendizaje...')">🚀 Entendí todo</button>
                            <button class="btn-fb amarillo" onclick="alert('¡Anotado! Guardando respuesta...')">👍 Me ayudó algo</button>
                            <!-- Botón rojo que abre la caja de dudas específica -->
                            <button class="btn-fb rojo" onclick="document.getElementById('dudas-${documento.id}').style.display='block'">🔴 Sigo dudando</button>
                        </div>

                        <!-- Caja de dudas oculta -->
                        <div id="dudas-${documento.id}" class="caja-dudas">
                            <label style="font-size: 0.85rem; font-weight: bold;">¿Qué concepto no te quedó claro? Dejalo acá:</label>
                            <textarea rows="2" placeholder="Escribí tu duda puntual para que los profes la revisen..."></textarea>
                            <button class="btn-enviar-duda" onclick="alert('¡Duda enviada al panel de profesores!'); document.getElementById('dudas-${documento.id}').style.display='none';">Enviar duda</button>
                        </div>
                    </div>
                `;
                contenedorMateriales.appendChild(div);
            }
        });

        if (!hayAprobados) {
            contenedorMateriales.innerHTML = '<p>No hay materiales disponibles aún.</p>';
        }
    } catch (error) {
        console.error("Error leyendo Firestore:", error);
        contenedorMateriales.innerHTML = '<p style="color:red;">Error al cargar los materiales.</p>';
    }
}

// 4. Cargar materiales PENDIENTES (Solo Profes/Admins)
async function cargarPendientes() {
    contenedorPendientes.innerHTML = '<p>Buscando pendientes...</p>';
    try {
        const q = query(collection(db, "materiales"), orderBy("fecha", "desc"));
        const querySnapshot = await getDocs(q);
        contenedorPendientes.innerHTML = '';

        let hayPendientes = false;

        querySnapshot.forEach((documento) => {
            const data = documento.data();
            if (data.estado === 'pendiente') {
                hayPendientes = true;
                const div = document.createElement('div');
                div.style = 'border: 1px solid #ffe8a1; padding: 10px; background: #fff; border-radius: 5px;';
                div.innerHTML = `
                    <strong>${data.titulo}</strong> (${data.materia})<br>
                    <a href="${data.url}" target="_blank">Revisar Link</a><br>
                    <small>Subido por: ${data.subidoPor}</small><br>
                    <button class="btn-aprobar" data-id="${documento.id}" style="margin-top:5px; background: green; color: white; border: none; padding: 5px; cursor:pointer;">Aprobar ✅</button>
                    <button class="btn-rechazar" data-id="${documento.id}" style="margin-top:5px; background: red; color: white; border: none; padding: 5px; cursor:pointer;">Rechazar ❌</button>
                `;
                contenedorPendientes.appendChild(div);
            }
        });

        if (!hayPendientes) {
            contenedorPendientes.innerHTML = '<p>No hay materiales pendientes de revisión.</p>';
        }

        // Agregar eventos a los botones de aprobar/rechazar
        document.querySelectorAll('.btn-aprobar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                await updateDoc(doc(db, "materiales", id), { estado: 'aprobado' });
                cargarPendientes();
                cargarMateriales();
            });
        });

        document.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                await updateDoc(doc(db, "materiales", id), { estado: 'rechazado' });
                cargarPendientes();
            });
        });

    } catch (error) {
        console.error("Error al cargar pendientes:", error);
    }
}
