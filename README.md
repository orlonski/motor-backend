# Motor de Integrações - Backend

API REST para gerenciar configurações do motor de integrações com n8n.

## 📋 Sobre o Projeto

Este backend fornece uma API completa para gerenciar integrações, endpoints de API e mapeamentos de campos. Desenvolvido com Node.js, Express e Prisma ORM, oferece autenticação JWT e validação robusta de dados.

### Funcionalidades

- ✅ **Autenticação JWT**: Sistema seguro de login com tokens
- ✅ **CRUD de Integrações**: Gerenciamento completo de integrações
- ✅ **CRUD de Endpoints**: Configuração de endpoints de API
- ✅ **CRUD de Mapeamentos**: Definição de mapeamentos de campos
- ✅ **Validação de Dados**: Validação automática com express-validator
- ✅ **Tratamento de Erros**: Sistema centralizado de tratamento de erros
- ✅ **Busca e Filtros**: Funcionalidade de busca em todas as entidades

## 🚀 Tecnologias Utilizadas

- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web minimalista
- **Prisma ORM** - ORM moderno para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **bcryptjs** - Hash seguro de senhas
- **express-validator** - Validação de dados

## 📦 Estrutura do Projeto

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   └── seed.js                # Script de seed
├── src/
│   ├── config/
│   │   └── database.js        # Configuração do Prisma
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── integrationController.js
│   │   ├── endpointController.js
│   │   └── mappingController.js
│   ├── middleware/
│   │   ├── auth.js            # Middleware de autenticação
│   │   ├── errorHandler.js    # Tratamento de erros
│   │   └── validator.js       # Validação de dados
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── integrationRoutes.js
│   │   ├── endpointRoutes.js
│   │   └── mappingRoutes.js
│   ├── app.js                 # Configuração do Express
│   └── server.js              # Ponto de entrada
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 12+ instalado e rodando
- npm ou yarn

### Passo 1: Instalar Dependências

```bash
cd backend
npm install
```

### Passo 2: Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/motor_integracoes?schema=public"

# JWT
JWT_SECRET="sua_chave_secreta_super_segura_aqui_mude_em_producao"
JWT_EXPIRES_IN="24h"

# Server
PORT=5000
NODE_ENV=development

# Admin User (usado no seed)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Passo 3: Configurar o Banco de Dados

#### 3.1. Criar o banco de dados PostgreSQL

```sql
CREATE DATABASE motor_integracoes;
```

#### 3.2. Gerar o Prisma Client

```bash
npm run prisma:generate
```

#### 3.3. Executar as migrations

```bash
npm run prisma:migrate
```

Quando solicitado, dê um nome para a migration (ex: `init`).

#### 3.4. Popular o banco com dados iniciais (seed)

```bash
npm run prisma:seed
```

Isso criará:
- Um usuário admin (username: `admin`, password: `admin123`)
- Uma integração de exemplo
- Um endpoint de exemplo
- Alguns mapeamentos de exemplo

### Passo 4: Iniciar o Servidor

#### Modo Desenvolvimento (com hot reload)

```bash
npm run dev
```

#### Modo Produção

```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📡 Endpoints da API

### Autenticação

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin"
  }
}
```

#### Obter Usuário Atual
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Integrações

#### Listar Integrações
```http
GET /api/integrations
Authorization: Bearer {token}

# Com busca
GET /api/integrations?search=CRM
```

#### Buscar Integração
```http
GET /api/integrations/:id
Authorization: Bearer {token}
```

#### Criar Integração
```http
POST /api/integrations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "CRM XPTO",
  "description": "Integração com CRM"
}
```

#### Atualizar Integração
```http
PUT /api/integrations/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "CRM XPTO Atualizado",
  "description": "Nova descrição"
}
```

#### Deletar Integração
```http
DELETE /api/integrations/:id
Authorization: Bearer {token}
```

### Endpoints

#### Listar Endpoints de uma Integração
```http
GET /api/integrations/:integrationId/endpoints
Authorization: Bearer {token}

# Com busca
GET /api/integrations/:integrationId/endpoints?search=cliente
```

#### Buscar Endpoint
```http
GET /api/endpoints/:id
Authorization: Bearer {token}
```

#### Criar Endpoint
```http
POST /api/endpoints
Authorization: Bearer {token}
Content-Type: application/json

{
  "integrationId": "uuid",
  "name": "Criar Cliente",
  "httpMethod": "POST",
  "url": "https://api.example.com/customers",
  "headersTemplate": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{token}}"
  },
  "authenticationType": "Bearer Token"
}
```

#### Atualizar Endpoint
```http
PUT /api/endpoints/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Criar Cliente V2",
  "httpMethod": "POST",
  "url": "https://api.example.com/v2/customers"
}
```

#### Deletar Endpoint
```http
DELETE /api/endpoints/:id
Authorization: Bearer {token}
```

### Mapeamentos

#### Listar Mapeamentos de um Endpoint
```http
GET /api/endpoints/:endpointId/mappings
Authorization: Bearer {token}

# Filtrar por direção
GET /api/endpoints/:endpointId/mappings?direction=request
GET /api/endpoints/:endpointId/mappings?direction=response

# Com busca
GET /api/endpoints/:endpointId/mappings?search=email
```

#### Buscar Mapeamento
```http
GET /api/mappings/:id
Authorization: Bearer {token}
```

#### Criar Mapeamento
```http
POST /api/mappings
Authorization: Bearer {token}
Content-Type: application/json

{
  "endpointId": "uuid",
  "direction": "request",
  "sourcePath": "data.customer.email",
  "targetPath": "customer.email"
}
```

