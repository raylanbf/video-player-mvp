# Video Player MVP

Um Produto Mínimo Viável (MVP) de um sistema de videoaulas com perguntas interativas obrigatórias. 
Desenvolvido com **Frontend Vanilla (HTML/CSS/JS)** e **Backend em PHP / MySQL**, otimizado para rodar em hospedagens compartilhadas (como a **Hostinger**) usando **Apache (.htaccess)**.

## Funcionalidades

- **Área do Administrador:** 
  - Login simples.
  - CRUD de Vídeos.
  - CRUD de Perguntas interativas (com minuto exato de disparo, alternativas e feedbacks).
- **Área do Aluno:**
  - Player de vídeo customizado.
  - Bloqueio de avanço para capítulos não assistidos.
  - Vídeo pausa automaticamente no minuto configurado pelo professor.
  - Modal de pergunta obrigatória; avanço só é liberado em caso de acerto.
  - Progresso salvo na API.

## Tecnologias

- **Backend:** PHP 7.4+ (Autenticação via JWT Simples e Roteamento via `.htaccess`).
- **Banco de Dados:** MySQL / MariaDB (via PDO).
- **Frontend:** HTML5, CSS3, JavaScript Vanilla.

---

## 🚀 Deploy e Instalação na Hostinger (via GitHub)

Este projeto está configurado para publicação direta via GitHub para a Hostinger.

### Passos para a Hostinger:

1. **Configurar o Banco de Dados:**
   - Acesse o painel da Hostinger (hPanel) > Banco de Dados > Bancos de Dados MySQL.
   - Crie um novo banco de dados (ex: `u123456_videoplayer`) e grave o usuário e senha criados.
   - Abra o **phpMyAdmin** na Hostinger e importe o arquivo `schema_completo.sql` presente na raiz deste projeto.
   - *(O script SQL já insere dados de exemplo (Seed) incluindo um Vídeo e duas Perguntas de teste).*

2. **Editar as Credenciais do Banco (`api/db.php`):**
   - No GitHub (ou localmente antes do push), edite o arquivo `api/db.php`.
   - Modifique o bloco `else` (Configuração Produção) com os dados gerados no passo 1.
     ```php
     $host = 'srvXXXX.hstgr.io'; // Ou localhost se for o padrão da Hostinger
     $db   = 'u123456_videoplayer';
     $user = 'u123456_admin';
     $pass = 'SuaSenhaForteAqui';
     ```

3. **Deploy via GitHub:**
   - Configure a ferramenta de **Git/GitHub da Hostinger** (no hPanel) para apontar para o seu repositório deste projeto.
   - Configure para fazer o deploy automático (webhook) na branch `main`.
   - Assim que fizer o deploy, os arquivos estarão online.

### Roteamento Apache (Garantia de Funcionamento)
O painel administrativo consome URLs amigáveis (ex: `/api/videos`). Para que o PHP da Hostinger entenda, há um arquivo `api/.htaccess` nativo neste projeto que faz esse mapeamento invisível sob os panos.

---

## Fluxo de Uso e Teste

**Administrador:**
1. Acesse o seu domínio e clique em "Área do Administrador".
2. Acesse com:
   - Usuário: **admin**
   - Senha: **admin123** *(Este usuário foi inserido via `schema_completo.sql`)*
3. Clique em "Perguntas" na tabela de vídeos para customizar as interações ou crie vídeos novos.

**Aluno:**
1. Acesse o seu domínio e clique em "Área do Aluno".
2. Observe que ao tentar avançar na linha do tempo para além do primeiro ponto de bloqueio, o vídeo irá retroceder automaticamente.
3. Ao longo da reprodução, o vídeo pausará e mostrará o modal.
4. Se o aluno errar, receberá o feedback vermelho de erro. Acertando (verde), o vídeo o deixa continuar a assistir.

## Considerações Técnicas
- As validações e proteções de rotas foram mantidas simples neste MVP (ex. tokens em localstorage).
- As rotas PHP dentro de `api/admin` e `api/student` controlam permissão. 
- O player previne atalhos de inspecionar elementos do browser para inibir downloads simples do vídeo.
