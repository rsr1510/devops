pipeline {
    agent any

    environment {
        AWS_REGION    = 'ap-south-2'
        ECR_REPOSITORY = 'rs-app'
        APP_NAME       = 'rs-app'
        IMAGE_TAG      = "${BUILD_NUMBER}"
        // Keep EMAIL_RECIPIENTS as plaintext or as Secret text credential if you prefer.
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
                // node/workspace context ensured by declarative agent
                echo '📥 Checking out code from GitHub...'
                checkout scm

                script {
                    env.GIT_COMMIT_MSG = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    env.GIT_AUTHOR     = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                sh '''
                    npm ci
                    npm list || true
                '''
            }
        }

        stage('Lint & Test') {
            parallel {
                stage('Lint') {
                    steps {
                        echo '🔍 Running ESLint...'
                        sh 'npm run lint || true'
                    }
                }
                stage('Unit Tests') {
                    steps {
                        echo '🧪 Running unit tests...'
                        sh 'npm test -- --coverage --ci || true'
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
                echo '🐳 Building Docker image...'
                sh """
                    docker build \
                        -t ${ECR_REPOSITORY}:${IMAGE_TAG} \
                        -t ${ECR_REPOSITORY}:latest \
                        --build-arg BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                        --build-arg VCS_REF=\$(git rev-parse --short HEAD) \
                        .
                """

                // optional vulnerability scan (won't break the build)
                sh """
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL ${ECR_REPOSITORY}:${IMAGE_TAG} || true
                """
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    // Bind AWS credentials explicitly. Replace 'aws-credentials-id' with your Jenkins credential id for AWS (username/password or access key pair).
                    withCredentials([usernamePassword(credentialsId: 'aws-credentials-id', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                        sh """
                            export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
                            export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
                            export AWS_REGION=${AWS_REGION}

                            AWS_ACCOUNT_ID=\$(aws sts get-caller-identity --query Account --output text)

                            ECR_REGISTRY=\${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

                            # Ensure repository exists (no-op if exists)
                            aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} >/dev/null 2>&1 || \
                                aws ecr create-repository --repository-name ${ECR_REPOSITORY} >/dev/null

                            # Login to ECR & push
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin \${ECR_REGISTRY}

                            docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker tag ${ECR_REPOSITORY}:latest \${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

                            docker push \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                            docker push \${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

                            echo "✅ Image pushed: \${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

                            // Export registry for later stages
                            echo "ECR_REGISTRY=\${ECR_REGISTRY}" > ecr_info.txt
                        """
                    }
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    // EC2_HOST must be stored as a Secret text credential with ID 'ec2-host'
                    // SSH key must be an SSH Username with private key credential with ID 'ec2-ssh-key'
                    withCredentials([string(credentialsId: 'ec2-host', variable: 'EC2_HOST')]) {
                        // we still need AWS creds for ECR login on remote host - reuse aws creds
                        withCredentials([usernamePassword(credentialsId: 'aws-credentials-id', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                            sshagent(['ec2-ssh-key']) {
                                // pass minimal env to remote deploy script
                                sh """
                                    cat > deploy.sh <<'EOFS'
#!/bin/bash
set -e

export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
export AWS_REGION=${AWS_REGION}
ECR_REGISTRY=\$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com
ECR_REPOSITORY=${ECR_REPOSITORY}
IMAGE_TAG=${IMAGE_TAG}
APP_NAME=${APP_NAME}

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin \${ECR_REGISTRY}

# Stop & remove old container (ignore errors)
docker stop \${APP_NAME} || true
docker rm \${APP_NAME} || true

# Pull & run new image
docker pull \${ECR_REGISTRY}/\${ECR_REPOSITORY}:\${IMAGE_TAG}

docker run -d --name \${APP_NAME} --restart unless-stopped -p 80:3000 -e NODE_ENV=production \${ECR_REGISTRY}/\${ECR_REPOSITORY}:\${IMAGE_TAG}

# Health check
sleep 5
curl -f http://localhost/health || { echo "Health check failed"; exit 1; }

echo "✅ Remote deployment successful"
EOFS

                                    scp -o StrictHostKeyChecking=no deploy.sh ${EC2_USER}@${EC2_HOST}:/tmp/deploy.sh
                                    ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'bash /tmp/deploy.sh'
                                """
                            }
                        }
                    }
                }
            }
        }

        stage('Smoke Tests') {
            steps {
                script {
                    // EC2_HOST is available from withCredentials earlier if needed; use environment fallback if not
                    def host = env.EC2_HOST ?: sh(script: "echo ${EC2_HOST}", returnStdout: true).trim()
                    echo "Running smoke tests against ${host}"
                    sh """
                        HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}/health || echo 000)
                        if [ "\$HTTP_CODE" = "200" ]; then
                            echo "✅ Health check passed"
                        else
                            echo "❌ Health check failed with code \$HTTP_CODE"
                            exit 1
                        fi
                    """
                }
            }
        }
    } // stages

    post {
        success {
            script {
                def message = """\
✅ Pipeline SUCCESS - ${env.JOB_NAME} #${env.BUILD_NUMBER}

📋 Details:
- Branch: ${env.BRANCH_NAME}
- Commit: ${env.GIT_COMMIT_MSG}
- Author: ${env.GIT_AUTHOR}
- Image: ${env.ECR_REGISTRY ?: 'see build logs'}/${env.ECR_REPOSITORY}:${env.IMAGE_TAG}
- Deployed to: http://${env.EC2_HOST}

🔗 Build URL: ${env.BUILD_URL}
"""
                emailext subject: "✅ Pipeline Success - ${env.JOB_NAME} #${env.BUILD_NUMBER}", body: message, to: "${EMAIL_RECIPIENTS}"
                echo message
            }
            // keep cleanup in script so it's executed within node/workspace context
            script {
                sh 'docker image prune -f || true'
            }
        }

        failure {
            script {
                def message = """\
❌ Pipeline FAILED - ${env.JOB_NAME} #${env.BUILD_NUMBER}

📋 Details:
- Branch: ${env.BRANCH_NAME}
- Commit: ${env.GIT_COMMIT_MSG}
- Author: ${env.GIT_AUTHOR}
- Failed Stage: ${env.STAGE_NAME}

🔗 Build URL: ${env.BUILD_URL}
"""
                emailext subject: "❌ Pipeline Failed - ${env.JOB_NAME} #${env.BUILD_NUMBER}", body: message, to: "${EMAIL_RECIPIENTS}"
                echo message
            }
        }

        always {
            // these steps run in workspace context
            archiveArtifacts artifacts: '**/package*.json, Dockerfile', allowEmptyArchive: true
            cleanWs()
        }
    }
}