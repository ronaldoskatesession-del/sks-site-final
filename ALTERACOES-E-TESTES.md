

### Correção dos acessos das ferramentas no dashboard

Os quatro cards de ferramentas digitais abrem agora os respectivos links oficiais na mesma aba, conforme solicitado. Removidos `target="_blank"` e indicação de nova aba nos cards do dashboard de professor e aluno.

### Formações na área do aluno

O item Formações do dashboard abre `aluno.html#escolher-formacao` na mesma aba. O catálogo reúne a busca, os filtros por área, a evolução do agente, as unidades, os próximos passos e os painéis laterais do dashboard. O Laboratório de IA ocupa a primeira posição. As unidades liberadas vêm em seguida e os detalhes de cada unidade indicam o acesso da conta.

Disciplina abre as aulas e trilhas da formação. As cinco abas dos módulos, os botões, as linhas, os textos de destaque e as bordas usam o dourado do menu. No tema escuro, o texto usa `#FFB727`, a borda usa `#FFA500` e o fundo ativo usa `#262014`. O tema claro usa as cores do respectivo menu.

O fluxo completo entre dashboard, catálogo, disciplina e retorno foi verificado no navegador, incluindo busca, filtros, bloqueios e as cinco abas. Os testes de liberação das formações, persistência e isolamento de contas passaram. O comando geral `npm test` do pacote original requer `dist/index.html`, enquanto esta distribuição local executa a aplicação em `outputs`.
