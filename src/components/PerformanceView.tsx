import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Target, TrendingUp, Plus, Activity } from 'lucide-react';
import { Employee, UserRole } from '../types';

interface PerformanceViewProps {
  employees: Employee[];
  currentUserRole: UserRole;
}

export default function PerformanceView({ employees, currentUserRole }: PerformanceViewProps) {
  const [activeTab, setActiveTab] = useState<'okrs' | 'avaliacoes' | 'feedbacks'>('okrs');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Desempenho & OKRs</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Metas, avaliações de desempenho e feedback 360°</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Avaliação
          </button>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
        {[
          { id: 'okrs', label: 'Objetivos (OKRs)', icon: Target },
          { id: 'avaliacoes', label: 'Avaliações', icon: TrendingUp },
          { id: 'feedbacks', label: 'Feedback 360°', icon: Activity }
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
            <Award className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Módulo em Desenvolvimento</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            O módulo de {activeTab === 'okrs' ? 'Objetivos e Resultados-Chave' : activeTab === 'avaliacoes' ? 'Avaliações de Desempenho' : 'Feedback Contínuo'} está na roadmap para a próxima grande atualização do HCM.
          </p>
          <button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">
            Configurar KPIs Básicos
          </button>
        </div>
      </div>
    </div>
  );
}
