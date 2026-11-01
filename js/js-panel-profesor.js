// =============================================================================
// Panel del profesor: aprueba los videos que mandan los alumnos y los PUBLICA como una página
// completa (video + descripción + material + comentarios), con la misma estructura que el resto.
//
//  - El video aprobado se guarda en la colección "nodos" (la que usa contenido.html), en el lugar
//    que elija el docente: una lista de videos de una página fija o un tema agregado desde el "+".
//  - El aporte original (colección "materiales") queda marcado como "publicado" con el enlace a la página.
//  - Los datos que escriben los alumnos entran siempre con textContent, nunca con innerHTML.
// =============================================================================
import { db, auth } from './firebase-config.js';
import { collection, getDocs, deleteDoc, doc, query, orderBy, where, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const RAIZ = new URL('../', import.meta.url).href;
const contenedorPendientes = document.getElementById('contenedor-pendientes');
const contenedorPublicados = document.getElementById('contenedor-publicados');

let usuarioActual = null;
const rolActual = localStorage.getItem('rolUsuario');

// ---------------------------------------------------------------- dónde se puede publicar un video
// Páginas fijas del sitio (las claves coinciden con las que usa contenido-docente.js: "página#l<número de lista>").
const MATERIAS = {
    'Mat/mat-L.html': 'Lógica Computacional', 'Mat/mat-OC.html': 'Organización de Computadoras',
    'Mat/mat-POO.html': 'Laboratorio de POO', 'Mat/mat-R.html': 'Redes',
};
const LISTAS_FIJAS = [
    { clave: 'Mat/L/introL.html#l0', materia: 'Lógica Computacional', tema: 'Introducción' },
    { clave: 'Mat/L/estructurasL.html#l0', materia: 'Lógica Computacional', tema: 'Estructuras Lógicas' },
    { clave: 'Mat/L/tablasyconectoresL.html#l0', materia: 'Lógica Computacional', tema: 'Tablas de Verdad' },
    { clave: 'Mat/L/tablasyconectoresL.html#l1', materia: 'Lógica Computacional', tema: 'Tablas de Verdad › Conectores lógicos' },
    { clave: 'Mat/L/tablasyconectoresL.html#l2', materia: 'Lógica Computacional', tema: 'Tablas de Verdad › Disyunción (inclusiva)' },
    { clave: 'Mat/L/conectoresL.html#l0', materia: 'Lógica Computacional', tema: 'Conectores lógicos' },
    { clave: 'Mat/OC/introOC.html#l0', materia: 'Organización de Computadoras', tema: 'Introducción' },
    { clave: 'Mat/OC/cpu.html#l0', materia: 'Organización de Computadoras', tema: 'CPU' },
    { clave: 'Mat/POO/introPOO.html#l0', materia: 'Laboratorio de POO', tema: 'Introducción' },
    { clave: 'Mat/R/introR.html#l0', materia: 'Redes', tema: 'Introducción' },
];
const TEMAS_FIJOS = { 'Mat/L/leyesL.html': { materia: 'Lógica Computacional', tema: 'Leyes Lógicas' } };
// Cuando se agregan páginas fijas nuevas con listas de videos, se suman a LISTAS_FIJAS.

let destinos = [];                                   // { clave, grupo, texto }

async function cargarDestinos() {
    destinos = LISTAS_FIJAS.map((d) => ({ clave: d.clave, grupo: d.materia, texto: d.tema, materia: d.materia, tema: d.tema, fijo: true }));
    try {
        const snap = await getDocs(query(collection(db, 'nodos'), where('tipo', '==', 'tema')));
        const porId = new Map(snap.docs.map((d) => [d.id, { ...d.data(), id: d.id }]));
        porId.forEach((n) => {
            const cadena = [n.titulo]; let a = n;
            while (a.padre && !a.padre.includes('#') && porId.has(a.padre)) { a = porId.get(a.padre); cadena.unshift(a.titulo); }
            if (!a.padre || !a.padre.includes('#')) return;                       // rama rota: el padre ya no existe
            const pagina = a.padre.split('#')[0];
            const fijo = TEMAS_FIJOS[pagina], lista = LISTAS_FIJAS.find((l) => l.clave.startsWith(pagina + '#'));
            const materia = MATERIAS[pagina] || (fijo && fijo.materia) || (lista && lista.materia) || 'Otros';
            const base = fijo ? [fijo.tema] : (lista ? [lista.tema] : []);
            destinos.push({ clave: n.id, grupo: materia, texto: [...base, ...cadena].join(' › '), fijo: false });
        });
    } catch (error) {
        console.error('No se pudieron leer los temas agregados:', error);
    }
}

// ---------------------------------------------------------------- utilidades
const el = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; };
const normalizar = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const claveMateria = (s) => normalizar(s).replace(/\b(las|los|la|el|de)\b/g, '').replace(/\s+/g, ' ').trim();

