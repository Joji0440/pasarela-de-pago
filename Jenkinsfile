pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {
        VERCEL_TOKEN      = credentials('vercel-token')
        VERCEL_ORG_ID     = credentials('vercel-org-id')
        VERCEL_PROJECT_ID = credentials('vercel-project-id')
        
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
                bat "vercel deploy --prod --token=${env.VERCEL_TOKEN} --yes"
            }
        }
    }
}
