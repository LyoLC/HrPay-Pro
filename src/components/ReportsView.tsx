import React, { useState } from 'react';
import { Employee, PayrollProcessed, UserRole } from '../types';
import { FileText, Download, Printer, Search, BarChart3, TrendingUp, Table, Calendar } from 'lucide-react';

interface ReportsViewProps {
  payrollHistory: PayrollProcessed[];
  employees: Employee[];
  onTriggerGlobalPrint: () => void;
  onPrintMultipleSlips?: (payrolls: PayrollProcessed[]) => void;
}

type ReportTab = 'Folha Salarial' | 'INSS' | 'IRPS' | 'Descontos' | 'Lista de Funcionários';

export default function ReportsView({
  payrollHistory,
  employees,
  onTriggerGlobalPrint,
  onPrintMultipleSlips
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('Folha Salarial');
  const [selectedMonth, setSelectedMonth] = useState(5); // May (since May has pre-populated payments on boot!)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([]);

  // Filter payroll list for chosen interval
  const paymentsInInterval = payrollHistory.filter(
    p => p.mes === selectedMonth && p.ano === selectedYear
  );

  // Format currency
  const formatMT = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val).replace('MZN', 'MT');
  };

  // Sum aggregates
  const sumBase = paymentsInInterval.reduce((sum, p) => sum + p.salarioBase, 0);
  const sumGross = paymentsInInterval.reduce((sum, p) => sum + p.totalBruto, 0);
  const sumInssTrabalhador = paymentsInInterval.reduce((sum, p) => sum + p.impostos.inssTrabalhador, 0);
  const sumInssPatronal = paymentsInInterval.reduce((sum, p) => sum + p.impostos.inssPatronal, 0);
  const sumIrps = paymentsInInterval.reduce((sum, p) => sum + p.impostos.irps, 0);
  const sumVales = paymentsInInterval.reduce((sum, p) => sum + p.vales, 0);
  const sumAbsenceDeduction = paymentsInInterval.reduce((sum, p) => sum + p.faltasDeducao, 0);
  const sumNet = paymentsInInterval.reduce((sum, p) => sum + p.salarioLiquido, 0);

  // Trigger actual CSV export
  const handleExportCSV = (format: 'CSV' | 'Excel' = 'CSV') => {
    let csvContent = '';
    const separator = format === 'Excel' ? ';' : ',';

    if (activeTab === 'Folha Salarial') {
      const headers = ['Funcionário', 'Salário Base (MT)', 'Proventos (MT)', 'Deduções (MT)', 'Líquido (MT)', 'Estado'];
      csvContent += headers.join(separator) + '\n';
      paymentsInInterval.forEach(p => {
        const proventos = p.totalBruto - p.salarioBase;
        const deducoes = p.totalBruto - p.salarioLiquido;
        const emp = employees.find(e => e.id === p.funcionarioId);
        const name = emp ? emp.nome : 'Desconhecido';
        const row = [
          `"${name}"`,
          p.salarioBase,
          proventos,
          deducoes,
          p.salarioLiquido,
          p.pago ? 'PAGO' : 'PENDENTE'
        ];
        csvContent += row.join(separator) + '\n';
      });
    } else if (activeTab === 'INSS') {
      const headers = ['Funcionário', 'Salário Bruto (MT)', 'INSS Trabalhador (MT)', 'INSS Patronal (MT)', 'Total INSS (MT)'];
      csvContent += headers.join(separator) + '\n';
      paymentsInInterval.forEach(p => {
        const emp = employees.find(e => e.id === p.funcionarioId);
        const name = emp ? emp.nome : 'Desconhecido';
        const inssT = p.impostos.inssTrabalhador;
        const inssP = p.impostos.inssPatronal;
        const total = inssT + inssP;
        const row = [`"${name}"`, p.totalBruto, inssT, inssP, total];
        csvContent += row.join(separator) + '\n';
      });
    } else if (activeTab === 'IRPS') {
      const headers = ['Funcionário', 'Salário Bruto (MT)', 'INSS Trabalhador (MT)', 'Matéria Colectável (MT)', 'IRPS Retido (MT)'];
      csvContent += headers.join(separator) + '\n';
      paymentsInInterval.forEach(p => {
        const emp = employees.find(e => e.id === p.funcionarioId);
        const name = emp ? emp.nome : 'Desconhecido';
        const inssT = p.impostos.inssTrabalhador;
        const materiaColectavel = p.totalBruto - inssT;
        const row = [`"${name}"`, p.totalBruto, inssT, materiaColectavel, p.impostos.irps];
        csvContent += row.join(separator) + '\n';
      });
    } else if (activeTab === 'Descontos') {
      const headers = ['Funcionário', 'Faltas Injust. (MT)', 'Vales (MT)', 'Outros (MT)', 'Total Descontos (MT)'];
      csvContent += headers.join(separator) + '\n';
      paymentsInInterval.forEach(p => {
        const emp = employees.find(e => e.id === p.funcionarioId);
        const name = emp ? emp.nome : 'Desconhecido';
        const totalDescontos = p.faltasDeducao + p.vales + p.impostos.outrosDescontos;
        const row = [`"${name}"`, p.faltasDeducao, p.vales, p.impostos.outrosDescontos, totalDescontos];
        csvContent += row.join(separator) + '\n';
      });
    } else if (activeTab === 'Lista de Funcionários') {
      const headers = ['Nome', 'Email', 'Cargo', 'Departamento', 'Estado'];
      csvContent += headers.join(separator) + '\n';
      employees.forEach(emp => {
        const row = [
          `"${emp.nome}"`,
          `"${emp.email}"`,
          `"${emp.cargo}"`,
          `"${emp.departamento}"`,
          `"${emp.estado}"`
        ];
        csvContent += row.join(separator) + '\n';
      });
    }

    const filename = `Relatorio_${activeTab.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.csv`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSimulated = (format: 'CSV' | 'Excel' | 'PDF') => {
    if (format === 'CSV' || format === 'Excel') {
      handleExportCSV(format);
    } else {
      const filename = `Relatorio_${activeTab.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.${format.toLowerCase()}`;
      alert(`Exportação iniciada para o formato ${format}! O download do arquivo "${filename}" será processado brevemente.`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPayrolls.length === paymentsInInterval.length) {
      setSelectedPayrolls([]);
    } else {
      setSelectedPayrolls(paymentsInInterval.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedPayrolls.includes(id)) {
      setSelectedPayrolls(selectedPayrolls.filter(pid => pid !== id));
    } else {
      setSelectedPayrolls([...selectedPayrolls, id]);
    }
  };

  const handlePrintSelected = () => {
    if (onPrintMultipleSlips && selectedPayrolls.length > 0) {
      const selected = paymentsInInterval.filter(p => selectedPayrolls.includes(p.id));
      onPrintMultipleSlips(selected);
    }
  };

  return (
    <div className="space-y-6" id="reports-module-sheet">
      {/* Upper header action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatórios Financeiros e Fiscais</h2>
          <p className="text-xs text-slate-500 font-medium">Extraia folhas salariais integradas, mapas oficiais de previdência social e retenção de IRPS</p>
        </div>

        {/* Month selector dropdowns */}
        <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs shrink-0 font-bold">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            className="bg-transparent border-0 text-xs font-bold text-slate-700 outline-none"
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
          >
            <option value={5}>Maio (Semestre Passado)</option>
            <option value={6}>Junho (Mês Corrente)</option>
            <option value={7}>Julho (Previsões)</option>
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

      {/* Aggregate metrics box card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="aggregations-counter-grid">
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[9px] uppercase font-bold text-slate-400">Remunerações Consolidadas (Bruto)</span>
          <span className="block text-lg font-black text-slate-800 mt-1 font-mono">{formatMT(sumGross)}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[9px] uppercase font-bold text-rose-500">Total Retenção IRPS</span>
          <span className="block text-lg font-black text-rose-700 mt-1 font-mono">{formatMT(sumIrps)}</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[9px] uppercase font-bold text-amber-500">Soma INSS Coletado (7%)</span>
          <span className="block text-lg font-black text-amber-700 mt-1 font-mono">{formatMT(sumInssTrabalhador + sumInssPatronal)}</span>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-[9px] uppercase font-bold text-emerald-700">Massa Líquida Paga</span>
          <span className="block text-lg font-black text-emerald-900 mt-1 font-mono">{formatMT(sumNet)}</span>
        </div>
      </div>

      {/* Report Category selections */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Navigation Selector tab row */}
        <div className="p-4.5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-none">
            {[
              { tab: 'Folha Salarial', label: 'Folha Salarial Mensal' },
              { tab: 'INSS', label: 'Segurança Social (INSS)' },
              { tab: 'IRPS', label: 'Retenção na Fonte (IRPS)' },
              { tab: 'Descontos', label: 'Mapa Geral de Descontos' },
              { tab: 'Lista de Funcionários', label: 'Lista de Funcionários' }
            ].map(item => (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab as ReportTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border shrink-0 cursor-pointer ${activeTab === item.tab ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Export tools */}
          <div className="flex space-x-2 shrink-0">
            {activeTab === 'Folha Salarial' && selectedPayrolls.length > 0 && (
              <button
                onClick={handlePrintSelected}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Selecionados ({selectedPayrolls.length})</span>
              </button>
            )}

            <button
              onClick={onTriggerGlobalPrint}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span title="Imprimir Mapa Geral (Ctrl+P)">Imprimir Mapa Geral</span>
            </button>

            <button
              onClick={() => handleExportSimulated('CSV')}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report as CSV</span>
            </button>

            <button
              onClick={() => handleExportSimulated('Excel')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Sheet representation tables */}
        <div className="overflow-x-auto">
          {paymentsInInterval.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium text-xs">
              De momento não existem remunerações processadas para o período indicado ({selectedMonth}/{selectedYear}).
              <br />
              Vá ao menu **Processamento Salarial** para calcular as folhas de salário de cada funcionário.
            </div>
          ) : (
            <>
              {activeTab === 'Folha Salarial' && (
                <table className="w-full text-left border-collapse" id="report-sheet-folha-salarial">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/10">
                      <th className="py-4 px-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          checked={selectedPayrolls.length > 0 && selectedPayrolls.length === paymentsInInterval.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="py-4 px-2">Funcionário</th>
                      <th className="py-4 px-3">Cargo Inicial</th>
                      <th className="py-4 px-3">Salário Base</th>
                      <th className="py-4 px-3">Bônus & Subs.</th>
                      <th className="py-4 px-3">Total Bruto</th>
                      <th className="py-4 px-3">INSS Trb (3%)</th>
                      <th className="py-4 px-3">IRPS Retido</th>
                      <th className="py-4 px-3">Empréstimos/Cuts</th>
                      <th className="py-4 px-6 text-right">Líquido a Pagar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {paymentsInInterval.map(p => {
                      const emp = employees.find(e => e.id === p.funcionarioId);
                      const allowancesSum = p.bonus + p.subsidioTransporte + p.subsidioAlimentacao + p.comissoes + p.horasExtras;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-4 px-4 w-10">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              checked={selectedPayrolls.includes(p.id)}
                              onChange={() => toggleSelect(p.id)}
                            />
                          </td>
                          <td className="py-4 px-2 font-bold text-slate-800">{emp?.nome || 'Utilizador'}</td>
                          <td className="py-4 px-3 text-slate-500 font-bold">{emp?.cargo}</td>
                          <td className="py-4 px-3 font-mono text-slate-600">{formatMT(p.salarioBase)}</td>
                          <td className="py-4 px-3 font-mono text-emerald-600">+{formatMT(allowancesSum)}</td>
                          <td className="py-4 px-3 font-mono font-bold text-slate-800">{formatMT(p.totalBruto)}</td>
                          <td className="py-4 px-3 font-mono text-rose-600">-{formatMT(p.impostos.inssTrabalhador)}</td>
                          <td className="py-4 px-3 font-mono text-rose-600">-{formatMT(p.impostos.irps)}</td>
                          <td className="py-4 px-3 font-mono text-rose-600">-{formatMT(p.vales + p.faltasDeducao)}</td>
                          <td className="py-4 px-6 text-right font-mono font-black text-emerald-800 bg-emerald-50/10">{formatMT(p.salarioLiquido)}</td>
                        </tr>
                      );
                    })}
                    {/* Sum aggregate summary row */}
                    <tr className="bg-slate-50/80 font-black border-t-2 border-slate-200">
                      <td colSpan={3} className="py-4 px-6 text-slate-800">TOTAL CONSOLIDADO</td>
                      <td className="py-4 px-3 font-mono">{formatMT(sumBase)}</td>
                      <td className="py-4 px-3 font-mono text-emerald-700">+{formatMT(paymentsInInterval.reduce((sum, p) => sum + p.bonus + p.subsidioTransporte + p.subsidioAlimentacao + p.comissoes + p.horasExtras, 0))}</td>
                      <td className="py-4 px-3 font-mono text-slate-900">{formatMT(sumGross)}</td>
                      <td className="py-4 px-3 font-mono text-rose-700">-{formatMT(sumInssTrabalhador)}</td>
                      <td className="py-4 px-3 font-mono text-rose-700">-{formatMT(sumIrps)}</td>
                      <td className="py-4 px-3 font-mono text-rose-700">-{formatMT(sumVales + sumAbsenceDeduction)}</td>
                      <td className="py-4 px-6 text-right font-mono text-emerald-950 text-sm bg-emerald-50">{formatMT(sumNet)}</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {activeTab === 'INSS' && (
                <table className="w-full text-left border-collapse" id="report-sheet-inss">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/10">
                      <th className="py-4 px-6">Funcionário</th>
                      <th className="py-4 px-3">NUIT do Trabalhador</th>
                      <th className="py-4 px-3">Base de Cálculo INSS</th>
                      <th className="py-4 px-3">Dedução Trabalhador (3%)</th>
                      <th className="py-4 px-3">Encargo Patronal (4%)</th>
                      <th className="py-4 px-6 text-right">Contribuição Total (7%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {paymentsInInterval.map(p => {
                      const emp = employees.find(e => e.id === p.funcionarioId);
                      const baseInss = p.salarioBase + p.bonus + p.comissoes + p.horasExtras - p.faltasDeducao;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800">{emp?.nome}</td>
                          <td className="py-4 px-3 font-mono font-bold text-slate-600">{emp?.nuit}</td>
                          <td className="py-4 px-3 font-mono">{formatMT(baseInss)}</td>
                          <td className="py-4 px-3 font-mono text-rose-600">-{formatMT(p.impostos.inssTrabalhador)}</td>
                          <td className="py-4 px-3 font-mono text-slate-600">+{formatMT(p.impostos.inssPatronal)}</td>
                          <td className="py-4 px-6 text-right font-mono font-black text-amber-700">{formatMT(p.impostos.inssTrabalhador + p.impostos.inssPatronal)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50/80 font-black border-t-2 border-slate-200">
                      <td colSpan={2} className="py-4 px-6 text-slate-800">TOTAIS DE SEGURANÇA SOCIAL</td>
                      <td className="py-4 px-3 font-mono">{formatMT(paymentsInInterval.reduce((sum, p) => sum + (p.salarioBase + p.bonus + p.comissoes + p.horasExtras - p.faltasDeducao), 0))}</td>
                      <td className="py-4 px-3 font-mono text-rose-700">-{formatMT(sumInssTrabalhador)}</td>
                      <td className="py-4 px-3 font-mono text-slate-800">+{formatMT(sumInssPatronal)}</td>
                      <td className="py-4 px-6 text-right font-mono text-amber-950 text-sm bg-amber-50">{formatMT(sumInssTrabalhador + sumInssPatronal)}</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {activeTab === 'IRPS' && (
                <table className="w-full text-left border-collapse" id="report-sheet-irps">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/10">
                      <th className="py-4 px-6">Funcionário</th>
                      <th className="py-4 px-3">NUIT do Trabalhador</th>
                      <th className="py-4 px-3">Base Tributável IRPS</th>
                      <th className="py-4 px-3">Taxa Efectiva</th>
                      <th className="py-4 px-6 text-right">Retenção IRPS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {paymentsInInterval.map(p => {
                      const emp = employees.find(e => e.id === p.funcionarioId);
                      const baseIrps = p.totalBruto - p.impostos.inssTrabalhador - p.faltasDeducao;
                      
                      // Calculate effective rate preview
                      const rateRaw = baseIrps > 0 ? (p.impostos.irps / baseIrps) * 100 : 0;
                      const rateStr = rateRaw > 0 ? `${rateRaw.toFixed(1)}%` : 'Isento';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800">{emp?.nome}</td>
                          <td className="py-4 px-3 font-mono font-bold text-slate-600">{emp?.nuit}</td>
                          <td className="py-4 px-3 font-mono">{formatMT(baseIrps)}</td>
                          <td className="py-4 px-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${p.impostos.irps > 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                              {rateStr}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-black text-rose-700">-{formatMT(p.impostos.irps)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50/80 font-black border-t-2 border-slate-200">
                      <td colSpan={2} className="py-4 px-6 text-slate-800">TOTAL ARRECADADO DE IRPS</td>
                      <td className="py-4 px-3 font-mono">{formatMT(paymentsInInterval.reduce((sum, p) => sum + (p.totalBruto - p.impostos.inssTrabalhador - p.faltasDeducao), 0))}</td>
                      <td className="py-4 px-3">—</td>
                      <td className="py-4 px-6 text-right font-mono text-rose-950 text-sm bg-rose-50">-{formatMT(sumIrps)}</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {activeTab === 'Descontos' && (
                <table className="w-full text-left border-collapse" id="report-sheet-descontos">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/10">
                      <th className="py-4 px-6">Funcionário</th>
                      <th className="py-4 px-3">Adiantamentos (Vales)</th>
                      <th className="py-4 px-3">Desconto de Faltas</th>
                      <th className="py-4 px-3">Impostos Retidos</th>
                      <th className="py-4 px-6 text-right font-black">Total Descontos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {paymentsInInterval.map(p => {
                      const emp = employees.find(e => e.id === p.funcionarioId);
                      const impostosSoma = p.impostos.inssTrabalhador + p.impostos.irps;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800">{emp?.nome}</td>
                          <td className="py-4 px-3 font-mono text-rose-600">-{formatMT(p.vales)}</td>
                          <td className="py-4 px-3 font-mono text-rose-600">-{formatMT(p.faltasDeducao)}</td>
                          <td className="py-4 px-3 font-mono text-rose-600">-{formatMT(impostosSoma)}</td>
                          <td className="py-4 px-6 text-right font-mono font-black text-rose-800">{formatMT(p.totalDescontos)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50/80 font-black border-t-2 border-slate-200">
                      <td className="py-4 px-6 text-slate-800">TOTAL GERAL DEDUÇÕES</td>
                      <td className="py-4 px-3 font-mono text-rose-700">-{formatMT(sumVales)}</td>
                      <td className="py-4 px-3 font-mono text-rose-700">-{formatMT(sumAbsenceDeduction)}</td>
                      <td className="py-4 px-3 font-mono text-rose-700">-{formatMT(paymentsInInterval.reduce((sum, p) => sum + (p.impostos.inssTrabalhador + p.impostos.irps), 0))}</td>
                      <td className="py-4 px-6 text-right font-mono text-rose-950 text-sm bg-rose-100/50">-{formatMT(sumVales + sumAbsenceDeduction + sumInssTrabalhador + sumIrps)}</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {activeTab === 'Lista de Funcionários' && (
                <table className="w-full text-left border-collapse" id="report-sheet-employee-list">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/10">
                      <th className="py-4 px-6">Nome</th>
                      <th className="py-4 px-3">Email</th>
                      <th className="py-4 px-3">Cargo</th>
                      <th className="py-4 px-3">Departamento</th>
                      <th className="py-4 px-6 text-right font-black">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-800">{emp.nome}</td>
                        <td className="py-4 px-3 text-slate-500">{emp.email}</td>
                        <td className="py-4 px-3">{emp.cargo}</td>
                        <td className="py-4 px-3">{emp.departamento}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.estado === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {emp.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/80 font-black border-t-2 border-slate-200">
                      <td className="py-4 px-6 text-slate-800">TOTAL FUNCIONÁRIOS</td>
                      <td colSpan={3}></td>
                      <td className="py-4 px-6 text-right font-mono text-slate-800 text-sm">{employees.length}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
