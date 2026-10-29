# 🗺️ Plano de Refatoração e Evolução Arquitetural — *Trilha (life-metas)*

Este documento reúne o diagnóstico da auditoria arquitetural e define um roteiro de refatoração seguro e iterativo, dividido em fases incrementais. Cada fase especifica os problemas, causas, soluções, o passo a passo técnico e as **restrições mandatórias** para garantir que a aplicação não sofra regressões funcionais nem de acessibilidade.

---

## 📌 Fase 1: Higiene de Dependências e Isolamento do Domínio Puro

### Item 1.1: Dependências Não Utilizadas no `package.json`
* **Problema detectado:** Pacotes de backend e IA instalados, mas não utilizados no código (`express`, `@types/express`, `dotenv`, `@google/genai`).
* **Descrição do problema e o que pode causar:**  
  O projeto é uma aplicação Single Page Application (SPA) client-side empacotada com Vite. Ter `express` em `dependencies` causa confusão conceitual, infla a pasta `node_modules`, aumenta o tempo de `npm install` no CI/CD e introduz superfícies de vulnerabilidades de segurança desnecessárias.
* **Solução recomendada:**  
  Remover pacotes não utilizados do manifesto de dependências do projeto.
* **Forma de resolver:**  
  1. No arquivo `package.json`, remover `"express"`, `"dotenv"` e `"@google/genai"` de `dependencies`.
  2. Remover `"@types/express"` de `devDependencies`.
  3. Executar `npm install` (ou remover as entradas no `package-lock.json`) para sincronizar a árvore de dependências.
* **Restrições a serem seguidas:**  
  * ⚠️ **Não remover dependências essenciais de build ou UI:** manter intactos `vite`, `@tailwindcss/vite`, `tailwindcss`, `autoprefixer`, `esbuild`, `tsx`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `lucide-react`, `motion`, `react` e `react-dom`.
  * ⚠️ **Validar integridade:** rodar `npm run build` logo após a remoção para certificar que nenhum import implícito quebrou.

---

### Item 1.2: Lógica de Gamificação e Negócio Acoplada à Camada Visual
* **Problema detectado:** Fórmulas de cálculo de XP, progressão de nível e mapeamento de títulos comportamentais embutidas diretamente dentro de um hook `useMemo` em `App.tsx`.
* **Descrição do problema e o que pode causar:**  
  A lógica que dita como o usuário ganha pontos (15 XP por subtarefa, 50 XP por tarefa, 200 XP por objetivo) e como sobe de nível (divisão por 250 XP iniciando no Nível 0) está misturada com o ciclo de renderização do React. Isso impede a criação de testes de unidade automatizados para as regras de negócio e sobrecarrega a leitura do componente principal.
* **Solução recomendada:**  
  Extrair o cálculo de gamificação para um módulo de domínio puro em `src/utils/gamificationUtils.ts`, decompondo-o em funções de responsabilidade única (`calculateTaskMetrics`, `countCompletedGoals`, `calculateTotalXp`, `getLevelInfo` e a orquestradora `calculateGamificationStats`).
* **Forma de resolver:**  
  1. Criar o arquivo `src/utils/gamificationUtils.ts`.
  2. Implementar funções puras granulares:
     - `calculateTaskMetrics(tasks)`: computa tarefas e subtarefas concluídas/totais.
     - `countCompletedGoals(goals)`: filtra metas concluídas ou 100%.
     - `calculateTotalXp(...)`: aplica a pontuação ponderada por ação.
     - `getLevelInfo(totalXp)`: calcula nível (base 0), XP atual e mapeamento de título.
     - `calculateGamificationStats(...)`: orquestra a composição do estado.
  3. Exportar as interfaces e funções granulares para testes unitários independentes.
  4. No `App.tsx`, substituir o bloco de cálculo inline por:
     ```typescript
     const gamificationStats = useMemo(() => {
       return calculateGamificationStats(tasks, goalsWithProgress);
     }, [tasks, goalsWithProgress]);
     ```
