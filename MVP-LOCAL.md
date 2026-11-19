# Agência Escola SKS — MVP local

## Começar

Entre como aluno em http://127.0.0.1:4173/entrar.html?role=student&next=%2Faluno.html ou como professor em http://127.0.0.1:4173/entrar.html?role=teacher&next=%2Fprofessor.html . As áreas exigem uma sessão; o acesso anônimo HTTP não está habilitado por padrão.

O ambiente anterior foi restaurado em `aluno.html#inicio`, sem uma central ou dashboard adicionais. A Agência Escola, os 25 módulos, Minha conta, o perfil e o projeto final continuam disponíveis. Contas e progresso real não foram alterados.

O botão **Explorar unidade** abre os 25 módulos dentro do ambiente original do aluno, com a mesma sessão. A grade e o HUB existentes são preservados. O arquivo pessoal do Desktop não foi modificado.

Para testar uma conta de aluno individual, saia da conta e escolha **Criar conta de aluno**. E-mail funciona somente como identificador local; não há envio de mensagens, verificação de e-mail ou recuperação de senha. Use uma senha exclusiva para o teste. O modo técnico de prévia offline por arquivo e a prévia HTTP explicitamente habilitada em testes permanecem separados das contas; não são a entrada oficial.

Se o endereço parar de responder, execute **Iniciar-SKS.cmd** na pasta do projeto, ou `node server.cjs --port 4173` com Node 24. O servidor atende somente este computador. Não é necessário instalar pacotes para executar.

Foi configurado um atalho **Formacao SKS.lnk** na pasta Inicializar da sua conta do Windows. Ele inicia o supervisor em segundo plano quando você entra no Windows, usando a cópia verificada do Node em `.local-runtime/node.exe`, sem depender do cache ou da duração da sessão do Codex. O supervisor verifica o servidor a cada cinco segundos e tenta reiniciar somente o seu próprio processo quando necessário. Não interfere com outro programa que ocupe a porta 4173. Esse mecanismo não é um serviço do sistema, não pede senha de administrador e não publica a plataforma.

Para a primeira ativação, se o processo iniciado pelo Codex não permanecer ligado, execute **Ativar-SKS.cmd pelo Explorador de Arquivos do Windows**, fora do Codex. Isso ativa o mesmo atalho que rodará nos próximos logins. Não é necessário deixar uma janela de terminal aberta nesse modo. O computador precisa permanecer ligado e com o usuário conectado; encerrar o supervisor ou a sessão do Windows interrompe essa recuperação. A instalação foi verificada; uma inicialização real após reiniciar o Windows ainda exige validação pelo usuário.

**Iniciar-SKS.cmd** continua como alternativa manual; nesse caso, mantenha sua janela aberta, podendo minimizá-la. Os dados não são apagados quando o servidor para. Consulte `ACESSO-LOCAL.md` na raiz do projeto para ativação, diagnóstico e remoção apenas do atalho de início automático.

## O fluxo principal

### Login e acompanhamento de alunos

Entrada do aluno: http://127.0.0.1:4173/entrar.html?role=student&next=%2Faluno.html . Entrada do professor: http://127.0.0.1:4173/entrar.html?role=teacher&next=%2Fprofessor.html . A conta existente do professor é preservada; não há uma senha padrão nova.

O aluno faz seu próprio cadastro em http://127.0.0.1:4173/entrar.html?role=student&mode=register&next=%2Faluno.html . Ele informa nome, e-mail e senha e aparece automaticamente na lista do professor, mesmo antes de estudar. Não existe etapa de recadastro ou vínculo manual no painel. O formulário de cadastro manual do professor foi removido.

**Preparar 2 ou 3 alunos de teste** cria contas identificadas como TESTE: iniciante (zero progresso), em andamento (12 tópicos, avaliação de 75% e hub parcial) e precisa de apoio (3 aulas, avaliação de 25%, dúvida aberta e hub parcial). Os registros iniciais são fictícios, não evidência de estudo real. Repetir a ação reutiliza as contas e nunca restaura, sobrescreve ou apaga o que você modificou nelas. Nesta validação, as três contas foram criadas a pedido do usuário após backup do banco local.

O painel abre com o filtro **Alunos reais**. As contas fictícias ficam em **Contas TESTE**, e o preparo de cenários fica recolhido em **Ferramentas de teste**, abaixo da lista. Os indicadores reais excluem as demonstrações. **Ver aluno** abre a própria interface de jornada, aulas, biblioteca e hub daquele aluno em modo de consulta. **Relatório e parecer** abre o acompanhamento pedagógico e permite escrever a devolutiva. O aluno vê o parecer no Projeto final ao atualizar a página.

O **Painel do professor** é o primeiro link da barra lateral, acima de **Visão geral**, tanto no editor quanto no próprio painel. A mesma navegação dá acesso à formação, projeto, biblioteca, gestão de conteúdos e revisão. No celular, o botão de menu abre e fecha essa barra. O botão **Modo claro / Modo escuro** está no cabeçalho do painel e compartilha a preferência de tema com as outras páginas, quando o armazenamento do navegador está disponível. Trocar o tema não atualiza a lista de alunos nem descarta pareceres em edição. Um parecer não salvo também bloqueia a saída pelo menu até ser salvo ou descartado.

