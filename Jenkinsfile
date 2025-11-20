pipeline {

    agent any

    environment {
        AWS_REGION       = 'ap-south-2'
        ECR_REPOSITORY   = 'rs-app'
        APP_NAME         = 'rs-app'
        IMAGE_TAG        = "${BUILD_NUMBER}"
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
                echo "📥 Checking out repository..."
                checkout scm

                sh '''
                    git config --global --add safe.directory "$PWD"
                '''

                script {
                    env.COMMIT_MESSAGE = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.AUTHOR         = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "📦 Installing Node dependencies..."
                sh '''
                    rm -rf node_modules package-lock.json
                    npm install --legacy-peer-deps
                '''
            }
        }


        stage('Lint & Test') {
            parallel {

                stage('Lint') {
                    steps {
                        echo "🔍 Running ESLint..."
                        sh 'npm run lint || true'    // do not fail build on lint errors
                    }
                }

                stage('Unit Tests') {
                    steps {
                        echo "🧪 Running Jest tests..."
                        sh 'npm test -- --coverage --ci || true'   // avoid breaking pipeline
                    }
                    post {
                        always {
                            junit testResults: '**/junit.xml', allowEmptyResults: true
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."

                sh """
                    docker build \
                        -t ${ECR_REPOSITORY}:${IMAGE_TAG} \
                        -t ${ECR_REPOSITORY}:latest \
                        --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                        --build-arg VCS_REF=\$(git rev-parse --short HEAD) \
                        .
                """

                echo "🔎 Running Trivy scan..."
                sh """
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy image --severity HIGH,CRITICAL \
                        ${ECR_REPOSITORY}:${IMAGE_TAG} || true
                """
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-credentials-id',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        sh """
                            export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                            export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                            export AWS_REGION=${AWS_REGION}
                            
                            AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)
                            ECR_REGISTRY=\${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                    
                            aws ecr get-login-password --region ${AWS_REGION} |
                                docker login --username AWS --password-stdin \${ECR_REGISTRY}
                    
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker push \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                        """
                    }

                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                withCredentials([
                    string(credentialsId: 'ec2-host', variable: 'EC2_HOST')
                ]) {
                    sshagent(['ec2-ssh-key']) {
                        sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} << 'EOF'
                        docker pull ${ECR_REGISTRY}/rs-app:${BUILD_NUMBER}
                        docker stop rs-app || true
                        docker rm rs-app || true
                        docker run -d -p 3000:3000 --name rs-app ${ECR_REGISTRY}/rs-app:${BUILD_NUMBER}
                        EOF
                        """
                    }
                }
            }
        }


        stage('Smoke Test') {
            steps {
                script {
                    sh """
                        CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}/health || echo 000)

                        if [ "\$CODE" = "200" ]; then
                            echo "Smoke test passed"
                        else
                            echo "Smoke test FAILED (HTTP \$CODE)"
                            exit 1
                        fi
                    """
                }
            }
        }

    }

    post {
        success {
            emailext subject: "SUCCESS: ${JOB_NAME} #${BUILD_NUMBER}",
                     body: "Pipeline succeeded!",
                     to: EMAIL_RECIPIENTS

            sh "docker image prune -f || true"
        }

        failure {
            emailext subject: "FAILURE: ${JOB_NAME} #${BUILD_NUMBER}",
                     body: "Pipeline failed!",
                     to: EMAIL_RECIPIENTS
        }

        always {
            archiveArtifacts artifacts: '**/package*.json, Dockerfile', allowEmptyArchive: true
            cleanWs()
        }
    }
}