* **Restrições a serem seguidas:**  
  * ⚠️ **Manter paridade exata de regras:** preservar o início no **Nível 0** e a lista exata de títulos: `['Aprendiz Esforçado', 'Iniciante Intencional', 'Planejador Consistente', 'Arquiteto de Hábitos', 'Estrategista Focado', 'Mestre da Realização']`.
  * ⚠️ **Sem efeitos colaterais:** a função de domínio deve ser estritamente pura (sem chamadas a `localStorage`, `window` ou hooks do React).

---

## 📌 Fase 2: Abstração de Persistência e Eliminação do Prop Drilling

### Item 2.1: Acoplamento Direto com `localStorage` sem Camada de Repositório
* **Problema detectado:** Acesso direto a `localStorage.getItem` e `setItem` espalhado no carregamento e nos efeitos de `App.tsx`.
* **Descrição do problema e o que pode causar:**  
  Caso o usuário tenha dados antigos ou mal formatados no navegador, o `JSON.parse` direto pode resultar em estados inválidos. Além disso, se a aplicação evoluir para sincronização em nuvem (ex: Supabase, Firebase ou API REST), o código de UI precisará ser modificado diretamente.
* **Solução recomendada:**  
  Criar um repositório de dados local com tratamento de falhas e fallback para dados iniciais (`src/services/storageRepository.ts`).
* **Forma de resolver:**  
  1. Criar `src/services/storageRepository.ts`.
  2. Implementar métodos com tipagem estrita:
     * `loadGoals(): Goal[]`
     * `saveGoals(goals: Goal[]): void`
     * `loadTasks(): Task[]`
     * `saveTasks(tasks: Task[]): void`
  3. Envolver o parsing em blocos `try/catch` que garantem que, em caso de JSON inválido ou erro de cota de disco, a aplicação retorne os dados padrão (`INITIAL_GOALS` e `INITIAL_TASKS`) sem travar a interface.
* **Restrições a serem seguidas:**  
  * ⚠️ **Preservar as chaves de storage existentes:** manter estritamente as chaves `'trilha_goals_v1'` e `'trilha_tasks_v1'` para não apagar os dados já salvos no navegador dos usuários atuais.
  * ⚠️ **Preservar contratos de modelo:** não alterar a estrutura das interfaces `Goal`, `Task` e `Subtask` em `src/models/types.ts`.

---

### Item 2.2: Prop Drilling Severo em Metas e Subtarefas
* **Problema detectado:** O componente `App.tsx` repassa até 13 funções de callback para `GoalDetailPanel.tsx`, que por sua vez repassa 9 callbacks para `TaskItem.tsx`, que repassa 4 callbacks recursivamente por todos os níveis da `SubtaskTree.tsx`.
* **Descrição do problema e o que pode causar:**  
  Qualquer alteração na assinatura de uma ação (como adicionar um parâmetro a `onUpdateSubtaskStatus`) exige alterar 4 ou 5 arquivos diferentes. Isso aumenta a fragilidade do código e obriga componentes intermediários a re-renderizarem apenas para repassar propriedades que eles próprios não utilizam.
* **Solução recomendada:**  
  Criar provedores de contexto dedicados (`GoalContext` e `TaskContext`) com React Context API.
* **Forma de resolver:**  
  1. Criar `src/contexts/GoalContext.tsx` para gerenciar metas (`goals`, `saveGoal`, `changeGoalStatus`, `deleteGoal`, `selectedGoalId`).
  2. Criar `src/contexts/TaskContext.tsx` para gerenciar tarefas e a árvore de subtarefas (`tasks`, `saveTask`, `updateTaskStatus`, `deleteTask`, `addSubtask`, `updateSubtaskStatus`, `editSubtask`, `deleteSubtask`).
  3. Fazer com que `GoalDetailPanel.tsx`, `TaskItem.tsx` e `SubtaskTree.tsx` utilizem os hooks customizados `useGoals()` e `useTasks()` para disparar ações diretamente, reduzindo as props de cada componente a apenas o dado do item que estão renderizando.
* **Restrições a serem seguidas:**  
  * ⚠️ **Preservar a imutabilidade da árvore:** as atualizações de subtarefas aninhadas devem continuar utilizando as funções puras de recursão testadas em `src/utils/treeUtils.ts` (`insertSubtaskInTree`, `updateSubtaskStatusInTree`, `editSubtaskInTree`, `deleteSubtaskFromTree`).
  * ⚠️ **Garantir integridade de foco:** não quebrar a lógica de restauração de foco implementada em `handleBackFromGoalDetail` e no hook `useModalA11y`.

