# Sistema de Gestão de Vendas

Sistema web para gerenciamento de produtos, vendas, estoque e indicadores financeiros.

O projeto foi desenvolvido utilizando JavaScript e Node.js, com uma API REST construída com Express e banco de dados SQLite.

## 🚀 Tecnologias

- JavaScript
- Node.js
- Express
- SQLite
- REST API
- CORS
- Nodemon
- Git
- GitHub

## 📋 Funcionalidades

### Produtos

- Cadastro de produtos
- Consulta de produtos
- Consulta de produto por ID
- Atualização de produtos
- Exclusão lógica de produtos
- Controle de estoque
- Definição de estoque mínimo
- Cálculo de lucro bruto
- Cálculo de margem

### Vendas

- Registro de vendas
- Associação de produtos à venda
- Cálculo automático do subtotal
- Aplicação de desconto
- Registro de frete
- Registro de taxas
- Cálculo do custo dos produtos
- Cálculo do lucro
- Baixa automática do estoque
- Registro da movimentação de estoque

### Dashboard

- Faturamento
- Quantidade de vendas
- Produtos vendidos
- Custo dos produtos
- Taxas
- Lucro
- Margem
- Ticket médio
- Indicadores por canal de venda
- Filtro por período

## 📁 Estrutura do projeto

```text
src/
├── controllers/
│   ├── produtoController.js
│   ├── vendaController.js
│   └── dashboardController.js
│
├── routes/
│   ├── produtoRoutes.js
│   ├── vendaRoutes.js
│   └── dashboardRoutes.js
│
├── database/
│   └── database.js
│
└── server.js
```

## 🗄️ Banco de dados

O sistema utiliza SQLite.

Principais tabelas:

- `produtos`
- `vendas`
- `itens_venda`
- `movimentacoes_estoque`
- `despesas`

O arquivo `database.sqlite` é criado localmente e não é versionado no Git.

## 🔌 Endpoints

### Produtos

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/produtos` | Cadastrar produto |
| GET | `/produtos` | Listar produtos |
| GET | `/produtos/:id` | Buscar produto |
| PUT | `/produtos/:id` | Atualizar produto |
| DELETE | `/produtos/:id` | Excluir produto |

### Vendas

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/vendas` | Registrar venda |
| GET | `/vendas` | Listar vendas |
| GET | `/vendas/:id` | Buscar venda |

### Dashboard

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/dashboard` | Consultar indicadores |
| GET | `/dashboard?inicio=YYYY-MM-DD&fim=YYYY-MM-DD` | Consultar indicadores por período |

## ⚙️ Como executar

### 1. Clonar o projeto

```bash
git clone https://github.com/SEU-USUARIO/sistema-gestao-vendas.git
```

### 2. Entrar na pasta

```bash
cd sistema-gestao-vendas
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Iniciar o servidor

```bash
npm run dev
```

A API estará disponível em:

```text
http://localhost:3000
```

## 🧪 Testando a API

O projeto possui um arquivo:

```text
teste.http
```

Ele pode ser utilizado com a extensão REST Client do VS Code para testar os endpoints da aplicação.

## 📊 Exemplo

### Cadastro de produto

```http
POST http://localhost:3000/produtos
Content-Type: application/json

{
  "nome": "KIT-FACA-6UNIDADES",
  "sku": "KIT-FACA",
  "categoria": "Cozinha",
  "custo": 22.50,
  "preco": 79.99,
  "estoque": 50,
  "estoque_minimo": 10
}
```

### Registro de venda

```http
POST http://localhost:3000/vendas
Content-Type: application/json

{
  "canal": "Shopee",
  "desconto": 0,
  "frete": 0,
  "taxas": 19.99,
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 2
    }
  ]
}
```

## 🎯 Objetivo do projeto

O projeto tem como objetivo desenvolver uma aplicação real de gestão de vendas, permitindo controlar produtos, estoque, vendas e indicadores financeiros em um único sistema.

Além da utilização prática, o projeto também serve como demonstração de conhecimentos em desenvolvimento backend, APIs REST, banco de dados e JavaScript.

## 📌 Próximos passos

- [ ] Criar interface web
- [ ] Dashboard visual
- [ ] Gráficos
- [ ] Gestão de despesas
- [ ] Histórico de movimentações de estoque
- [ ] Cancelamento de vendas
- [ ] Filtros e paginação
- [ ] Autenticação de usuários
- [ ] Testes automatizados
- [ ] Docker
- [ ] PostgreSQL
- [ ] Deploy

## 👨‍💻 Autor

Luiz Miguel