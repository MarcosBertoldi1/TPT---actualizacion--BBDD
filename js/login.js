import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const formLogin = document.getElementById('form-login');
const mensajeError = document.getElementById('mensaje-error');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        mensajeError.textContent = '';

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            alert(`¡Bienvenido/a ${user.email}!`);
            
            // Redirige al inicio
            window.location.href = 'index.html';

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