---

## 📌 Fase 3: Decomposição do "God Component" `App.tsx` em Telas Modulares

### Item 3.1: Centralização de Toda a Apresentação no `App.tsx`
* **Problema detectado:** `App.tsx` possui mais de 1.300 linhas, acumulando o cabeçalho, as 3 telas principais da aplicação (*Objetivos*, *Tarefas da Rotina* e *Método*), filtros de cada tela, cards informativos e renderização de todos os modais.
* **Descrição do problema e o que pode causar:**  
  Dificuldade extrema de manutenção, alto risco de conflitos em alterações colaborativas (merge conflicts), acoplamento visual e re-renderizações em cascata desnecessárias a cada interação do usuário.
* **Solução recomendada:**  
  Dividir o conteúdo das telas em componentes de visão isolados dentro de `src/views/` (ou `src/screens/`).
* **Forma de resolver:**  
  1. Criar os seguintes componentes de visão:
     * `src/views/GoalsView.tsx`: renderiza a lista de cartões de objetivos (quando nenhum estiver selecionado) ou o `GoalDetailPanel.tsx` (quando um objetivo estiver em foco), além da barra de filtros de objetivos e do painel de gamificação.
     * `src/views/TasksView.tsx`: renderiza a tela de tarefas com seus dois modos dedicados (**Exibição por objetivo** e **Exibição por data**) e a lista filtrada de `TaskItem`.
     * `src/views/MethodView.tsx`: renderiza os cards explicativos dos pilares do método comportamental.
  2. Reduzir o `App.tsx` para um componente orquestrador enxuto ($\approx 100$ linhas) contendo apenas:
     * O Skip Link de acessibilidade.
     * O container de notificações `aria-live`.
     * A barra de navegação (`header`) com as abas de tela (`activeView`).
     * A alternância entre `<GoalsView />`, `<TasksView />` e `<MethodView />`.
     * O rodapé (`footer`) e o container de modais.
* **Restrições a serem seguidas:**  
  * ⚠️ **Preservar 100% dos atributos de acessibilidade:**
    * Manter o Skip Link com `href="#conteudo-principal"` no topo da aplicação.
    * Manter `role="status"` e `aria-live="polite"` no container do banner flutuante de feedback de gamificação.
    * Manter `aria-current="page"` nos botões de navegação da tela ativa.
    * Manter a barra de progresso com `role="progressbar"`, `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` e `aria-valuetext`.
    * Manter `role="alertdialog"` e foco no botão "Cancelar" no modal `DeleteGoalModal`.
    * Manter as listas semânticas `<ul role="list">` e `<li>` tanto em objetivos quanto na lista de tarefas e na árvore recursiva de subtarefas.
  * ⚠️ **Preservar o fluxo das tarefas:** manter a regra de que controles e subtarefas só abrem quando a tarefa é ativada por clique ou `Enter`, exibindo na listagem apenas: *checkbox*, *título* e *contagem de subtarefas*.
  * ⚠️ **Sem quebra de build:** a cada componente extraído, verificar a integridade com `npm run lint` e `npm run build`.

---

## 📋 Resumo da Ordem de Execução Recomendada

| Etapa | Ação Principal | Risco | Arquivos Afetados |
| :---: | :--- | :---: | :--- |
| **Fase 1.1** | Remoção de dependências mortas | Quase nulo | `package.json` |
| **Fase 1.2** | Extração de `gamificationUtils.ts` | Baixo | `src/utils/gamificationUtils.ts`, `src/App.tsx` |
| **Fase 2.1** | Criação de `storageRepository.ts` | Baixo | `src/services/storageRepository.ts`, `src/App.tsx` |
| **Fase 2.2** | Criação de `GoalContext` e `TaskContext` | Médio | `src/contexts/`, `GoalDetailPanel.tsx`, `TaskItem.tsx` |
| **Fase 3.1** | Extração de views (`GoalsView`, `TasksView`, `MethodView`) | Baixo | `src/views/`, `src/App.tsx` |

