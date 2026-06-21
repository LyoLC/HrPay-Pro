import React from 'react';
import { PayrollProcessed, Employee, CompanySettings } from '../types';
import { FileText, Printer, X, CreditCard, ShieldCheck } from 'lucide-react';

interface PrintViewProps {
  payroll: PayrollProcessed | null;
  allPayrolls: PayrollProcessed[];
  employees: Employee[];
  settings: CompanySettings;
  onClose: () => void;
  printMode: 'single' | 'general'; // single payslip vs company ledger
}

export default function PrintView({
  payroll,
  allPayrolls,
  employees,
  settings,
  onClose,
  printMode
}: PrintViewProps) {
  // Format currency
  const formatMT = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val).replace('MZN', 'MT');
  };

  const getMonthName = (m: number) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[m - 1] || 'Mês';
  };

  const handlePrintTrigger = () => {
    // Hide buttons during browser dialog native printing
    window.print();
  };

  if (printMode === 'single' && payroll) {
    const emp = employees.find(e => e.id === payroll.funcionarioId);
    
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" id="print-receipt-modal">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[95vh]">
          {/* Header Action Row (Hidden during native print) */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center print:hidden rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Recibo de Salário Oficial - Visualização de Impressão</h3>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handlePrintTrigger}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Iniciar Impressão (Ctrl + P)</span>
              </button>

              <button
                onClick={onClose}
                className="bg-white border hover:bg-slate-50 text-slate-600 font-bold p-2 rounded-xl text-xs flex items-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PRINT BODY - HIGHLY STYLE FOR BLACK/WHITE INVOICE PRINTERS */}
          <div className="flex-1 overflow-y-auto p-8 bg-white print:p-0" id="official-payslip-canvas">
            <div className="text-slate-800 max-w-2xl mx-auto space-y-6 font-sans text-xs">
              
              {/* Receipt Header Table */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div className="space-y-1">
                  <h1 className="text-lg font-black tracking-tight text-slate-900">{settings.nomeEmpresa}</h1>
                  <p className="font-bold text-slate-500">Recursos Humanos & Processamento Salarial</p>
                  <p className="text-[10px] text-slate-400">{settings.enderecoEmpresa}</p>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono"><b>NUIT EMPRESA:</b> {settings.nuitEmpresa}</p>
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <div className="border border-slate-800 p-2 text-center rounded">
                    <span className="block font-black text-xs uppercase tracking-wider text-slate-600">Recibo de Salário</span>
                    <span className="block font-mono font-black text-sm text-slate-900 mt-1">{getMonthName(payroll.mes)} / {payroll.ano}</span>
                  </div>
                </div>
              </div>

              {/* Contributor Employee metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border border-slate-100 print:bg-transparent print:border-slate-800 print:p-2.5">
                <div className="space-y-1.5 font-semibold text-slate-600">
                  <p><b>Nome do Trabalhador:</b> <span className="text-slate-950 font-bold">{emp?.nome}</span></p>
                  <p><b>Profissão / Cargo:</b> <span className="text-slate-800">{emp?.cargo}</span></p>
                  <p><b>Departamento:</b> <span className="text-slate-800">{emp?.departamento}</span></p>
                </div>
                <div className="space-y-1.5 font-semibold text-slate-600 font-mono text-left sm:text-right">
                  <p><b>Nº de BI (ID):</b> <span className="text-slate-800 font-bold">{emp?.bi}</span></p>
                  <p><b>NUIT do Funcionando:</b> <span className="text-slate-800 font-bold">{emp?.nuit}</span></p>
                  <p><b>Data de Admissão:</b> <span className="text-slate-800">{emp?.dataAdmissao}</span></p>
                </div>
              </div>

              {/* Core Ledger Calculation comparison lines */}
              <div className="border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left font-semibold border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black uppercase text-slate-800 print:bg-transparent">
                      <th className="py-2.5 px-4">Proventos (Vantagens)</th>
                      <th className="py-2.5 px-3 text-right">Valor Bruto</th>
                      <th className="py-2.5 px-3">Descontos (Retenções)</th>
                      <th className="py-2.5 px-4 text-right">Valor Retor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                    {/* Row 1: base salary */}
                    <tr className="align-top">
                      <td className="py-2.5 px-4">Salário Base Mensal</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatMT(payroll.salarioBase)}</td>
                      <td className="py-2.5 px-3">Previdência Social (INSS 3%)</td>
                      <td className="py-2.5 px-4 text-right font-mono">-{formatMT(payroll.impostos.inssTrabalhador)}</td>
                    </tr>

                    {/* Row 2: Overtime */}
                    <tr className="align-top">
                      <td className="py-2.5 px-4">Horas Extras Reais ({payroll.horasExtrasHoras}h)</td>
                      <td className="py-2.5 px-3 text-right font-mono">{payroll.horasExtras > 0 ? `+${formatMT(payroll.horasExtras)}` : '—'}</td>
                      <td className="py-2.5 px-3">Retenção de Rendimento (IRPS)</td>
                      <td className="py-2.5 px-4 text-right font-mono">-{payroll.impostos.irps > 0 ? formatMT(payroll.impostos.irps) : 'Isento'}</td>
                    </tr>

                    {/* Row 3: Subsidies */}
                    <tr className="align-top">
                      <td className="py-2.5 px-4">Subsídios (Transporte & Alim.)</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {(payroll.subsidioTransporte + payroll.subsidioAlimentacao) > 0 
                          ? `+${formatMT(payroll.subsidioTransporte + payroll.subsidioAlimentacao)}` 
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3">Adiantamento Sancionado (Vales)</td>
                      <td className="py-2.5 px-4 text-right font-mono">-{payroll.vales > 0 ? formatMT(payroll.vales) : '—'}</td>
                    </tr>

                    {/* Row 4: Commissions and Faltas */}
                    <tr className="align-top">
                      <td className="py-2.5 px-4">Prémios de Desempenho / comissões</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {(payroll.comissoes + payroll.bonus) > 0 
                          ? `+${formatMT(payroll.comissoes + payroll.bonus)}` 
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3">Penalização de Faltas</td>
                      <td className="py-2.5 px-4 text-right font-mono">-{payroll.faltasDeducao > 0 ? formatMT(payroll.faltasDeducao) : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Money Totals row summary */}
              <div className="grid grid-cols-3 gap-2 border border-slate-800 p-3 rounded">
                <div className="text-center font-bold">
                  <span className="block text-[9px] uppercase text-slate-400">Total Proventos Brutos</span>
                  <span className="block text-xs font-mono font-bold mt-1">{formatMT(payroll.totalBruto)}</span>
                </div>
                <div className="text-center font-bold">
                  <span className="block text-[9px] uppercase text-slate-400 font-semibold text-rose-600">Total Deduções Retidas</span>
                  <span className="block text-xs font-mono font-bold mt-1 text-rose-700">-{formatMT(payroll.totalDescontos)}</span>
                </div>
                <div className="text-center font-bold bg-slate-50 border-l border-slate-200 print:bg-transparent print:border-slate-800">
                  <span className="block text-[9px] uppercase text-emerald-800 font-extrabold">líquido líquido a pagar</span>
                  <span className="block text-base font-mono font-black mt-1 text-emerald-900 border border-emerald-500/10 rounded px-1">{formatMT(payroll.salarioLiquido)}</span>
                </div>
              </div>

              {/* Informações de quitação bancária */}
              <div className="space-y-1 border border-dashed border-slate-300 p-3 rounded font-mono text-[9px] text-slate-500">
                <p><b>BANCO DO PAGAMENTO:</b> {settings.bancoPrincipal} • <b>Nº CONTA:</b> {settings.numeroContaPrincipal}</p>
                <p><b>REFERÊNCIA ELECTRÓNICA:</b> {payroll.referenciaBancaria || 'QUITAÇÃO MANUAL'} • <b>RESPONSÁVEL DO PROCESSAMENTO:</b> {payroll.processadoPor}</p>
                <p><b>CONFORMIDADE:</b> Segurança Social de Moçambique. Formulário de conformidade IRS Maputo.</p>
              </div>

              {/* Dual signature lines for formal validity */}
              <div className="grid grid-cols-2 gap-12 pt-16 text-center text-slate-600 text-[10px] font-bold">
                <div className="space-y-4">
                  <div className="border-t border-slate-800 w-full mx-auto" />
                  <p>O Empregador / Direcção Geral</p>
                  <p className="text-[8px] text-slate-400 font-semibold font-mono">Assinatura & Carimbo Oficial</p>
                </div>

                <div className="space-y-4">
                  <div className="border-t border-slate-800 w-full mx-auto" />
                  <p>{emp?.nome}</p>
                  <p className="text-[8px] text-slate-400 font-semibold font-mono">Assinatura do Trabalhador</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Master Payroll consolidated sheet (general tab list table format)
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" id="print-ledger-modal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[95vh]">
        
        {/* Header Action Row */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center print:hidden rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Folha de Salário Consolidada - Visualização de Impressão</h3>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handlePrintTrigger}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Iniciar Impressão Lote (Ctrl + P)</span>
            </button>

            <button
              onClick={onClose}
              className="bg-white border hover:bg-slate-50 text-slate-600 font-bold p-2 rounded-xl text-xs flex items-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINT LEDGER CANVAS */}
        <div className="p-8 bg-white overflow-y-auto print:p-0" id="official-ledger-canvas">
          <div className="text-slate-800 space-y-6 font-sans text-xs">
            {/* Header info */}
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-3">
              <div>
                <h1 className="text-md font-black text-slate-900 uppercase">{settings.nomeEmpresa}</h1>
                <p className="text-[10px] font-bold text-slate-500 font-mono"><b>MAPA CONSOLIDADO DE SALÁRIOS</b> • NUIT: {settings.nuitEmpresa}</p>
                <p className="text-[9px] text-slate-400 font-medium">Belo Horizonte, Maputo, Moçambique</p>
              </div>
              <div className="text-right">
                <span className="block text-md font-black font-mono bg-slate-100 p-2 border rounded">
                  {allPayrolls[0] ? `${getMonthName(allPayrolls[0].mes)} / ${allPayrolls[0].ano}` : 'Mês'}
                </span>
              </div>
            </div>

            {/* Corporate spreadsheet detail table */}
            <table className="w-full text-left font-bold border-collapse font-mono text-[9px] text-slate-700">
              <thead>
                <tr className="border-b border-slate-800 text-slate-900 bg-slate-100 print:bg-transparent">
                  <th className="py-2 px-3">Colaborador</th>
                  <th className="py-2 px-2">Salário Base</th>
                  <th className="py-2 px-2">Prémio/Bonus</th>
                  <th className="py-2 px-2">H.Extras</th>
                  <th className="py-2 px-2">Total Bruto</th>
                  <th className="py-2 px-2">Desconto INSS</th>
                  <th className="py-2 px-2">Retenção IRPS</th>
                  <th className="py-2 px-2">Vales/Faltas</th>
                  <th className="py-2 px-3 text-right">Líquido Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-b border-slate-800">
                {allPayrolls.map(p => {
                  const emp = employees.find(e => e.id === p.funcionarioId);
                  
                  return (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{emp?.nome}</td>
                      <td className="py-2.5 px-2">{formatMT(p.salarioBase)}</td>
                      <td className="py-2.5 px-2">+{formatMT(p.bonus + p.subsidioTransporte + p.subsidioAlimentacao + p.comissoes)}</td>
                      <td className="py-2.5 px-2">+{formatMT(p.horasExtras)}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">{formatMT(p.totalBruto)}</td>
                      <td className="py-2.5 px-2 text-rose-700">-{formatMT(p.impostos.inssTrabalhador)}</td>
                      <td className="py-2.5 px-2 text-rose-700">-{formatMT(p.impostos.irps)}</td>
                      <td className="py-2.5 px-2 text-rose-700">-{formatMT(p.vales + p.faltasDeducao)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-800 font-extrabold">{formatMT(p.salarioLiquido)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom corporate approvals fields */}
            <div className="grid grid-cols-3 gap-8 pt-16 text-center text-slate-600 text-[10px] font-bold">
              <div className="space-y-4">
                <div className="border-t border-slate-800 w-full" />
                <p>Elaborado por (RH)</p>
              </div>
              <div className="space-y-4">
                <div className="border-t border-slate-800 w-full" />
                <p>Verificado por (Contabilidade)</p>
              </div>
              <div className="space-y-4">
                <div className="border-t border-slate-800 w-full" />
                <p>Aprovado por (Direcção Geral)</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