### Ambiente do aluno e Minha conta

O link docente `aluno.html?aluno=<identificador>#inicio` exige uma sessão de professor e mantém essa sessão, sem entrar como aluno. O banner identifica o aluno consultado e a leitura apenas. Navegar não grava tempo, última aula, respostas, notas ou progresso; os controles de edição ficam bloqueados. Caderno e observações pessoais não são enviados para essa consulta. O botão **Voltar ao professor** não encerra a sessão. Um usuário aluno não pode abrir essa visão de outra pessoa.

No próprio ambiente, **Minha conta** aparece no menu e no avatar, em `aluno.html#conta`. Ela reúne nome, nome de preferência, contato e localização opcionais, e-mail de login somente leitura, data do cadastro, identificação local SKS e resumo da formação. O aluno pode salvar seus dados básicos; o perfil tem controle de revisão independente do progresso. E-mail, função e senha não são alterados por esse formulário. Alteração de senha e verificação de e-mail ainda não estão implementadas.

A identificação SKS é interna: não corresponde a matrícula universitária ou certificado. Não são coletados CPF, RG, data de nascimento, endereço residencial ou dados bancários nesta etapa. O professor pode consultar o perfil básico do aluno, mas não recebe celular, cidade ou UF; não pode editá-lo. A prévia sem login apresenta orientação para entrar, sem inventar dados de conta.

### Perfil e nível de agente

O canto superior identifica o aluno por nome e iniciais, com o nível logo abaixo. Ao abrir **Minha conta**, o aluno vê sua evolução e o que falta para avançar. Há seis níveis: **Agente Iniciante** (0%), **Agente Aprendiz** (20%), **Agente em Formação** (40%), **Agente em Desenvolvimento** (60%), **Agente Avançado** (80%) e **Agente Pleno** (100%).

A classificação é calculada automaticamente a partir dos 301 tópicos de estudo concluídos e dos 17 entregáveis do hub marcados para revisão, totalizando 318 etapas. Rascunhos, tempo aberto e entregáveis apenas listados não contam. O limiar usa a contagem exata; um percentual arredondado não promove o aluno. Reabrir uma etapa pode reduzir o nível. O cálculo não altera os registros existentes nem equivale a aprovação ou certificado.

O indicador **online** se refere à sessão aberta no navegador, não a um serviço de presença entre dispositivos. Na consulta do professor, o perfil mostra **em consulta**, sem afirmar que o aluno está online. A prévia permanece identificada como **prévia** e continua separada das contas.

A lista consulta novos cadastros e progressos a cada 12 segundos enquanto a página estiver visível, e ao retornar à aba. Não é transmissão instantânea em tempo real. A atualização pausa durante busca, seleção de filtros ou edição de parecer para não interromper o trabalho. Um parecer não salvo pode ser salvo ou descartado explicitamente; não é apagado pelo atualizador. O botão **Atualizar** continua disponível.

Para professor e aluno simultâneos, abra o login do aluno em uma janela anônima/privada ou outro perfil do navegador. Uma nova aba comum compartilha a sessão. Também é possível sair e entrar em outra conta, mas não há acesso por impersonação. Se a sessão mudar enquanto o aluno edita, o salvamento é bloqueado e o rascunho pode ser exportado sem gravar na conta errada.

1. **Minha Jornada SKS:** entrada pela Agência Escola, progresso real e nove fases da grade.
2. **Agência Escola:** 25 módulos originais, 318 tópicos/entregáveis, textos, exemplos, exercícios e 24 avaliações de quatro questões.
3. **Projeto final · Hub:** 11 áreas operacionais, 40 campos-base e dois links HTTPS opcionais. Todos os valores começam vazios, sem dados da Michelli ou de qualquer outro cliente.
4. **Estudar e construir em paralelo:** os módulos e aulas têm atalhos para os quadros relacionados. Você escreve o conteúdo; a plataforma não copia respostas das aulas para o projeto.
5. **17 entregáveis:** os títulos originais do módulo 25 são preservados. Só ficam disponíveis para marcar quando os campos relacionados estão preenchidos. Marcar para revisão não aprova o projeto nem conclui aulas.
6. **Professor:** acompanha progresso, avaliações, respostas, dúvidas e hub. Pode escrever uma devolutiva que aparece no projeto do aluno. O caderno privado de anotações não é exibido no painel docente.

As áreas do hub são Cliente e negócio; Pesquisa e estratégia; Marca e comunicação; Canais e experiência; Conteúdo e produção; Campanhas e aquisição; Vendas e negociação; CRM e relacionamento; Dados e performance; Acervo e IA aplicada; Operação e entrega final. Os 25 módulos apontam para as áreas relacionadas, sem alterar a grade original.

## Salvamento e privacidade

