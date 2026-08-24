<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso - Tecnología para Todos</title>
    
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/header.css">
    
    <style>
        /* Estilos rápidos para que los formularios se vean ordenados */
        .contenedor-formularios {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 40px;
        }
        .caja-form {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            border: 1px solid #ddd;
            width: 100%;
            max-width: 400px;
        }
        .caja-form h2 {
            margin-top: 0;
            margin-bottom: 20px;
            font-size: 1.5rem;
            text-align: center;
        }
        .grupo-input {
            margin-bottom: 15px;
        }
        .grupo-input label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .grupo-input input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .btn-full {
            width: 100%;
            padding: 10px;
            margin-top: 10px;
            font-size: 1rem;
            cursor: pointer;
            border-radius: 4px;
            border: none;
            font-weight: bold;
        }
        .btn-ingresar { background: #0056b3; color: white; }
        .btn-google-style { background: #db4437; color: white; margin-top: 15px; }
        .btn-registrar { background: #28a745; color: white; }
        .mensaje-error { color: #dc3545; font-weight: bold; margin-top: 10px; text-align: center; font-size: 0.9rem; min-height: 20px;}
        .divisor { text-align: center; margin: 20px 0; color: #777; font-size: 0.9rem; }
    </style>
</head>
<body>

    <header class="encabezado-principal">
        <div class="contenedor-header">
            <a href="index.html" class="logo-banner">
                <img src="img/logoTPT4.png" alt="Logo TPT" class="logo-img-banner" width="75" height="75">
                <div class="logo-texto-lineal">
                    <h1>Tecnología para todos</h1>
                    <span class="tagline">Hacer simple lo que parece difícil.</span>
                </div>
            </a>
        </div>
        <nav class="navegacion-principal">
            <ul>
                <li><a href="index.html">Inicio</a></li>
                <li><a href="sobre.html">Sobre el Proyecto</a></li>
            </ul>
        </nav>
    </header>

    <main id="contenido-principal" class="contenedor-pagina">
        
        <div style="text-align: center; margin-top: 20px;">
            <h1>¡Bienvenido a la plataforma!</h1>
            <p>Ingresá con tu cuenta o registrate para acceder a todos los materiales.</p>
        </div>

        <div class="contenedor-formularios">
            
            <!-- CAJA 1: INICIAR SESIÓN -->
            <div class="caja-form">
                <h2>Iniciar Sesión</h2>
                <form id="form-login">
                    <div class="grupo-input">
                        <label for="email">Correo Electrónico</label>
                        <input type="email" id="email" required placeholder="tu@correo.com">
                    </div>
                    <div class="grupo-input">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" required placeholder="******">
                    </div>
                    <button type="submit" class="btn-full btn-ingresar">Ingresar</button>
                    <div id="mensaje-error" class="mensaje-error"></div>
                </form>

                <div class="divisor">O ingresá rápidamente con</div>
                <button id="btn-google" class="btn-full btn-google-style">G Iniciar sesión con Google</button>
            </div>

            <!-- CAJA 2: CREAR CUENTA NUEVA -->
            <div class="caja-form">
                <h2>Crear Cuenta Nueva</h2>
                <form id="form-registro">
                    <div class="grupo-input">
                        <label for="email-registro">Correo Electrónico</label>
                        <input type="email" id="email-registro" required placeholder="tu@correo.com">
                    </div>
                    <div class="grupo-input">
                        <label for="password-registro">Contraseña (Mín. 6 caracteres)</label>
                        <input type="password" id="password-registro" required placeholder="******">
                    </div>
                    <button type="submit" class="btn-full btn-registrar">Registrarme</button>
                    <div id="mensaje-error-registro" class="mensaje-error"></div>
                </form>
            </div>

        </div>

    </main>

    <footer class="pie-pagina" style="margin-top: 50px;">
        <p>Proyecto <strong>Tecnología para Todos</strong>. ET29 DE 6.</p>
    </footer>

    <!-- SCRIPT DE AUTENTICACIÓN Y ROLES -->
    <script type="module">
        import { auth } from './js/firebase-config.js'; // Ajustá la ruta según dónde esté este archivo html
        import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

        const formLogin = document.getElementById('form-login');
        const btnGoogle = document.getElementById('btn-google');
        const formRegistro = document.getElementById('form-registro');
        
        const mensajeError = document.getElementById('mensaje-error');
        const mensajeErrorRegistro = document.getElementById('mensaje-error-registro');

        // --- FUNCIÓN PARA VERIFICAR EL ROL ---
        async function verificarRolYRedirigir(user) {
            const email = user.email.toLowerCase(); 

            const correosAdmin = [
                'marcos.bertoldi.945@alutecnica29de6.edu.ar', 
                'agustin.meza.779@alutecnica29de6.edu.ar'
            ];

            if (correosAdmin.includes(email)) {
                localStorage.setItem('rolUsuario', 'admin'); 
                alert(`¡Bienvenido/a Administrador/a!`);
                window.location.href = 'index.html';

            } else if (email.endsWith('@tecnica29de6.edu.ar')) {
                localStorage.setItem('rolUsuario', 'profesor'); 
                alert(`¡Bienvenido/a Profesor/a!`);
                window.location.href = 'index.html';

            } else {
                localStorage.setItem('rolUsuario', 'alumno'); 
                alert(`¡Bienvenido/a Alumno/a!`);
                window.location.href = 'index.html';
            }
        }

        // --- INICIO DE SESIÓN CON CORREO Y CONTRASEÑA ---
        if (formLogin) {
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value.trim();
                mensajeError.textContent = '';

                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    await verificarRolYRedirigir(userCredential.user);
                } catch (error) {
                    console.error("Error al iniciar sesión:", error.code);
                    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                        mensajeError.textContent = 'Correo o contraseña incorrectos.';
                    } else if (error.code === 'auth/user-not-found') {
                        mensajeError.textContent = 'No existe un usuario con este correo.';
                    } else {
                        mensajeError.textContent = 'Error al intentar ingresar.';
                    }
                }
            });
        }

        // --- INICIO DE SESIÓN / REGISTRO CON GOOGLE ---
        if (btnGoogle) {
            btnGoogle.addEventListener('click', async () => {
                const provider = new GoogleAuthProvider();
                mensajeError.textContent = ''; 

                try {
                    const result = await signInWithPopup(auth, provider);
                    await verificarRolYRedirigir(result.user);
                } catch (error) {
                    console.error("Error con Google:", error.code);
                    if (error.code !== 'auth/popup-closed-by-user') {
                        mensajeError.textContent = 'Error al iniciar sesión con Google.';
                    }
                }
            });
        }

        // --- REGISTRO DE CUENTA NUEVA ---
        if (formRegistro) {
            formRegistro.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email-registro').value.trim();
                const password = document.getElementById('password-registro').value.trim();
                mensajeErrorRegistro.textContent = '';

                try {
                    // Firebase crea la cuenta y automáticamente inicia la sesión
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    await verificarRolYRedirigir(userCredential.user);
                } catch (error) {
                    console.error("Error al crear cuenta:", error.code);
                    if (error.code === 'auth/email-already-in-use') {
                        mensajeErrorRegistro.textContent = 'Este correo ya está registrado. Intentá iniciar sesión.';
                    } else if (error.code === 'auth/weak-password') {
                        mensajeErrorRegistro.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                    } else {
                        mensajeErrorRegistro.textContent = 'Error al crear la cuenta.';
                    }
                }
            });
        }
    </script>
</body>
</html>
