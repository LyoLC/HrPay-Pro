import React, { useState } from 'react';
import { Employee, AttendanceRecord, UserRole } from '../types';
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle, Plus, Sparkles, Filter, ChevronRight, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  employees: Employee[];
  onAddAttendanceRecord: (record: AttendanceRecord) => void;
  onUpdateAttendanceRecord: (id: string, updated: Partial<AttendanceRecord>) => void;
  currentUserRole: UserRole;
}

export default function AttendanceView({
  attendance,
  employees,
  onAddAttendanceRecord,
  onUpdateAttendanceRecord,
  currentUserRole
}: AttendanceViewProps) {
  const activeEmployees = employees.filter(e => e.estado === 'Ativo');
  
  // State for selected calendar day (up to June 21, 2026)
  const [selectedDay, setSelectedDay] = useState(21);
  const [selectedMonth, setSelectedMonth] = useState(6); // June
  const [selectedYear, setSelectedYear] = useState(2026);

  // Filter state for summary
  const [selectedEmployeeSummaryId, setSelectedEmployeeSummaryId] = useState<string>(activeEmployees[0]?.id || '');

  const dateString = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;

  // Find records for the currently selected day
  const dailyRecords = attendance.filter(a => a.data === dateString);

  const getRecordForEmployee = (empId: string) => {
    return dailyRecords.find(r => r.funcionarioId === empId);
  };

  const handleStatusChange = (empId: string, newStatus: 'Presente' | 'Falta Justificada' | 'Falta Injustificada' | 'Atraso') => {
    if (currentUserRole === UserRole.FUNCIONARIO) return;

    const existing = getRecordForEmployee(empId);
    if (existing) {
      onUpdateAttendanceRecord(existing.id, { presente: newStatus });
    } else {
      const newRec: AttendanceRecord = {
        id: `att_${empId}_${dateString}`,
        funcionarioId: empId,
        data: dateString,
        presente: newStatus,
        horasExtras: 0
      };
      onAddAttendanceRecord(newRec);
    }
  };

  const handleOvertimeChange = (empId: string, hours: number) => {
    if (currentUserRole === UserRole.FUNCIONARIO) return;

    const existing = getRecordForEmployee(empId);
    if (existing) {
      onUpdateAttendanceRecord(existing.id, { horasExtras: hours });
    } else {
      const newRec: AttendanceRecord = {
        id: `att_${empId}_${dateString}`,
        funcionarioId: empId,
        data: dateString,
        presente: 'Presente',
        horasExtras: hours
      };
      onAddAttendanceRecord(newRec);
    }
  };

  const handleComentarioChange = (empId: string, text: string) => {
    if (currentUserRole === UserRole.FUNCIONARIO) return;

    const existing = getRecordForEmployee(empId);
    if (existing) {
      onUpdateAttendanceRecord(existing.id, { comentario: text });
    } else {
      const newRec: AttendanceRecord = {
        id: `att_${empId}_${dateString}`,
        funcionarioId: empId,
        data: dateString,
        presente: 'Presente',
        horasExtras: 0,
        comentario: text
      };
      onAddAttendanceRecord(newRec);
    }
  };

  // Compute stats for selected employee
  const empRecords = attendance.filter(a => a.funcionarioId === selectedEmployeeSummaryId);
  const totalDays = empRecords.length;
  const totalPresents = empRecords.filter(r => r.presente === 'Presente').length;
  const totalDelays = empRecords.filter(r => r.presente === 'Atraso').length;
  const totalJustifiedAbs = empRecords.filter(r => r.presente === 'Falta Justificada').length;
  const totalUnjustifiedAbs = empRecords.filter(r => r.presente === 'Falta Injustificada').length;
  const totalOvertimeHours = empRecords.reduce((sum, r) => sum + r.horasExtras, 0);
  const totalWorkedHours = (totalPresents + totalDelays) * 8 + totalOvertimeHours;

  const handleExportCSV = () => {
    let csvContent = 'Data,Funcionario,Estado,Horas Extras,Comentario\n';
    
    // Filter records for the current month/year
    const monthlyRecords = attendance.filter(a => {
      const [y, m] = a.data.split('-');
      return parseInt(y) === selectedYear && parseInt(m) === selectedMonth;
    });

    monthlyRecords.forEach(r => {
      const emp = employees.find(e => e.id === r.funcionarioId);
      const empName = emp ? emp.nome : 'Desconhecido';
      const row = [
        r.data,
        `"${empName}"`,
        r.presente,
        r.horasExtras,
        `"${r.comentario || ''}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const filename = `Assiduidade_${selectedMonth.toString().padStart(2, '0')}_${selectedYear}.csv`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const monthlyRecords = attendance.filter(a => {
      const [y, m] = a.data.split('-');
      return parseInt(y) === selectedYear && parseInt(m) === selectedMonth;
    });

    const tableData = monthlyRecords.map(r => {
      const emp = employees.find(e => e.id === r.funcionarioId);
      const empName = emp ? emp.nome : 'Desconhecido';
      return [
        r.data,
        empName,
        r.presente,
        r.horasExtras.toString(),
        r.comentario || ''
      ];
    });

    doc.setFontSize(16);
    doc.text(`Relatório de Assiduidade - ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`, 14, 15);
    
    autoTable(doc, {
      head: [['Data', 'Funcionário', 'Estado', 'Horas Extras', 'Comentário']],
      body: tableData,
      startY: 25,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] } // emerald-500
    });

    doc.save(`Assiduidade_${selectedMonth.toString().padStart(2, '0')}_${selectedYear}.pdf`);
  };

  return (
    <div className="space-y-6" id="attendance-section-grid">
      {/* Upper description */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mapa de Assiduidade e Presenças</h2>
          <p className="text-xs text-slate-500 font-medium">Controlo diário de assiduidade, justificação de faltas administrativas e horas extraordinárias acumuladas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Primary Layout Split: Calendar & Register Table + Side Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Grid left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workdays Selector Strip */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Selecione o Dia de Trabalho (Junho 2026)
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Dia de Trabalho Activo</span>
              </span>
            </div>

            {/* Horiz line of days */}
            <div className="flex overflow-x-auto space-x-2 py-2 scrollbar-none" id="days-calendar-strip">
              {Array.from({ length: 21 }, (_, i) => i + 1).map(day => {
                const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
                const dayOfWeekStr = new Date(dateStr).toLocaleString('pt-PT', { weekday: 'short' });
                const isSelected = selectedDay === day;
                const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border w-12 shrink-0 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-md shadow-emerald-600/10' 
                        : isWeekend 
                          ? 'bg-slate-100 text-slate-400 border-slate-100 opacity-50' 
                          : 'bg-white hover:border-slate-300 border-slate-200'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">{dayOfWeekStr}</span>
                    <span className="text-sm font-black mt-0.5">{day}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold italic text-center sm:text-left">
              * Sábados e Domingos estão ocultos ou desativados por padrão na escala normal da empresa.
            </p>
          </div>

          {/* Core Daily Presence Sheet */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="daily-attendance-panel">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Controlo Geral: {dateString}</h3>
                <p className="text-[10px] text-slate-400 font-semibold font-mono">
                  Presenças lançadas: {dailyRecords.length} de {activeEmployees.length} colaboradores
                </p>
              </div>
              {currentUserRole === UserRole.FUNCIONARIO && (
                <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                  Apenas Leitura
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-50">
              {activeEmployees.map(emp => {
                const rec = getRecordForEmployee(emp.id);
                const currentStatus = rec?.presente || 'Atraso'; // default display fallback or none
                const hasOvertime = rec?.horasExtras || 0;
                const comentario = rec?.comentario || '';

                return (
                  <div key={emp.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/20 transition-colors">
                    
                    {/* User profile */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <img
                        src={emp.foto}
                        alt={emp.nome}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{emp.nome}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{emp.cargo}</p>
                      </div>
                    </div>

                    {/* Status selectors */}
                    <div className="flex flex-wrap gap-2 items-center" onClick={e => e.stopPropagation()}>
                      {[
                        { key: 'Presente', label: 'Presente', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { key: 'Falta Justificada', label: 'Justificada', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { key: 'Falta Injustificada', label: 'Injustificada', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' },
                        { key: 'Atraso', label: 'Atraso', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' }
                      ].map(pill => (
                        <button
                          key={pill.key}
                          type="button"
                          onClick={() => handleStatusChange(emp.id, pill.key as any)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            rec?.presente === pill.key
                              ? pill.colorClass + ' ring-2 ring-offset-1 ring-slate-100 font-extrabold shadow-sm'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
                          }`}
                          disabled={currentUserRole === UserRole.FUNCIONARIO}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>

                    {/* Hours details and small comment */}
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      {/* Overtime multiplier input */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-semibold">Horas Extras:</span>
                        <input
                          type="number"
                          min={0}
                          max={8}
                          className="w-12 bg-slate-50 border border-slate-200 text-slate-800 font-bold font-mono py-1 px-1.5 text-[11px] text-center rounded-lg focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                          value={hasOvertime}
                          onChange={e => handleOvertimeChange(emp.id, Number(e.target.value))}
                          disabled={currentUserRole === UserRole.FUNCIONARIO || currentStatus.startsWith('Falta')}
                        />
                        <span className="text-[10px] text-slate-400 font-bold">hrs</span>
                      </div>

                      <input
                        type="text"
                        className="flex-1 min-w-[120px] bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-[10px] font-medium text-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                        placeholder="Adicionar justificação..."
                        value={comentario}
                        onChange={e => handleComentarioChange(emp.id, e.target.value)}
                        disabled={currentUserRole === UserRole.FUNCIONARIO}
                      />
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side summary card (Employee Summary stats tracker) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Resumo Acumulado</h3>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>

            {/* Dropdown to pick employee */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Selecionar Trabalhador</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
                value={selectedEmployeeSummaryId}
                onChange={e => setSelectedEmployeeSummaryId(e.target.value)}
              >
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            {/* Accumulator stats boxes */}
            <div className="space-y-3">
              {/* Presenças e Atrasos layout */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-600 font-semibold flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Dias Presentes</span>
                </span>
                <span className="text-md font-bold text-slate-900 font-mono">{totalPresents} dias</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-600 font-semibold flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Atrasos Registados</span>
                </span>
                <span className="text-md font-bold text-slate-900 font-mono">{totalDelays}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-600 font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span>Faltas Justificadas</span>
                </span>
                <span className="text-md font-bold text-slate-900 font-mono">{totalJustifiedAbs}</span>
              </div>

              <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/60 flex justify-between items-center">
                <span className="text-xs text-rose-800 font-semibold flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Faltas Injustificadas</span>
                </span>
                <span className="text-md font-bold text-rose-700 font-mono">{totalUnjustifiedAbs}</span>
              </div>

              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/60 flex justify-between items-center">
                <span className="text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Horas Extraordinárias</span>
                </span>
                <span className="text-md font-bold text-emerald-700 font-mono">{totalOvertimeHours} hrs</span>
              </div>

              <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/60 flex justify-between items-center">
                <span className="text-xs text-indigo-800 font-semibold flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Total de Horas Trabalhadas</span>
                </span>
                <span className="text-md font-bold text-indigo-700 font-mono">{totalWorkedHours} hrs</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              * Nota: As faltas injustificadas geram desconto material automático na folha salarial de 3% por cada dia útil ausente (calculado sobre o vencimento de base).
            </p>
          </div>

          {/* Visual Monthly Calendar Grid Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">
              Calendário Visual Mensal ({selectedMonth.toString().padStart(2, '0')}/{selectedYear})
            </h3>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Weekday Headers */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
                <div key={dayName} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
                  {dayName}
                </div>
              ))}
              
              {/* Empty offset days */}
              {(() => {
                const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
                return Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-full aspect-square bg-transparent"></div>
                ));
              })()}

              {/* Actual days */}
              {(() => {
                const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                return Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const rec = empRecords.find(r => r.data === dateStr);
                  
                  let colorClass = 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'; // Default
                  let tooltip = `${day} ${dateStr}: Sem registo`;
                  
                  if (rec) {
                    switch (rec.presente) {
                      case 'Presente':
                        colorClass = 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-600/20';
                        tooltip = `${day}: Presente`;
                        break;
                      case 'Atraso':
                        colorClass = 'bg-amber-400 text-white shadow-sm ring-1 ring-amber-500/20';
                        tooltip = `${day}: Atraso`;
                        break;
                      case 'Falta Justificada':
                        colorClass = 'bg-blue-500 text-white shadow-sm ring-1 ring-blue-600/20';
                        tooltip = `${day}: Falta Justificada (Férias/Licença)`;
                        break;
                      case 'Falta Injustificada':
                        colorClass = 'bg-rose-500 text-white shadow-sm ring-1 ring-rose-600/20';
                        tooltip = `${day}: Falta Injustificada`;
                        break;
                    }
                  } else {
                     // Check if it is a weekend
                     const dObj = new Date(selectedYear, selectedMonth - 1, day);
                     if (dObj.getDay() === 0 || dObj.getDay() === 6) {
                        colorClass = 'bg-slate-100/50 text-slate-300';
                        tooltip = `${day}: Fim de Semana`;
                     }
                  }

                  return (
                    <div 
                      key={day} 
                      title={tooltip}
                      className={`w-full aspect-square rounded-lg ${colorClass} flex flex-col items-center justify-center cursor-help transition-all duration-200 hover:scale-105`}
                    >
                      <span className="text-xs font-black">{day}</span>
                    </div>
                  );
                });
              })()}
            </div>
            
            {/* Calendar Legend */}
            <div className="flex flex-wrap gap-3 justify-center text-[9px] font-semibold text-slate-600 mt-4 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-xs"></span><span>Presente</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400 shadow-xs"></span><span>Atraso</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500 shadow-xs"></span><span>Férias/Licença/Justificada</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 shadow-xs"></span><span>Injustificada/Ausente</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
