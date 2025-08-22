# Finkraft MERN Stack Application with EKS Deployment

A comprehensive MERN stack application deployed on AWS EKS with automated CI/CD pipeline using Jenkins, ArgoCD, and monitoring with Prometheus/Grafana.

## 🏗️ Architecture Overview

This project demonstrates a complete DevOps workflow for deploying a MERN stack application on AWS EKS with the following components:

- **Frontend**: React.js application
- **Backend**: Node.js/Express.js API
- **Database**: MongoDB
- **Infrastructure**: AWS EKS with spot and on-demand instances
- **CI/CD**: Jenkins with automated pipelines
- **GitOps**: ArgoCD for Kubernetes deployment
- **Monitoring**: Prometheus and Grafana
- **Code Quality**: SonarQube integration

## 📋 Prerequisites

Before starting the deployment, ensure you have the following tools installed on your local machine:

- AWS CLI
- Terraform
- Docker
- kubectl
- eksctl
- trivy

## 🚀 Deployment Workflow

### Phase 1: Jenkins Infrastructure Setup

#### 1.1 Terraform Automation for Jenkins Instance

Use Terraform to automate the creation of the Jenkins instance from your local machine. The infrastructure includes:

**Jenkins Instance Specifications:**
- **Instance Type**: t2.2xlarge
- **Storage**: 30GB gp2
- **IAM Role**: EC2 Admin Access Role
- **Security Group**: Open ports 8080 (Jenkins), 9000 (SonarQube), 80 (HTTP), 443 (HTTPS), 22 (SSH)

**Required Tools Installation:**
- AWS CLI
- Terraform
- Trivy
- eksctl
- Docker
- SonarQube (Docker container)
- kubectl
- Jenkins

#### 1.2 Jenkins UI Configuration

**Required Plugins:**
1. AWS credentials
2. Pipeline: AWS Steps
3. Terraform
4. Pipeline Stage View
5. Docker Pipeline
6. Docker
7. Docker Commons
8. Docker API
9. NodeJS
10. OWASP Dependency-Check
11. SonarQube Scanner

**Required Credentials:**
- AWS Credentials
- Terraform Cloud (Secret Text)

**System Configuration - Tools Section:**
- Terraform: `/usr/bin/terraform`
- NodeJS: Latest version
- Dependency Check: Latest version
- Docker: From docker.com
- Sonar-scanner: From central repository

![Jenkins Pipelines](assets/Jenkins%20Pipelines.png)

### Phase 2: EKS Infrastructure Setup

#### 2.1 VPC and Network Infrastructure

**Phase 1 - VPC Setup (MERN_VPC Module):**
1. VPC
2. Public and Private Subnets
3. Internet Gateway
4. Elastic IP for NAT
5. NAT Gateway
6. Route Tables (Public with IGW, Private with NAT)
7. Route Table Associations

#### 2.2 Jump Server Setup

A jump server is required to access the private EKS cluster for security and best practices.

#### 2.3 EKS Cluster Setup

**Required IAM Resources:**
1. EKS Cluster IAM Role
2. IAM Role Policy Attachment (EKS Cluster Attachment)
3. EKS Node Group IAM Role (EKS Worker Node Policy)
4. IAM OpenID Connect Provider
5. TLS Certificate for OIDC

**Cluster Configuration:**
- Use spot instances along with on-demand instances to reduce costs
- Cluster creation should take no more than 20 minutes

### Phase 3: Post-EKS Setup Configuration

#### 3.1 AWS CLI Configuration

Configure AWS CLI on both Jenkins and Jump servers:

```bash
# On Jenkins Server
aws eks update-kubeconfig --name finkraft-prod-finkraft-eks-cluster --region us-east-1

# On Jump Server
aws eks update-kubeconfig --name finkraft-prod-finkraft-eks-cluster --region us-east-1
```

#### 3.2 Load Balancer Controller Setup

```bash
# Download IAM policy
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json

# Create IAM policy
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# Create IAM service account
eksctl create iamserviceaccount \
  --cluster=finkraft-prod-eks-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::649418801891:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve \
  --region=us-east-1

# Verify creation
kubectl get sa -n kube-system | grep "aws"
```

#### 3.3 Install Load Balancer Controller

```bash
# Add Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo list

# Install controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=finkraft-prod-eks-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Verify deployment
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Phase 4: ArgoCD Setup

#### 4.1 Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v2.4.7/manifests/install.yaml

# Check installation
kubectl get all -n argocd
kubectl get svc -n argocd

# Change service to LoadBalancer
kubectl edit svc argocd-server -n argocd
# Change ClusterIP to LoadBalancer
```

#### 4.2 ArgoCD Access Configuration

```bash
# Get ArgoCD password
kubectl get secrets -n argocd
kubectl edit secrets argocd-initial-admin-secret -n argocd

# Decode password (replace with your actual password)
echo ZWNRcVJRTWRmYndXYW1jUQ== | base64 --decode
```

**Login Credentials:**
- Username: `admin`
- Password: (decoded from secret)

![ArgoCD Deployment](assets/ArgoCD%20Deployment.png)

### Phase 5: SonarQube Configuration

#### 5.1 SonarQube Setup

**Default Credentials:**
- Username: `admin`
- Password: `admin`

**Token Creation:**
1. Go to Configuration → Users
2. Click "Create Token"
3. Give a name and copy the token safely

#### 5.2 Webhook Configuration

Configure webhook for Jenkins:
- Name: `Jenkins`
- URL: `http://<public-ip-of-jenkins>:8080/sonarqube-webhook/`

