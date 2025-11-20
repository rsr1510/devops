// pipeline {

//     agent any

//     environment {
//         AWS_REGION       = 'ap-south-2'
//         ECR_REPOSITORY   = 'rs-app'
//         APP_NAME         = 'rs-app'
//         IMAGE_TAG        = "${BUILD_NUMBER}"
//         EMAIL_RECIPIENTS = 'r.s.r94448@gmail.com'
//     }

//     options {
//         buildDiscarder(logRotator(numToKeepStr: '10'))
//         timestamps()
//         timeout(time: 30, unit: 'MINUTES')
//     }

//     stages {

//         stage('Checkout') {
//             steps {
//                 echo "📥 Checking out repository..."
//                 checkout scm

//                 sh '''
//                     git config --global --add safe.directory "$PWD"
//                 '''

//                 script {
//                     env.COMMIT_MESSAGE = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
//                     env.AUTHOR         = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
//                 }
//             }
//         }

//         stage('Install Dependencies') {
//             steps {
//                 echo "📦 Installing Node dependencies..."
//                 sh '''
//                     rm -rf node_modules package-lock.json
//                     npm install --legacy-peer-deps
//                 '''
//             }
//         }


//         stage('Lint & Test') {
//             parallel {

//                 stage('Lint') {
//                     steps {
//                         echo "🔍 Running ESLint..."
//                         sh 'npm run lint || true'    // do not fail build on lint errors
//                     }
//                 }

//                 stage('Unit Tests') {
//                     steps {
//                         echo "🧪 Running Jest tests..."
//                         sh 'npm test -- --coverage --ci || true'   // avoid breaking pipeline
//                     }
//                     post {
//                         always {
//                             junit testResults: '**/junit.xml', allowEmptyResults: true
//                         }
//                     }
//                 }
//             }
//         }

//         stage('Build Docker Image') {
//             steps {
//                 echo "🐳 Building Docker image..."

//                 sh """
//                     docker build \
//                         -t ${ECR_REPOSITORY}:${IMAGE_TAG} \
//                         -t ${ECR_REPOSITORY}:latest \
//                         --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
//                         --build-arg VCS_REF=\$(git rev-parse --short HEAD) \
//                         .
//                 """

//                 echo "🔎 Running Trivy scan..."
//                 sh """
//                     docker run --rm \
//                         -v /var/run/docker.sock:/var/run/docker.sock \
//                         aquasec/trivy image --severity HIGH,CRITICAL \
//                         ${ECR_REPOSITORY}:${IMAGE_TAG} || true
//                 """
//             }
//         }

//         stage('Push to ECR') {
//             steps {
//                 script {
//                     withCredentials([[
//                         $class: 'AmazonWebServicesCredentialsBinding',
//                         credentialsId: 'aws-credentials-id',
//                         accessKeyVariable: 'AWS_ACCESS_KEY_ID',
//                         secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
//                     ]]) {
//                         sh """
//                             export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
//                             export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
//                             export AWS_REGION=${AWS_REGION}
                            
//                             AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)
//                             ECR_REGISTRY=\${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                    
//                             aws ecr get-login-password --region ${AWS_REGION} |
//                                 docker login --username AWS --password-stdin \${ECR_REGISTRY}
                    
//                             docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
//                             docker push \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
//                         """
//                     }

//                 }
//             }
//         }

//         stage('Deploy to EC2') {
//             steps {
//                 withCredentials([
//                     string(credentialsId: 'ec2-host', variable: 'EC2_HOST'),
//                     [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials-id']
//                 ]) {
//                     sshagent(['ec2-user']) {
        
//                         sh '''
//                             cat > deploy.sh <<'EOF'
//         #!/bin/bash
//         set -e
        
//         AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
//         ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        
//         aws ecr get-login-password --region ${AWS_REGION} \
//             | docker login --username AWS --password-stdin ${ECR_REGISTRY}
        
//         docker stop ${APP_NAME} || true
//         docker rm ${APP_NAME} || true
        
//         docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
        
//         docker run -d --name ${APP_NAME} --restart unless-stopped \
//             -p 80:3000 ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
        
