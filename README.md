# SmartRU — Sem Desperdício (Frontend)

Frontend web do sistema **SmartRU**, plataforma da startup estudantil da UFRPE que combate o desperdício de alimentos no Restaurante Universitário (RU) através de agendamento de refeições, visão computacional de fila e análise inteligente de cardápio.

Este repositório contém **apenas o frontend web** (React + Vite). O backend principal ("RU Sem Desperdício") e os serviços de IA (Menu Analyzer, FilaRural) vivem em repositórios separados da organização.

---

## 🧱 Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Build tool | [Vite](https://vitejs.dev/) 5 |
| UI | [React](https://react.dev/) 18 |
| Roteamento | [React Router DOM](https://reactrouter.com/) 6 |
| Estilo | [Tailwind CSS](https://tailwindcss.com/) 3 |
| Requisições HTTP | [Axios](https://axios-http.com/) |
| Ícones | [lucide-react](https://lucide.dev/) |
| Gráficos | [Recharts](https://recharts.org/) |
| Datas | [date-fns](https://date-fns.org/) |
| Analytics | [Firebase](https://firebase.google.com/) (Analytics apenas) |

Fontes usadas: **Syne** (títulos/display), **DM Sans** (corpo), **JetBrains Mono** (mono).

---

## 📁 Estrutura do projeto

```
├── public/                    # Favicons, ícones PWA e verificação do Google
├── src/
│   ├── assets/                 # Imagens estáticas (logo, etc.)
│   ├── components/
│   │   ├── layout/AppLayout.jsx        # Layout com navegação (usado nas rotas autenticadas)
│   │   ├── shared/LoadingScreen.jsx    # Tela de carregamento
│   │   ├── ui/                         # Componentes reutilizáveis (Modal, Spinner, FormInput, Logo, QueueStatusCard)
│   │   └── ProtectedRoute.jsx          # Guarda de rota (autenticação + permissão por tipo de usuário)
│   ├── contexts/
│   │   ├── AuthContext.jsx     # Estado global de autenticação (login/logout/registro)
│   │   └── ToastContext.jsx    # Sistema de notificações toast
│   ├── pages/
│   │   ├── auth/                # Login, Cadastro, Recuperar senha, Redefinir senha
│   │   ├── student/              # Dashboard, Agendar, Histórico, Perfil, Cardápio, Alterar senha
│   │   ├── staff/                 # Dashboard, Agendamentos (todos), Relatórios, Upload de cardápio
│   │   ├── DashboardRouter.jsx   # Decide qual dashboard mostrar (estudante vs funcionário)
│   │   └── NotFoundPage.jsx
│   ├── services/api.js         # Cliente Axios central + todos os endpoints da API
│   ├── utils/helpers.js        # Validação de CPF, formatação de datas, tradução de erros da API
│   ├── firebase.js             # Inicialização do Firebase (Analytics)
│   ├── App.jsx                  # Definição de todas as rotas da aplicação
│   ├── main.jsx                 # Ponto de entrada React
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .gitignore
```

---

## 🔐 Autenticação e permissões

- O login é feito por **CPF + senha** (`authAPI.login`), não por e-mail.
- A sessão do backend usa **cookies HttpOnly** (`withCredentials: true` no Axios) — o token não fica acessível via JavaScript.
- O frontend guarda os **dados do usuário** (nome, tipo, e-mail, etc.) no `localStorage`, sob a chave `smartru_user`, só para exibição na UI — a autenticação real é validada pelo backend a cada requisição.
- Existem 3 tipos de usuário (`user.type`): **`estudante`**, **`funcionario`** e **`convidado`**.
- `ProtectedRoute` bloqueia acesso a rotas para usuários não logados e pode restringir por tipo (`allowedTypes={['funcionario']}`), usado nas páginas exclusivas de funcionário (Agendamentos, Relatórios, Upload de Cardápio).
- O `api.js` tem um **interceptor de refresh automático**: se uma requisição retornar `401`, ele tenta renovar a sessão via `/user/refresh` uma vez; se falhar, limpa o `localStorage` e redireciona para `/login`. Erros `403` (sem permissão) e `429` (rate limit) não disparam esse fluxo.

---

## 🗺️ Rotas da aplicação

| Rota | Página | Acesso |
|---|---|---|
| `/login` | LoginPage | Público |
| `/cadastro` | RegisterPage | Público |
| `/recuperar-senha` | PasswordRecoverPage | Público |
| `/redefinir-senha` | PasswordResetPage | Público |
| `/dashboard` | DashboardRouter (Student ou Staff) | Autenticado |
| `/agendar` | SchedulePage | Autenticado |
| `/historico` | HistoryPage | Autenticado |
| `/perfil` | ProfilePage | Autenticado |
| `/alterar-senha` | ChangePasswordPage | Autenticado |
| `/cardapio` | MenuPage | Autenticado |
| `/agendamentos` | AllSchedulesPage | Apenas `funcionario` |
| `/relatorios` | ReportsPage | Apenas `funcionario` |
| `/cardapio-upload` | MenuUploadPage | Apenas `funcionario` |
| `*` | NotFoundPage | — |

---

## 🌐 Integração com a API (`src/services/api.js`)

Base URL padrão (produção): `https://semdesperdicio.smartru.com.br/api` — sobrescrita pela variável de ambiente `VITE_API_URL`.

Grupos de endpoints já mapeados no cliente:

- **`authAPI`** — login, register, logout, refresh
- **`userAPI`** — listagem, contagem, troca/recuperação/reset de senha, exclusão de conta
- **`scheduleAPI`** — criar, atualizar, confirmar, cancelar agendamento; `mySchedules` (minhas refeições) e `allSchedules` (visão do funcionário)
- **`menuAPI`** — upload de cardápio (multipart), cardápio atual, imagem do cardápio por refeição
- **`deviceAPI`** — registro de dispositivo (provavelmente para notificações push)
- **`notificationAPI`** — disparo de lembrete diário, colaboração de fila, listagem/consulta de jobs
- **`reportAPI`** — demanda por data, exportação, consumo por período (converte datas para formato `dd/mm/aaaa` automaticamente)

O tratamento de erros da API é centralizado em `getErrorMessage()` (`src/utils/helpers.js`), que sabe interpretar os formatos de erro usados pelo backend (`message`, `detail.msg`, `detail` como string/array, erros 422 com `details`) e devolve uma mensagem amigável — inclusive traduzindo erros de "duplicate key"/"unique constraint" para "Já tens uma refeição agendada para esse dia e tipo!".

---

## ▶️ Como rodar localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18+ e npm

### Passos

```bash
# 1. Clonar o repositório
git clone https://github.com/FilaRural-UFRPE/Frontend_RU_Sem_Desperdicio.git
cd Frontend_RU_Sem_Desperdicio

# 2. Instalar dependências
npm install

# 3. (Opcional) configurar a URL da API
# crie um arquivo .env na raiz com:
# VITE_API_URL=http://localhost:8000/api   (ou a URL do backend que você está usando)

# 4. Rodar em modo desenvolvimento
npm run dev
```

O Vite vai subir o servidor local (normalmente em `http://localhost:5173`).

### Outros scripts

```bash
npm run build     # gera a build de produção na pasta dist/
npm run preview   # serve a build de produção localmente para testar
```

> ⚠️ Sem configurar `VITE_API_URL`, o app vai tentar falar direto com a API de **produção** (`semdesperdicio.smartru.com.br`). Para desenvolver contra o backend local, sempre configure o `.env`.

---

## 🔑 Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_API_URL` | Não (tem fallback de produção) | URL base da API do backend |

O arquivo `.env` **não deve ser commitado** (já está no `.gitignore`).

---

## 🔥 Firebase

O projeto inicializa o Firebase apenas para **Analytics** (`src/firebase.js`). As chaves de configuração do Firebase Web SDK (`apiKey`, `authDomain`, etc.) são identificadores públicos por design — não são segredos como uma chave de API de servidor — mas se o projeto Firebase mudar de dono/config, esse arquivo precisa ser atualizado manualmente.

---

## 📦 O que fica de fora do controle de versão

`node_modules/`, `dist/` e `.env` estão no `.gitignore` e não devem ser commitados. Depois de clonar, rode `npm install` para gerar o `node_modules` localmente.

---

## 👥 Equipe (Smart RU)

| Nome | Papel |
|---|---|
| Tomás José Kavela | CEO / Fundador |
| Jezreel David Figueiredo | CBO |
| Daniel Eric | DevOps |
| Arthur Iarley | CTO |
| José Alberto | Dev Backend |
| Edson Amorim | QA e Acessibilidade |
| Bruno Leal | Dev / Social Media |

---

## 🔗 Repositórios relacionados

- Backend principal (RU Sem Desperdício) — migrations e API principal
- [`FilaRural-Visao-Computacional`](https://github.com/FilaRural-UFRPE/FilaRural-Visao-Computacional) — serviço de visão computacional (YOLOv8) que estima o tamanho da fila do RU em tempo real