function idYoutube(texto) {                          // acepta el ID solo o cualquier link de YouTube
    const t = String(texto || '').trim();
    if (/^[\w-]{11}$/.test(t)) return t;
    let u; try { u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t); } catch { return null; }
    const host = u.hostname.replace(/^(www|m)\./, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        if (u.pathname === '/watch') id = u.searchParams.get('v');
        else { const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{11})/); if (m) id = m[2]; }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
}
function destinoSugerido(data) {                     // intenta ubicar el video según lo que eligió el alumno
    const mat = claveMateria(data.materia), mod = normalizar(data.modulo);
    if (!mat) return '';
    const candidatos = destinos.filter((d) => d.fijo && claveMateria(d.materia) === mat);
    const hallado = candidatos.find((d) => mod && (mod.includes(normalizar(d.tema)) || normalizar(d.tema).includes(mod)));
    return hallado ? hallado.clave : '';
}
function selectDestinos(seleccion) {
    const s = el('select'); s.style.cssText = 'width:100%;padding:10px;border-radius:6px;border:1px solid var(--color-borde);margin-bottom:10px;';
    s.append(Object.assign(el('option', null, '-- Elegí dónde publicarlo --'), { value: '' }));
    const grupos = [...new Set(destinos.map((d) => d.grupo))].sort((a, b) => a.localeCompare(b, 'es'));
    grupos.forEach((g) => {
        const og = el('optgroup'); og.label = g;
        destinos.filter((d) => d.grupo === g).forEach((d) => og.append(Object.assign(el('option', null, d.texto), { value: d.clave })));
        s.append(og);
    });
    s.value = seleccion || ''; return s;
}
function etiquetaDe(clave) { const d = destinos.find((x) => x.clave === clave); return d ? d.grupo + ' › ' + d.texto : clave; }
function campo(etiqueta, control) {
    const l = el('label', null, etiqueta); l.style.cssText = 'display:block;margin-bottom:5px;font-weight:bold;font-size:.9rem;'; return [l, control];
}

// ---------------------------------------------------------------- acceso
onAuthStateChanged(auth, async (user) => {
    if (user && (rolActual === 'profesor' || rolActual === 'admin')) {
        usuarioActual = user;
        await cargarDestinos();
        cargarPendientes();
        cargarPublicados();
    } else {
        window.location.href = RAIZ + 'index.html';
    }
});

