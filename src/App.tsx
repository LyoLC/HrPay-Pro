import { useState, useEffect } from 'react';
import { 
  User, Employee, Contract_Doc, AttendanceRecord, ActivityTask, 
  PayrollProcessed, CompanySettings, MenuSection, UserRole, CustomReportConfig
} from './types';
import { 
  MOCK_USERS, MOCK_EMPLOYEES, MOCK_CONTRACTS, MOCK_TASKS, 
  generateMockAttendance, generateMockPaymentsMay 
} from './utils/mockData';
import { DEFAULT_IRPS_BRACKETS } from './utils/calculations';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

// Components
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import EmployeesView from './components/EmployeesView';
import ContractsView from './components/ContractsView';
import AttendanceView from './components/AttendanceView';
import ActivitiesView from './components/ActivitiesView';
import PayrollView from './components/PayrollView';
import ReportsView from './components/ReportsView';
import CustomReportsView from './components/CustomReportsView';
import ConfigView from './components/ConfigView';
import ProfileView from './components/ProfileView';
import PrintView from './components/PrintView';

// Icons
import { 
  LayoutDashboard, Users, FileLock2, CalendarDays, CheckSquare, 
  Banknote, FileBarChart2, Settings, UserCircle, LogOut, Menu, X, Landmark, Bell, FileText, Moon, Sun, Search
} from 'lucide-react';

import hrpayLogo from './assets/images/hrpay_pro_logo_1782570869903.jpg';

import { 
  fetchEmployees, saveEmployees, 
  fetchContracts, saveContracts, 
  fetchAttendance, saveAttendance, 
  fetchTasks, saveTasks, 
  fetchPayroll, savePayroll, 
  fetchSettings, saveSettings,
  fetchReports, saveReports,
  subscribeToTasksChanges, subscribeToContractsChanges, subscribeToPayrollChanges,
  uploadBackupToStorage
} from './lib/firestore';

import { sendMockEmail } from './utils/mockEmailService';

const LOCAL_STORAGE_PREFIX = 'hrpay_pro_v1_';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