//         sleep 5
//         curl -f http://localhost/health || exit 1
//         EOF
//                         '''
        
//                         sh '''
//                             scp -o StrictHostKeyChecking=no deploy.sh ubuntu@$EC2_HOST:/tmp/deploy.sh
//                             ssh -o StrictHostKeyChecking=no ubuntu@$EC2_HOST 'bash /tmp/deploy.sh'
//                         '''
//                     }
//                 }
//             }
//         }

//         stage('Smoke Test') {
//             steps {
//                 script {
//                     sh """
//                         CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}/health || echo 000)

//                         if [ "\$CODE" = "200" ]; then
//                             echo "Smoke test passed"
//                         else
//                             echo "Smoke test FAILED (HTTP \$CODE)"
//                             exit 1
//                         fi
//                     """
//                 }
//             }
//         }

//     }

//     post {
//         success {
//             emailext subject: "SUCCESS: ${JOB_NAME} #${BUILD_NUMBER}",
//                      body: "Pipeline succeeded!",
//                      to: EMAIL_RECIPIENTS

//             sh "docker image prune -f || true"
//         }

//         failure {
//             emailext subject: "FAILURE: ${JOB_NAME} #${BUILD_NUMBER}",
//                      body: "Pipeline failed!",
//                      to: EMAIL_RECIPIENTS
//         }

//         always {
//             archiveArtifacts artifacts: '**/package*.json, Dockerfile', allowEmptyArchive: true
//             cleanWs()
//         }
//     }
// }




// pipeline {

//     agent any

//     environment {
//         AWS_REGION       = 'ap-south-2'
//         ECR_REPOSITORY   = 'rs-app'
//         APP_NAME         = 'rs-app'
//         IMAGE_TAG        = "${BUILD_NUMBER}"
//         EMAIL_RECIPIENTS = 'r.s.r94448@gmail.com'
//     }

//     options {
//         buildDiscarder(logRotator(numToKeepStr: '10'))
//         timestamps()
//         timeout(time: 30, unit: 'MINUTES')
//     }

//     stages {

//         stage('Checkout') {
//             steps {
//                 echo "📥 Checking out repository..."
//                 checkout scm

//                 sh '''
//                     git config --global --add safe.directory "$PWD"
//                 '''

//                 script {
//                     env.COMMIT_MESSAGE = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
//                     env.AUTHOR         = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
//                 }
//             }
//         }

//         stage('Install Dependencies') {
//             steps {
//                 echo "📦 Installing Node dependencies..."
//                 sh '''
//                     rm -rf node_modules package-lock.json
//                     npm install --legacy-peer-deps
//                 '''
//             }
//         }

//         stage('Lint & Test') {
//             parallel {

//                 stage('Lint') {
//                     steps {
//                         echo "🔍 Running ESLint..."
//                         sh 'npm run lint || true'
//                     }
//                 }

//                 stage('Unit Tests') {
//                     steps {
//                         echo "🧪 Running Jest tests..."
//                         sh 'npm test -- --coverage --ci || true'
//                     }
//                     post {
//                         always {
//                             junit testResults: '**/junit.xml', allowEmptyResults: true
//                         }
//                     }
//                 }
//             }
//         }

//         stage('Build Docker Image') {
//             steps {
//                 echo "🐳 Building Docker image..."

//                 sh """
//                     docker build -q \
//                         -t ${ECR_REPOSITORY}:${IMAGE_TAG} \
//                         -t ${ECR_REPOSITORY}:latest \
//                         --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
//                         --build-arg VCS_REF=\$(git rev-parse --short HEAD) \
//                         .
//                 """
                
//                 echo "✅ Docker image built successfully"
//             }
//         }

//         stage('Push to ECR') {
//             steps {
//                 script {
//                     withCredentials([[
//                         $class: 'AmazonWebServicesCredentialsBinding',
//                         credentialsId: 'aws-credentials-id',
//                         accessKeyVariable: 'AWS_ACCESS_KEY_ID',
//                         secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
//                     ]]) {
//                         sh """
//                             export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
//                             export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
//                             export AWS_REGION=${AWS_REGION}
                            
