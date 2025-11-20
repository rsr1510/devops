pipeline {
    agent any
    
    environment {
        AWS_REGION = 'ap-south-2'
        AWS_CREDENTIALS = credentials('aws-credentials-id')   // Access Key + Secret Key
        AWS_ACCOUNT_ID = "${AWS_CREDENTIALS_USR}"             // Access Key ID part
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_REPOSITORY = 'rs-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
    
        // Application / Deployment Configuration
        APP_NAME = 'rs-app'
    
        EC2_HOST = credentials('ec2-host')   // This contains your EC2 public DNS/IP
        EC2_USER = 'ec2-user'
        SSH_KEY = credentials('ec2-ssh-key') // SSH private key for EC2 deployment        
        // Notification
        EMAIL_RECIPIENTS = 'r.s.r94448@gmail.com'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo '📥 Checking out code from GitHub...'
                    checkout scm
                    
                    // Get commit information
                    env.GIT_COMMIT_MSG = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                    env.GIT_AUTHOR = sh(
                        script: 'git log -1 --pretty=%an',
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    echo '📦 Installing Node.js dependencies...'
                    sh '''
                        npm ci
                        npm list
                    '''
                }
            }
        }
        
        stage('Code Quality - Lint') {
            steps {
                script {
                    echo '🔍 Running ESLint...'
                    sh 'npm run lint || true'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    echo '🧪 Running unit tests...'
                    sh '''
                        npm test -- --coverage --ci
                    '''
                }
            }
            post {
                always {
                    // Archive test results
                    junit(
                        testResults: '**/junit.xml',
                        allowEmptyResults: true
                    )
                }
            }
        }
        
        stage('SonarQube Analysis') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo '📊 Running SonarQube analysis...'
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            sonar-scanner \
                                -Dsonar.projectKey=devops-app \
                                -Dsonar.sources=. \
                                -Dsonar.host.url=$SONAR_HOST_URL \
                                -Dsonar.login=$SONAR_AUTH_TOKEN
                        '''
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo '🐳 Building Docker image...'
                    sh """
                        docker build \
                            -t ${ECR_REPOSITORY}:${IMAGE_TAG} \
                            -t ${ECR_REPOSITORY}:latest \
                            --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                            --build-arg VCS_REF=\$(git rev-parse --short HEAD) \
                            .
                    """
                    
                    // Scan image for vulnerabilities (optional)
                    sh """
                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image --severity HIGH,CRITICAL \
                            ${ECR_REPOSITORY}:${IMAGE_TAG} || true
                    """
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                script {
                    echo '📤 Pushing image to AWS ECR...'
                    withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                        sh """
                            # Login to ECR
                            aws ecr get-login-password --region ${AWS_REGION} | \
                                docker login --username AWS --password-stdin ${ECR_REGISTRY}
                            
                            # Tag images
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} \
                                ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker tag ${ECR_REPOSITORY}:latest \
                                ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                            
                            # Push images
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                            
                            echo "✅ Image pushed: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
                        """
                    }
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                script {
                    echo '🚀 Deploying to EC2...'
                    withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                        sshagent(['ec2-ssh-key']) {
                            sh """
                                # Create deployment script
                                cat > deploy.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | \\
    docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Stop and remove old container
docker stop ${APP_NAME} || true
docker rm ${APP_NAME} || true

# Pull new image
docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

# Run new container
docker run -d \\
    --name ${APP_NAME} \\
    --restart unless-stopped \\
    -p 80:3000 \\
    -e NODE_ENV=production \\
    --log-driver=awslogs \\
    --log-opt awslogs-region=${AWS_REGION} \\
    --log-opt awslogs-group=/ecs/${APP_NAME} \\
    --log-opt awslogs-stream=\$(hostname) \\
    ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

# Health check
echo "Waiting for application to start..."
sleep 10
curl -f http://localhost/health || exit 1

echo "✅ Deployment successful!"
EOFSCRIPT

                                # Copy and execute deployment script
                                scp -o StrictHostKeyChecking=no deploy.sh ${EC2_USER}@${EC2_HOST}:/tmp/
                                ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'bash /tmp/deploy.sh'
                            """
                        }
                    }
                }
            }
        }
        
        stage('Smoke Tests') {
            steps {
                script {
                    echo '🔥 Running smoke tests...'
                    sleep(time: 15, unit: 'SECONDS')
                    
                    sh """
                        # Test application health
                        HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}/health)
                        if [ \$HTTP_CODE -eq 200 ]; then
                            echo "✅ Health check passed"
                        else
                            echo "❌ Health check failed with code \$HTTP_CODE"
                            exit 1
                        fi
                        
                        # Test main endpoint
                        curl -f http://${EC2_HOST}/ || exit 1
                        echo "✅ Application is responding correctly"
                    """
                }
            }
        }
    }
    
    post {
        success {
            script {
                def message = """
                    ✅ Pipeline SUCCESS - ${env.JOB_NAME} #${env.BUILD_NUMBER}
                    
                    📋 Details:
                    - Branch: ${env.BRANCH_NAME}
                    - Commit: ${env.GIT_COMMIT_MSG}
                    - Author: ${env.GIT_AUTHOR}
                    - Image: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                    - Deployed to: http://${EC2_HOST}
                    
                    🔗 Build URL: ${env.BUILD_URL}
                """
                
                emailext(
                    subject: "✅ Pipeline Success - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: message,
                    to: "${EMAIL_RECIPIENTS}",
                    mimeType: 'text/plain'
                )
                
                echo message
            }
            
            // Clean up Docker images
            sh '''
                docker image prune -f
            '''
        }
        
        failure {
            script {
                def message = """
                    ❌ Pipeline FAILED - ${env.JOB_NAME} #${env.BUILD_NUMBER}
                    
                    📋 Details:
                    - Branch: ${env.BRANCH_NAME}
                    - Commit: ${env.GIT_COMMIT_MSG}
                    - Author: ${env.GIT_AUTHOR}
                    - Failed Stage: ${env.STAGE_NAME}
                    
                    🔗 Build URL: ${env.BUILD_URL}
                    
                    Please check the logs for more details.
                """
                
                emailext(
                    subject: "❌ Pipeline Failed - ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: message,
                    to: "${EMAIL_RECIPIENTS}",
                    mimeType: 'text/plain'
                )
                
                echo message
            }
        }
        
        always {
            // Archive artifacts
            archiveArtifacts(
                artifacts: '**/package*.json, Dockerfile',
                allowEmptyArchive: true
            )
            
            // Clean workspace
            cleanWs()
        }
    }
}
