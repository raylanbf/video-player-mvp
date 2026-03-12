# Video Player MVP

Um Produto Mínimo Viável (MVP) de um sistema de videoaulas com perguntas interativas obrigatórias. Desenvolvido com frontend vanilla (HTML/CSS/JS), backend Node.js (Express) e banco de dados SQLite.

## Funcionalidades

- **Área do Administrador:** 
  - Login simples.
  - CRUD de Vídeos.
  - CRUD de Perguntas interativas (com minuto exato de disparo, alternativas e feedbacks).
- **Área do Aluno:**
  - Player de vídeo customizado.
  - Bloqueio de avanço para capítulos não assistidos.
  - Video pausa automaticamente no minuto configurado pelo professor.
  - Modal de pergunta obrigatória; avanço só é liberado em caso de acerto.
  - Progresso salvo localmente e na API.

## Tecnologias

- **Backend:** Node.js, Express, SQLite3.
- **Frontend:** HTML5, CSS3, JavaScript Vanilla.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14+ recomendada).

## Instalação e Execução

1. No terminal, acesse a pasta raiz do projeto.
2. Instale as dependências executando:
   ```bash
   npm install
   ```
3. Inicialize o banco de dados e os dados de exemplo (`seed`):
   ```bash
   node init-db.js
   ```
   *Nota: O seed já adiciona um usuário admin, um vídeo hospedado em servidor público (BigBuckBunny.mp4) e 4 perguntas distribuídas em minutos iniciais para testes (min 2, 4, 6, 8).*

4. Inicie o servidor web da aplicação:
   ```bash
   node server.js
   ```

5. O servidor estará rodando em: `http://localhost:3000`

## Fluxo de Uso Teste

**Administrador:**
1. Acesse `http://localhost:3000` e clique em "Área do Administrador".
2. Acesse com:
   - Usuário: **admin**
   - Senha: **admin123**
3. Visualize o vídeo de exemplo ou crie novos.
4. Clique em "Perguntas" na tabela de vídeos para customizar as interações.

**Aluno:**
1. Acesse `http://localhost:3000` e clique em "Área do Aluno".
2. Observe que ao tentar avançar na linha do tempo para além do primeiro ponto de bloqueio, o vídeo irá retroceder automaticamente.
3. Ao longo da reprodução, o vídeo pausará e mostrará o modal com a pergunta correspondente àquele trecho.
4. Se o aluno errar, receberá o feedback negativo e poderá tentar novamente. Se acertar, o vídeo continua de onde parou.

## Considerações Técnicas
- As validações e proteções de rotas foram mantidas simples neste MVP para facilitar o uso local. Em um cenário real, tokens JWT verdadeiros seriam adicionados à área do aluno.
- URLs de Vídeo: a aplicação usa um player `<video>` nativo do HTML5, garantindo que o tempo (`currentTime`) possa ser manipulado perfeitamente para bloquear saltos temporais de alunos. Para vídeos do YouTube, seria necessária a integração oficial da API de IFrames do Youtube.
