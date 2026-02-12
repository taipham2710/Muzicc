pipeline {
    agent { label 'Jenkins Agent' }

    options {
        // Hiển thị timestamp trong log
        timestamps()
        // Nếu job treo quá 20 phút thì tự hủy
        timeout(time: 20, unit: 'MINUTES')
    }

    environment {
        // AWS & ECR
        AWS_REGION    = "ap-southeast-1"
        ECR_REGISTRY  = "705071586383.dkr.ecr.ap-southeast-1.amazonaws.com"

        // Tên image backend, image frontend (phần repo, không gồm registry)
        BACKEND_IMAGE = "muzicc-backend"
        FRONTEND_IMAGE = "muzicc-frontend"

        // URL SonarQube – nên cấu hình bằng biến môi trường của Jenkins
        SONAR_HOST    = "http://172.31.28.215:9000"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Trivy FS Scan') {
            steps {
                sh '''
                    set -euo pipefail
                    trivy fs --severity HIGH,CRITICAL --exit-code 1 .
                '''
            }
        }

        stage('SonarQube Scan') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        set -euo pipefail
                        cd backend
                        sonar-scanner \
                          -Dsonar.projectKey=muzicc-backend \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONAR_HOST} \
                          -Dsonar.token="${SONAR_TOKEN}"

                        cd ../frontend
                        sonar-scanner \
                          -Dsonar.projectKey=muzicc-frontend \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONAR_HOST} \
                          -Dsonar.token="${SONAR_TOKEN}"
                    '''
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Prepare Tags') {
            steps {
                script {
                    def shortCommit = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()

                    env.IMAGE_TAG = "${BUILD_NUMBER}-${shortCommit}"
                }
            }
        }


        stage('Docker Build') {
            steps {
                sh '''
                    set -euo pipefail
                    docker build -t "${BACKEND_IMAGE}:${IMAGE_TAG}" ./backend
                    docker build -t "${FRONTEND_IMAGE}:${IMAGE_TAG}" ./frontend
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    set -euo pipefail
                    trivy image --severity HIGH,CRITICAL --exit-code 1 \
                        "${BACKEND_IMAGE}:${IMAGE_TAG}"
                    trivy image --severity HIGH,CRITICAL --exit-code 1 \
                        "${FRONTEND_IMAGE}:${IMAGE_TAG}"
                '''
            }
        }

        stage('OPA Policy Check') {
            steps {
                sh '''
                    set -euo pipefail
                    echo "{\"image\":\"${BACKEND_IMAGE}:${IMAGE_TAG}\"}" > input.json
                    opa eval --fail-defined \
                        --data policies/ \
                        --input input.json \
                        "data.muzicc.allow"


                    echo "{\"image\":\"${FRONTEND_IMAGE}:${IMAGE_TAG}\"}" > input.json
                    opa eval --fail-defined \
                        --data policies/ \
                        --input input.json \
                        "data.muzicc.allow"
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                    set -euo pipefail

                    # Login ECR
                    aws ecr get-login-password --region "${AWS_REGION}" | \
                        docker login --username AWS --password-stdin "${ECR_REGISTRY}"

                    # Tag & push image backend
                    docker tag "${BACKEND_IMAGE}:${IMAGE_TAG}" \
                        "${ECR_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"

                    docker push "${ECR_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}"

                    # Tag & push image frontend
                    docker tag "${FRONTEND_IMAGE}:${IMAGE_TAG}" \
                        "${ECR_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"

                    docker push "${ECR_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
                '''
            }
        }
    }

    post {
        started {
            notifySlack("STARTED 🚀 Build ${BUILD_NUMBER} started")
        }

        success {
            notifySlack("SUCCESS ✅ Build ${BUILD_NUMBER} succeeded")
        }

        failure {
            notifySlack("FAILED ❌ Build ${BUILD_NUMBER} failed")
        }

        always {
            sh 'docker system prune -af || true'
        }
    }
}

def notifySlack(message) {
    withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_WEBHOOK')]) {
        sh '''
            set -euo pipefail
            curl -X POST -H "Content-type: application/json" \
                 --data "{\"text\":\"${message.replace('\"', '\\\"')}\"}" \
                 "${SLACK_WEBHOOK}"
        '''
    }
}
