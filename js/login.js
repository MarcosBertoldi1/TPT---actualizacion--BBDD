import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const btnGoogle = document.getElementById('btn-google');
const mensajeError = document.getElementById('mensaje-error');
const mensajeErrorRegistro = document.getElementById('mensaje-error-registro');

// --- FUNCIÓN PARA VERIFICAR EL ROL Y REDIRIGIR ---
async function verificarRolYRedirigir(user) {
    // Obtenemos el correo ingresado, quitándole los espacios extra por si acaso
    const emailIngresado = user.email ? user.email.trim() : ''; 

    // ÚNICOS correos con rol de profesor. El resto de usuarios son alumnos.
    const correosProfesores = [
        'marcos.bertoldi.945@alu.tecnica29de6.edu.ar',
        'pepito@tecnica29de6.edu.ar',
        'UPruebaDocente@gmail.com'
    ];

    // Se compara en minúsculas solo temporalmente para evitar fallos por mayúsculas
    const esProfesor = correosProfesores.some(correo => 
        correo.toLowerCase() === emailIngresado.toLowerCase()
    );

    if (esProfesor) {
        // ES PROFESOR
        localStorage.setItem('rolUsuario', 'profesor'); 
        alert(`¡Bienvenido/a Profesor/a!`);
    } else {
        // ES ALUMNO 
        localStorage.setItem('rolUsuario', 'alumno'); 
        alert(`¡Bienvenido/a Alumno/a!`);
    }

    // Redirección compatible con GitHub Pages y Localhost
    const esGitHub = window.location.hostname.includes('github.io');
    const repoNombre = 'TPT---actualizacion--BBDD'; 
    
    window.location.href = esGitHub 
        ? `/${repoNombre}/index.html` 
        : './index.html';
}

// --- INICIO DE SESIÓN CON CORREO Y CONTRASEÑA ---
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        if (mensajeError) mensajeError.textContent = '';

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await verificarRolYRedirigir(userCredential.user);
        } catch (error) {
            console.error("Error al iniciar sesión:", error.code);
            if (mensajeError) {
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                    mensajeError.textContent = 'Correo o contraseña incorrectos.';
                } else if (error.code === 'auth/user-not-found') {
                    mensajeError.textContent = 'No existe un usuario registrado con este correo.';
                } else {
                    mensajeError.textContent = 'Error al intentar ingresar. Intenta nuevamente.';
                }
            }
        }
    });
}

// --- INICIO DE SESIÓN CON GOOGLE ---
if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        if (mensajeError) mensajeError.textContent = ''; 

        try {
            const result = await signInWithPopup(auth, provider);
            await verificarRolYRedirigir(result.user);
        } catch (error) {
            console.error("Error con Google:", error.code);
            if (error.code !== 'auth/popup-closed-by-user' && mensajeError) {
                mensajeError.textContent = 'Error al iniciar sesión con Google.';
            }
        }
    });
}

// --- CREAR CUENTA NUEVA ---
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-registro').value.trim();
        const password = document.getElementById('password-registro').value.trim();
        if (mensajeErrorRegistro) mensajeErrorRegistro.textContent = '';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await verificarRolYRedirigir(userCredential.user);
        } catch (error) {
            console.error("Error al crear cuenta:", error.code);
            if (mensajeErrorRegistro) {
                if (error.code === 'auth/email-already-in-use') {
                    mensajeErrorRegistro.textContent = 'Este correo ya está registrado. Intentá iniciar sesión.';
                } else if (error.code === 'auth/weak-password') {
                    mensajeErrorRegistro.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                } else {
                    mensajeErrorRegistro.textContent = 'Error al crear la cuenta.';
                }
            }
        }
    });
}
