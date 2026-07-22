Integrantes:
- Macias Bravo Melina.
- Lizzardi Milazzo.



# Calculadora Clásica con Pasarela de Pago Payphone

Este proyecto es una aplicación web interactiva desarrollada con **React** y **Vite**. Cuenta con una calculadora funcional y elegante que bloquea los resultados hasta que el usuario realiza un pago exitoso a través de la pasarela de pago **Payphone**.

## 🚀 Características
- **Interfaz moderna**: Diseño responsivo y estilizado para la calculadora.
- **Integración con Payphone**: Uso del botón de pagos de Payphone para procesar transacciones en USD.
- **Seguridad**: Configuración mediante variables de entorno para proteger las credenciales del comercio.
- **Despliegue rápido**: Listo para ser subido a GitHub y desplegado directamente en Vercel.

---

## 🛠️ Requisitos Previos
Asegúrate de tener instalado:
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
- Una cuenta en [Payphone Developer Hub](https://developer.payphonetodoesposible.com/) para obtener tus credenciales (Token y Store ID).

---

## 💻 Configuración Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo llamado `.env.local` en la raíz del proyecto (este archivo está ignorado por Git por seguridad) y define tus credenciales basándote en `.env.example`:
   ```env
   VITE_PAYPHONE_TOKEN=tu_token_de_payphone_aqui
   VITE_PAYPHONE_STORE_ID=tu_store_id_de_payphone_aqui
   VITE_PAYPHONE_AMOUNT_CENTS=315 # El monto en centavos (ej: 315 = $3.15)
   VITE_PAYPHONE_CURRENCY=USD
   VITE_PAYPHONE_LAT=-1.831239
   VITE_PAYPHONE_LNG=-78.183406
   VITE_PAYPHONE_TIMEZONE=-5
   VITE_PAYPHONE_REFERENCE=Desbloqueo de resultado de calculadora
   VITE_PAYPHONE_PHONE=+593999999999
   VITE_PAYPHONE_EMAIL=ejemplo@mail.com
   VITE_PAYPHONE_DOCUMENT_ID=1700000000
   VITE_PAYPHONE_IDENTIFICATION_TYPE=1
   ```

3. **Ejecutar en entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📦 Cómo subirlo a GitHub

Para subir este proyecto a un nuevo repositorio en GitHub:

1. Crea un repositorio vacío en tu cuenta de GitHub (no agregues archivos README, .gitignore ni licencia durante la creación).
2. Abre tu terminal en la carpeta del proyecto y ejecuta los siguientes comandos para asociarlo y subirlo:
   ```bash
   # Agregar el origen remoto de tu repositorio
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

   # Subir los archivos a la rama principal (main)
   git push -u origin main
   ```
   *(Reemplaza `TU_USUARIO` y `TU_REPOSITORIO` con tus datos de GitHub).*

---

## ☁️ Despliegue en Vercel

Sigue estos pasos para desplegar la aplicación en Vercel de forma gratuita:

1. Ve a [Vercel Workspace](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New...** y luego en **Project**.
3. Importa el repositorio de GitHub que acabas de subir (`pasarela-de-pago`).
4. **Configuración del proyecto (Framework Preset):**
   - Vercel detectará automáticamente que es un proyecto **Vite**.
   - Comando de compilación (`Build Command`): `npm run build` o `vite build`.
   - Directorio de salida (`Output Directory`): `dist`.
5. **Variables de Entorno (Environment Variables):**
   - Antes de presionar "Deploy", expande la sección **Environment Variables**.
   - Agrega cada una de las variables requeridas (al menos `VITE_PAYPHONE_TOKEN` y `VITE_PAYPHONE_STORE_ID` con sus valores reales de producción o pruebas).
6. Haz clic en **Deploy**. ¡Listo! Vercel compilará tu aplicación y te dará una URL pública.
