# Formação SKS — Agência Escola e MVP local

## Acessos oficiais

- Aluno: http://127.0.0.1:4173/entrar.html?role=student&next=%2Faluno.html
- Professor: http://127.0.0.1:4173/entrar.html?role=teacher&next=%2Fprofessor.html

Após o login, `aluno.html#inicio` abre diretamente a Agência Escola, como na versão anterior. A central e o dashboard extras foram retirados. Os 25 módulos, perfil, temas e projeto final permanecem disponíveis.

A página pessoal `191026.html` do Desktop permanece intacta. Contas novas começam sem progresso e contas existentes preservam seus registros. Não há uma segunda central ou catálogo de unidades no acesso do aluno.

A abertura direta de `outputs/aluno.html` por arquivo continua sendo apenas um modo técnico de prévia offline, separado das contas. Não é o acesso oficial nem envia dados ao professor. Não transfira uma prévia para uma conta sem revisar e importar explicitamente seus dados.

## O que está disponível

- 9 fases e 25 módulos, preservando a grade atualizada fornecida.
- 301 tópicos de estudo e 17 entregáveis finais.
- Textos iniciais, exemplos, exercícios e 24 avaliações com quatro questões e justificativas.
- 14 bônus em formato textual.
- Agência Escola como ponto de partida da jornada.
- Hub do cliente com 11 áreas operacionais, inicialmente sem respostas preenchidas.
- Atalhos dos módulos para desenvolver o projeto enquanto estuda.
- Agenda pessoal vazia, apoio de estudo por busca e registro de dúvidas.
- Progresso, anotações, relatórios e modo escuro.
- Perfil com nome, iniciais e nível automático, de Agente em Formação a Agente Mentor. Minha conta mostra os seis níveis e os requisitos para avançar.

Marcar um entregável para revisão não aprova o projeto e não emite certificado. A página de certificados apresenta os requisitos; não existe emissão formal neste MVP. O apoio de estudo não é um assistente de IA generativa.

O nível de agente conta os 301 tópicos concluídos e os 17 entregáveis marcados no hub (318 etapas). Os seis patamares começam em 0%, 20%, 40%, 60%, 80% e 100%, sem promoção por arredondamento. É uma identificação de progresso, não de aprovação pedagógica ou certificação.

## Contas e acompanhamento do professor

Para acesso individual com acompanhamento, use **Entrar como aluno** ou http://127.0.0.1:4173/entrar.html?role=student&next=%2Faluno.html . Para criar a conta, o próprio aluno abre http://127.0.0.1:4173/entrar.html?role=student&mode=register&next=%2Faluno.html e informa nome, e-mail e senha. O professor entra em http://127.0.0.1:4173/professor.html e já vê os inscritos, sem recadastrar ou vincular manualmente. O painel não tem mais formulário de cadastro manual.

O painel começa mostrando **Alunos reais**. Em **Ferramentas de teste**, recolhido abaixo da lista, é possível preparar 2 ou 3 alunos fictícios TESTE, com cenários de início, andamento e necessidade de apoio. Repetir não altera progresso ou senha existentes. Os testes ficam identificados e separados das métricas dos alunos reais. As três contas da validação atual foram criadas expressamente a pedido do usuário, com backup prévio.

Para testar professor e aluno simultâneos, use janela anônima/privada ou outro perfil. Duas abas normais compartilham a mesma conta. O painel consulta novos cadastros e progressos a cada 12 segundos com a página visível, sem interromper busca ou apagar parecer não salvo; também existe o botão **Atualizar**. O aluno vê o parecer no projeto ao recarregar. A prévia sem login não envia dados ao professor.

Em uma instalação nova, o primeiro cadastro configura o professor. Não há senha padrão; nesta instalação, as contas existentes permanecem intactas. Depois, cada aluno cria a própria conta.

No modo com conta, progresso e projetos ficam no banco `local-data/sks.sqlite`, por usuário. O professor acompanha avaliações, atividades, dúvidas e o hub, e pode escrever uma devolutiva. O caderno pessoal do aluno não é exibido no painel docente. Contas não recebem automaticamente os registros da prévia; a recuperação exige a ação de importação correspondente.

**Ver aluno** abre a jornada real do aluno selecionado em modo somente leitura, sem trocar o login do professor ou alterar estudo/progresso. Para escrever uma devolutiva, use o botão separado **Relatório e parecer**. Caderno e observações pessoais ficam fora da consulta, e **Voltar ao professor** mantém sua sessão.

**Minha conta**, no menu e no avatar do aluno, reúne dados básicos editáveis, e-mail de login somente leitura, data de cadastro, identificação interna SKS e resumo da formação. Não há coleta de CPF, RG ou dados bancários. Celular, cidade e UF são opcionais e não são mostrados ao professor. A alteração de senha ainda não está disponível. Perfil e progresso têm revisões independentes, e nenhuma informação do print de referência foi copiada.

Uma conta já conectada continua usando seu banco ao abrir `/aluno.html`. Não há prévia anônima por HTTP na execução oficial. O recurso legado permanece restrito a testes com opção explícita, nunca ativada pelo comando normal de inicialização.

## Executar o servidor

Se o endereço local não responder, abra **Iniciar-SKS.cmd** na pasta do projeto ou execute:

```text
node server.cjs --port 4173
```

É necessário Node 24. O servidor atende somente neste computador. Não são necessários pacotes adicionais. As senhas usam scrypt e as sessões usam cookies HttpOnly, com autorização no servidor. Não há verificação de e-mail, recuperação de senha, pagamentos ou acesso público a esta instalação.

## Conteúdo e limites

Os textos são uma primeira versão didática escrita com apoio de IA a partir da grade autorizada. Precisam de revisão pedagógica, inclusive gabaritos e carga horária. Use um cliente fictício ou dados autorizados; nunca insira senhas, documentos pessoais, dados bancários ou materiais confidenciais.

O editor do professor permite revisar aulas e adicionar links HTTPS de vídeos ou materiais. Seus ajustes são compartilhados entre as contas do servidor; a prévia sem login usa os arquivos distribuídos. Não há upload, transcodificação ou hospedagem própria de vídeos. `curso-para-validacao.md` reúne a edição textual inicial e não é reescrito automaticamente pelo editor.

Os sites, o vídeo e as imagens fornecidos servem de referência. Nenhum site publicado foi alterado. `dist` contém a interface estática, não o servidor nem o banco de dados; copiar essa pasta para uma hospedagem não publica a autenticação.

## Mais detalhes e testes

Consulte `MVP-LOCAL.md` para salvamento, privacidade, recuperação da prévia antiga e limites de cada modo.

Execute `node work/test-all.cjs` para verificar a grade, a central, o hub, as avaliações, as entradas protegidas, a prévia técnica, o isolamento das contas e as permissões. Testes de servidor usam portas e bancos temporários separados, sem alterar o servidor principal.