// ---------------------------------------------------------------- aportes pendientes de los alumnos
function tarjetaPendiente(id, data) {
    const card = el('div', 'video-review-card');
    const cab = el('div', 'video-review-header'), info = el('div', 'video-review-info');
    info.append(el('h4', null, data.titulo || '(sin título)'),
        el('span', 'badge-materia', [data.materia, data.modulo].filter(Boolean).join(' › ') || 'Sin materia'));
    const autor = el('div', 'autor-text', 'Enviado por: '); autor.append(el('strong', null, data.subidoPor || 'Desconocido'));
    info.append(autor); cab.append(info); card.append(cab);

    const vid = idYoutube(data.url), vc = el('div', 'video-container');
    if (vid) {
        const f = document.createElement('iframe');
        f.width = '100%'; f.height = '250'; f.src = 'https://www.youtube.com/embed/' + vid; f.setAttribute('frameborder', '0'); f.setAttribute('allowfullscreen', '');
        f.title = 'Vista previa del video'; vc.append(f);
    } else vc.append(el('p', null, 'El link del video no es válido. Si lo aprobás no se podrá publicar: rechazalo.'));
    card.append(vc);

    const acciones = el('div', 'review-actions'); acciones.style.cssText = 'background:var(--color-fondo-header);padding:15px;border-radius:8px;';
    const inTitulo = el('input'); inTitulo.type = 'text'; inTitulo.maxLength = 160; inTitulo.value = data.titulo || '';
    inTitulo.style.cssText = 'width:100%;padding:10px;border-radius:6px;border:1px solid var(--color-borde);margin-bottom:10px;box-sizing:border-box;';
    const inDesc = el('textarea'); inDesc.rows = 3; inDesc.maxLength = 600; inDesc.value = data.descripcion || '';
    inDesc.style.cssText = 'width:100%;margin-bottom:10px;box-sizing:border-box;';
    const sel = selectDestinos(destinoSugerido(data));
    const inComentario = el('textarea'); inComentario.rows = 2; inComentario.placeholder = 'Escribe tu corrección o feedback para el alumno...';
    inComentario.style.cssText = 'width:100%;box-sizing:border-box;';
    acciones.append(...campo('Título que va a tener la página:', inTitulo), ...campo('Descripción:', inDesc),
        ...campo('Publicar en:', sel), inComentario);

    const botones = el('div', 'action-buttons');
    const ok = el('button', 'btn-success btn-aprobar', 'Aprobar y publicar'); ok.type = 'button';
    const no = el('button', 'btn-danger btn-rechazar', 'Rechazar'); no.type = 'button';
    botones.append(ok, no); acciones.append(botones); card.append(acciones);

    ok.onclick = async () => {
        const titulo = inTitulo.value.trim().slice(0, 160);
        if (!vid) { alert('El link del video no es válido.'); return; }
        if (!titulo) { alert('Escribí un título.'); return; }
        if (!sel.value) { alert('Elegí dónde publicar este video.'); return; }
        ok.disabled = no.disabled = true; ok.textContent = 'Publicando…';
        try {
            const lote = writeBatch(db), nuevo = doc(collection(db, 'nodos'));
            lote.set(nuevo, {
                padre: sel.value, tipo: 'video', titulo, descripcion: inDesc.value.trim().slice(0, 600),
                videoId: vid, materialUrl: '', materialNombre: '', orden: Date.now(),
                creadoPor: usuarioActual.email, origenMaterial: id, fecha: serverTimestamp(),
            });
            lote.update(doc(db, 'materiales', id), {
                estado: 'publicado', nodoId: nuevo.id, destino: etiquetaDe(sel.value),
                comentarioProfesor: inComentario.value.trim() || 'Excelente aporte, aprobado.',
            });
            await lote.commit();
            const hecho = el('div', 'video-review-card'), p = el('p');
            p.append(el('strong', null, '✔ «' + titulo + '» publicado en ' + etiquetaDe(sel.value) + '. '));
            const a = el('a', null, 'Ver la página'); a.href = RAIZ + 'contenido.html?id=' + encodeURIComponent(nuevo.id); p.append(a);
            hecho.append(p); card.replaceWith(hecho);
        } catch (error) {
            console.error('No se pudo publicar:', error);
            alert('No se pudo publicar (' + (error.code || error.message) + '). Revisá que las reglas de Firestore estén publicadas.');
            ok.disabled = no.disabled = false; ok.textContent = 'Aprobar y publicar';
        }
    };
    no.onclick = async () => {
        no.disabled = ok.disabled = true;
        try {
            const lote = writeBatch(db);
            lote.update(doc(db, 'materiales', id), { estado: 'rechazado', comentarioProfesor: inComentario.value.trim() || 'Material no cumple con los requisitos.' });
            await lote.commit(); card.remove();
            if (!contenedorPendientes.querySelector('.video-review-card')) mostrarVacio();
        } catch (error) {
            console.error('No se pudo rechazar:', error); alert('No se pudo rechazar (' + (error.code || error.message) + ').');
            no.disabled = ok.disabled = false;
        }
    };
    return card;
}
function mostrarVacio() {
    contenedorPendientes.replaceChildren(el('div', null, 'No hay entregas pendientes. ¡Todo al día!'));
    contenedorPendientes.firstChild.style.cssText = 'text-align:center;color:var(--color-texto-suave);padding:20px;';
}
async function cargarPendientes() {
    if (!contenedorPendientes) return;
    contenedorPendientes.replaceChildren(el('div', 'loader-text', 'Buscando entregas pendientes...'));
    try {
        const snap = await getDocs(query(collection(db, 'materiales'), orderBy('fecha', 'desc')));
        const pendientes = snap.docs.filter((d) => d.data().estado === 'pendiente');
        if (!pendientes.length) return mostrarVacio();
        contenedorPendientes.replaceChildren(...pendientes.map((d) => tarjetaPendiente(d.id, d.data())));
    } catch (error) {
        console.error('Error al cargar pendientes:', error);
        const e = el('div', null, 'Error al cargar la base de datos.'); e.style.color = '#ef4444'; contenedorPendientes.replaceChildren(e);
    }
}

