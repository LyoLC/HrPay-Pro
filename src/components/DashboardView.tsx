import React, { useState } from 'react';
import { Employee, Contract_Doc, AttendanceRecord, PayrollProcessed, UserRole, ActivityTask, CompanySettings } from '../types';
import { Users, CreditCard, Calendar, Award, AlertTriangle, Building2, TrendingUp, TrendingDown, ArrowUpRight, Cake, CheckCircle2, Plus, X, ClipboardList, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';

interface DashboardViewProps {
  employees: Employee[];
  contracts: Contract_Doc[];
  attendance: AttendanceRecord[];
  tasks: ActivityTask[];
  payrollHistory: PayrollProcessed[];
  settings: CompanySettings;
  onNavigate: (section: any) => void;
  currentUserRole: UserRole;
  onAddTask?: (task: ActivityTask) => void;
  onAddAttendanceRecord?: (record: AttendanceRecord) => void;
}

export default function DashboardView({
  employees,
  contracts,
  attendance,
  tasks,
  payrollHistory,
  settings,
  onNavigate,
  currentUserRole,
  onAddTask,
  onAddAttendanceRecord
}: DashboardViewProps) {
  // Calculators
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.estado === 'Ativo').length;
  
  // Calculate total monthly payroll costs (Massa salarial from latest processed invoices)
  const currentYear = 2026;
  const latestProcessedMonth = 5; // May
  const currentMonthProcessed = payrollHistory.filter(p => p.mes === latestProcessedMonth && p.ano === currentYear);
  
  const massaSalarial = currentMonthProcessed.reduce((sum, p) => sum + p.totalBruto, 0);
  const totalLiquidoPago = currentMonthProcessed.reduce((sum, p) => sum + p.salarioLiquido, 0);
  const totalInssRecolhido = currentMonthProcessed.reduce((sum, p) => sum + p.impostos.inssTrabalhador + p.impostos.inssPatronal, 0);
  const totalIrpsRecolhido = currentMonthProcessed.reduce((sum, p) => sum + p.impostos.irps, 0);

  // Contracts close to expiration (within 30 days from today June 21, 2026)
  const today = new Date('2026-06-21');
  const expiringContracts = contracts.filter(c => {
    if (!c.dataFim || c.estado !== 'Ativo') return false;
    const expirationDate = new Date(c.dataFim);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 45; // alert if expiring within 45 days
  });

  // Monthly average attendance rate
  const totalAttendanceEntries = attendance.length;
  const presentsAndDelays = attendance.filter(a => a.presente === 'Presente' || a.presente === 'Atraso').length;
  const attendanceRate = totalAttendanceEntries > 0 
    ? Math.round((presentsAndDelays / totalAttendanceEntries) * 100) 
    : 92; // fallback

  // Quick Create State
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [quickCreateModal, setQuickCreateModal] = useState<'task' | 'attendance' | null>(null);

  // Form states for Quick Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');

  // Form states for Quick Attendance
  const [attEmp, setAttEmp] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState<'Presente' | 'Falta Justificada' | 'Falta Injustificada' | 'Atraso'>('Presente');

  const handleQuickCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddTask) return;
    onAddTask({
      id: `tsk_${Date.now()}`,
      titulo: taskTitle,
      descricao: taskDesc,
      funcionarioId: taskAssignee,
      estado: 'Pendente',
      prazo: taskDeadline,
      priority: 'Medium',
      categoria: 'Geral',
      comentarios: []
    });
    setQuickCreateModal(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskAssignee('');
    setTaskDeadline('');
    alert('Tarefa rápida criada com sucesso!');
  };

  const handleQuickCreateAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddAttendanceRecord) return;
    onAddAttendanceRecord({
      id: `att_${Date.now()}`,
      funcionarioId: attEmp,
      data: attDate,
      presente: attStatus,
      horasExtras: 0
    });
    setQuickCreateModal(null);
    setAttEmp('');
    alert('Assiduidade rápida registada com sucesso!');
  };

  // Department payroll breakdown
  const deptBreakdown = employees.reduce((acc: { [key: string]: { count: number, totalBase: number } }, emp) => {
    if (!acc[emp.departamento]) {
      acc[emp.departamento] = { count: 0, totalBase: 0 };
    }
    acc[emp.departamento].count += 1;
    acc[emp.departamento].totalBase += emp.salarioBase;
    return acc;
  }, {});

  const departmentData = Object.entries(deptBreakdown).map(([name, stats]) => ({
    name,
    count: stats.count,
    totalBase: stats.totalBase,
    percentage: Math.round((stats.totalBase / (massaSalarial || 195000)) * 100)
  }));

  // Format currency
  const formatMT = (val: number) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val).replace('MZN', 'MT');
  };

  // Task Status Distribution
  const taskStatusCounts = {
    Pendente: 0,
    'Em Progresso': 0,
    'Concluída': 0
  };
  tasks?.forEach(task => {
    if (taskStatusCounts[task.estado] !== undefined) {
      taskStatusCounts[task.estado]++;
    }
  });

  const taskChartData = [
    { name: 'Pendentes', count: taskStatusCounts['Pendente'], color: '#f43f5e' }, // rose-500
    { name: 'Em Progresso', count: taskStatusCounts['Em Progresso'], color: '#eab308' }, // yellow-500
    { name: 'Concluídas', count: taskStatusCounts['Concluída'], color: '#10b981' } // emerald-500
  ];

  // Upcoming Birthdays
  const currentMonth = today.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  
  const upcomingBirthdays = employees.filter(emp => {
    if (!emp.dataNascimento) return false;
    const birthDate = new Date(emp.dataNascimento);
    const birthMonth = birthDate.getMonth() + 1;
    return birthMonth === currentMonth || birthMonth === nextMonth;
  }).sort((a, b) => {
    const aMonth = new Date(a.dataNascimento).getMonth();
    const bMonth = new Date(b.dataNascimento).getMonth();
    if (aMonth !== bMonth) return aMonth - bMonth;
    const aDate = new Date(a.dataNascimento).getDate();
    const bDate = new Date(b.dataNascimento).getDate();
    return aDate - bDate;
  });

  // Tax Deadlines
  const prazoInss = settings.prazoInss || 10;
  const prazoIrps = settings.prazoIrps || 20;

  // Let's assume the obligations refer to the latest processed month (May 2026 for now, or just next month of today)
  const todayDate = new Date(today);
  
  // Find next INSS deadline
  let inssDeadline = new Date(todayDate.getFullYear(), todayDate.getMonth(), prazoInss);
  if (todayDate > inssDeadline) {
    inssDeadline = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, prazoInss);
  }
  const daysToInss = Math.ceil((inssDeadline.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  // Find next IRPS deadline
  let irpsDeadline = new Date(todayDate.getFullYear(), todayDate.getMonth(), prazoIrps);
  if (todayDate > irpsDeadline) {
    irpsDeadline = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, prazoIrps);
  }
  const daysToIrps = Math.ceil((irpsDeadline.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  // Pending Payroll Approvals (status is 'Pendente Revisão' or missing/falsy pago without 'Aprovado'/'Pago')
  const pendingPayrollApprovals = payrollHistory.filter(p => p.status === 'Pendente Revisão' || (!p.status && !p.pago)).length;

  // Monthly Payroll Trend Data
  const monthlyPayrollTrend = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i + 1;
    const monthLabel = new Date(currentYear, i, 1).toLocaleString('pt-MZ', { month: 'short' }).replace('.', '');
    const monthPayroll = payrollHistory.filter(p => p.ano === currentYear && p.mes === monthIndex);
    const totalMes = monthPayroll.reduce((sum, p) => sum + p.totalBruto, 0);
    return {
      name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      total: totalMes,
    };
  });

  return (
    <div className="space-y-6" id="dashboard-analitico">
      {/* Welcome Banner */}
      <div className="bg-emerald-950 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-emerald-900">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-800/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-60 h-60 rounded-full bg-teal-800/20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border border-emerald-500/30">
              Painel Principal de Gestão — Perfil {currentUserRole}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">HRPay Pro: Visão Geral Executiva</h2>
            <p className="text-emerald-200 text-xs md:text-sm max-w-xl leading-relaxed">
              Bem-vindo ao sistema. Hoje é domingo, 21 de Junho de 2026. Estão consolidadas as informações salariais referentes ao mês de **Maio/2026**, com o cálculo progressivo de impostos legais de Moçambique.
            </p>
          </div>
          <div className="flex md:justify-end">
            <button
              onClick={() => onNavigate('Processamento Salarial')}
              className="bg-white hover:bg-slate-50 text-emerald-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Processar Folha Salarial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards (Headcount, Pending Payroll, Expiries) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Headcount</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-slate-800">{totalEmployees}</p>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Ativos</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Payroll Approvals</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-slate-800">{pendingPayrollApprovals}</p>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Aguardando</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Upcoming Expiries</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-slate-800">{expiringContracts.length}</p>
              <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Este mês</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5" id="stats-kpi-grid">
        {/* KPI 1: Colaboradores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center space-x-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>100% Ativos</span>
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Funcionários Ativos</h4>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{activeEmployees}</span>
              <span className="text-xs text-slate-400 font-medium">de {totalEmployees} cadastrados</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Massa Salarial */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
              Último Mês
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Massa Bruta (Maio)</h4>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-black text-slate-800 leading-tight">
                {formatMT(massaSalarial || 195000)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Vencimento de Contratos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className={`p-2.5 rounded-xl ${expiringContracts.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </span>
            {expiringContracts.length > 0 && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md animate-pulse">
                Atenção
              </span>
            )}
          </div>
          <div className="mt-4">
            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Alerta de Vencimento</h4>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{expiringContracts.length}</span>
              <span className="text-xs text-slate-400 font-medium">contratos</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Assiduidade Mensal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              Junho/26
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Assiduidade Média</h4>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{attendanceRate}%</span>
              <span className="text-xs text-slate-400 font-medium">da equipa</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Custos de RH (Deduções arrecadadas) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Award className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              Impostos
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">IRPS+INSS Arrecadado</h4>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-md font-bold text-slate-800">
                {formatMT(totalInssRecolhido + totalIrpsRecolhido || 29845)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Custos de RH & Massa Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div>
              <h3 className="font-bold text-slate-800 text-md">Demonstrativo Financeiro (Maio/2026)</h3>
              <p className="text-xs text-slate-400 font-medium">Comparação gráfica entre os principais componentes salariais processados</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Moeda: MT
            </span>
          </div>

          {/* Simple Visual representation bar list */}
          <div className="space-y-4">
            {/* Component 1: Salário Líquido na Mão do Trabalhador */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Salário Líquido (Remuneração Direta)</span>
                </span>
                <span className="text-slate-950">{formatMT(totalLiquidoPago || 145000)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '74%' }} />
              </div>
            </div>

            {/* Component 2: Retenção na Fonte IRPS */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Imposto de Rendimento (Retenção IRPS)</span>
                </span>
                <span className="text-slate-950">{formatMT(totalIrpsRecolhido || 14850)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '8%' }} />
              </div>
            </div>

            {/* Component 3: Contribuição Segurança Social INSS (Trabalhador 3% + Patronal 4%) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Previdência Social (INSS Coletado 7%)</span>
                </span>
                <span className="text-slate-950">{formatMT(totalInssRecolhido || 12150)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '6.5%' }} />
              </div>
            </div>
          </div>

          {/* Quick Informational Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-start space-x-2.5">
            <Building2 className="w-4.5 h-4.5 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-slate-700">Regulamentação e Transparência fiscal:</p>
              <p className="mt-0.5">O INSS de 3% deduzido na folha do funcionário é somado à parcela patronal obrigatória de 4% paga integralmente pela empresa, perfazendo o recolhimento consolidado de 7% às caixas da segurança nacional. O IRPS é deduzido progressivamente conforme a tabela nacional legalizada moçambicana.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Custos por Departamentos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-50 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Distribuição por Departamentos</h3>
              <span className="text-[10px] text-slate-400 font-mono">Bases</span>
            </div>

            <div className="space-y-4">
              {departmentData.map((dept, idx) => {
                const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600'];
                const accent = colors[idx % colors.length];

                return (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 truncate max-w-[150px]">{dept.name}</span>
                      <span className="text-slate-900 font-bold">{formatMT(dept.totalBase)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${accent}`} style={{ width: `${dept.percentage}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono w-6 text-right">
                        {dept.percentage}%
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {dept.count} {dept.count === 1 ? 'colaborador ativo' : 'colaboradores ativos'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigate('Funcionários')}
            className="w-full mt-6 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2 rounded-xl text-xs border border-slate-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Ver Listas de Utilizadores</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Payroll Trends Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 text-indigo-700">
            <TrendingUp className="w-4 h-4" />
            <span>Tendência Anual de Despesas Salariais ({currentYear})</span>
          </h3>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
            Bruto Processado
          </span>
        </div>
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyPayrollTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}
                formatter={(value: number) => [formatMT(value), 'Despesa Salarial']}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#047857', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical/Attention Section (Alerts of contracts ending and task monitoring) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box A: Contratos Próximos de Vencer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Aviso de Vencimento de Contratos (45 dias)</span>
            </h3>
            <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full">
              {expiringContracts.length} Alertas
            </span>
          </div>

          {expiringContracts.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              Não há contratos expirando nos próximos 45 dias. Excelente controle!
            </div>
          ) : (
            <div className="space-y-3">
              {expiringContracts.map(c => {
                const emp = employees.find(e => e.id === c.funcionarioId);
                const expiryDate = c.dataFim ? new Date(c.dataFim) : null;
                const daysLeft = expiryDate 
                  ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <div key={c.id} className="flex justify-between items-center p-3 bg-rose-50/50 rounded-xl border border-rose-100/60">
                    <div className="flex items-center space-x-3">
                      <img
                        src={emp?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={emp?.nome}
                        className="w-10 h-10 rounded-full object-cover border border-rose-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{emp?.nome || 'Instabilidade'}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{emp?.cargo} — {c.tipo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-700 font-mono">{daysLeft} dias restantes</div>
                      <p className="text-[9px] text-slate-400 font-semibold">Expira a {c.dataFim}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button
            onClick={() => onNavigate('Contratos')}
            className="w-full text-center text-[11px] font-bold text-emerald-600 hover:underline pt-2 block"
          >
            Aceder ao Módulo de Contratos e Renovar Documentação
          </button>
        </div>

        {/* Box B: Indicadores de Assiduidade */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-sm">Resumo Mensal de Assiduidade (Junho/2026)</h3>
            <span className="text-[10px] text-slate-400">Total acumulado</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100/60 text-center">
              <span className="block text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Total Presenças</span>
              <span className="block text-2xl font-black text-emerald-950 mt-1">
                {attendance.filter(a => a.presente === 'Presente').length}
              </span>
              <span className="text-[9px] text-emerald-800/65 font-medium block mt-1">Registadas neste mês</span>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100/60 text-center">
              <span className="block text-[10px] uppercase font-bold text-rose-600 tracking-wider">Faltas Injustificadas</span>
              <span className="block text-2xl font-black text-rose-950 mt-1">
                {attendance.filter(a => a.presente === 'Falta Injustificada').length}
              </span>
              <span className="text-[9px] text-rose-800/65 font-medium block mt-1">Com deduções em folha</span>
            </div>
          </div>

          <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
            <span>Atrasos sinalizados: <b>{attendance.filter(a => a.presente === 'Atraso').length}</b></span>
            <span>Justificáveis: <b>{attendance.filter(a => a.presente === 'Falta Justificada').length}</b></span>
          </div>

          <button
            onClick={() => onNavigate('Assiduidade')}
            className="w-full text-center text-[11px] font-bold text-emerald-600 hover:underline pt-2 block"
          >
            Lançar Presenças ou Horas Extras no Mapa Diário
          </button>
        </div>

        {/* Box C: Upcoming Birthdays */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 text-indigo-700">
              <Cake className="w-4 h-4" />
              <span>Aniversários (Mês Atual e Próximo)</span>
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
              {upcomingBirthdays.length}
            </span>
          </div>

          {upcomingBirthdays.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              Não há aniversariantes nestes meses.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.slice(0, 3).map(emp => {
                const bDate = new Date(emp.dataNascimento!);
                const formattedDate = `${bDate.getDate().toString().padStart(2, '0')}/${(bDate.getMonth() + 1).toString().padStart(2, '0')}`;
                return (
                  <div key={emp.id} className="flex justify-between items-center p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                    <div className="flex items-center space-x-3">
                      <img
                        src={emp.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={emp.nome}
                        className="w-10 h-10 rounded-full object-cover border border-indigo-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{emp.nome}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{emp.departamento}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-700 font-mono">{formattedDate}</div>
                    </div>
                  </div>
                );
              })}
              {upcomingBirthdays.length > 3 && (
                <div className="text-center text-[10px] text-slate-500 font-medium">
                  + {upcomingBirthdays.length - 3} aniversariante(s)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Box D: Task Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Distribuição de Tarefas</span>
            </h3>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full">
              {tasks?.length || 0} Total
            </span>
          </div>

          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {taskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Box E: Prazos Fiscais */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 md:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 text-blue-700">
              <Calendar className="w-4 h-4" />
              <span>Obrigações Fiscais</span>
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              Prazos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className={`p-4 rounded-xl border ${daysToInss <= 5 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} flex items-center justify-between`}>
              <div>
                <span className={`block text-[10px] uppercase font-bold tracking-wider ${daysToInss <= 5 ? 'text-rose-600' : 'text-slate-500'}`}>INSS</span>
                <span className={`block text-xl font-black mt-1 ${daysToInss <= 5 ? 'text-rose-950' : 'text-slate-800'}`}>Dia {prazoInss}</span>
                <span className={`text-[9px] font-medium block mt-1 ${daysToInss <= 5 ? 'text-rose-800' : 'text-slate-500'}`}>
                  {daysToInss === 0 ? 'Expira hoje!' : `Faltam ${daysToInss} dias`}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${daysToInss <= 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${daysToIrps <= 5 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} flex items-center justify-between`}>
              <div>
                <span className={`block text-[10px] uppercase font-bold tracking-wider ${daysToIrps <= 5 ? 'text-rose-600' : 'text-slate-500'}`}>IRPS</span>
                <span className={`block text-xl font-black mt-1 ${daysToIrps <= 5 ? 'text-rose-950' : 'text-slate-800'}`}>Dia {prazoIrps}</span>
                <span className={`text-[9px] font-medium block mt-1 ${daysToIrps <= 5 ? 'text-rose-800' : 'text-slate-500'}`}>
                  {daysToIrps === 0 ? 'Expira hoje!' : `Faltam ${daysToIrps} dias`}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${daysToIrps <= 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Create FAB */}
      {currentUserRole !== UserRole.FUNCIONARIO && (
        <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
          {showQuickMenu && (
            <div className="mb-4 flex flex-col gap-2 items-end transition-all origin-bottom transform">
              <button
                onClick={() => { setQuickCreateModal('task'); setShowQuickMenu(false); }}
                className="flex items-center gap-3 px-4 py-3 bg-white text-slate-700 shadow-xl rounded-full border border-slate-100 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
              >
                <span className="text-sm font-bold">Nova Tarefa</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full"><ClipboardList className="w-4 h-4" /></div>
              </button>
              <button
                onClick={() => { setQuickCreateModal('attendance'); setShowQuickMenu(false); }}
                className="flex items-center gap-3 px-4 py-3 bg-white text-slate-700 shadow-xl rounded-full border border-slate-100 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
              >
                <span className="text-sm font-bold">Nova Presença</span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-full"><Clock className="w-4 h-4" /></div>
              </button>
            </div>
          )}
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 z-50"
          >
            {showQuickMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
      )}

      {/* Quick Task Modal */}
      {quickCreateModal === 'task' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                Criar Nova Tarefa
              </h2>
              <button onClick={() => setQuickCreateModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuickCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título</label>
                <input required type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Ex: Preparar relatório mensal" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea required value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[80px]" placeholder="Detalhes da tarefa..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Atribuir a</label>
                  <select required value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {employees.filter(e => e.estado === 'Ativo').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Limite</label>
                  <input required type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setQuickCreateModal(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer">
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Attendance Modal */}
      {quickCreateModal === 'attendance' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                Registar Presença
              </h2>
              <button onClick={() => setQuickCreateModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuickCreateAttendance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Funcionário</label>
                <select required value={attEmp} onChange={e => setAttEmp(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  <option value="">Selecione o Funcionário...</option>
                  {employees.filter(e => e.estado === 'Ativo').map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome} - {emp.cargo}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
                  <input required type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                  <select required value={attStatus} onChange={e => setAttStatus(e.target.value as any)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    <option value="Presente">Presente</option>
                    <option value="Atraso">Atraso</option>
                    <option value="Falta Justificada">Falta Justificada</option>
                    <option value="Falta Injustificada">Falta Injustificada</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setQuickCreateModal(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer">
                  Registar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