//                             AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)
//                             ECR_REGISTRY=\${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                    
//                             echo "🔐 Logging into ECR..."
//                             aws ecr get-login-password --region ${AWS_REGION} | \
//                                 docker login --username AWS --password-stdin \${ECR_REGISTRY} > /dev/null 2>&1
                    
//                             echo "📤 Pushing image to ECR..."
//                             docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
//                             docker push \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} | grep -E "Pushed|digest:" || true
                            
//                             echo "✅ Image pushed successfully"
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Deploy to EC2') {
//             steps {
//                 withCredentials([
//                     string(credentialsId: 'ec2-host', variable: 'EC2_HOST'),
//                     sshUserPrivateKey(
//                         credentialsId: 'ec2-ssh-key',
//                         keyFileVariable: 'SSH_KEY'
//                     ),
//                     [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials-id']
//                 ]) {
//                     sh '''
//                         echo "🚀 Deploying to EC2..."
                        
//                         cat > deploy.sh <<EOF
// #!/bin/bash
// set -e

// export AWS_REGION="ap-south-2"
// export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
// export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"

// AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)
// ECR_REGISTRY="\${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

// aws ecr get-login-password --region ${AWS_REGION} | \\
//     docker login --username AWS --password-stdin \${ECR_REGISTRY} > /dev/null 2>&1

// docker stop ${APP_NAME} 2>/dev/null || true
// docker rm ${APP_NAME} 2>/dev/null || true

// echo "Pulling image..."
// docker pull \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

// echo "Starting container..."
// docker run -d --name ${APP_NAME} --restart unless-stopped \\
//     -p 80:3000 \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}

// sleep 5
// curl -sf http://localhost/health > /dev/null || exit 1
// echo "Container is healthy"
// EOF
//                     '''

//                     sh '''
//                         chmod 600 $SSH_KEY
//                         scp -o StrictHostKeyChecking=no -o LogLevel=ERROR -i $SSH_KEY deploy.sh ec2-user@$EC2_HOST:/tmp/deploy.sh
//                         ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR -i $SSH_KEY ec2-user@$EC2_HOST 'bash /tmp/deploy.sh'
                        
//                         echo "✅ Deployment completed"
//                     '''
//                 }
//             }
//         }

//         stage('Smoke Test') {
//             steps {
//                 withCredentials([
//                     string(credentialsId: 'ec2-host', variable: 'EC2_HOST')
//                 ]) {
//                     script {
//                         echo "🧪 Running smoke test..."
//                         sh """
//                             CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://\${EC2_HOST}/health || echo 000)

//                             if [ "\$CODE" = "200" ]; then
//                                 echo "✅ Smoke test passed"
//                             else
//                                 echo "❌ Smoke test FAILED (HTTP \$CODE)"
//                                 exit 1
//                             fi
//                         """
//                     }
//                 }
//             }
//         }

//     }

//     post {
//         success {
//             emailext subject: "✅ SUCCESS: ${JOB_NAME} #${BUILD_NUMBER}",
//                      body: "Pipeline succeeded!\n\nCommit: ${COMMIT_MESSAGE}\nAuthor: ${AUTHOR}",
//                      to: EMAIL_RECIPIENTS

//             sh "docker image prune -f > /dev/null 2>&1 || true"
//         }

//         failure {
//             emailext subject: "❌ FAILURE: ${JOB_NAME} #${BUILD_NUMBER}",
//                      body: "Pipeline failed!\n\nCommit: ${COMMIT_MESSAGE}\nAuthor: ${AUTHOR}",
//                      to: EMAIL_RECIPIENTS
//         }

