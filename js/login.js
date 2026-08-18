import { auth } from './firebase-config.js';
// Sumamos GoogleAuthProvider, signInWithPopup y signOut
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const formLogin = document.getElementById('form-login');
const btnGoogle = document.getElementById('btn-google');
const mensajeError = document.getElementById('mensaje-error');

// --- FUNCIÓN PARA VERIFICAR EL ROL SEGÚN EL DOMINIO ---
async function verificarRolYRedirigir(user) {
    const email = user.email.toLowerCase(); // Pasamos todo a minúscula por las dudas

    if (email.endsWith('@tecnica29de6.edu.ar')) {
        // ES PROFESOR
        localStorage.setItem('rolUsuario', 'profesor'); // Guardamos el rol en la PC
        alert(`¡Bienvenido/a Profesor/a!`);
        window.location.href = 'index.html';

    } else if (email.endsWith('@alu.tecnica29de6.edu.ar')) {
        // ES ALUMNO
        localStorage.setItem('rolUsuario', 'alumno'); // Guardamos el rol en la PC
        alert(`¡Bienvenido/a Alumno/a!`);
        window.location.href = 'index.html';

    } else {
        // CORREO NO PERMITIDO (Ej: @gmail.com)
        await signOut(auth); // Cerramos la sesión inmediatamente por seguridad
        localStorage.removeItem('rolUsuario'); // Borramos cualquier rol guardado
        mensajeError.textContent = 'Acceso denegado. Debes usar tu correo institucional (@tecnica29de6.edu.ar o @alu.tecnica29de6.edu.ar).';
    }
}


// --- 1. INICIO DE SESIÓN CON CORREO Y CONTRASEÑA ---
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        mensajeError.textContent = '';

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Si el login es exitoso, mandamos al usuario a la función que revisa el rol
            await verificarRolYRedirigir(userCredential.user);
            
        } catch (error) {
            console.error("Error al iniciar sesión:", error.code);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                mensajeError.textContent = 'Correo o contraseña incorrectos.';
            } else if (error.code === 'auth/user-not-found') {
                mensajeError.textContent = 'No existe un usuario registrado con este correo.';
            } else {
                mensajeError.textContent = 'Error al intentar ingresar. Intenta nuevamente.';
            }
        }
    });
}

// --- 2. INICIO DE SESIÓN CON GOOGLE ---
if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        mensajeError.textContent = ''; 

        try {
            const result = await signInWithPopup(auth, provider);
            // Si el login con Google es exitoso, mandamos al usuario a la función que revisa el rol
            await verificarRolYRedirigir(result.user);
            
        } catch (error) {
            console.error("Error con Google:", error.code);
            if (error.code !== 'auth/popup-closed-by-user') {
                mensajeError.textContent = 'Error al iniciar sesión con Google.';
            }
        }
    });
}