A **prévia sem login** guarda seu teste no navegador, na chave `sks-preview-workspace-v1`. Ela não cria contas e não lê ou grava o banco de alunos. Diferentes navegadores, endereços e o modo `file:` podem ter armazenamentos distintos. Se o navegador bloquear esse recurso, a tela informa que não salvou; use **Exportar progresso** antes de sair.

No **modo com conta**, os dados são salvos por usuário em `local-data/sks.sqlite`, no computador que executa o servidor. Continuam disponíveis após reiniciar o servidor. A confirmação **Salvo na sua conta** aparece após resposta do servidor. Se houver erro ou conflito entre abas, exporte um backup antes de recarregar. Saídas e trocas de conta aguardam as gravações pendentes.

Senhas são armazenadas com scrypt; sessões usam cookies HttpOnly. A API verifica a identidade, a função e a revisão dos registros no servidor, incluindo bloqueio de tentativas de gravação de uma aba pertencente a outra conta. Isto é uma base de validação local, não uma auditoria ou garantia de segurança de produção.

As contas e sessões não são compartilhadas entre as portas usadas pelos testes. Os testes automáticos usam dados fictícios isolados em outra base. A base principal só recebe contas de demonstração pela ação explícita de preparo de turma; esses registros aparecem identificados como TESTE.

Use **Exportar progresso** para guardar seu hub, anotações, respostas e resultados. O backup contém seus registros privados: guarde-o com cuidado. **Baixar relatório** gera um resumo de estudo sem o caderno pessoal. O professor pode exportar o relatório agregado dos alunos.

Registros da prévia antiga permanecem no navegador. A prévia sem login pode retomar esse teste; ele não é copiado automaticamente para contas novas. Em Progresso e relatórios da conta, **Recuperar prévia antiga** solicita sua confirmação. No editor do professor, **Recuperar editor anterior** aparece quando há materiais antigos e permite incorporá-los ao curso compartilhado deste servidor local. Os registros antigos não são apagados.

As edições feitas no editor do professor são compartilhadas entre as contas do servidor. A prévia sem login usa os materiais distribuídos nos arquivos locais; alterações do editor não reescrevem automaticamente esses arquivos nem o texto `curso-para-validacao.md`.

Não inclua credenciais, documentos pessoais, dados de pagamento ou informações confidenciais de clientes. Use um cliente fictício ou dados autorizados.

## Recursos adicionais e limites claros

- A agenda pessoal começa vazia e permite planejar e concluir tarefas, sem eventos fictícios ou lembretes externos.
- O apoio de estudo busca assuntos nas aulas e permite registrar dúvidas para o professor. Não usa IA generativa ou uma chave de API.
- A página de certificados mostra requisitos e progresso; **nenhum certificado formal é emitido neste MVP**.
- O tempo de estudo considera aulas abertas com a página visível e em foco, em intervalos de até 20 segundos. Não comprova leitura ou a carga horária planejada de 150–200 horas.
- Links HTTPS de vídeos e materiais podem ser adicionados no editor. Upload, transcodificação e hospedagem própria de vídeos não estão implementados.
- Comunidade pública, notificações por e-mail, SSO, DRM, IA generativa e certificação formal são etapas futuras, não recursos simulados.
- A edição textual inicial foi escrita com apoio de IA e ainda precisa de revisão pedagógica. Os nove passos visuais são as nove fases reais; não substituem os 25 módulos.

Nenhum site publicado foi alterado. As URLs fornecidas são referências. `dist/` é uma cópia da interface local, **não uma implantação completa**: publicar esses arquivos estáticos não publica o servidor ou a autenticação. Uma versão online exige infraestrutura apropriada, identidade hospedada, armazenamento, backups, política de privacidade e validação de segurança.

## Verificação técnica

Execute `node work/test-all.cjs` (ou `npm test`, se tiver npm disponível). Os testes cobrem a central, os acessos oficiais protegidos, a prévia técnica com opção explícita, o acesso por arquivo sem rede, a grade preservada, o hub inicialmente vazio, as avaliações, o isolamento de contas, a privacidade do caderno, autenticação, CSRF, permissões, persistência após reiniciar, conflitos de gravação e troca de contas. Após perda de identidade, a navegação permanece bloqueada até um novo login, mas o rascunho pode ser exportado. Os dados locais e os dados de teste nunca são copiados para `dist`.

## GitHub e Supabase

Esta etapa aguarda os links do repositório e do projeto, além das conexões autorizadas. Não foi feito envio ao GitHub nem migração para Supabase. O projeto Supabase mencionado no arquivo pessoal de referência não foi reutilizado.

O backup de código deve excluir banco, sessões, senhas, chaves, arquivos de ambiente, logs, exportações privadas e o HTML pessoal do Desktop. GitHub guarda a versão do código; isso não substitui o backup protegido dos registros dos alunos. A migração dos dados exige autorização no projeto correto, políticas de acesso por aluno/professor e verificação de preservação dos registros existentes. Não publique apenas `dist` esperando que o login local passe a funcionar online.
