# INFORME TÉCNICO: INTEGRACIÓN Y DESPLIEGUE CONTINUO (CI/CD)

**Asignatura:** Integración de Sistemas y Plataformas  
**Institución:** Universidad Laica Eloy Alfaro de Manabí (ULEAM)  
**Carrera:** Tecnologías de la Información  
**Estudiante:** Lizzardi Anthoni Milazzo Cedeño  

---

## 1. Configuración de la Herramienta de Despliegue (Vercel)

Para la herramienta de despliegue se seleccionó **Vercel** debido a su integración nativa con repositorios de control de versiones y su optimización para aplicaciones web basadas en React y Vite.

### Pasos de Configuración:
1. **Creación del Proyecto en Vercel:** Se vinculó la cuenta de GitHub con Vercel y se importó el repositorio `pasarela-de-pago`.
2. **Configuración de Variables de Entorno (Environment Variables):**
   Para asegurar que el token y credenciales de Payphone no queden expuestos en el código del repositorio público, se configuraron de forma segura en el dashboard de Vercel (dentro de *Settings -> Environment Variables*). Las variables cargadas fueron:
   - `VITE_PAYPHONE_TOKEN`: Bearer token de autenticación propio para el Sandbox de Payphone.
   - `VITE_PAYPHONE_CURRENCY`: `USD`
   - `VITE_PAYPHONE_AMOUNT_CENTS`: `100` (monto a cobrar expresado en centavos).
3. **Autorización del Dominio en la Pasarela (Payphone):**
   Dado que Payphone restringe las transacciones por seguridad mediante la cabecera `Origin` del navegador, se ingresó al panel de **Payphone Developer** y en la pestaña *Detalles* se registraron las URLs de producción provistas por Vercel:
   - **Dominio web:** `https://pasarela-de-pago-lizzardis-projects.vercel.app`
   - **URL de Respuesta:** `https://pasarela-de-pago-lizzardis-projects.vercel.app`

---

## 2. Implementación del Pipeline (CI/CD)

Se diseñaron y prepararon **dos alternativas** de Pipeline de CI/CD para automatizar el ciclo de compilación y despliegue cada vez que se realice un `git push` a la rama principal (`main`).

### Opción A: GitHub Actions (Implementada y Activa en Producción)
Ubicación del archivo en el repositorio: `.github/workflows/ci-cd.yml`

Este pipeline automatizado realiza las siguientes acciones:
- **Disparador (Trigger):** Se activa automáticamente al hacer un cambio o push en la rama `main`.
- **Fase de Build (Construcción):** Descarga el código, instala dependencias (`npm ci`) y compila el proyecto (`npm run build`) en un entorno virtual Linux para verificar que no existan errores de código.
- **Fase de Deploy (Despliegue):** Utiliza Vercel CLI para extraer la configuración segura del proyecto (usando secrets de GitHub), compila los artefactos de producción y despliega de manera inmediata en la nube de Vercel.

#### Código del Pipeline en GitHub Actions:
```yaml
name: Pipeline de Integración y Despliegue Continuo (CI/CD)

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  # Etapa de Construcción y Verificación (Build)
  build:
    name: Compilar Proyecto
    runs-on: ubuntu-latest
    steps:
      - name: Descargar Código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Instalar Dependencias
        run: npm ci

      - name: Compilar Aplicación (Build)
        run: npm run build

  # Etapa de Despliegue (Deploy)
  deploy:
    name: Desplegar en Vercel
    needs: build # Solo se ejecuta si la etapa de Build pasa correctamente
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Descargar Código
        uses: actions/checkout@v4

      - name: Instalar Vercel CLI
        run: npm install --global vercel

      - name: Descargar Configuración de Vercel
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Compilar para Vercel
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Desplegar en Producción
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

### Opción B: Jenkinsfile (Configuración Alternativa)
Ubicación del archivo en el repositorio: `Jenkinsfile`

Esta es una configuración alternativa si se prefiere implementar un servidor local o en la nube utilizando Jenkins. Utiliza etapas declarativas estructuradas.

```groovy
pipeline {
    agent any

    tools {
        nodejs 'node' // NodeJS previamente configurado en las herramientas de Jenkins
    }

    environment {
        VERCEL_TOKEN      = credentials('vercel-token')
        VERCEL_ORG_ID     = credentials('vercel-org-id')
        VERCEL_PROJECT_ID = credentials('vercel-project-id')
    }

    stages {
        stage('Descargar Código') {
            steps {
                checkout scm
            }
        }

        stage('Instalar Dependencias') {
            steps {
                bat 'npm install' // Cambiar a 'sh' si Jenkins corre en Linux
            }
        }

        stage('Compilar (Build)') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Desplegar en Vercel') {
            steps {
                bat 'npm install -g vercel'
                bat "vercel deploy --prod --token=${env.VERCEL_TOKEN} --yes"
            }
        }
    }
}
```

---

## 3. Aporte Extra / Solución al error de "Store ID Mismatch"

Durante el desarrollo de la práctica, se presentó un error en el widget de pagos de Payphone que impedía inicializar la cajita en producción, mostrando el mensaje: **"La tienda asociada no existe"** o **"Su aplicación no está autorizada para acceder a este recurso"**.

### Diagnóstico del Problema:
Las credenciales de desarrollo (`storeId` y `token`) deben ser congruentes. Si se utiliza un token de Sandbox propio, no se puede utilizar el `storeId` por defecto de una cuenta externa (por ejemplo, el de un tutorial o el provisto por el profesor), ya que genera un conflicto de autenticación.

### Solución Técnica Aplicada en `src/App.jsx`:
De acuerdo con las especificaciones del API de Payphone, el parámetro `storeId` es **opcional**. Si se omite en la inicialización, la pasarela de pagos automáticamente asigna la transacción a la **tienda por defecto** del comercio asociado al `token`. 

Se modificó el código del frontend para que el `storeId` sea dinámico y, en caso de no ser configurado, se envíe como `undefined` permitiendo a la pasarela resolver la tienda automáticamente.

#### Modificaciones de código realizadas:

1. **Línea 106 de `src/App.jsx`:**
   Se modificó la validación para que la calculadora no requiera estrictamente la existencia de un `storeId` para activar la interfaz de pagos, requiriendo únicamente el token del comercio.
   ```diff
   - const hasPayphoneCredentials = Boolean(payphoneConfig.token && payphoneConfig.storeId);
   + const hasPayphoneCredentials = Boolean(payphoneConfig.token);
   ```

2. **Línea 357 de `src/App.jsx`:**
   Se modificó el constructor del objeto `PPaymentButtonBox` para que, en caso de no proveer un ID de tienda específico en las variables de entorno, la propiedad se envíe como `undefined` (haciendo que el SDK de Payphone lo ignore y aplique la tienda por defecto del token de autenticación).
   ```diff
   - storeId: payphoneConfig.storeId,
   + storeId: payphoneConfig.storeId || undefined,
   ```

Gracias a este cambio en el código, el sistema se volvió sumamente robusto, logrando que el botón de pagos se cargue, procese las transacciones simuladas del Sandbox de Payphone y redirija al usuario con éxito de vuelta al dominio de Vercel para desbloquear la calculadora sin errores.
