pipeline {
    agent any

    tools {
        // Esto asume que tienes configurado Node.js en las herramientas globales de Jenkins bajo el nombre 'node'
        nodejs 'node'
    }

    environment {
        // Reemplaza estas credenciales o configúralas en la sección de Credenciales de Jenkins
        VERCEL_TOKEN      = credentials('vercel-token')
        VERCEL_ORG_ID     = credentials('vercel-org-id')
        VERCEL_PROJECT_ID = credentials('vercel-project-id')
        
        // Variables de tu app
        VITE_PAYPHONE_TOKEN    = credentials('vite-payphone-token')
        VITE_PAYPHONE_STORE_ID = credentials('vite-payphone-store-id')
    }

    stages {
        stage('Descargar Código') {
            steps {
                checkout scm
            }
        }

        stage('Instalar Dependencias') {
            steps {
                // Si tu Jenkins corre en Linux, cambia 'bat' por 'sh'
                bat 'npm install'
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
                // Realiza el despliegue usando Vercel CLI y las credenciales del entorno
                bat "vercel deploy --prod --token=${env.VERCEL_TOKEN} --yes"
            }
        }
    }
}
