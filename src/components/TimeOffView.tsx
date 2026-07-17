import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palmtree, Calendar, Plus, Clock, AlertCircle } from 'lucide-react';
import { Employee, UserRole } from '../types';

interface TimeOffViewProps {
  employees: Employee[];
  currentUserRole: UserRole;
}

export default function TimeOffView({ employees, currentUserRole }: TimeOffViewProps) {
  const [activeTab, setActiveTab] = useState<'ferias' | 'licencas' | 'historico'>('ferias');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Férias e Licenças</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Gestão de ausências, férias anuais e licenças especiais</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
        {[
          { id: 'ferias', label: 'Plano de Férias', icon: Palmtree },
          { id: 'licencas', label: 'Licenças', icon: Clock },
          { id: 'historico', label: 'Histórico', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Palmtree className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Módulo em Desenvolvimento</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            A funcionalidade de {activeTab === 'ferias' ? 'Plano de Férias' : activeTab === 'licencas' ? 'Gestão de Licenças' : 'Histórico de Ausências'} está a ser implementada e estará disponível em breve com integração total ao portal do funcionário.
          </p>
          <button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