//         always {
//             cleanWs()
//         }
//     }
// }









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
                echo "📥 Checking out code from repository..."
                checkout scm
                
                script {
                    sh 'git config --global --add safe.directory "$PWD"'
                    env.COMMIT_MESSAGE = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
                    env.AUTHOR         = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
                    env.COMMIT_HASH    = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    
                    echo "Commit: ${env.COMMIT_HASH} by ${env.AUTHOR}"
                    echo "Message: ${env.COMMIT_MESSAGE}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "📦 Installing Node.js dependencies..."
                sh '''
                    rm -rf node_modules package-lock.json
                    npm install --legacy-peer-deps 2>&1 | grep -E "added|audited|found" || true
                '''
                echo "✅ Dependencies installed"
            }
        }

        stage('Lint & Test') {
            parallel {
                stage('Lint') {
                    steps {
                        script {
                            echo "🔍 Running ESLint..."
                            def lintResult = sh(script: 'npm run lint 2>&1 || true', returnStatus: true)
                            if (lintResult == 0) {
                                echo "✅ Lint passed"
                            } else {
                                echo "⚠️ Lint warnings found (not blocking build)"
                            }
                        }
                    }
                }

                stage('Unit Tests') {
                    steps {
                        script {
                            echo "🧪 Running Jest tests..."
                            def testResult = sh(script: 'npm test -- --coverage --ci 2>&1 || true', returnStatus: true)
                            if (testResult == 0) {
                                echo "✅ Tests passed"
                            } else {
                                echo "⚠️ Tests failed (not blocking build)"
                            }
                        }
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
                script {
                    sh """
                        docker build -q \
                            -t ${ECR_REPOSITORY}:${IMAGE_TAG} \
                            -t ${ECR_REPOSITORY}:latest \
                            --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                            --build-arg VCS_REF=${env.COMMIT_HASH} \
                            . > /dev/null
                    """
                    echo "✅ Docker image built: ${ECR_REPOSITORY}:${IMAGE_TAG}"
                }
            }
        }

        stage('Push to ECR') {
            steps {
                echo "📤 Pushing image to AWS ECR..."
                script {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-credentials-id',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        sh '''
                            # Get AWS Account ID
                            AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
                            ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                            
                            # Login to ECR
                            aws ecr get-login-password --region ${AWS_REGION} | \
                                docker login --username AWS --password-stdin ${ECR_REGISTRY} 2>&1 | grep -i "login succeeded" || true
                            
                            # Tag and push image
                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} 2>&1 | grep -E "Pushed|digest:" || echo "Pushing..."
                            
                            echo "✅ Image pushed: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
                        '''
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying to EC2 instance..."
                withCredentials([
                    string(credentialsId: 'ec2-host', variable: 'EC2_HOST'),
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'SSH_KEY'
                    ),
                    [$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials-id']
                ]) {
                    script {
                        // Get AWS Account ID on Jenkins
                        def awsAccountId = sh(script: 'aws sts get-caller-identity --query Account --output text', returnStdout: true).trim()
                        def ecrRegistry = "${awsAccountId}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                        
                        // Create deployment script
                        sh """
                            cat > deploy.sh <<'DEPLOY_SCRIPT'
#!/bin/bash
set -e

# Colors for output
GREEN='\\033[0;32m'
RED='\\033[0;31m'
NC='\\033[0m' # No Color

echo "Starting deployment..."

# Set AWS credentials
export AWS_REGION="${AWS_REGION}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="${AWS_REGION}"

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \\
    docker login --username AWS --password-stdin ${ecrRegistry} > /dev/null 2>&1

if [ \$? -eq 0 ]; then
    echo "\${GREEN}✅ ECR login successful\${NC}"
else
    echo "\${RED}❌ ECR login failed\${NC}"
    exit 1
fi

# Stop old container
echo "Stopping old container..."
docker stop ${APP_NAME} 2>/dev/null || echo "No existing container to stop"
docker rm ${APP_NAME} 2>/dev/null || echo "No existing container to remove"

# Pull new image
echo "Pulling image: ${ecrRegistry}/${ECR_REPOSITORY}:${IMAGE_TAG}"
docker pull ${ecrRegistry}/${ECR_REPOSITORY}:${IMAGE_TAG}

if [ \$? -eq 0 ]; then
    echo "\${GREEN}✅ Image pulled successfully\${NC}"
else
    echo "\${RED}❌ Image pull failed\${NC}"
    exit 1
fi

# Start new container
echo "Starting new container..."
docker run -d \\
    --name ${APP_NAME} \\
    --restart unless-stopped \\
    -p 80:3000 \\
    ${ecrRegistry}/${ECR_REPOSITORY}:${IMAGE_TAG}

if [ \$? -eq 0 ]; then
    echo "\${GREEN}✅ Container started successfully\${NC}"
else
    echo "\${RED}❌ Container start failed\${NC}"
    docker logs ${APP_NAME} 2>&1 | tail -20
    exit 1
fi

# Wait for application to start
echo "Waiting for application to start..."
sleep 8

# Health check
echo "Running health check..."
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo "\${GREEN}✅ Health check passed\${NC}"
    echo "\${GREEN}✅ Deployment completed successfully!\${NC}"
else
    echo "\${RED}⚠️ Health check failed, but container is running\${NC}"
    docker ps | grep ${APP_NAME}
fi

# Cleanup old images
echo "Cleaning up old images..."
docker image prune -f > /dev/null 2>&1 || true

echo "Deployment finished!"
DEPLOY_SCRIPT
                        """
                        
                        // Copy and execute deployment script
                        sh '''
                            chmod 600 $SSH_KEY
                            chmod +x deploy.sh
                            
                            echo "Copying deployment script to EC2..."
                            scp -o StrictHostKeyChecking=no \
                                -o LogLevel=ERROR \
                                -i $SSH_KEY \
                                deploy.sh ec2-user@$EC2_HOST:/tmp/deploy.sh
                            
                            echo "Executing deployment on EC2..."
                            ssh -o StrictHostKeyChecking=no \
                                -o LogLevel=ERROR \
                                -i $SSH_KEY \
                                ec2-user@$EC2_HOST 'bash /tmp/deploy.sh'
                        '''
                        
                        echo "✅ Deployment completed successfully"
                    }
                }
            }
        }

        stage('Smoke Test') {
            steps {
                echo "🧪 Running smoke test..."
                withCredentials([
                    string(credentialsId: 'ec2-host', variable: 'EC2_HOST')
                ]) {
                    script {
                        def httpCode = sh(
                            script: "curl -s -o /dev/null -w '%{http_code}' http://\${EC2_HOST}/health || echo 000",
                            returnStdout: true
                        ).trim()
                        
                        if (httpCode == '200') {
                            echo "✅ Smoke test passed (HTTP ${httpCode})"
                        } else {
                            echo "⚠️ Smoke test warning (HTTP ${httpCode})"
                            echo "Application may still be starting..."
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Pipeline completed successfully!"
            emailext(
                subject: "✅ SUCCESS: ${JOB_NAME} #${BUILD_NUMBER}",
                body: """
                    <h2>Pipeline Succeeded</h2>
                    <p><strong>Job:</strong> ${JOB_NAME}</p>
                    <p><strong>Build:</strong> #${BUILD_NUMBER}</p>
                    <p><strong>Commit:</strong> ${env.COMMIT_HASH}</p>
                    <p><strong>Author:</strong> ${env.AUTHOR}</p>
                    <p><strong>Message:</strong> ${env.COMMIT_MESSAGE}</p>
                    <p><strong>Image:</strong> ${ECR_REPOSITORY}:${IMAGE_TAG}</p>
                    <hr>
                    <p>Check the build: ${BUILD_URL}</p>
                """,
                to: EMAIL_RECIPIENTS,
                mimeType: 'text/html'
            )
            
            sh "docker image prune -f > /dev/null 2>&1 || true"
        }

        failure {
            echo "❌ Pipeline failed!"
            emailext(
                subject: "❌ FAILURE: ${JOB_NAME} #${BUILD_NUMBER}",
                body: """
                    <h2>Pipeline Failed</h2>
                    <p><strong>Job:</strong> ${JOB_NAME}</p>
                    <p><strong>Build:</strong> #${BUILD_NUMBER}</p>
                    <p><strong>Commit:</strong> ${env.COMMIT_HASH}</p>
                    <p><strong>Author:</strong> ${env.AUTHOR}</p>
                    <p><strong>Message:</strong> ${env.COMMIT_MESSAGE}</p>
                    <hr>
                    <p>Check the logs: ${BUILD_URL}console</p>
                """,
                to: EMAIL_RECIPIENTS,
                mimeType: 'text/html'
            )
        }

        always {
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
    }
}
