import React, { useState } from 'react';
import { Employee, Contract_Doc, ContractType, UserRole } from '../types';
import { FileText, Plus, AlertTriangle, Calendar, ToggleLeft, ToggleRight, Check, CheckCircle2, RefreshCw, Upload, Download } from 'lucide-react';

interface ContractsViewProps {
  contracts: Contract_Doc[];
  employees: Employee[];
  onCreateContract: (contract: Contract_Doc) => void;
  onUpdateContract: (id: string, updated: Partial<Contract_Doc>) => void;
  currentUserRole: UserRole;
}

export default function ContractsView({
  contracts,
  employees,
  onCreateContract,
  onUpdateContract,
  currentUserRole
}: ContractsViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'Todos' | 'Ativo' | 'Expirado'>('Todos');
  const [uploadingEmpId, setUploadingEmpId] = useState<string | null>(null);

  // Form states
  const [formEmpId, setFormEmpId] = useState('');
  const [formTipo, setFormTipo] = useState<ContractType>('Contrato a prazo');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formSalario, setFormSalario] = useState(15000);
  const [formAutorenew, setFormAutorenew] = useState(true);
  const [formAlert, setFormAlert] = useState(true);

  // Drag and drop mock state
  const [isDragging, setIsDragging] = useState(false);

  const activeEmployees = employees.filter(e => e.estado === 'Ativo');

  const filteredContracts = contracts.filter(c => {
    if (selectedStatus === 'Todos') return true;
    return c.estado === selectedStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId) {
      alert('Por favor, selecione um funcionário ativo.');
      return;
    }

    const linkedEmp = employees.find(e => e.id === formEmpId);

    const newContract: Contract_Doc = {
      id: `ct_${Date.now()}`,
      funcionarioId: formEmpId,
      tipo: formTipo,
      dataInicio: formStart,
      dataFim: formTipo === 'Contrato sem termo' ? undefined : formEnd,
      salarioBase: Number(formSalario),
      estado: 'Ativo',
      renovacaoAutomatica: formAutorenew,
      alertasVencimento: formAlert,
      arquivoPdf: `Contrato_${linkedEmp?.nome.replace(/\s+/g, '_') || 'Novi'}.pdf`
    };

    onCreateContract(newContract);
    setIsFormOpen(false);
    
    // Also log notification
    alert(`Sucesso! Contrato criado para o funcionário ${linkedEmp?.nome}. O salário base do funcionário foi sincronizado.`);
  };

  const toggleRenew = (id: string, current: boolean) => {
    if (currentUserRole === UserRole.SUPERVISOR || currentUserRole === UserRole.FUNCIONARIO) return;
    onUpdateContract(id, { renovacaoAutomatica: !current });
  };

  const toggleAlert = (id: string, current: boolean) => {
    if (currentUserRole === UserRole.SUPERVISOR || currentUserRole === UserRole.FUNCIONARIO) return;
    onUpdateContract(id, { alertasVencimento: !current });
  };

  const handleSimulatedUpload = (empId: string, fileName: string) => {
    onUpdateContract(empId, { arquivoPdf: fileName });
    setUploadingEmpId(null);
    alert(`Doc Digital carregado com sucesso: "${fileName}" anexado ao histórico de compliance.`);
  };

  // Format currency
  const formatMT = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val).replace('MZN', 'MT');
  };

  return (
    <div className="space-y-6" id="contracts-layout-container">
      {/* Upper header metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Contratos de Trabalho</h2>
          <p className="text-xs text-slate-500 font-medium">Controlo de prazos de validade, renovações automáticas e termos de prestação de serviços</p>
        </div>

        {currentUserRole !== UserRole.SUPERVISOR && currentUserRole !== UserRole.FUNCIONARIO && (
          <button
            onClick={() => {
              if (activeEmployees.length === 0) {
                alert('Cadastre funcionários ativos primeiro antes de gerar um contrato.');
                return;
              }
              setFormEmpId(activeEmployees[0].id);
              setFormStart(new Date().toISOString().split('T')[0]);
              setFormEnd(new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]); // +1 year
              setFormSalario(activeEmployees[0].salarioBase);
              setIsFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/10 transition-colors cursor-pointer"
            id="register-contract-button"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Novo Contrato</span>
          </button>
        )}
      </div>

      {/* Contract Warning Banner */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-start space-x-3 text-amber-900 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
        <div className="space-y-1">
          <p className="font-extrabold text-amber-950">Aviso legal sobre prazos legais de renovação (Moçambique):</p>
          <p className="text-amber-800 leading-relaxed font-semibold">
            Os contratos a prazo sujeitos a limite temporal necessitam de aviso prévio de cessação por escrito ou sofrerão renovação tácita automática conforme a Lei do Trabalho. Mantenha os <b>Alertas de Vencimento</b> activos para receber notificações 30 dias antes da data limite expirar.
          </p>
        </div>
      </div>

      {/* Table grid filter */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex space-x-2">
            {['Todos', 'Ativo', 'Expirado'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 cursor-pointer ${selectedStatus === status ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {status === 'Todos' ? 'Todos Contratos' : valueTranslate(status)}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Consolidação Oficial</span>
        </div>

        {/* Dynamic Table Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="contracts-data-table">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="py-4 px-6">Funcionário</th>
                <th className="py-4 px-3">Tipo de Vínculo</th>
                <th className="py-4 px-3">Início e Fim</th>
                <th className="py-4 px-3">Salário Inicial</th>
                <th className="py-4 px-3">Avisos e Sinc</th>
                <th className="py-4 px-3">Documento PDF</th>
                <th className="py-4 px-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs font-medium">
                    Nenhum documento de contrato encontrado correspondente a este estado.
                  </td>
                </tr>
              ) : (
                filteredContracts.map(c => {
                  const emp = employees.find(e => e.id === c.funcionarioId);
                  const isExpiringSoon = c.dataFim && (c.estado === 'Ativo') && 
                    (Math.ceil((new Date(c.dataFim).getTime() - new Date('2026-06-21').getTime()) / (1000 * 60 * 60 * 24)) <= 45);

                  return (
                    <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${isExpiringSoon ? 'bg-amber-50/20' : ''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={emp?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={emp?.nome}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="block font-bold text-slate-800">{emp?.nome || 'Utilizador Excluído'}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold">{emp?.cargo}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <span className="font-bold text-slate-800">{c.tipo}</span>
                      </td>

                      <td className="py-4 px-3 space-y-0.5">
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span><b>De:</b> {c.dataInicio}</span>
                        </div>
                        {c.dataFim ? (
                          <div className={`flex items-center space-x-1 font-mono text-[10px] ${isExpiringSoon ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <span><b>Até:</b> {c.dataFim}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                            Sem Termo / Permanente
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3 font-mono font-bold text-slate-800">
                        {formatMT(c.salarioBase)}
                      </td>

                      <td className="py-4 px-3 space-y-2">
                        {/* Renew Check */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => toggleRenew(c.id, c.renovacaoAutomatica)}
                            className="text-slate-500 hover:text-emerald-600 cursor-pointer"
                            disabled={currentUserRole === UserRole.SUPERVISOR || currentUserRole === UserRole.FUNCIONARIO}
                          >
                            {c.renovacaoAutomatica ? (
                              <ToggleRight className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-300" />
                            )}
                          </button>
                          <span className="text-[10px] text-slate-500">Auto-Renovar</span>
                        </div>

                        {/* Alert Check */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => toggleAlert(c.id, c.alertasVencimento)}
                            className="text-slate-500 hover:text-emerald-600 cursor-pointer"
                            disabled={currentUserRole === UserRole.SUPERVISOR || currentUserRole === UserRole.FUNCIONARIO}
                          >
                            {c.alertasVencimento ? (
                              <ToggleRight className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-300" />
                            )}
                          </button>
                          <span className="text-[10px] text-slate-500">Alertas Activos</span>
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        {c.arquivoPdf ? (
                          <div className="flex items-center space-x-2">
                            <span className="p-1 bg-rose-50 text-rose-700 rounded border border-rose-100">
                              <FileText className="w-4 h-4" />
                            </span>
                            <div className="text-[9px]">
                              <p className="font-bold text-slate-700 truncate max-w-[130px]">{c.arquivoPdf}</p>
                              <button
                                onClick={() => alert(`A descarregar arquivo emulado: ${c.arquivoPdf}`)}
                                className="text-emerald-600 hover:underline flex items-center font-bold"
                              >
                                <Download className="w-3 h-3 mr-0.5" />
                                <span>Baixar</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadingEmpId(c.id)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-600 flex items-center space-x-1 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-400" />
                            <span>Anexar PDF</span>
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-3 text-right">
                        {c.estado === 'Ativo' ? (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold inline-flex items-center space-x-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold inline-flex items-center space-x-1 font-mono">
                            <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                            <span>Expirado</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Drag Drop Simulation Modal */}
      {uploadingEmpId && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full">
            <h3 className="text-md font-bold text-slate-800 mb-2">Anexar Cópia Digitalizada</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Anexe o contrato assinado juridicamente em formato PDF</p>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleSimulatedUpload(uploadingEmpId, file.name);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}
              onClick={() => {
                const mockFiles = ['Contrato_Assinado_2026.pdf', 'Minuta_Geral_RH.pdf', 'Contrato_Moçambique_Oficial.pdf'];
                const sel = mockFiles[Math.floor(Math.random() * mockFiles.length)];
                handleSimulatedUpload(uploadingEmpId, sel);
              }}
            >
              <Upload className="w-10 h-10 text-slate-400 mx-auto block mb-2" />
              <p className="text-xs font-bold text-slate-600">Arraste e solte o arquivo PDF aqui</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Ou clique para selecionar um arquivo do seu computador</p>
            </div>

            <button
              onClick={() => setUploadingEmpId(null)}
              className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Contract Creation Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-50">
              <h3 className="text-md font-bold text-slate-800">Registar Contrato de Trabalho</h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                onClick={() => setIsFormOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Employee ID */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Funcionário *</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  value={formEmpId}
                  onChange={e => {
                    setFormEmpId(e.target.value);
                    const emp = employees.find(x => x.id === e.target.value);
                    if (emp) setFormSalario(emp.salarioBase);
                  }}
                >
                  {activeEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.nome} - {e.cargo}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Vínculo */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tipo de Vínculo Contratual *</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  value={formTipo}
                  onChange={e => setFormTipo(e.target.value as ContractType)}
                >
                  <option value="Contrato a prazo">Contrato a prazo (Termo Determinado)</option>
                  <option value="Contrato sem termo">Contrato sem termo (Efectivo)</option>
                  <option value="Prestação de serviços">Prestação de serviços</option>
                </select>
              </div>

              {/* Início / Fim dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Data de Início *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    value={formStart}
                    onChange={e => setFormStart(e.target.value)}
                  />
                </div>

                {formTipo !== 'Contrato sem termo' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Data de Termo *</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                      value={formEnd}
                      onChange={e => setFormEnd(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Salário Inicial */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Salário Comercial Registado (MT) *</label>
                <input
                  type="number"
                  required
                  min={5000}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:outline-none"
                  value={formSalario}
                  onChange={e => setFormSalario(Number(e.target.value))}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ao atualizar este valor, a base tributável do trabalhador será alterada na base geral de dados.
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    className="accent-emerald-600 rounded"
                    checked={formAutorenew}
                    onChange={e => setFormAutorenew(e.target.checked)}
                  />
                  <span>Permitir Renovação Automática</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    className="accent-emerald-600 rounded"
                    checked={formAlert}
                    onChange={e => setFormAlert(e.target.checked)}
                  />
                  <span>Activar Alertas de Expirabilidade à equipa de RH</span>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Confirmar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function valueTranslate(val: string): string {
  if (val === 'Ativo') return 'Contratos Activos';
  if (val === 'Expirado') return 'Contratos Expirados';
  return val;
}
