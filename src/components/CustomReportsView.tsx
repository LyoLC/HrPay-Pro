import React, { useState } from 'react';
import { CustomReportConfig, Employee, Contract_Doc, PayrollProcessed, AttendanceRecord, MOZAMBIQUE_DEPARTMENTS } from '../types';
import { Save, Download, FileText, Filter, Printer, Trash2, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';

interface CustomReportsViewProps {
  reports: CustomReportConfig[];
  employees: Employee[];
  contracts: Contract_Doc[];
  payroll: PayrollProcessed[];
  attendance: AttendanceRecord[];
  onSaveReport: (report: CustomReportConfig) => void;
  onDeleteReport: (id: string) => void;
}

const AVAILABLE_FIELDS = [
  { 
    group: 'Funcionários', 
    fields: [
      { id: 'emp_id', label: 'ID do Funcionário' },
      { id: 'emp_nome', label: 'Nome' },
      { id: 'emp_bi', label: 'BI' },
      { id: 'emp_email', label: 'Email' },
      { id: 'emp_cargo', label: 'Cargo' },
      { id: 'emp_departamento', label: 'Departamento' },
      { id: 'emp_dataAdmissao', label: 'Data de Admissão' },
      { id: 'emp_salarioBase', label: 'Salário Base' },
      { id: 'emp_estado', label: 'Estado' },
      { id: 'emp_skills', label: 'Skills' }
    ]
  },
  { 
    group: 'Contratos', 
    fields: [
      { id: 'contract_tipo', label: 'Tipo de Contrato Ativo' },
      { id: 'contract_dataInicio', label: 'Início do Contrato' },
      { id: 'contract_salarioBase', label: 'Salário Base (Contrato)' }
    ]
  },
  { 
    group: 'Processamento Salarial (Acumulado)', 
    fields: [
      { id: 'pay_totalLiquido', label: 'Total Líquido Acumulado' },
      { id: 'pay_totalBruto', label: 'Total Bruto Acumulado' },
      { id: 'pay_totalDescontos', label: 'Total Descontos Acumulado' }
    ]
  },
  { 
    group: 'Assiduidade (Acumulado)', 
    fields: [
      { id: 'att_presentes', label: 'Total Presenças' },
      { id: 'att_faltas', label: 'Faltas Injustificadas' },
      { id: 'att_atrasos', label: 'Atrasos' },
      { id: 'att_horasExtras', label: 'Total Horas Extras' }
    ]
  }
];

export default function CustomReportsView({
  reports,
  employees,
  contracts,
  payroll,
  attendance,
  onSaveReport,
  onDeleteReport
}: CustomReportsViewProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Form State
  const [reportName, setReportName] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>(['emp_nome', 'emp_cargo', 'emp_departamento']);
  const [filterDept, setFilterDept] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState<'Ativo' | 'Inativo' | 'Todos'>('Todos');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // UI State
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Funcionários']);
  const [generatedData, setGeneratedData] = useState<any[]>([]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const handleToggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    );
  };

  const handleGenerateReport = () => {
    if (selectedFields.length === 0) {
      alert("Por favor, selecione pelo menos um campo para gerar o relatório.");
      return;
    }

    let baseData: any[] = [];
    
    let filteredEmployees = employees;
    if (filterDept !== 'Todos') {
      filteredEmployees = filteredEmployees.filter(e => e.departamento === filterDept);
    }
    if (filterStatus !== 'Todos') {
      filteredEmployees = filteredEmployees.filter(e => e.estado === filterStatus);
    }
    if (dateStart && dateEnd) {
       filteredEmployees = filteredEmployees.filter(e => e.dataAdmissao >= dateStart && e.dataAdmissao <= dateEnd);
    }

    baseData = filteredEmployees.map(emp => {
      let record: any = {};
      
      const empContracts = contracts.filter(c => c.funcionarioId === emp.id);
      const activeContract = empContracts.find(c => c.estado === 'Ativo');
      const empPayroll = payroll.filter(p => p.funcionarioId === emp.id);
      const empAtt = attendance.filter(a => a.funcionarioId === emp.id);

      // Map selected fields to record object
      selectedFields.forEach(fieldId => {
        switch (fieldId) {
          // Employees
          case 'emp_id': record['ID do Funcionário'] = emp.id; break;
          case 'emp_nome': record['Nome'] = emp.nome; break;
          case 'emp_bi': record['BI'] = emp.bi; break;
          case 'emp_email': record['Email'] = emp.email; break;
          case 'emp_cargo': record['Cargo'] = emp.cargo; break;
          case 'emp_departamento': record['Departamento'] = emp.departamento; break;
          case 'emp_dataAdmissao': record['Data de Admissão'] = emp.dataAdmissao; break;
          case 'emp_salarioBase': record['Salário Base'] = emp.salarioBase?.toLocaleString('pt-MZ'); break;
          case 'emp_estado': record['Estado'] = emp.estado; break;
          case 'emp_skills': record['Skills'] = emp.skills ? emp.skills.join('; ') : ''; break;
          
          // Contracts
          case 'contract_tipo': record['Tipo de Contrato Ativo'] = activeContract ? activeContract.tipo : 'N/A'; break;
          case 'contract_dataInicio': record['Início do Contrato'] = activeContract ? activeContract.dataInicio : 'N/A'; break;
          case 'contract_salarioBase': record['Salário Base (Contrato)'] = activeContract ? activeContract.salarioBase?.toLocaleString('pt-MZ') : 'N/A'; break;
          
          // Payroll
          case 'pay_totalLiquido': record['Total Líquido Acumulado (MT)'] = empPayroll.reduce((acc, p) => acc + p.salarioLiquido, 0).toLocaleString('pt-MZ'); break;
          case 'pay_totalBruto': record['Total Bruto Acumulado (MT)'] = empPayroll.reduce((acc, p) => acc + p.totalBruto, 0).toLocaleString('pt-MZ'); break;
          case 'pay_totalDescontos': record['Total Descontos Acumulado (MT)'] = empPayroll.reduce((acc, p) => acc + p.totalDescontos, 0).toLocaleString('pt-MZ'); break;
          
          // Attendance
          case 'att_presentes': record['Total Presenças'] = empAtt.filter(a => a.presente === 'Presente').length; break;
          case 'att_faltas': record['Faltas Injustificadas'] = empAtt.filter(a => a.presente === 'Falta Injustificada').length; break;
          case 'att_atrasos': record['Atrasos'] = empAtt.filter(a => a.presente === 'Atraso').length; break;
          case 'att_horasExtras': record['Total Horas Extras'] = empAtt.reduce((sum, a) => sum + (a.horasExtras || 0), 0); break;
        }
      });

      return record;
    });

    setGeneratedData(baseData);
  };

  const handleSaveConfig = () => {
    if (!reportName) {
      alert("Por favor, introduza um nome para o relatório.");
      return;
    }
    if (selectedFields.length === 0) {
      alert("Selecione pelo menos um campo para salvar a configuração.");
      return;
    }
    
    const config: CustomReportConfig = {
      id: `rep_${Date.now()}`,
      name: reportName,
      description: `Relatório personalizado criado em ${new Date().toLocaleDateString()}`,
      dataSources: [], // Deprecated in favor of fields
      fields: selectedFields,
      filters: {
        department: filterDept,
        employeeStatus: filterStatus as any,
        dateRange: dateStart && dateEnd ? { start: dateStart, end: dateEnd } : undefined
      },
      createdAt: new Date().toISOString()
    };
    onSaveReport(config);
    setSelectedReportId(config.id);
  };

  const handleLoadConfig = (config: CustomReportConfig) => {
    setReportName(config.name);
    // Support legacy config that used dataSources or new one with fields
    if (config.fields && config.fields.length > 0) {
      setSelectedFields(config.fields);
    } else {
      setSelectedFields(['emp_nome']); // Fallback
    }
    setFilterDept(config.filters.department || 'Todos');
    setFilterStatus(config.filters.employeeStatus || 'Todos');
    setDateStart(config.filters.dateRange?.start || '');
    setDateEnd(config.filters.dateRange?.end || '');
    setSelectedReportId(config.id);
  };

  const exportCSV = () => {
    if (generatedData.length === 0) return;
    const headers = Object.keys(generatedData[0]);
    const csvContent = [
      headers.join(','),
      ...generatedData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportName || 'relatorio'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reports-view">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatórios Dinâmicos</h2>
          <p className="text-xs text-slate-500 font-medium">Crie relatórios personalizados selecionando campos específicos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:hidden">
        {/* Sidebar: Saved Configs & Form */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              Configuração do Relatório
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nome do Relatório</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                placeholder="Ex: Assiduidade RH..."
                value={reportName}
                onChange={e => setReportName(e.target.value)}
              />
            </div>

            <div className="space-y-2 border-t border-slate-50 pt-2">
              <label className="text-xs font-semibold text-slate-600 block mb-2">Campos de Dados (Colunas)</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {AVAILABLE_FIELDS.map(group => (
                  <div key={group.group} className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
                    <button 
                      onClick={() => toggleGroup(group.group)}
                      className="w-full flex items-center justify-between p-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      {group.group}
                      {expandedGroups.includes(group.group) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedGroups.includes(group.group) && (
                      <div className="p-2 space-y-2 bg-white">
                        {group.fields.map(field => (
                          <label key={field.id} className="flex items-center space-x-2 text-[11px] cursor-pointer text-slate-600 hover:text-slate-900 group">
                            <div className="relative flex items-center justify-center" onClick={(e) => {
                              e.preventDefault();
                              handleToggleField(field.id);
                            }}>
                              {selectedFields.includes(field.id) ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />
                              )}
                            </div>
                            <span onClick={() => handleToggleField(field.id)}>{field.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-50 pt-4">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Filtros de Registos</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="Todos">Todos os Departamentos</option>
                {MOZAMBIQUE_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                <option value="Todos">Todos os Estados</option>
                <option value="Ativo">Ativos</option>
                <option value="Inativo">Inativos</option>
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 text-[10px]" title="Data Admissão Início" />
                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 text-[10px]" title="Data Admissão Fim" />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button onClick={handleGenerateReport} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-2 cursor-pointer transition-colors shadow-sm">
                <FileText className="w-4 h-4" />
                Gerar Relatório
              </button>
              <button onClick={handleSaveConfig} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-2 cursor-pointer transition-colors border border-indigo-200">
                <Save className="w-4 h-4" />
                Guardar Configuração
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Relatórios Salvos</h3>
            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum relatório salvo.</p>
            ) : (
              <div className="space-y-2">
                {reports.map(rep => (
                  <div key={rep.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                    <button onClick={() => handleLoadConfig(rep)} className="text-xs font-semibold text-slate-700 hover:text-emerald-600 text-left cursor-pointer truncate mr-2 flex-1">
                      {rep.name}
                    </button>
                    <button onClick={() => onDeleteReport(rep.id)} className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 shrink-0 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Preview */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
            <h3 className="text-md font-bold text-slate-800 print:text-xl">Pré-visualização do Relatório</h3>
            {generatedData.length > 0 && (
              <div className="flex gap-2 print:hidden">
                <button onClick={exportCSV} className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 p-2 rounded-lg cursor-pointer transition-colors" title="Exportar CSV">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={printReport} className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 p-2 rounded-lg cursor-pointer transition-colors" title="Imprimir / Guardar PDF">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {generatedData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-sm">
              <FileText className="w-12 h-12 mb-3 opacity-20 text-slate-300" />
              <p>Configure e gere o relatório para visualizar os dados aqui.</p>
              <p className="text-xs mt-1">Pode selecionar campos específicos para personalizar as colunas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr>
                    {Object.keys(generatedData[0]).map(key => (
                      <th key={key} className="p-3 border-b-2 border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50 sticky top-0">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.keys(generatedData[0]).map(key => (
                        <td key={key} className="p-3 text-[11px] font-medium text-slate-700 whitespace-nowrap">
                          {row[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-[10px] text-slate-400 font-semibold print:hidden">
                Total de registos: {generatedData.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

