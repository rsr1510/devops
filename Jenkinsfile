pipeline {
    agent any

    stages {
        stage('Build Docker Image') {
            steps {
                echo '🚧 Building Docker image...'
                sh 'docker build -t simple-html-site .'
            }
            
        }

        stage('Run Container') {
            steps {
                echo '🚀 Running Docker container...'
                sh '''
                docker rm -f simple-html-site || true
                docker run -d -p 80:80 --name simple-html-site simple-html-site
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed.'
        }
    }
}