#### Atualizar Mapeamento
```http
PUT /api/mappings/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "direction": "response",
  "sourcePath": "customer.id",
  "targetPath": "data.customerId"
}
```

#### Deletar Mapeamento
```http
DELETE /api/mappings/:id
Authorization: Bearer {token}
```

## 🔐 Autenticação

Todas as rotas da API (exceto `/api/auth/login` e `/health`) requerem autenticação via JWT.

Para autenticar, inclua o token no header `Authorization`:

```
Authorization: Bearer {seu_token_jwt}
```

O token é obtido através do endpoint de login e expira em 24 horas (configurável via `JWT_EXPIRES_IN`).

## 🗄️ Esquema do Banco de Dados

### Tabela: users
```sql
id          UUID PRIMARY KEY
username    VARCHAR(100) UNIQUE
password    VARCHAR(255)
created_at  TIMESTAMPTZ
```

### Tabela: integrations
```sql
id          UUID PRIMARY KEY
name        VARCHAR(255)
description TEXT
created_at  TIMESTAMPTZ
```

### Tabela: api_endpoints
```sql
id                   UUID PRIMARY KEY
integration_id       UUID REFERENCES integrations(id)
name                 VARCHAR(255)
http_method          VARCHAR(10)
url                  TEXT
headers_template     JSONB
authentication_type  VARCHAR(50)
created_at           TIMESTAMPTZ
```

### Tabela: field_mappings
```sql
id          UUID PRIMARY KEY
endpoint_id UUID REFERENCES api_endpoints(id)
direction   VARCHAR(10)  -- 'request' ou 'response'
source_path TEXT
target_path TEXT
created_at  TIMESTAMPTZ
```

## 🧪 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento com hot reload
- `npm start` - Inicia o servidor em modo produção
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Executa migrations do banco de dados
- `npm run prisma:studio` - Abre o Prisma Studio (interface visual do banco)
- `npm run prisma:seed` - Popula o banco com dados iniciais

## 🔧 Ferramentas de Desenvolvimento

### Prisma Studio

Para visualizar e editar dados do banco de forma visual:

```bash
npm run prisma:studio
```

Isso abrirá uma interface web em `http://localhost:5555`

### Logs

O servidor usa o middleware `morgan` para logging de requisições HTTP em modo desenvolvimento.

## 🚢 Deploy em Produção

### Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis em produção:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="chave_super_secreta_e_complexa"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV=production
```

### Build e Deploy

1. **Instalar dependências:**
```bash
npm install --production
```

2. **Gerar Prisma Client:**
```bash
npm run prisma:generate
```

3. **Executar migrations:**
```bash
npx prisma migrate deploy
```

4. **Iniciar servidor:**
```bash
npm start
```

### Opções de Hospedagem

- **Heroku**: Suporte nativo para Node.js e PostgreSQL
- **Railway**: Deploy simplificado com PostgreSQL integrado
- **DigitalOcean App Platform**: Escalável e fácil de configurar
- **AWS EC2 + RDS**: Controle total sobre infraestrutura
- **Render**: Deploy gratuito com PostgreSQL

## 🔒 Segurança

- ✅ Senhas armazenadas com hash bcrypt (10 rounds)
- ✅ Autenticação JWT com tokens que expiram
- ✅ Validação de entrada em todas as rotas
- ✅ CORS habilitado (configure para produção)
- ✅ Proteção contra SQL Injection via Prisma ORM
- ✅ Headers de segurança (considere adicionar helmet.js)

### Recomendações para Produção

1. Use HTTPS em produção
2. Configure CORS para aceitar apenas domínios específicos
3. Adicione rate limiting (ex: express-rate-limit)
4. Implemente logs estruturados (ex: winston)
5. Configure monitoramento (ex: Sentry)
6. Use variáveis de ambiente seguras
7. Implemente backup automático do banco de dados

## 🐛 Tratamento de Erros

A API retorna erros no seguinte formato:

```json
{
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais (opcional)"
}
```

### Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `204` - Deletado com sucesso (sem conteúdo)
- `400` - Erro de validação
- `401` - Não autenticado
- `404` - Recurso não encontrado
- `409` - Conflito (registro duplicado)
- `500` - Erro interno do servidor

## 📝 Exemplos de Uso

### Fluxo Completo de Autenticação

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

const { token } = await loginResponse.json();

// 2. Usar o token em requisições subsequentes
const integrationsResponse = await fetch('http://localhost:5000/api/integrations', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const integrations = await integrationsResponse.json();
```

## 🤝 Integração com Frontend

O backend está configurado para funcionar perfeitamente com o frontend React. Certifique-se de que:

1. O backend está rodando na porta 5000
2. O CORS está habilitado (já configurado)
3. O frontend está configurado para fazer proxy para `http://localhost:5000`

## 📚 Recursos Adicionais

- [Documentação do Express](https://expressjs.com/)
- [Documentação do Prisma](https://www.prisma.io/docs/)
- [Documentação do JWT](https://jwt.io/)
- [Documentação do PostgreSQL](https://www.postgresql.org/docs/)

## 🆘 Solução de Problemas

### Erro de conexão com o banco de dados

Verifique se:
- PostgreSQL está rodando
- As credenciais no `.env` estão corretas
- O banco de dados `motor_integracoes` existe

### Erro "JWT_SECRET is not defined"

Certifique-se de que o arquivo `.env` existe e contém `JWT_SECRET`.

### Erro nas migrations

Execute:
```bash
npx prisma migrate reset
npm run prisma:migrate
npm run prisma:seed
```

## 📄 Licença

Este projeto é de uso interno.

## 👥 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