// ---------------------------------------------------------------- materiales aprobados antes (eliminar)
async function cargarPublicados() {
    if (!contenedorPublicados) return;
    contenedorPublicados.replaceChildren(el('div', 'loader-text', 'Cargando materiales publicados...'));
    try {
        const snap = await getDocs(query(collection(db, 'materiales'), where('estado', '==', 'aprobado')));
        if (snap.empty) {
            const p = el('p', null, 'No hay materiales anteriores. Los videos nuevos se publican como páginas y se editan o eliminan desde su propia página.');
            p.style.cssText = 'color:var(--color-texto-suave);text-align:center;padding:15px;'; contenedorPublicados.replaceChildren(p); return;
        }
        contenedorPublicados.replaceChildren(...snap.docs.map((documento) => {
            const data = documento.data(), div = el('div', 'video-review-card'); div.style.marginBottom = '15px';
            const fila = el('div'); fila.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;';
            const info = el('div'), t = el('h4', null, data.titulo); t.style.cssText = 'margin:0 0 5px 0;font-size:1.05rem;';
            const mod = el('span', null, data.modulo || 'General'); mod.style.cssText = 'background:var(--color-borde);color:var(--color-texto);padding:3px 10px;border-radius:12px;font-size:.8rem;font-weight:600;margin-left:5px;';
            const autor = el('div', 'autor-text', 'Subido por: '); autor.style.marginTop = '5px'; autor.append(el('strong', null, data.subidoPor || ''));
            info.append(t, el('span', 'badge-materia', data.materia || ''), mod, autor);
            const borrar = el('button', 'btn-danger btn-eliminar', 'Eliminar'); borrar.type = 'button'; borrar.style.cssText = 'padding:8px 14px;font-size:.85rem;border-radius:6px;';
            borrar.onclick = async () => {
                if (!confirm('¿Estás seguro de que deseas eliminar este material publicado? Dejará de aparecer en la vista de los alumnos.')) return;
                try { await deleteDoc(doc(db, 'materiales', documento.id)); cargarPublicados(); }
                catch (error) { alert('No se pudo eliminar (' + (error.code || error.message) + ').'); }
            };
            fila.append(info, borrar); div.append(fila); return div;
        }));
    } catch (error) {
        console.error('Error al cargar publicados:', error);
        const e = el('div', null, 'Error al cargar la lista de publicados.'); e.style.color = '#ef4444'; contenedorPublicados.replaceChildren(e);
    }
}

