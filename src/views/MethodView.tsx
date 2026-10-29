import React from 'react';
import { Compass, Target, Award } from 'lucide-react';

export const MethodView: React.FC = () => {
  return (
    <section
      id="metodo"
      aria-labelledby="heading-metodo"
      className="space-y-6"
    >
      <div>
        <h2
          id="heading-metodo"
          className="text-xl sm:text-2xl font-bold text-stone-900"
        >
          Pilares do Método Comportamental
        </h2>
        <p className="text-sm text-stone-600 mt-0.5">
          Como a estrutura progressiva reduz a sobrecarga cognitiva e mantém a motivação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
            <h3>01. Decomposição Cognitiva</h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Dividir objetivos complexos em tarefas e múltiplos níveis de
            subtarefas elimina a paralisia por análise. Cada subtarefa
            herda por padrão o prazo do nível superior para manter o
            alinhamento temporal.
          </p>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <Target className="w-4 h-4 shrink-0" aria-hidden="true" />
            <h3>02. Efeito do Gradiente de Meta</h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Cada tarefa vinculada possui um valor padrão (minutos,
            páginas, moeda) que é somado imediatamente ao objetivo quando
            concluída, tornando o esforço diário visível e recompensador.
          </p>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
            <h3>03. Foco Progressivo Sem Ruído</h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Controles de edição, exclusão, mudança de status e subtarefas
            só aparecem quando você entra em um objetivo ou em uma tarefa,
            evitando poluição visual e facilitando a navegação por teclado
            e leitores de tela.
          </p>
        </div>
      </div>
    </section>
  );
};