export default function App() {
  // Session Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<MenuSection>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Core Database Collections State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract_Doc[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<ActivityTask[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollProcessed[]>([]);
  const [reports, setReports] = useState<CustomReportConfig[]>([]);
  
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
    prazoInss: 10,
    prazoIrps: 20,
    horarioAlertaContratos: '09:00',
    irpsBrackets: DEFAULT_IRPS_BRACKETS
  });

  // Printer manager state
  const [printingPayroll, setPrintingPayroll] = useState<PayrollProcessed | null>(null);
  const [printingPayrolls, setPrintingPayrolls] = useState<PayrollProcessed[]>([]);
  const [printMode, setPrintMode] = useState<'single' | 'general' | 'multiple_slips'>('single');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem(`${LOCAL_STORAGE_PREFIX}theme`) === 'dark';
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}theme`, 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}theme`, 'light');
    }

    if (currentUser) {
      setDoc(doc(db, 'userPreferences', currentUser.id), { isDarkMode }, { merge: true }).catch(err => {
        console.error("Failed to save user preference", err);
      });
    }
  }, [isDarkMode, currentUser]);

  // Trigger state load from LocalStorage or seed data
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. User session recall if saved (still using localStorage for session)
        const savedUser = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}session_user`);
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }

        // 2. Employees recall
        const savedEmployees = await fetchEmployees();
        if (savedEmployees.length > 0) {
          setEmployees(savedEmployees);
        } else {
          setEmployees(MOCK_EMPLOYEES);
          await saveEmployees(MOCK_EMPLOYEES);
        }

        // 3. Contracts recall
        const savedContracts = await fetchContracts();
        if (savedContracts.length > 0) {
          setContracts(savedContracts);
        } else {
          setContracts(MOCK_CONTRACTS);
          await saveContracts(MOCK_CONTRACTS);
        }

        // 4. Attendance recall
        const savedAttendance = await fetchAttendance();
        if (savedAttendance.length > 0) {
          setAttendance(savedAttendance);
        } else {
          const generated = generateMockAttendance();
          setAttendance(generated);
          await saveAttendance(generated);
        }

        // 5. Tasks recall
        const savedTasks = await fetchTasks();
        if (savedTasks.length > 0) {
          setTasks(savedTasks);
        } else {
          setTasks(MOCK_TASKS);
          await saveTasks(MOCK_TASKS);
        }

        // 6. Payroll Processed history recall
        const savedPayroll = await fetchPayroll();
        if (savedPayroll.length > 0) {
          setPayrollHistory(savedPayroll);
        } else {
          const generatedHistory = generateMockPaymentsMay();
          setPayrollHistory(generatedHistory);
          await savePayroll(generatedHistory);
        }

        // 7. Company settings recall
        const savedSettings = await fetchSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }

        // 8. Custom Reports
        const savedReports = await fetchReports();
        if (savedReports.length > 0) {
          setReports(savedReports);
        }
      } catch (err) {
        console.error('Falha ao carregar os dados do Firestore:', err);
      } finally {
        setInitialLoadDone(true);
      }
    };
    loadData();
  }, []);

  // Real-time notification subscriptions
  useEffect(() => {
    if (!initialLoadDone) return;

    const addNotification = (title: string, message: string) => {
      setNotifications(prev => [
        { id: Math.random().toString(36).substring(2, 9), title, message, date: new Date(), read: false },
        ...prev
      ].slice(0, 50)); // Keep last 50
    };

    const unsubTasks = subscribeToTasksChanges((changes) => {
      changes.forEach(change => {
        if (change.type === 'added') {
          const task = change.doc.data() as ActivityTask;
          if (task.estado === 'Pendente') {
            addNotification('Nova Tarefa Pendente', `Tarefa "${task.titulo}" foi criada e aguarda início.`);
          }
        }
      });
    });

    const unsubContracts = subscribeToContractsChanges((changes) => {
      changes.forEach(change => {
        if (change.type === 'modified') {
          // Assume modification might mean expiry update, but here we just notify
          const contract = change.doc.data() as Contract_Doc;
          addNotification('Atualização de Contrato', `O contrato de ${contract.tipo} foi atualizado.`);
        }
      });
    });

    const unsubPayroll = subscribeToPayrollChanges((changes) => {
      changes.forEach(change => {
        if (change.type === 'added') {
          const payroll = change.doc.data() as PayrollProcessed;
          addNotification('Folha Processada', `Folha de ${payroll.mes}/${payroll.ano} para o funcionário ${payroll.funcionarioId} foi processada.`);
        }
      });
    });

    return () => {
      unsubTasks();
      unsubContracts();
      unsubPayroll();
    };
  }, [initialLoadDone]);

  // Contract Expiration Service
  useEffect(() => {
    if (!initialLoadDone || contracts.length === 0) return;

    const checkContracts = () => {
      const lastChecked = localStorage.getItem('last_contract_check');
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const alertTime = settings.horarioAlertaContratos || '09:00';
      const [alertHour, alertMinute] = alertTime.split(':').map(Number);
      
      const isPastAlertTime = now.getHours() > alertHour || (now.getHours() === alertHour && now.getMinutes() >= alertMinute);

      if (lastChecked !== today && isPastAlertTime) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const targetDays = [30, 15, 7];

        contracts.forEach(contract => {
          if (contract.estado === 'Ativo' && contract.dataFim) {
            const endDate = new Date(contract.dataFim);
            const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / msPerDay);
            
            if (targetDays.includes(diffDays)) {
              const emp = employees.find(e => e.id === contract.funcionarioId);
              if (emp) {
                setNotifications(prev => [
                  {
                    id: Math.random().toString(36).substring(2, 9),
                    title: 'Alerta de Expiração de Contrato',
                    message: `[E-mail enviado para ${emp.email} e RH] O contrato de ${emp.nome} expira em exactamente ${diffDays} dias (${contract.dataFim}).`,
                    date: new Date(),
                    read: false
                  },
                  ...prev
                ]);
                
                sendMockEmail(
                  [emp.email, settings.emailEmpresa || 'rh@empresa.com'],
                  `Aviso Importante: Contrato expirando em ${diffDays} dias`,
                  `Olá ${emp.nome},\n\nEste é um alerta automático de que o seu contrato de trabalho (${contract.tipo}) terminará em ${diffDays} dias, no dia ${contract.dataFim}.\n\nPor favor, contacte o departamento de Recursos Humanos.\n\nAtenciosamente,\nRecursos Humanos\n${settings.nomeEmpresa}`
                );
              }
            }
          }
        });
        localStorage.setItem('last_contract_check', today);
      }
    };

    // Check immediately and then every minute
    checkContracts();
    const interval = setInterval(checkContracts, 60 * 1000);
    return () => clearInterval(interval);
  }, [initialLoadDone, contracts, employees, settings]);

  // Weekly Backup Service
  useEffect(() => {
    if (!initialLoadDone || !currentUser) return;

    const performBackup = async () => {
      try {
        const lastBackupStr = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}last_weekly_backup`);
        const now = new Date();
        
        let shouldBackup = false;
        if (!lastBackupStr) {
          shouldBackup = true;
        } else {
          const lastBackupDate = new Date(lastBackupStr);
          const diffMs = now.getTime() - lastBackupDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays >= 7) {
            shouldBackup = true;
          }
        }

        if (shouldBackup) {
          const backupData = {
            timestamp: now.toISOString(),
            employees,
            contracts,
            attendance,
            tasks,
            payrollHistory,
            settings
          };
          
          const filename = `backups/backup_${now.toISOString().split('T')[0]}.json`;
          await uploadBackupToStorage(filename, backupData);
          
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}last_weekly_backup`, now.toISOString());
          console.log(`Backup semanal automático concluído: ${filename}`);
        }
      } catch (error) {
        console.error('Erro ao efetuar o backup semanal:', error);
      }
    };
    
    // Slight delay to not block the main UI render
    const timeout = setTimeout(performBackup, 3000);
    return () => clearTimeout(timeout);
  }, [initialLoadDone, currentUser, employees, contracts, attendance, tasks, payrollHistory, settings]);

  // Standard write triggers to disk
  const saveEmployeesToStorage = async (list: Employee[]) => {
    setEmployees(list);
    await saveEmployees(list);
  };

  const saveContractsToStorage = async (list: Contract_Doc[]) => {
    setContracts(list);
    await saveContracts(list);
  };

  const saveAttendanceToStorage = async (list: AttendanceRecord[]) => {
    setAttendance(list);
    await saveAttendance(list);
  };

  const saveTasksToStorage = async (list: ActivityTask[]) => {
    setTasks(list);
    await saveTasks(list);
  };

  const savePayrollToStorage = async (list: PayrollProcessed[]) => {
    setPayrollHistory(list);
    await savePayroll(list);
  };

  const saveCompanySettingsToStorage = async (data: CompanySettings) => {
    setSettings(data);
    await saveSettings(data);
  };

  const handleSaveReport = async (report: CustomReportConfig) => {
    const newList = [...reports, report];
    setReports(newList);
    await saveReports(newList);
  };

  const handleDeleteReport = async (id: string) => {
    const newList = reports.filter(r => r.id !== id);
    setReports(newList);
    await saveReports(newList);
  };

  // Login handler
  const handleLoginSuccess = async (usr: User) => {
    setCurrentUser(usr);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}session_user`, JSON.stringify(usr));
    
    // Redirect employee roles directly onto personal workspace
    if (usr.perfil === UserRole.FUNCIONARIO) {
      setActiveSection('Meu Perfil');
    } else {
      setActiveSection('Dashboard');
    }

    try {
      const prefDoc = await getDoc(doc(db, 'userPreferences', usr.id));
      if (prefDoc.exists()) {
        const data = prefDoc.data();
        if (data.isDarkMode !== undefined) {
          setIsDarkMode(data.isDarkMode);
        }
      }
    } catch (err) {
      console.error("Failed to load user preferences", err);
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
      savePayrollToStorage([...payrollHistory, { ...record, status: record.status || 'Pendente Revisão' }]);
    }
  };

  const handleUpdatePayroll = (payrollId: string, updates: Partial<PayrollProcessed>) => {
    const list = payrollHistory.map(p => {
      if (p.id === payrollId) {
        return { ...p, ...updates };
      }
      return p;
    });
    savePayrollToStorage(list);
  };

  // Global Search
  const getGlobalSearchResults = () => {
    if (!globalSearchQuery.trim()) return { employees: [], payrolls: [] };
    const query = globalSearchQuery.toLowerCase();
    
    const matchedEmployees = employees.filter(emp => 
      emp.nome.toLowerCase().includes(query) || 
      emp.codigoFuncionario.toLowerCase().includes(query)
    ).slice(0, 5);
    
    const matchedPayrolls = payrollHistory.filter(pay => 
      pay.funcionarioNome?.toLowerCase().includes(query) || 
      pay.id.toLowerCase().includes(query) ||
      pay.periodo.toLowerCase().includes(query)
    ).slice(0, 5);
    
    return { employees: matchedEmployees, payrolls: matchedPayrolls };
  };

  const globalSearchResults = getGlobalSearchResults();

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
            tasks={tasks}
            payrollHistory={payrollHistory}
            settings={settings}
            onNavigate={setActiveSection}
            currentUserRole={currentUser.perfil}
            onAddTask={handleAddTask}
            onAddAttendanceRecord={handleAddAttendanceRecord}
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
            onUpdatePayroll={handleUpdatePayroll}
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
            onPrintMultipleSlips={(payrolls) => {
              setPrintMode('multiple_slips');
              setPrintingPayrolls(payrolls);
            }}
          />
        );
      case 'Relatórios Dinâmicos':
        return (
          <CustomReportsView
            reports={reports}
            employees={employees}
            contracts={contracts}
            payroll={payrollHistory}
            attendance={attendance}
            onSaveReport={handleSaveReport}
            onDeleteReport={handleDeleteReport}
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
            attendance={attendance}
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
    { name: 'Relatórios Dinâmicos', icon: FileText, blockForEmployee: true },
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
            <img src={hrpayLogo} alt="HRPay Pro Logo" className="h-8 w-auto rounded bg-white p-0.5" />
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
                <div className="flex items-center space-x-2">
                  <img src={hrpayLogo} alt="HRPay Pro Logo" className="h-6 w-auto rounded bg-white p-0.5" />
                  <span className="font-extrabold text-sm text-white">HRPay Pro</span>
                </div>
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
        
        {/* Desktop TopBar */}
        <header className="hidden md:flex justify-between items-center px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0 sticky top-0 z-30">
          
          {/* Global Search Bar */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar funcionários ou folhas de salário..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && globalSearchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                {globalSearchResults.employees.length === 0 && globalSearchResults.payrolls.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-medium">
                    Nenhum resultado encontrado para "{globalSearchQuery}"
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto p-2">
                    {globalSearchResults.employees.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Funcionários</h4>
                        <div className="space-y-1">
                          {globalSearchResults.employees.map(emp => (
                            <button
                              key={emp.id}
                              onClick={() => {
                                setActiveSection('Funcionários');
                                setShowSearchResults(false);
                                setGlobalSearchQuery('');
                              }}
                              className="w-full text-left flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">{emp.nome}</p>
                                <p className="text-[10px] text-slate-500">{emp.cargo}</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{emp.codigoFuncionario}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {globalSearchResults.payrolls.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Folhas de Salário</h4>
                        <div className="space-y-1">
                          {globalSearchResults.payrolls.map(pay => (
                            <button
                              key={pay.id}
                              onClick={() => {
                                setActiveSection('Processamento Salarial');
                                setShowSearchResults(false);
                                setGlobalSearchQuery('');
                              }}
                              className="w-full text-left flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">{pay.funcionarioNome}</p>
                                <p className="text-[10px] text-slate-500">{pay.periodo}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${pay.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {pay.status || 'Pendente'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 relative rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title={isDarkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            
            <div className="relative">
               <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 relative rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
               <Bell className="w-5 h-5 text-slate-600" />
               {notifications.filter(n => !n.read).length > 0 && (
                 <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
               )}
             </button>
             
             {showNotifications && (
               <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                 <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-800 text-sm">Notificações</h3>
                   <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                     {notifications.filter(n => !n.read).length} Novas
                   </span>
                 </div>
                 <div className="max-h-80 overflow-y-auto">
                   {notifications.length === 0 ? (
                     <div className="p-6 text-center text-xs text-slate-400 font-medium">Nenhuma notificação no momento.</div>
                   ) : (
                     <div className="divide-y divide-slate-50">
                       {notifications.map(notif => (
                         <div key={notif.id} className={`p-4 transition-colors ${notif.read ? 'bg-white' : 'bg-indigo-50/30'}`} onClick={() => {
                           setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                         }}>
                           <div className="flex justify-between items-start mb-1">
                             <h4 className={`text-xs font-bold ${notif.read ? 'text-slate-700' : 'text-indigo-900'}`}>{notif.title}</h4>
                             <span className="text-[9px] text-slate-400 font-medium">{notif.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                           <p className="text-[11px] text-slate-500 leading-relaxed">{notif.message}</p>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
                 <div className="p-2 border-t border-slate-50 bg-slate-50/50">
                   <button 
                     onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                     className="w-full text-[10px] font-bold text-slate-500 hover:text-slate-800 py-1.5 transition-colors cursor-pointer"
                   >
                     Marcar todas como lidas
                   </button>
                 </div>
               </div>
             )}
            </div>
          </div>
        </header>

        {/* Mobile Upper TopBar */}
        <header className="bg-white border-b border-slate-100 p-4 flex items-center justify-between md:hidden shadow-xs shrink-0 sticky top-0 z-40">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-100"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
          
          <div className="text-center flex flex-col items-center">
            <img src={hrpayLogo} alt="HRPay Pro Logo" className="h-6 w-auto mb-1 rounded" />
            <span className="text-[9px] text-slate-400 block font-semibold">{activeSection}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 relative rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            
            <div className="relative">
               <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 relative rounded-full hover:bg-slate-100 transition-colors">
               <Bell className="w-5 h-5 text-slate-600" />
               {notifications.filter(n => !n.read).length > 0 && (
                 <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
               )}
             </button>
             
             {showNotifications && (
               <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                 <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-800 text-sm">Notificações</h3>
                   <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                     {notifications.filter(n => !n.read).length} Novas
                   </span>
                 </div>
                 <div className="max-h-72 overflow-y-auto">
                   {notifications.length === 0 ? (
                     <div className="p-6 text-center text-xs text-slate-400 font-medium">Nenhuma notificação.</div>
                   ) : (
                     <div className="divide-y divide-slate-50">
                       {notifications.map(notif => (
                         <div key={notif.id} className={`p-4 ${notif.read ? 'bg-white' : 'bg-indigo-50/30'}`} onClick={() => {
                           setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                         }}>
                           <div className="flex justify-between items-start mb-1">
                             <h4 className={`text-xs font-bold ${notif.read ? 'text-slate-700' : 'text-indigo-900'}`}>{notif.title}</h4>
                             <span className="text-[9px] text-slate-400 font-medium">{notif.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                           <p className="text-[11px] text-slate-500 leading-relaxed">{notif.message}</p>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             )}
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 py-3 bg-white border-b border-slate-100 z-30 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar funcionários ou salário..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
            {/* Search Results Dropdown */}
            {showSearchResults && globalSearchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                {globalSearchResults.employees.length === 0 && globalSearchResults.payrolls.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-medium">
                    Nenhum resultado encontrado para "{globalSearchQuery}"
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto p-2">
                    {globalSearchResults.employees.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Funcionários</h4>
                        <div className="space-y-1">
                          {globalSearchResults.employees.map(emp => (
                            <button
                              key={emp.id}
                              onClick={() => {
                                setActiveSection('Funcionários');
                                setShowSearchResults(false);
                                setGlobalSearchQuery('');
                              }}
                              className="w-full text-left flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">{emp.nome}</p>
                                <p className="text-[10px] text-slate-500">{emp.cargo}</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{emp.codigoFuncionario}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {globalSearchResults.payrolls.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Folhas de Salário</h4>
                        <div className="space-y-1">
                          {globalSearchResults.payrolls.map(pay => (
                            <button
                              key={pay.id}
                              onClick={() => {
                                setActiveSection('Processamento Salarial');
                                setShowSearchResults(false);
                                setGlobalSearchQuery('');
                              }}
                              className="w-full text-left flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">{pay.funcionarioNome}</p>
                                <p className="text-[10px] text-slate-500">{pay.periodo}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${pay.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {pay.status || 'Pendente'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Master Router views */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {renderRouterSection()}
        </main>
      </div>

      {/* 4. PRINT TEMPLATES MODAL SWITCH OVERLAY */}
      {(printingPayroll || printMode === 'general' || (printMode === 'multiple_slips' && printingPayrolls.length > 0)) && (
        <PrintView
          payroll={printMode === 'single' ? printingPayroll : null}
          allPayrolls={
            printMode === 'general' ? payrollHistory.filter(p => p.mes === 5 && p.ano === 2026) : 
            printMode === 'multiple_slips' ? printingPayrolls : 
            []
          }
          employees={employees}
          settings={settings}
          onClose={() => {
            setPrintingPayroll(null);
            setPrintingPayrolls([]);
            setPrintMode('single');
          }}
          printMode={printMode}
        />
      )}
    </div>
  );
}
