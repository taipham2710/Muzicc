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
        //FRONTEND_IMAGE = "muzicc-frontend"

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

                        cd "$WORKSPACE"

                        echo "[INFO] Current dir:"
                        pwd
                        ls -la

                        echo "[INFO] Backend scan..."
                        docker run --rm \
                        -e SONAR_HOST_URL="$SONAR_HOST" \
                        -e SONAR_TOKEN="$SONAR_TOKEN" \
                        -v "$WORKSPACE/backend:/usr/src" \
                        sonarsource/sonar-scanner-cli \
                        -Dsonar.projectKey=muzicc-backend \
                        -Dsonar.sources=. \
                        -Dsonar.projectVersion=${BUILD_NUMBER}

                        echo "[INFO] Frontend scan..."
                        docker run --rm \
                        -e SONAR_HOST_URL="$SONAR_HOST" \
                        -e SONAR_TOKEN="$SONAR_TOKEN" \
                        -v "$WORKSPACE/frontend:/usr/src" \
                        sonarsource/sonar-scanner-cli \
                        -Dsonar.projectKey=muzicc-frontend \
                        -Dsonar.sources=. \
                        -Dsonar.projectVersion=${BUILD_NUMBER}
                    '''
                }
            }
        }

        stage('Prepare Tags for Backend') {
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


        stage('Docker Build for Backend') {
            steps {
                sh '''
                    set -euo pipefail
                    docker build -t "${BACKEND_IMAGE}:${IMAGE_TAG}" ./backend
                '''
            }
        }

        stage('Trivy Image Scan for Backend') {
            steps {
                sh '''
                    set -euo pipefail
                    trivy image --severity HIGH,CRITICAL --exit-code 1 \
                        "${BACKEND_IMAGE}:${IMAGE_TAG}"
                '''
            }
        }

        stage('OPA Policy Check for Backend') {
            steps {
                sh '''
                    set -euo pipefail

                    check_policy () {
                        IMAGE=$1
                        echo "{\"image\":\"$IMAGE\"}" > input.json

                        RESULT=$(opa eval -f raw \
                            --data policies/ \
                            --input input.json \
                            "data.muzicc.allow")

                        echo "[INFO] OPA result for $IMAGE = $RESULT"

                        if [ "$RESULT" != "true" ]; then
                            echo "OPA policy failed for $IMAGE"
                            exit 1
                        fi
                    }

                    check_policy "${BACKEND_IMAGE}:${IMAGE_TAG}"
                '''
            }
        }

        stage('Push to ECR for Backend') {
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
                '''
            }
        }

        stage('Build Frontend (Static)') {
            steps {
                sh '''
                    set -euo pipefail

                    echo "[INFO] Build frontend static files..."

                    docker run --rm \
                    -v "$WORKSPACE/frontend:/app" \
                    -w /app \
                    node:22-alpine \
                    sh -c "npm ci && npm run build"
                '''
            }
        }

        stage('Upload Frontend to S3') {
            steps {
                sh '''
                    set -euo pipefail

                    echo "[INFO] Upload frontend to S3..."

                    aws s3 sync frontend/dist/ s3://muzicc-bucket/frontend/ --delete
                '''
            }
        }

        stage('Invalidate CloudFront Cache') {
            steps {
                sh '''
                    aws cloudfront create-invalidation \
                    --distribution-id E27ZNU3U3SZM2R \
                    --paths "/*"
                '''
            }
        }
    }

    post {
        always {
            script {
                notifySlack("BUILD ${BUILD_NUMBER} finished with status: ${currentBuild.currentResult}")
            }
        }
    }
}

def notifySlack(message) {
    withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_WEBHOOK')]) {
        sh """
            curl -X POST -H 'Content-type: application/json' \
                 --data '{"text":"${message}"}' \
                 ${SLACK_WEBHOOK}
        """
    }
}
