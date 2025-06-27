# quebranunca-web

Frontend oficial da plataforma **QuebraNunca** – Interface web para gestão colaborativa de jogadores, grupos, partidas e rankings de futevôlei.

## 🧱 Stack

- **Framework**: React 18 + Vite
- **Estilo**: Tailwind CSS
- **Roteamento**: React Router
- **Gerenciamento de Estado**: Context API (ou outro, conforme evolução)
- **Containerização**: Docker
- **Deploy**: AWS ECS Fargate (via ECR)
- **Hospedagem**: domínio `quebranunca.com`

## 🚀 Funcionalidades

- Cadastro e login de jogadores
- Criação e visualização de grupos
- Agendamento e submissão de partidas
- Validação colaborativa de resultados
- Ranking por grupo

## 📁 Estrutura do Projeto

```
/src
  /assets
  /components
  /contexts
  /hooks
  /pages
  /routes
  /services
  /styles
  /utils
  main.jsx
  App.jsx
```

## 🧪 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Yarn ou npm
- Docker (para container)

### Instalação e execução

```bash
# Instalar dependências
yarn install

# Rodar o projeto
yarn dev
```

A aplicação estará disponível em `http://localhost:5173`.

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` e defina a variável `VITE_API_URL`:

```env
VITE_API_URL=http://localhost:5001/api
```

Se desejar compartilhar a configuração, você pode incluir um arquivo `.env.example` como referência.

## 🐳 Docker

### Build da imagem

```bash
docker build -t quebranunca-web .
```

### Executar localmente

```bash
docker run -p 80:80 quebranunca-web
```

## 📦 Deploy

O deploy é feito via imagem Docker publicada no **ECR**, rodando no **ECS Fargate** com balanceador de carga.

Veja detalhes em [`docs/deploy-aws.md`](./docs/deploy-aws.md)

## 🧠 Design System

Utilizamos Tailwind com componentes personalizados. Futuramente, planejamos consolidar um design system reutilizável.

## 🛠 Contribuindo

Contribuições são bem-vindas! Veja [`CONTRIBUTING.md`](./CONTRIBUTING.md) para mais detalhes.
