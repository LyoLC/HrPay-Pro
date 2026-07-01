import React, { useState } from 'react';
import { Employee, PayrollProcessed, AttendanceRecord, UserRole, CompanySettings } from '../types';
import { processFullPayroll } from '../utils/calculations';
import { downloadCSV } from '../utils/csv';
import { DollarSign, Printer, CheckCircle, Calculator, FileText, AlertCircle, Sparkles, SlidersHorizontal, RefreshCcw, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts';

interface PayrollViewProps {
  employees: Employee[];
  payrollHistory: PayrollProcessed[];
  attendance: AttendanceRecord[];
  onSaveProcessedPayroll: (payroll: PayrollProcessed) => void;
  onUpdatePayroll: (id: string, updates: Partial<PayrollProcessed>) => void;
  currentUserRole: UserRole;
  settings: CompanySettings;
  onPrintSlip: (payroll: PayrollProcessed) => void;
}

export default function PayrollView({
  employees,
  payrollHistory,
  attendance,
  onSaveProcessedPayroll,
  onUpdatePayroll,
  currentUserRole,
  settings,
  onPrintSlip
}: PayrollViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(6); // June
  const [selectedYear, setSelectedYear] = useState(2026);
  
  // simulation modal state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simBaseSalary, setSimBaseSalary] = useState(25000);
  const [simBonus, setSimBonus] = useState(0);
  const [simOvertime, setSimOvertime] = useState(0);
  const [simAbsences, setSimAbsences] = useState(0);

  const EXPORT_COLUMNS = [
    { id: 'nome', label: 'Funcionario' },
    { id: 'base', label: 'Salario Base (MT)' },
    { id: 'faltas', label: 'Faltas' },
    { id: 'horasExtras', label: 'Horas Extras' },
    { id: 'bruto', label: 'Total Bruto (MT)' },
    { id: 'inss', label: 'INSS (MT)' },
    { id: 'irps', label: 'IRPS (MT)' },
    { id: 'liquido', label: 'Liquido (MT)' },
    { id: 'estado', label: 'Estado' }
  ];
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(EXPORT_COLUMNS.map(c => c.id));
  const [showExportColDropdown, setShowExportColDropdown] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // processing drawer modal state
  const [processingEmp, setProcessingEmp] = useState<Employee | null>(null);

  // Form states inside processing drawer
  const [bonus, setBonus] = useState(0);
  const [subsidioTrans, setSubsidioTrans] = useState(0);
  const [subsidioAlim, setSubsidioAlim] = useState(1500); // default
  const [comissoes, setComissoes] = useState(0);
  const [vales, setVales] = useState(0);
  const [outrosDescontos, setOutrosDescontos] = useState(0);

  // Filter out workers
  const activeEmployees = employees.filter(e => e.estado === 'Ativo');

  // Find processed records for selected month
  const processedInPeriod = payrollHistory.filter(
    p => p.mes === selectedMonth && p.ano === selectedYear
  );

  const getProcessedRecord = (empId: string) => {
    return processedInPeriod.find(p => p.funcionarioId === empId);
  };

  // Automated Absence / Overtime lookup from attendance records for the selected month!
  const getAutomatedAttendanceMetrics = (empId: string) => {
    // Generate dates string prefix
    const datePrefix = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-`;
    const records = attendance.filter(
      a => a.funcionarioId === empId && a.data.startsWith(datePrefix)
    );

    const unjustifiedFaltas = records.filter(r => r.presente === 'Falta Injustificada').length;
    const totalOvertimeHours = records.reduce((sum, r) => sum + r.horasExtras, 0);

    return { unjustifiedFaltas, totalOvertimeHours };
  };

  const openProcessingDrawer = (emp: Employee) => {
    const existing = getProcessedRecord(emp.id);
    const { unjustifiedFaltas, totalOvertimeHours } = getAutomatedAttendanceMetrics(emp.id);

    setProcessingEmp(emp);

    if (existing) {
      setBonus(existing.bonus);
      setSubsidioTrans(existing.subsidioTransporte);
      setSubsidioAlim(existing.subsidioAlimentacao);
      setComissoes(existing.comissoes);
      setVales(existing.vales);
      setOutrosDescontos(existing.impostos.outrosDescontos);
    } else {
      // pre-load some intelligent estimates
      setBonus(0);
      // Give standard transport subsidy to lower salaries
      setSubsidioTrans(emp.salarioBase < 30000 ? 1500 : 0);
      setSubsidioAlim(1500);
      setComissoes(0);
      setVales(0);
      setOutrosDescontos(0);
    }
  };

  // Handle active typing reactive calculations preview
  const previewCalculation = () => {
    if (!processingEmp) return null;
    
    const { unjustifiedFaltas, totalOvertimeHours } = getAutomatedAttendanceMetrics(processingEmp.id);

    return processFullPayroll({
      funcionarioId: processingEmp.id,
      mes: selectedMonth,
      ano: selectedYear,
      salarioBase: processingEmp.salarioBase,
      bonus,
      subsidioTransporte: subsidioTrans,
      subsidioAlimentacao: subsidioAlim,
      horasExtrasHoras: totalOvertimeHours,
      comissoes,
      vales,
      faltasInjustificadas: unjustifiedFaltas,
      outrosDescontos,
      taxaInssTrabalhador: settings.taxaInssTrabalhador,
      taxaInssPatronal: settings.taxaInssPatronal,
      brackets: settings.irpsBrackets,
      processadoPor: 'Clara Nhantumbo'
    });
  };

  const handleSaveProcessing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingEmp) return;

    const result = previewCalculation();
    if (result) {
      onSaveProcessedPayroll(result);
      setProcessingEmp(null);
      alert(`Mensalidade de salário processada com sucesso para ${processingEmp.nome}.`);
    }
  };

  const handleApprove = (payrollId: string) => {
    onUpdatePayroll(payrollId, { status: 'Aprovado' });
    alert('Processamento aprovado com sucesso!');
  };

  const handlePayConfirm = (payrollId: string) => {
    const ref = `BIM-${Math.floor(Math.random() * 900000) + 100000}`;
    onUpdatePayroll(payrollId, { 
      status: 'Pago', 
      pago: true, 
      referenciaBancaria: ref, 
      dataPagamento: new Date().toISOString().split('T')[0] 
    });
    alert(`Sucesso! O estado do processamento foi marcado como PAGO. Referência bancária gerada: ${ref}`);
  };

  const formatMT = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val).replace('MZN', 'MT');
  };

  const handleExportCSV = () => {
    const activeColumns = EXPORT_COLUMNS.filter(col => selectedExportColumns.includes(col.id));
    const headers = activeColumns.map(col => col.label).join(',');

    const rows = activeEmployees.map(emp => {
      const pay = getProcessedRecord(emp.id);
      const { unjustifiedFaltas, totalOvertimeHours } = getAutomatedAttendanceMetrics(emp.id);
      
      const dataMap: Record<string, string> = {
        nome: `"${emp.nome}"`,
        base: emp.salarioBase.toFixed(2),
        faltas: unjustifiedFaltas.toString(),
        horasExtras: totalOvertimeHours.toString(),
        bruto: pay ? pay.totalBruto.toFixed(2) : '0.00',
        inss: pay ? pay.impostos.inssTrabalhador.toFixed(2) : '0.00',
        irps: pay ? pay.impostos.irps.toFixed(2) : '0.00',
        liquido: pay ? pay.salarioLiquido.toFixed(2) : '0.00',
        estado: pay ? (pay.status === 'Pago' || pay.pago ? 'Pago' : pay.status === 'Aprovado' ? 'Aprovado' : 'Pendente Revisao') : 'Nao Calculado'
      };

      return activeColumns.map(col => dataMap[col.id]).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const filename = `Folha_Salarial_${selectedMonth.toString().padStart(2, '0')}_${selectedYear}.csv`;
    downloadCSV(csvContent, filename);
  };

  const preview = previewCalculation();

  const totalNetPay = processedInPeriod.reduce((sum, p) => sum + p.salarioLiquido, 0);
  const totalINSS = processedInPeriod.reduce((sum, p) => sum + p.impostos.inssTrabalhador, 0);
  const totalIRPS = processedInPeriod.reduce((sum, p) => sum + p.impostos.irps, 0);

  const chartData = [
    { name: 'Total Líquido', valor: totalNetPay, fill: '#10b981' },
    { name: 'Total INSS', valor: totalINSS, fill: '#f43f5e' },
    { name: 'Total IRPS', valor: totalIRPS, fill: '#6366f1' }
  ];

  return (
    <div className="space-y-6" id="payroll-layout-wrapper">
      {/* Description header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Processamento Salarial Diário / Mensal</h2>
          <p className="text-xs text-slate-500 font-medium">Cálculos automatizados de impostos nacionais com sincronização com a folha de assiduidade</p>
        </div>

        {/* Month selector dropdowns */}
        <div className="flex items-center space-x-4 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowExportColDropdown(!showExportColDropdown)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Colunas</span>
            </button>

            {showExportColDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 shadow-xl rounded-2xl z-50 p-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                  Colunas para Exportar
                </div>
                <div className="flex flex-col gap-1 px-2 mb-2 pb-2 border-b border-slate-100">
                  <button 
                    onClick={() => setSelectedExportColumns(EXPORT_COLUMNS.map(c => c.id))}
                    className="text-left text-xs font-medium text-emerald-600 hover:text-emerald-700 py-1"
                  >
                    Selecionar Todas
                  </button>
                  <button 
                    onClick={() => setSelectedExportColumns(['nome', 'base', 'estado'])}
                    className="text-left text-xs font-medium text-emerald-600 hover:text-emerald-700 py-1"
                  >
                    Apenas Info Básica
                  </button>
                  <button 
                    onClick={() => setSelectedExportColumns(['nome', 'bruto', 'inss', 'irps', 'liquido'])}
                    className="text-left text-xs font-medium text-emerald-600 hover:text-emerald-700 py-1"
                  >
                    Apenas Financeiro
                  </button>
                </div>
                {EXPORT_COLUMNS.map(col => (
                  <label key={col.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedExportColumns.includes(col.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExportColumns([...selectedExportColumns, col.id]);
                        } else {
                          setSelectedExportColumns(selectedExportColumns.filter(id => id !== col.id));
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 bg-slate-100 border-slate-300 w-3.5 h-3.5"
                    />
                    <span className="text-xs font-medium text-slate-700">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setShowSimulator(true)}
            className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Simulador What-If</span>
          </button>
          <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-100 shadow-xs font-bold">
            <select
              className="bg-transparent border-0 text-xs font-bold text-slate-700 outline-none"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              <option value={5}>Maio</option>
              <option value={6}>Junho</option>
              <option value={7}>Julho</option>
            </select>
            <span className="text-slate-300">|</span>
            <select
              className="bg-transparent border-0 text-xs font-bold text-slate-700 outline-none"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Chart */}
      {processedInPeriod.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-64">
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide mb-4">
            Distribuição de Custos Salariais
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: number) => formatMT(value)}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Integration Info Box */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-start space-x-3 text-emerald-900 text-xs shadow-xs">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1 font-semibold leading-relaxed">
          <p className="font-extrabold text-emerald-950">Recursos de Sincronização e Automação de Assiduidade Activos:</p>
          <p className="text-emerald-800 font-medium">
            O sistema faz uma análise cruzada em tempo real com a folha de assiduidade do funcionário para o período selecionado. 
            Ele identificará e somará de forma autónoma as <b>Horas Extraordinárias</b> registradas e deduzirá no salário as <b>Faltas Injustificadas</b> acumuladas!
          </p>
        </div>
      </div>

      {/* Payroll List Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="payroll-grid-panel">
        <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide">
            Cálculo das Remunerações Periodo: {selectedMonth.toString().padStart(2, '0')}/{selectedYear}
          </h3>
          <span className="text-[10px] text-slate-400 font-mono font-bold">
            Taxa Geral INSS Trabalhador: {(settings.taxaInssTrabalhador * 100).toFixed(0)}%
          </span>
        </div>

        {/* High intensity list table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/10">
                <th className="py-4 px-6">Funcionário</th>
                <th className="py-4 px-3">Salário Base</th>
                <th className="py-4 px-3">Sinc Assiduidade</th>
                <th className="py-4 px-3">Total Bruto</th>
                <th className="py-4 px-3">Desconto INSS</th>
                <th className="py-4 px-3">Retenção IRPS</th>
                <th className="py-4 px-3">Salário Líquido</th>
                <th className="py-4 px-3 text-center">Estado Ref</th>
                <th className="py-4 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
              {activeEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    Nenhum colaborador ativo cadastrado.
                  </td>
                </tr>
              ) : (
                activeEmployees.map(emp => {
                  const pay = getProcessedRecord(emp.id);
                  const { unjustifiedFaltas, totalOvertimeHours } = getAutomatedAttendanceMetrics(emp.id);

                  return (
                    <React.Fragment key={emp.id}>
                      <tr 
                        onClick={() => {
                          if (pay) setExpandedRowId(expandedRowId === emp.id ? null : emp.id);
                        }}
                        className={`hover:bg-slate-50/35 transition-colors ${pay ? 'cursor-pointer' : ''} ${expandedRowId === emp.id ? 'bg-slate-50/50' : ''}`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <img
                              src={emp.foto}
                              alt={emp.nome}
                              className="w-9 h-9 rounded-full object-cover border border-slate-100 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="block font-bold text-slate-800 flex items-center gap-1">
                                {emp.nome}
                                {pay && (
                                  expandedRowId === emp.id 
                                    ? <ChevronUp className="w-3 h-3 text-slate-400" />
                                    : <ChevronDown className="w-3 h-3 text-slate-400" />
                                )}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-bold">{emp.cargo}</span>
                            </div>
                          </div>
                        </td>

                      <td className="py-4 px-3 font-mono font-bold text-slate-600">
                        {formatMT(emp.salarioBase)}
                      </td>

                      <td className="py-4 px-3 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded block w-fit">
                          +{totalOvertimeHours} hrs Extras
                        </span>
                        {unjustifiedFaltas > 0 ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded block w-fit">
                            {unjustifiedFaltas} Faltas desc
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 block font-semibold leading-relaxed">
                            Sem faltas
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3 font-mono font-bold text-slate-900">
                        {pay ? formatMT(pay.totalBruto) : '—'}
                      </td>

                      <td className="py-4 px-3 font-mono text-rose-600">
                        {pay ? formatMT(pay.impostos.inssTrabalhador) : '—'}
                      </td>

                      <td className="py-4 px-3 font-mono text-rose-600">
                        {pay ? formatMT(pay.impostos.irps) : '—'}
                      </td>

                      <td className="py-4 px-3 font-mono font-black text-emerald-700">
                        {pay ? formatMT(pay.salarioLiquido) : '—'}
                      </td>

                      <td className="py-4 px-3 text-center">
                        {pay ? (
                          pay.status === 'Pago' || pay.pago ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-extrabold inline-block">
                              PAGO ({pay.referenciaBancaria})
                            </span>
                          ) : pay.status === 'Aprovado' ? (
                            <div className="flex flex-col space-y-1 items-center">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[9px] font-extrabold inline-block">
                                APROVADO
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handlePayConfirm(pay.id); }}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-extrabold hover:bg-emerald-700 cursor-pointer"
                                disabled={currentUserRole === UserRole.SUPERVISOR || currentUserRole === UserRole.FUNCIONARIO}
                              >
                                Efetuar Pagamento
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-1 items-center">
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-[9px] font-extrabold inline-block">
                                PENDENTE REVISÃO
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleApprove(pay.id); }}
                                className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[9px] font-extrabold hover:bg-indigo-700 cursor-pointer"
                                disabled={currentUserRole !== UserRole.ADMIN && currentUserRole !== UserRole.RH}
                              >
                                Aprovar
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-md text-[9px] font-medium inline-block">
                            Não Calculado
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openProcessingDrawer(emp); }}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer"
                            id={`process-btn-${emp.id}`}
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>{pay ? 'Re-calcular' : 'Calcular'}</span>
                          </button>

                          {pay && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onPrintSlip(pay); }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 font-bold p-1.5 rounded-lg text-[10px]"
                              title="Imprimir Recibo"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence initial={false}>
                      {expandedRowId === emp.id && pay && (
                        <tr className="bg-slate-50/20 border-b border-slate-100">
                          <td colSpan={9} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="py-4 px-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-5 rounded-xl border border-slate-200 bg-white shadow-sm ml-8">
                                  <div>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-3 border-b border-slate-100 pb-1.5">Vencimentos</h4>
                                    <ul className="space-y-2 text-xs">
                                      <li className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Salário Base</span>
                                        <span className="font-mono text-slate-700 font-semibold">{formatMT(pay.salarioBase)}</span>
                                      </li>
                                      {pay.bonus > 0 && (
                                        <li className="flex justify-between items-center">
                                          <span className="text-slate-500 font-medium">Bónus</span>
                                          <span className="font-mono text-emerald-600 font-bold">+{formatMT(pay.bonus)}</span>
                                        </li>
                                      )}
                                      {pay.comissoes > 0 && (
                                        <li className="flex justify-between items-center">
                                          <span className="text-slate-500 font-medium">Comissões</span>
                                          <span className="font-mono text-emerald-600 font-bold">+{formatMT(pay.comissoes)}</span>
                                        </li>
                                      )}
                                      {pay.horasExtras > 0 && (
                                        <li className="flex justify-between items-center">
                                          <span className="text-slate-500 font-medium">Horas Extras ({pay.horasExtrasHoras}h)</span>
                                          <span className="font-mono text-emerald-600 font-bold">+{formatMT(pay.horasExtras)}</span>
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-3 border-b border-slate-100 pb-1.5">Subsídios</h4>
                                    <ul className="space-y-2 text-xs">
                                      {pay.subsidioTransporte > 0 ? (
                                        <li className="flex justify-between items-center">
                                          <span className="text-slate-500 font-medium">Transporte</span>
                                          <span className="font-mono text-slate-700 font-semibold">{formatMT(pay.subsidioTransporte)}</span>
                                        </li>
                                      ) : null}
                                      {pay.subsidioAlimentacao > 0 ? (
                                        <li className="flex justify-between items-center">
                                          <span className="text-slate-500 font-medium">Alimentação</span>
                                          <span className="font-mono text-slate-700 font-semibold">{formatMT(pay.subsidioAlimentacao)}</span>
                                        </li>
                                      ) : null}
                                      {pay.subsidioTransporte === 0 && pay.subsidioAlimentacao === 0 && (
                                        <li className="text-slate-400 italic text-[11px]">Nenhum subsídio apurado</li>
                                      )}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-3 border-b border-slate-100 pb-1.5">Deduções</h4>
                                    <ul className="space-y-2 text-xs">
                                      {pay.faltasDeducao > 0 && (
                                        <li className="flex justify-between items-center">
                                          <span className="text-slate-500 font-medium">Faltas Injustificadas</span>
                                          <span className="font-mono text-rose-600 font-bold">-{formatMT(pay.faltasDeducao)}</span>
                                        </li>
                                      )}
                                      {pay.vales > 0 && (
                                        <li className="flex justify-between items-center">
                                          <span className="text-slate-500 font-medium">Vales / Adiantamentos</span>
                                          <span className="font-mono text-rose-600 font-bold">-{formatMT(pay.vales)}</span>
                                        </li>
                                      )}
                                      {pay.impostos.outrosDescontos > 0 && (
                                        <li className="flex justify-between items-center">
                                          <span className="text-slate-500 font-medium">Outros Descontos</span>
                                          <span className="font-mono text-rose-600 font-bold">-{formatMT(pay.impostos.outrosDescontos)}</span>
                                        </li>
                                      )}
                                      {pay.faltasDeducao === 0 && pay.vales === 0 && pay.impostos.outrosDescontos === 0 && (
                                        <li className="text-slate-400 italic text-[11px]">Nenhuma dedução apurada</li>
                                      )}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-3 border-b border-slate-100 pb-1.5">Impostos</h4>
                                    <ul className="space-y-2 text-xs">
                                      <li className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">INSS (3% Trabalhador)</span>
                                        <span className="font-mono text-rose-600 font-bold">-{formatMT(pay.impostos.inssTrabalhador)}</span>
                                      </li>
                                      <li className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">IRPS Retido</span>
                                        <span className="font-mono text-rose-600 font-bold">-{formatMT(pay.impostos.irps)}</span>
                                      </li>
                                      <li className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2">
                                        <span className="text-slate-400 font-medium text-[10px]">Encargo INSS Patronal (4%)</span>
                                        <span className="font-mono text-slate-400 font-semibold text-[10px]">{formatMT(pay.impostos.inssPatronal)}</span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Calculation and Input Fields Processing Side Panel */}
      {processingEmp && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-end">
          <div className="bg-white h-full max-w-xl w-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200 animate-slide-in">
            {/* Header */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <h3 className="font-bold text-slate-800 text-md">Cálculo de Proventos e Deduções</h3>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold"
                  onClick={() => setProcessingEmp(null)}
                >
                  ✕
                </button>
              </div>

              {/* Employee profile mini info */}
              <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <img
                  src={processingEmp.foto}
                  alt={processingEmp.nome}
                  className="w-12 h-12 rounded-full object-cover border border-white"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">{processingEmp.nome}</h4>
                  <p className="text-[10px] text-slate-500 font-extrabold">{processingEmp.cargo} • {processingEmp.departamento}</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">Salário Comercial de Base: {formatMT(processingEmp.salarioBase)}</p>
                </div>
              </div>

              {/* Input Form Fields for additionals */}
              <form onSubmit={handleSaveProcessing} className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Bonus */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bónus Desempenho (MT)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                      value={bonus}
                      onChange={e => setBonus(Number(e.target.value))}
                    />
                  </div>

                  {/* Subsidio Transporte */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Subsídio Transporte (MT)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                      value={subsidioTrans}
                      onChange={e => setSubsidioTrans(Number(e.target.value))}
                    />
                  </div>

                  {/* Subsidio Alimentacao */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Subsídio Alimentação (MT)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                      value={subsidioAlim}
                      onChange={e => setSubsidioAlim(Number(e.target.value))}
                    />
                  </div>

                  {/* Comissoes */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Comissões (MT)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none"
                      value={comissoes}
                      onChange={e => setComissoes(Number(e.target.value))}
                    />
                  </div>

                  {/* Vales Loans */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vales / Empréstimos (MT)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none text-rose-700"
                      value={vales}
                      onChange={e => setVales(Number(e.target.value))}
                    />
                  </div>

                  {/* Outros descontos */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Outras Deduções (MT)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 focus:outline-none text-rose-700"
                      value={outrosDescontos}
                      onChange={e => setOutrosDescontos(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Settle automatic calculation preview outputs */}
                {preview && (
                  <div className="bg-slate-900 rounded-2xl p-4.5 text-white space-y-4 shadow-inner border border-slate-800">
                    <span className="text-[9px] bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                      Demonstrativo de Cálculo em Tempo Real
                    </span>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono border-b border-slate-800 pb-3">
                      <div className="flex justify-between text-slate-400">
                        <span>Vencimento Base:</span>
                        <span className="font-bold text-white">{formatMT(preview.salarioBase)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Horas Extras ({preview.horasExtrasHoras}h):</span>
                        <span className="font-bold text-emerald-400">+{formatMT(preview.horasExtras)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 col-span-2">
                        <span>Subsídios Adicionais:</span>
                        <span className="font-bold text-emerald-400">
                          +{formatMT(preview.subsidioTransporte + preview.subsidioAlimentacao + preview.comissoes + preview.bonus)}
                        </span>
                      </div>
                      {preview.faltasDeducao > 0 && (
                        <div className="flex justify-between text-rose-400 col-span-2 font-bold">
                          <span>Dedução Faltas:</span>
                          <span>-{formatMT(preview.faltasDeducao)}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono border-b border-slate-800 pb-3">
                      <div className="flex justify-between text-rose-300">
                        <span>IRPS Retido:</span>
                        <span className="font-bold">-{formatMT(preview.impostos.irps)}</span>
                      </div>
                      <div className="flex justify-between text-rose-300">
                        <span>INSS Seg.Social:</span>
                        <span className="font-bold">-{formatMT(preview.impostos.inssTrabalhador)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px] col-span-2">
                        <span>INSS Pago Empresa (4% patronal):</span>
                        <span>{formatMT(preview.impostos.inssPatronal)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold pt-1">
                      <span className="text-emerald-400">Salário Líquido a Receber</span>
                      <span className="text-lg font-black text-white font-mono bg-emerald-950 px-3 py-1 rounded-xl">
                        {formatMT(preview.salarioLiquido)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit actions */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold cursor-pointer"
                    onClick={() => setProcessingEmp(null)}
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/15 cursor-pointer"
                    id="submit-process-salary-button"
                  >
                    Confirmar Processamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-800 text-md flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span>Simulador de Salário "What-If"</span>
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer"
                onClick={() => setShowSimulator(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 py-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Salário Base (MT)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-none"
                  value={simBaseSalary}
                  onChange={e => setSimBaseSalary(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bónus (MT)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-none"
                  value={simBonus}
                  onChange={e => setSimBonus(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Horas Extras</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-none"
                    value={simOvertime}
                    onChange={e => setSimOvertime(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Faltas Injustificadas</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 focus:outline-none"
                    value={simAbsences}
                    onChange={e => setSimAbsences(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {(() => {
              const simResult = processFullPayroll({
                funcionarioId: 'sim-1',
                mes: selectedMonth,
                ano: selectedYear,
                salarioBase: simBaseSalary,
                bonus: simBonus,
                subsidioTransporte: 0,
                subsidioAlimentacao: 0,
                horasExtrasHoras: simOvertime,
                comissoes: 0,
                vales: 0,
                faltasInjustificadas: simAbsences,
                outrosDescontos: 0,
                taxaInssTrabalhador: settings.taxaInssTrabalhador,
                taxaInssPatronal: settings.taxaInssPatronal,
                brackets: settings.irpsBrackets,
                processadoPor: 'Simulador'
              });

              return (
                <div className="bg-emerald-900 rounded-xl p-4 text-white space-y-2 mt-4 shadow-inner">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-300">Salário Bruto</span>
                    <span className="font-mono">{formatMT(simResult.totalBruto)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-300">Descontos (INSS + IRPS)</span>
                    <span className="font-mono">{formatMT(simResult.impostos.inssTrabalhador + simResult.impostos.irps)}</span>
                  </div>
                  <div className="border-t border-emerald-700/50 pt-2 flex justify-between items-center text-sm font-bold">
                    <span className="text-emerald-400">Líquido a Receber</span>
                    <span className="text-lg font-black text-white font-mono bg-emerald-950 px-3 py-1 rounded-xl">
                      {formatMT(simResult.salarioLiquido)}
                    </span>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
}