#### 5.3 Project Setup

Create two projects:
- Frontend
- Backend

Use the generated token and copy SonarQube scanner steps for safe storage.

![SonarQube Code Testing](assets/Sonarqube%20Code%20Testing.png)

### Phase 6: Jenkins Credentials Configuration

Configure the following credentials in Jenkins:

1. **sonar-token** (Secret Text)
2. **ECR_REPO1** (Secret Text) - Frontend
3. **ECR_REPO2** (Secret Text) - Backend
4. **ACCOUNT_ID** (Secret Text) - AWS Account ID
5. **GITHUB_APP** (Username and Password) - GitHub PAT

### Phase 7: Pipeline Execution

1. Run Frontend pipeline
2. Run Backend pipeline

### Phase 8: ArgoCD Application Deployment

#### 8.1 Repository Configuration

Connect repository using SSH:
1. Create SSH keys on local machine
2. Add public key to repository deploy keys

#### 8.2 Namespace Creation

```bash
# Create namespace on jump instance
kubectl create ns three-tier
```

#### 8.3 ArgoCD Application Configuration

Create 4 applications in ArgoCD UI in the following order:
1. Database
2. Backend
3. Frontend
4. Ingress

**Application Configuration:**
- **Name**: Exactly as in namespace and deployment.yml file
- **Project**: Default
- **Sync Policy**: Automatic with Self-Heal checked
- **Repository URL**: Select added repository
- **Path**: Path to deployment.yml file
  - `Kubernetes-Manifests-file/Backend`
  - `Kubernetes-Manifests-file/Frontend`
  - `Kubernetes-Manifests-file/Database`
  - `Kubernetes-Manifests-file/` (for ingress)

![Application Deployed with Custom Domain](assets/Application%20Deployed%20with%20Custom%20Domain.png)

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Pod Startup Issues

**Problem**: Pods not coming up due to tainted subnets

**Solution**: Ensure subnets are properly tagged for EKS:

```bash
# Check cluster subnets
aws eks describe-cluster --name finkraft-prod-finkraft-eks-cluster --query "cluster.resourcesVpcConfig.subnetIds"

# Tag subnets properly
aws ec2 create-tags \
  --resources subnet-0da46d560b01a2d4a subnet-0d04d6865d927b6b6 subnet-06b61444a857f25a8 \
  --tags Key=kubernetes.io/role/elb,Value=1 Key=kubernetes.io/cluster/IIR-dev-mern-eks-cluster,Value=shared
```

#### 2. Docker Repository Issues

**Problem**: Wrong Docker repo name causing image pull back state

**Solution**: Ensure CI pipelines correctly update manifests

**Recovery Commands**:
```bash
# Delete old replicas and restart deployment
kubectl delete rs -n three-tier --selector=role=api
kubectl rollout restart deployment api -n three-tier
```

#### 3. Load Balancer IAM Issues

**Solution**:
```bash
# Download updated IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

# Update role policy
aws iam put-role-policy \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# Restart controller
kubectl rollout restart deployment aws-load-balancer-controller -n kube-system
```

#### 4. ECR Secret Issues

**Solution**:
```bash
# Create ECR registry secret
kubectl create secret docker-registry ecr-registry-secret \
  --docker-server=<AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region <REGION>) \
  -n three-tier

# Patch service account
kubectl patch serviceaccount default \
  -n three-tier \
  -p '{"imagePullSecrets": [{"name": "ecr-registry-secret"}]}'
```

## 📊 Monitoring Setup

### Prometheus Installation

```bash
# Add Helm repositories
helm repo add stable https://charts.helm.sh/stable
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo list

# Install Prometheus
helm install prometheus prometheus-community/prometheus

# Change service to LoadBalancer
kubectl edit svc prometheus-server
# Change to LoadBalancer Type
```

### Grafana Installation

```bash
# Add Grafana repository
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Grafana
helm install grafana grafana/grafana

# Change service to LoadBalancer
kubectl edit svc grafana

# Get admin password
kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

### Grafana Dashboards

Import the following dashboard IDs for application monitoring:
- **6417**: Application monitoring dashboard
- **17375**: Additional monitoring dashboard

![Grafana Dashboard](assets/Grafana%20Dashboard.png)

![Grafana Dashboard 2](assets/Grafana%20Dashboard%202.png)

## 🏠 Project Structure

```
finkraft-app-repo/
├── Application-Code/
│   ├── backend/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── db.js
│   │   ├── index.js
│   │   └── package.json
│   └── frontend/
│       ├── public/
│       ├── src/
│       ├── services/
│       └── package.json
├── Jenkins-Pipeline-Code/
│   ├── Jenkinsfile-Backend
│   └── Jenkinsfile-Frontend
├── Kubernetes-Manifests-file/
│   ├── Backend/
│   ├── Frontend/
│   ├── Database/
│   └── ingress.yaml
├── assets/
│   └── [Deployment Images]
└── README.md
```

## 🔐 Security Considerations

- Use IAM roles instead of access keys where possible
- Implement proper subnet tagging for EKS
- Configure security groups with minimal required access
- Use private subnets for EKS worker nodes
- Implement proper RBAC in Kubernetes
- Regular security scanning with Trivy and SonarQube

## 📝 Notes

- Ensure all subnets are properly tagged for ArgoCD (must be in public subnets)
- Custom domain configuration: `app.<your-domain-name>.in`
- Monitor cluster costs with spot instances
- Regular backup of EKS configuration and application data
- Keep all tools and dependencies updated to latest stable versions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and quality checks
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
