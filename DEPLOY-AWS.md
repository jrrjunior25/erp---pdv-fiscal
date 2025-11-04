# 🚀 Deploy Backend na AWS

## Opção 1: AWS Elastic Beanstalk (Mais Simples)

### 1. Instalar AWS CLI e EB CLI
```bash
# Instalar AWS CLI
pip install awscli

# Configurar credenciais
aws configure

# Instalar EB CLI
pip install awsebcli
```

### 2. Inicializar Elastic Beanstalk
```bash
cd backend
eb init -p docker erp-pdv-backend --region us-east-1
```

### 3. Criar ambiente e fazer deploy
```bash
eb create erp-pdv-prod
eb deploy
```

### 4. Configurar variáveis de ambiente
```bash
eb setenv DATABASE_URL="sua-database-url" JWT_SECRET="seu-jwt-secret" GEMINI_API_KEY="sua-api-key"
```

### 5. Abrir aplicação
```bash
eb open
```

---

## Opção 2: AWS ECS + Fargate (Serverless Container)

### 1. Build e push da imagem Docker
```bash
cd backend

# Login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <sua-conta>.dkr.ecr.us-east-1.amazonaws.com

# Criar repositório
aws ecr create-repository --repository-name erp-pdv-backend --region us-east-1

# Build da imagem
docker build -t erp-pdv-backend .

# Tag da imagem
docker tag erp-pdv-backend:latest <sua-conta>.dkr.ecr.us-east-1.amazonaws.com/erp-pdv-backend:latest

# Push da imagem
docker push <sua-conta>.dkr.ecr.us-east-1.amazonaws.com/erp-pdv-backend:latest
```

### 2. Criar Task Definition (ECS)
Crie arquivo `task-definition.json`:
```json
{
  "family": "erp-pdv-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<sua-conta>.dkr.ecr.us-east-1.amazonaws.com/erp-pdv-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DATABASE_URL", "value": "sua-database-url"},
        {"name": "JWT_SECRET", "value": "seu-jwt-secret"},
        {"name": "GEMINI_API_KEY", "value": "sua-api-key"}
      ]
    }
  ]
}
```

### 3. Registrar Task Definition
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### 4. Criar Cluster e Service
```bash
# Criar cluster
aws ecs create-cluster --cluster-name erp-pdv-cluster

# Criar service
aws ecs create-service \
  --cluster erp-pdv-cluster \
  --service-name erp-pdv-service \
  --task-definition erp-pdv-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

## Opção 3: AWS EC2 (Controle Total)

### 1. Criar instância EC2
- Tipo: t2.micro (Free Tier)
- AMI: Amazon Linux 2
- Security Group: Abrir porta 3001

### 2. Conectar via SSH
```bash
ssh -i sua-chave.pem ec2-user@seu-ip-publico
```

### 3. Instalar dependências
```bash
# Instalar Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Instalar Git
sudo yum install -y git

# Instalar PM2
sudo npm install -g pm2
```

### 4. Clonar e configurar projeto
```bash
git clone seu-repositorio
cd erp-+-pdv-fiscal/backend

# Instalar dependências
npm install

# Configurar .env
nano .env

# Gerar Prisma Client
npx prisma generate

# Rodar migrations
npx prisma migrate deploy

# Build
npm run build
```

### 5. Iniciar com PM2
```bash
pm2 start dist/main.js --name erp-backend
pm2 startup
pm2 save
```

---

## Opção 4: AWS Lambda + API Gateway (Serverless)

### 1. Instalar Serverless Framework
```bash
npm install -g serverless
```

### 2. Criar serverless.yml no backend
```yaml
service: erp-pdv-backend

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    JWT_SECRET: ${env:JWT_SECRET}
    GEMINI_API_KEY: ${env:GEMINI_API_KEY}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

### 3. Deploy
```bash
cd backend
serverless deploy
```

---

## Banco de Dados na AWS

### Opção 1: RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier erp-pdv-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password SuaSenha123 \
  --allocated-storage 20
```

### Opção 2: RDS MySQL
Similar ao PostgreSQL, trocar `--engine postgres` por `--engine mysql`

---

## Custos Estimados (us-east-1)

| Serviço | Custo Mensal |
|---------|--------------|
| **Elastic Beanstalk** (t2.micro) | ~$10 |
| **ECS Fargate** (256 CPU, 512 MB) | ~$5-15 |
| **EC2 t2.micro** | Grátis (Free Tier) |
| **Lambda** | Grátis até 1M requisições |
| **RDS t3.micro** | ~$15 |

---

## Recomendação

**Para começar**: Use **EC2 t2.micro** (Free Tier) ou **Elastic Beanstalk**

**Para produção**: Use **ECS Fargate** ou **Elastic Beanstalk** com RDS

**Para escala**: Use **Lambda + API Gateway** com RDS Aurora Serverless
