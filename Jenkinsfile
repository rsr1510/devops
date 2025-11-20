pipeline {
    agent any
    
    environment {
        // AWS Configuration
        AWS_ACCOUNT_ID = '983194205945'  // Replace with your AWS Account ID
        AWS_REGION = 'ap-south-2'
        ECR_REPOSITORY = 'rs-app'
        
        // Docker Configuration
        DOCKER_IMAGE = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
        IMAGE_TAG = "${BUILD_NUMBER}"
        
        // Deployment Configuration
        EC2_HOST = 'ec2-18-60-109-216.ap-south-2.compute.amazonaws.com'  // Replace with your EC2 public DNS
        EC2_USER = 'ec2-user'
        
        // AWS Credentials (configured in Jenkins)
        AWS_CREDENTIALS = 'aws-credentials-id'
        
        // Email Configuration
        EMAIL_RECIPIENTS = 'r.s.r94448@gmail.com'
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo '==================== Checking out code from GitHub ===================='
                    checkout scm
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    echo '==================== Installing Dependencies ===================='
                    sh 'npm install'
                }
            }
        }

        stage('Code Quality Analysis') {
            steps {
                script {
                    echo '==================== Running Code Quality Checks ===================='
                    sh 'npm run lint || true'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo '==================== Building Docker Image ===================='
                    sh """
                        docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
                        docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${DOCKER_IMAGE}:${IMAGE_TAG}
                        docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                script {
                    echo '==================== Pushing Image to AWS ECR ===================='
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', 
                                    credentialsId: "${AWS_CREDENTIALS}"]]) {
                        sh """
                            aws ecr get-login-password --region ${AWS_REGION} \
                            | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                            
                            docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                            docker push ${DOCKER_IMAGE}:latest
                        """
                    }
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                script {
                    echo '==================== Deploying to EC2 Instance ===================='
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', 
                                    credentialsId: "${AWS_CREDENTIALS}"],
                                   sshUserPrivateKey(credentialsId: 'ec2-ssh-key', 
                                                    keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no -i \$SSH_KEY ${EC2_USER}@${EC2_HOST} << 'EOF'
                                aws ecr get-login-password --region ${AWS_REGION} \
                                | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                                
                                docker stop my-web-app || true
                                docker rm my-web-app || true
                                
                                docker pull ${DOCKER_IMAGE}:${IMAGE_TAG}
                                docker run -d --name my-web-app -p 80:3000 ${DOCKER_IMAGE}:${IMAGE_TAG}
                                
                                docker image prune -f
EOF
                        """
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo '==================== Performing Health Check ===================='
                    sh """
                        sleep 10
                        curl -f http://${EC2_HOST}/ || exit 1
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo '==================== Pipeline Succeeded ===================='
            emailext (
                subject: "✅ Jenkins Pipeline Success: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: """
                    <h2>Build Success!</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Docker Image:</strong> ${DOCKER_IMAGE}:${IMAGE_TAG}</p>
                    <p><strong>Deployment URL:</strong> <a href="http://${EC2_HOST}">http://${EC2_HOST}</a></p>
                    <p>The application has been successfully deployed to AWS.</p>
                """,
                to: "${EMAIL_RECIPIENTS}",
                mimeType: 'text/html'
            )
        }
        
        failure {
            echo '==================== Pipeline Failed ===================='
            emailext (
                subject: "❌ Jenkins Pipeline Failed: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: """
                    <h2>Build Failed!</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a></p>
                    <p>Please check the console output for details.</p>
                """,
                to: "${EMAIL_RECIPIENTS}",
                mimeType: 'text/html'
            )
        }
        
        always {
            cleanWs()
        }
    }
}
