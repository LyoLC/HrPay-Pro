import React, { useState } from 'react';
import { CompanySettings, IrpsBracket } from '../types';
import { Building2, Save, Sparkles, Scale, Info, Landmark, RefreshCcw, Plus, Trash2 } from 'lucide-react';

interface ConfigViewProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
}

export default function ConfigView({ settings, onSaveSettings }: ConfigViewProps) {
  // Enterprise identity state
  const [nome, setNome] = useState(settings.nomeEmpresa);
  const [nuit, setNuit] = useState(settings.nuitEmpresa);
  const [banco, setBanco] = useState(settings.bancoPrincipal);
  const [conta, setConta] = useState(settings.numeroContaPrincipal);
  const [nib, setNib] = useState(settings.nibEmpresa);
  const [endereco, setEndereco] = useState(settings.enderecoEmpresa);
  const [contacto, setContacto] = useState(settings.contactoEmpresa);
  const [email, setEmail] = useState(settings.emailEmpresa);

  // Security variables state
  const [inssTrabalhador, setInssTrabalhador] = useState(settings.taxaInssTrabalhador * 100);
  const [inssPatronal, setInssPatronal] = useState(settings.taxaInssPatronal * 100);
  const [prazoInss, setPrazoInss] = useState(settings.prazoInss || 10);
  const [prazoIrps, setPrazoIrps] = useState(settings.prazoIrps || 20);
  const [horarioAlertaContratos, setHorarioAlertaContratos] = useState(settings.horarioAlertaContratos || '09:00');

  // IRPS Brackets list state
  const [brackets, setBrackets] = useState<IrpsBracket[]>([...settings.irpsBrackets]);

  const handleBracketValueChange = (index: number, key: keyof IrpsBracket, val: number) => {
    const updated = [...brackets];
    updated[index] = { ...updated[index], [key]: val };
    setBrackets(updated);
  };

  const handleAddBracket = () => {
    setBrackets([...brackets, { minVal: 0, maxVal: 0, taxRate: 0, deductionCoefficient: 0 }]);
  };

  const handleRemoveBracket = (index: number) => {
    const updated = [...brackets];
    updated.splice(index, 1);
    setBrackets(updated);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const finalized: CompanySettings = {
      nomeEmpresa: nome,
      nuitEmpresa: nuit,
      bancoPrincipal: banco,
      numeroContaPrincipal: conta,
      nibEmpresa: nib,
      enderecoEmpresa: endereco,
      contactoEmpresa: contacto,
      emailEmpresa: email,
      taxaInssTrabalhador: inssTrabalhador / 100,
      taxaInssPatronal: inssPatronal / 100,
      prazoInss,
      prazoIrps,
      horarioAlertaContratos,
      irpsBrackets: brackets
    };

    onSaveSettings(finalized);
    alert('As configurações globais do sistema, taxas de previdência social e intervalos tributáveis de IRPS foram atualizados!');
  };

  const restoreSystemDefaultBrackets = () => {
    if (confirm('Deseja restaurar as taxas padrão recomendadas pelo Ministério das Finanças de Moçambique?')) {
      const defaultBrackets: IrpsBracket[] = [
        { minVal: 0, maxVal: 20250, taxRate: 0, deductionCoefficient: 0 },
        { minVal: 20250, maxVal: 32750, taxRate: 10, deductionCoefficient: 2025 },
        { minVal: 32750, maxVal: 60750, taxRate: 15, deductionCoefficient: 3662.5 },
        { minVal: 60750, maxVal: 144750, taxRate: 20, deductionCoefficient: 6700 },
        { minVal: 144750, maxVal: 289500, taxRate: 25, deductionCoefficient: 13937.5 },
        { minVal: 289500, maxVal: Infinity, taxRate: 32, deductionCoefficient: 34202.5 }
      ];
      setBrackets(defaultBrackets);
      setInssTrabalhador(3);
      setInssPatronal(4);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6" id="config-module-form">
      {/* Description */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Definições da Organização</h2>
          <p className="text-xs text-slate-500 font-medium font-semibold">Customize dados fiscais, tributações vigentes de IRPS e parametrização de segurança social</p>
        </div>

        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
          id="save-config-settings-button"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left columns: Core enterprise coordinates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Box A: Dados da Empresa */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Identidade de Contribuidor e Credenciamento</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome Empresa */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Designação Comercial (Empresa) *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>

              {/* NUIT Empresa */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">NUIT Geral da Empresa *</label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none font-mono"
                  value={nuit}
                  onChange={e => setNuit(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {/* Email Empresa */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email Geral *</label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Contacto */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Contacto Corporativo *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                  value={contacto}
                  onChange={e => setContacto(e.target.value)}
                />
              </div>
            </div>

            {/* Endereco */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Morada Escrita da Empresa (Moçambique) *</label>
              <textarea
                required
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none"
                value={endereco}
                onChange={e => setEndereco(e.target.value)}
              />
            </div>
          </div>

          {/* Box B: Configuração Tributária do IRPS Progressivo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Limites e Escalões da Tabela Mensal de IRPS</span>
              </h3>
              <button
                type="button"
                onClick={restoreSystemDefaultBrackets}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-2 py-1 rounded-lg transition-colors flex items-center space-x-1"
              >
                <RefreshCcw className="w-3 h-3 text-slate-400" />
                <span>Restaurar Tabelas Padrão</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    <th className="py-2.5 px-3">Escalão Mínimo (MT)</th>
                    <th className="py-2.5 px-3">Escalão Máximo (MT)</th>
                    <th className="py-2.5 px-3">Taxa (%)</th>
                    <th className="py-2.5 px-3">Coeficiente Dedução (MT)</th>
                    <th className="py-2.5 px-3 text-center">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {brackets.map((b, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          className="w-24 bg-slate-50 border border-slate-200 py-1 px-2 rounded-lg text-xs font-bold text-slate-900"
                          value={b.minVal}
                          onChange={e => handleBracketValueChange(idx, 'minVal', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          className="w-24 bg-slate-50 border border-slate-200 py-1 px-2 rounded-lg text-xs font-bold text-slate-900"
                          value={b.maxVal === Infinity ? 'Infinito' : b.maxVal}
                          onChange={e => handleBracketValueChange(idx, 'maxVal', e.target.value === 'Infinito' ? Infinity : Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="w-16 bg-slate-50 border border-slate-200 py-1 px-2 rounded-lg text-xs font-bold text-slate-900 text-right"
                            value={b.taxRate}
                            onChange={e => handleBracketValueChange(idx, 'taxRate', Number(e.target.value))}
                          />
                          <span className="font-bold text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          className="w-28 bg-slate-50 border border-slate-200 py-1 px-2 rounded-lg text-xs font-bold text-slate-900"
                          value={b.deductionCoefficient}
                          onChange={e => handleBracketValueChange(idx, 'deductionCoefficient', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBracket(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remover Escalão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddBracket}
                  className="flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-emerald-600 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Novo Escalão</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 flex items-start space-x-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="font-semibold">
                * Aviso: A fórmula matemática para calcular o IRPS na fonte segue a regra geral: <b>(Rendimento Tributável * Alíquota) - Coeficiente de Dedução</b>. Modificar as alíquotas ou limites altera instantaneamente as folhas de salário sob fiscalização.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Bank credentials and general parameters */}
        <div className="space-y-6">
          {/* Box C: Informações Bancaria */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Contas para Pagamento Salarial</span>
            </h3>

            <div className="space-y-3">
              {/* Banco principal */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Banco Principal da Empresa *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                  value={banco}
                  onChange={e => setBanco(e.target.value)}
                />
              </div>

              {/* Numero Conta */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Número de Conta Oficial *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none font-mono"
                  value={conta}
                  onChange={e => setConta(e.target.value)}
                />
              </div>

              {/* NIB */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">NIB da Empresa *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none font-mono"
                  value={nib}
                  onChange={e => setNib(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Box D: Taxas de Segurança Social INSS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Alíquotas de Segurança Social (INSS)</span>
            </h3>

            <div className="space-y-4 font-bold">
              {/* Trabalhador share */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-600">Alíquota Trabalhador (%)</span>
                  <span className="text-emerald-700 font-extrabold">{inssTrabalhador}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.1}
                  className="w-full accent-emerald-600 cursor-pointer"
                  value={inssTrabalhador}
                  onChange={e => setInssTrabalhador(Number(e.target.value))}
                />
              </div>

              {/* Patronal share */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-600">Alíquota Patronal (Empresa %)</span>
                  <span className="text-emerald-700 font-extrabold">{inssPatronal}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.1}
                  className="w-full accent-emerald-600 cursor-pointer"
                  value={inssPatronal}
                  onChange={e => setInssPatronal(Number(e.target.value))}
                />
              </div>

              <div className="text-[10px] text-slate-400 font-semibold leading-relaxed p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Os valores regulamentares nacionais de Moçambique são de **3%** de retenção do trabalhador e **4%** de contribuição directa da instituição patronal.
              </div>
            </div>
          </div>

          {/* Box E: Prazos de Submissão */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
              <RefreshCcw className="w-4 h-4 text-emerald-600" />
              <span>Prazos de Submissão Mensais</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Dia Limite INSS (ex: 10)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                  value={prazoInss}
                  onChange={e => setPrazoInss(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Dia Limite IRPS (ex: 20)</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                  value={prazoIrps}
                  onChange={e => setPrazoIrps(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Horário de Alertas de Contratos</label>
                <input
                  type="time"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                  value={horarioAlertaContratos}
                  onChange={e => setHorarioAlertaContratos(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
}
