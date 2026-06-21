import { useState, useEffect } from 'react';
import { 
  User, Employee, Contract_Doc, AttendanceRecord, ActivityTask, 
  PayrollProcessed, CompanySettings, MenuSection, UserRole 
} from './types';
import { 
  MOCK_USERS, MOCK_EMPLOYEES, MOCK_CONTRACTS, MOCK_TASKS, 
  generateMockAttendance, generateMockPaymentsMay 
} from './utils/mockData';
import { DEFAULT_IRPS_BRACKETS } from './utils/calculations';

// Components
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import EmployeesView from './components/EmployeesView';
import ContractsView from './components/ContractsView';
import AttendanceView from './components/AttendanceView';
import ActivitiesView from './components/ActivitiesView';
import PayrollView from './components/PayrollView';
import ReportsView from './components/ReportsView';
import ConfigView from './components/ConfigView';
import ProfileView from './components/ProfileView';
import PrintView from './components/PrintView';

// Icons
import { 
  LayoutDashboard, Users, FileLock2, CalendarDays, CheckSquare, 
  Banknote, FileBarChart2, Settings, UserCircle, LogOut, Menu, X, Landmark 
} from 'lucide-react';

const LOCAL_STORAGE_PREFIX = 'hrpay_pro_v1_';

export default function App() {
  // Session Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<MenuSection>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Database Collections State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract_Doc[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<ActivityTask[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollProcessed[]>([]);
  
  // Enterprise rules environment settings
  const [settings, setSettings] = useState<CompanySettings>({
    nomeEmpresa: 'Moçambique Ventures, S.A.',
    nuitEmpresa: '100439281',
    bancoPrincipal: 'Millennium BIM',
    numeroContaPrincipal: '30492810-22',
    nibEmpresa: '0003 0113 0030 4928 1022 93',
    enderecoEmpresa: 'Av. Mao Tse Tung, Nº 1450, Maputo, Moçambique',
    contactoEmpresa: '+258 21 445 566',
    emailEmpresa: 'contacto@mventures.co.mz',
    taxaInssTrabalhador: 0.03, // 3% Worker
    taxaInssPatronal: 0.04, // 4% Employer
    irpsBrackets: DEFAULT_IRPS_BRACKETS
  });

  // Printer manager state
  const [printingPayroll, setPrintingPayroll] = useState<PayrollProcessed | null>(null);
  const [printMode, setPrintMode] = useState<'single' | 'general'>('single');

  // Trigger state load from LocalStorage or seed data
  useEffect(() => {
    try {
      // 1. User session recall if saved
      const savedUser = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}session_user`);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      // 2. Employees recall
      const savedEmployees = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}employees`);
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      } else {
        setEmployees(MOCK_EMPLOYEES);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}employees`, JSON.stringify(MOCK_EMPLOYEES));
      }

      // 3. Contracts recall
      const savedContracts = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}contracts`);
      if (savedContracts) {
        setContracts(JSON.parse(savedContracts));
      } else {
        setContracts(MOCK_CONTRACTS);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}contracts`, JSON.stringify(MOCK_CONTRACTS));
      }

      // 4. Attendance recall
      const savedAttendance = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}attendance`);
      if (savedAttendance) {
        setAttendance(JSON.parse(savedAttendance));
      } else {
        const generated = generateMockAttendance();
        setAttendance(generated);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}attendance`, JSON.stringify(generated));
      }

      // 5. Tasks recall
      const savedTasks = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}tasks`);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        setTasks(MOCK_TASKS);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}tasks`, JSON.stringify(MOCK_TASKS));
      }

      // 6. Payroll Processed history recall
      const savedPayroll = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}payroll_history`);
      if (savedPayroll) {
        setPayrollHistory(JSON.parse(savedPayroll));
      } else {
        const generatedHistory = generateMockPaymentsMay();
        setPayrollHistory(generatedHistory);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}payroll_history`, JSON.stringify(generatedHistory));
      }

      // 7. Company settings recall
      const savedSettings = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}company_settings`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.error('Falha ao aceder ao LocalStorage do Navegador:', err);
    }
  }, []);

  // Standard write triggers to disk
  const saveEmployeesToStorage = (list: Employee[]) => {
    setEmployees(list);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}employees`, JSON.stringify(list));
  };

  const saveContractsToStorage = (list: Contract_Doc[]) => {
    setContracts(list);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}contracts`, JSON.stringify(list));
  };

  const saveAttendanceToStorage = (list: AttendanceRecord[]) => {
    setAttendance(list);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}attendance`, JSON.stringify(list));
  };

  const saveTasksToStorage = (list: ActivityTask[]) => {
    setTasks(list);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}tasks`, JSON.stringify(list));
  };

  const savePayrollToStorage = (list: PayrollProcessed[]) => {
    setPayrollHistory(list);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}payroll_history`, JSON.stringify(list));
  };

  const saveCompanySettingsToStorage = (data: CompanySettings) => {
    setSettings(data);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}company_settings`, JSON.stringify(data));
  };

  // Login handler
  const handleLoginSuccess = (usr: User) => {
    setCurrentUser(usr);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}session_user`, JSON.stringify(usr));
    
    // Redirect employee roles directly onto personal workspace
    if (usr.perfil === UserRole.FUNCIONARIO) {
      setActiveSection('Meu Perfil');
    } else {
      setActiveSection('Dashboard');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}session_user`);
  };

  // Roster CRUDs
  const handleCreateEmployee = (newEmp: Employee) => {
    const list = [...employees, newEmp];
    saveEmployeesToStorage(list);

    // Automatically sync/generate their new base contract template too!
    const newContract: Contract_Doc = {
      id: `ct_${Date.now()}`,
      funcionarioId: newEmp.id,
      tipo: newEmp.tipoContrato,
      dataInicio: newEmp.dataAdmissao,
      salarioBase: newEmp.salarioBase,
      estado: 'Ativo',
      renovacaoAutomatica: true,
      alertasVencimento: true,
      arquivoPdf: `Contrato_${newEmp.nome.replace(/\s+/g, '_')}.pdf`
    };
    saveContractsToStorage([...contracts, newContract]);
  };

  const handleUpdateEmployee = (id: string, updated: Partial<Employee>) => {
    const list = employees.map(emp => {
      if (emp.id === id) {
        const masterMerged = { ...emp, ...updated };
        // Sync contract base wages if salary base changes
        if (updated.salarioBase !== undefined) {
          const syncedContracts = contracts.map(c => {
            if (c.funcionarioId === id && c.estado === 'Ativo') {
              return { ...c, salarioBase: Number(updated.salarioBase) };
            }
            return c;
          });
          saveContractsToStorage(syncedContracts);
        }
        return masterMerged;
      }
      return emp;
    });
    saveEmployeesToStorage(list);
  };

  const handleDeleteEmployee = (id: string) => {
    // Delete worker
    const list = employees.filter(emp => emp.id !== id);
    saveEmployeesToStorage(list);

    // Clear their contracts
    const contractFiltered = contracts.filter(c => c.funcionarioId !== id);
    saveContractsToStorage(contractFiltered);

    // Clear task logs
    const taskFiltered = tasks.filter(t => t.funcionarioId !== id);
    saveTasksToStorage(taskFiltered);

    // Clear attendance cards
    const attFiltered = attendance.filter(a => a.funcionarioId !== id);
    saveAttendanceToStorage(attFiltered);
  };

  // Contracts CRUD
  const handleCreateContract = (newContract: Contract_Doc) => {
    saveContractsToStorage([...contracts, newContract]);

    // Update their base salary in employee record as well to guarantee sync
    handleUpdateEmployee(newContract.funcionarioId, { salarioBase: newContract.salarioBase });
  };

  const handleUpdateContract = (id: string, updated: Partial<Contract_Doc>) => {
    const list = contracts.map(c => {
      if (c.id === id) {
        const merged = { ...c, ...updated };
        if (updated.salarioBase !== undefined) {
          handleUpdateEmployee(c.funcionarioId, { salarioBase: updated.salarioBase });
        }
        return merged;
      }
      return c;
    });
    saveContractsToStorage(list);
  };

  // Attendance CRUD
  const handleAddAttendanceRecord = (rec: AttendanceRecord) => {
    saveAttendanceToStorage([...attendance, rec]);
  };

  const handleUpdateAttendanceRecord = (id: string, updated: Partial<AttendanceRecord>) => {
    const list = attendance.map(a => (a.id === id ? { ...a, ...updated } : a));
    saveAttendanceToStorage(list);
  };

  // Tasks CRUD
  const handleAddTask = (newTsk: ActivityTask) => {
    saveTasksToStorage([...tasks, newTsk]);
  };

  const handleUpdateTask = (id: string, updated: Partial<ActivityTask>) => {
    const list = tasks.map(t => (t.id === id ? { ...t, ...updated } : t));
    saveTasksToStorage(list);
  };

  // Pay slip process calculation save on DB history
  const handleSaveProcessedPayroll = (record: PayrollProcessed) => {
    // Check if payroll already processed for this specific period
    const existingIdx = payrollHistory.findIndex(p => p.id === record.id);
    if (existingIdx !== -1) {
      const copy = [...payrollHistory];
      copy[existingIdx] = record;
      savePayrollToStorage(copy);
    } else {
      savePayrollToStorage([...payrollHistory, record]);
    }
  };

  const handleMarkAsPaid = (payrollId: string, reference: string) => {
    const list = payrollHistory.map(p => {
      if (p.id === payrollId) {
        return {
          ...p,
          pago: true,
          dataPagamento: new Date().toISOString().split('T')[0],
          referenciaBancaria: reference
        };
      }
      return p;
    });
    savePayrollToStorage(list);
  };

  // Router dispatcher
  const renderRouterSection = () => {
    if (!currentUser) return null;

    switch (activeSection) {
      case 'Dashboard':
        return (
          <DashboardView
            employees={employees}
            contracts={contracts}
            attendance={attendance}
            payrollHistory={payrollHistory}
            onNavigate={setActiveSection}
            currentUserRole={currentUser.perfil}
          />
        );
      case 'Funcionários':
        return (
          <EmployeesView
            employees={employees}
            onCreateEmployee={handleCreateEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            currentUserRole={currentUser.perfil}
          />
        );
      case 'Contratos':
        return (
          <ContractsView
            contracts={contracts}
            employees={employees}
            onCreateContract={handleCreateContract}
            onUpdateContract={handleUpdateContract}
            currentUserRole={currentUser.perfil}
          />
        );
      case 'Assiduidade':
        return (
          <AttendanceView
            attendance={attendance}
            employees={employees}
            onAddAttendanceRecord={handleAddAttendanceRecord}
            onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
            currentUserRole={currentUser.perfil}
          />
        );
      case 'Atividades':
        return (
          <ActivitiesView
            tasks={tasks}
            employees={employees}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            currentUser={currentUser}
          />
        );
      case 'Processamento Salarial':
        return (
          <PayrollView
            employees={employees}
            payrollHistory={payrollHistory}
            attendance={attendance}
            onSaveProcessedPayroll={handleSaveProcessedPayroll}
            onMarkAsPaid={handleMarkAsPaid}
            currentUserRole={currentUser.perfil}
            settings={settings}
            onPrintSlip={(rec) => {
              setPrintMode('single');
              setPrintingPayroll(rec);
            }}
          />
        );
      case 'Relatórios':
        return (
          <ReportsView
            payrollHistory={payrollHistory}
            employees={employees}
            onTriggerGlobalPrint={() => {
              // Trigger multi ledger print
              setPrintMode('general');
              // Choose latest May payroll records to preview ledger output
              setPrintingPayroll(null);
              // Open modal
              const dummyItem = payrollHistory[0] || null;
              setPrintingPayroll(dummyItem); 
            }}
          />
        );
      case 'Configurações':
        return (
          <ConfigView
            settings={settings}
            onSaveSettings={saveCompanySettingsToStorage}
          />
        );
      case 'Meu Perfil':
        return (
          <ProfileView
            currentUser={currentUser}
            employees={employees}
            contracts={contracts}
            tasks={tasks}
            payrollHistory={payrollHistory}
            onUpdateEmployee={handleUpdateEmployee}
            onPrintSlip={(rec) => {
              setPrintMode('single');
              setPrintingPayroll(rec);
            }}
            onTaskStatusChange={(taskId, stat) => {
              handleUpdateTask(taskId, { estado: stat });
            }}
          />
        );
      default:
        return <div className="p-8 text-xs text-slate-400">Este módulo está indisponível de momento.</div>;
    }
  };

  // Secure user login check
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Sidebar dynamic menu elements depending on roles
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, blockForEmployee: true },
    { name: 'Funcionários', icon: Users, blockForEmployee: true },
    { name: 'Contratos', icon: FileLock2, blockForEmployee: true },
    { name: 'Assiduidade', icon: CalendarDays, blockForEmployee: false },
    { name: 'Atividades', icon: CheckSquare, blockForEmployee: false },
    { name: 'Processamento Salarial', icon: Banknote, blockForEmployee: true },
    { name: 'Relatórios', icon: FileBarChart2, blockForEmployee: true },
    { name: 'Configurações', icon: Settings, blockForEmployee: true },
    { name: 'Meu Perfil', icon: UserCircle, blockForEmployee: false }
  ];

  // Filters visible items for currently logged in Employee
  const isEmployeeRole = currentUser.perfil === UserRole.FUNCIONARIO;
  const visibleMenuItems = menuItems.filter(item => !isEmployeeRole || !item.blockForEmployee);

  return (
    <div className="min-h-screen bg-slate-50 flex" id="hrpay-dashboard-container">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP VIEW */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-extrabold text-white tracking-tight leading-none">HRPay Pro</h1>
              <span className="text-[10px] text-slate-400 font-medium">Mozambique Edição</span>
            </div>
          </div>

          {/* Nav List links */}
          <nav className="p-4 space-y-1">
            {visibleMenuItems.map(item => {
              const Icon = item.icon;
              const isSelected = activeSection === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.name as MenuSection);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                    isSelected 
                      ? 'bg-emerald-600 text-white shadow-sm font-black' 
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card info footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 font-bold text-white flex items-center justify-center text-xs border border-slate-700">
              {currentUser.nome[0]}
            </div>
            <div className="truncate max-w-[130px]">
              <span className="block text-xs font-extrabold text-white truncate leading-snug">{currentUser.nome}</span>
              <span className="block text-[9px] text-slate-400 font-bold leading-relaxed">{currentUser.perfil}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-rose-950 hover:text-rose-200 py-1.5 px-3 rounded-lg text-[10px] font-bold text-slate-400 transition-colors flex items-center justify-center space-x-1 border border-slate-750 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* 2. SIDEBAR NAVIGATION - MOBILE DRAWER VIEW */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex md:hidden" id="mobile-navigation-drawer">
          <div className="w-64 bg-slate-900 h-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="p-5 border-b border-slate-850 flex justify-between items-center bg-slate-950">
                <span className="font-extrabold text-sm text-white">HRPay Pro</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Links */}
              <nav className="p-4 space-y-1">
                {visibleMenuItems.map(item => {
                  const Icon = item.icon;
                  const isSelected = activeSection === item.name;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setActiveSection(item.name as MenuSection);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${isSelected ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User details */}
            <div className="p-4 border-t border-slate-850 bg-slate-950 space-y-3">
              <div className="text-xs text-slate-350">
                <p className="font-bold text-white mb-0.5">{currentUser.nome}</p>
                <p className="text-[10px] text-slate-400 font-bold">{currentUser.perfil}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-slate-800 hover:bg-rose-950 hover:text-rose-300 py-1.5 rounded-lg text-xs font-extrabold text-slate-400 flex items-center justify-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CORE CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-scrollable">
        
        {/* Mobile Upper TopBar */}
        <header className="bg-white border-b border-slate-100 p-4 flex items-center justify-between md:hidden shadow-xs shrink-0 sticky top-0 z-40">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-100"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
          
          <div className="text-center">
            <span className="font-extrabold text-slate-800 text-sm tracking-tight block">HRPay Pro</span>
            <span className="text-[9px] text-slate-400 block font-semibold">{activeSection}</span>
          </div>
          
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 font-black flex items-center justify-center text-xs">
            {currentUser.nome[0]}
          </div>
        </header>

        {/* Master Router views */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {renderRouterSection()}
        </main>
      </div>

      {/* 4. PRINT TEMPLATES MODAL SWITCH OVERLAY */}
      {printingPayroll && (
        <PrintView
          payroll={printMode === 'single' ? printingPayroll : null}
          allPayrolls={printMode === 'general' ? payrollHistory.filter(p => p.mes === 5 && p.ano === 2026) : []}
          employees={employees}
          settings={settings}
          onClose={() => setPrintingPayroll(null)}
          printMode={printMode}
        />
      )}
    </div>
  );
}
