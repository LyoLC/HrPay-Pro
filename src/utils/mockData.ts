import { Employee, Contract_Doc, AttendanceRecord, ActivityTask, PayrollProcessed, User, UserRole } from '../types';
import { processFullPayroll } from './calculations';

// Default mock users
export const MOCK_USERS: User[] = [
  {
    id: 'usr_1',
    nome: 'Gerson Matsolo',
    email: 'admin@hrpay.co.mz',
    perfil: UserRole.ADMIN,
    createdAt: '2026-01-10'
  },
  {
    id: 'usr_2',
    nome: 'Clara Nhantumbo',
    email: 'rh@hrpay.co.mz',
    perfil: UserRole.RH,
    createdAt: '2026-02-15'
  },
  {
    id: 'usr_3',
    nome: 'Tomás Mandlate',
    email: 'supervisor@hrpay.co.mz',
    perfil: UserRole.SUPERVISOR,
    createdAt: '2026-03-01'
  },
  {
    id: 'usr_4',
    nome: 'Abel Chilundo',
    email: 'abel@hrpay.co.mz',
    perfil: UserRole.FUNCIONARIO,
    funcionarioId: 'emp_1',
    createdAt: '2026-04-01'
  }
];

// 5 core Mozambican workers
export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp_1',
    nome: 'Abel Chilundo',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bi: '110103982736A',
    nuit: '110294821',
    contacto: '+258 84 123 4567',
    email: 'abel@hrpay.co.mz',
    morada: 'Av. Eduardo Mondlane, Maputo',
    departamento: 'Engenharia de Software',
    cargo: 'Engenheiro Frontend Júnior',
    dataAdmissao: '2025-01-15',
    salarioBase: 25000,
    tipoContrato: 'Contrato a prazo',
    estado: 'Ativo'
  },
  {
    id: 'emp_2',
    nome: 'Anabela Sitoe',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    bi: '110203874621B',
    nuit: '140598621',
    contacto: '+258 82 987 6543',
    email: 'anabela@hrpay.co.mz',
    morada: 'Bairro Central, Beira',
    departamento: 'Recursos Humanos',
    cargo: 'Analista de Recrutamento',
    dataAdmissao: '2024-06-10',
    salarioBase: 42000,
    tipoContrato: 'Contrato sem termo',
    estado: 'Ativo'
  },
  {
    id: 'emp_3',
    nome: 'Gervásio Tembe',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    bi: '110304918274C',
    nuit: '210697843',
    contacto: '+258 87 234 5678',
    email: 'gervasio@hrpay.co.mz',
    morada: 'Rua de Bagamoyo, Nampula',
    departamento: 'Logística',
    cargo: 'Supervisor de Operações',
    dataAdmissao: '2025-11-20',
    salarioBase: 18000,
    tipoContrato: 'Contrato a prazo',
    estado: 'Ativo'
  },
  {
    id: 'emp_4',
    nome: 'Mariana Nhaca',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    bi: '110405294837D',
    nuit: '190473821',
    contacto: '+258 85 555 1212',
    email: 'mariana@hrpay.co.mz',
    morada: 'Sommerschield II, Maputo',
    departamento: 'Administração',
    cargo: 'Diretora de Operações',
    dataAdmissao: '2023-01-05',
    salarioBase: 75000,
    tipoContrato: 'Contrato sem termo',
    estado: 'Ativo'
  },
  {
    id: 'emp_5',
    nome: 'Pedro Langa',
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    bi: '110502129482E',
    nuit: '150243891',
    contacto: '+258 84 888 7766',
    email: 'pedro@hrpay.co.mz',
    morada: 'Bairro George Dimitrov, Maputo',
    departamento: 'Engenharia de Software',
    cargo: 'Desenvolvedor Full Stack',
    dataAdmissao: '2026-03-01',
    salarioBase: 35000,
    tipoContrato: 'Contrato a prazo',
    estado: 'Ativo'
  }
];

// Contracts docs
export const MOCK_CONTRACTS: Contract_Doc[] = [
  {
    id: 'ct_1',
    funcionarioId: 'emp_1',
    tipo: 'Contrato a prazo',
    dataInicio: '2025-01-15',
    dataFim: '2026-07-15', // Expiration alert! June 21, 2026 is soon!
    salarioBase: 25000,
    estado: 'Ativo',
    renovacaoAutomatica: true,
    alertasVencimento: true,
    arquivoPdf: 'Contrato_Abel_Software.pdf'
  },
  {
    id: 'ct_2',
    funcionarioId: 'emp_2',
    tipo: 'Contrato sem termo',
    dataInicio: '2024-06-10',
    salarioBase: 42000,
    estado: 'Ativo',
    renovacaoAutomatica: false,
    alertasVencimento: false,
    arquivoPdf: 'Contrato_Anabela_Endless.pdf'
  },
  {
    id: 'ct_3',
    funcionarioId: 'emp_3',
    tipo: 'Contrato a prazo',
    dataInicio: '2025-11-20',
    dataFim: '2026-11-20',
    salarioBase: 18000,
    estado: 'Ativo',
    renovacaoAutomatica: true,
    alertasVencimento: true,
    arquivoPdf: 'Contrato_Gervasio_Logistica.pdf'
  },
  {
    id: 'ct_4',
    funcionarioId: 'emp_4',
    tipo: 'Contrato sem termo',
    dataInicio: '2023-01-05',
    salarioBase: 75000,
    estado: 'Ativo',
    renovacaoAutomatica: false,
    alertasVencimento: false,
    arquivoPdf: 'Contrato_Mariana_COO_Term.pdf'
  },
  {
    id: 'ct_5',
    funcionarioId: 'emp_5',
    tipo: 'Contrato a prazo',
    dataInicio: '2026-03-01',
    dataFim: '2026-09-01',
    salarioBase: 35000,
    estado: 'Ativo',
    renovacaoAutomatica: false,
    alertasVencimento: true,
    arquivoPdf: 'Contrato_Pedro_Langa.pdf'
  }
];

// Prepopulate attendance records up to today (Jun 21, 2026) starting June 1st
export const generateMockAttendance = (): AttendanceRecord[] => {
  const list: AttendanceRecord[] = [];
  const daysInJune = 21; // Up to current date
  const employeeIds = ['emp_1', 'emp_2', 'emp_3', 'emp_4', 'emp_5'];

  for (let day = 1; day <= daysInJune; day++) {
    // Generate YYYY-MM-DD
    const dateStr = `2026-06-${day.toString().padStart(2, '0')}`;
    const dayOfWeek = new Date(dateStr).getDay();
    
    // Skip weekends (Sunday=0, Saturday=6)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    employeeIds.forEach(empId => {
      // Deterministic but realistic attendance
      let state: 'Presente' | 'Falta Justificada' | 'Falta Injustificada' | 'Atraso' = 'Presente';
      let horasExtras = 0;
      let comentario = '';

      // Random generator with seed based on date and ID to keep it persistent
      const randSeed = (day * 13 + (empId === 'emp_1' ? 7 : empId === 'emp_2' ? 19 : empId === 'emp_3' ? 11 : empId === 'emp_4' ? 31 : 5)) % 100;

      if (randSeed > 95) {
        state = 'Falta Injustificada';
        comentario = 'Ausência não comunicada';
      } else if (randSeed > 92) {
        state = 'Falta Justificada';
        comentario = 'Consulta médica / Justificativo entregue';
      } else if (randSeed > 85) {
        state = 'Atraso';
        horasExtras = 0;
        comentario = 'Problemas no transporte';
      } else if (randSeed < 15) {
        // Did some overtime! Excellent!
        horasExtras = randSeed % 2 === 0 ? 2 : 1;
      }

      list.push({
        id: `att_${empId}_${dateStr}`,
        funcionarioId: empId,
        data: dateStr,
        presente: state,
        horasExtras,
        comentario
      });
    });
  }

  return list;
};

// Seed tasks (Gestão de Atividades)
export const MOCK_TASKS: ActivityTask[] = [
  {
    id: 'tsk_1',
    titulo: 'Desenvolver Recibo de Salário Imprimível',
    descricao: 'Criar o layout CSS de alta precisão para a impressão direta do recibo de pagamento no formato A4/A5.',
    funcionarioId: 'emp_1', // Abel
    prazo: '2026-06-25',
    priority: 'High',
    estado: 'Em Progresso',
    comentarios: [
      { autor: 'Clara Nhantumbo (RH)', data: '2026-06-18', texto: 'Abel, garanta que todas as deduções de INSS fiquem bem claras.' },
      { autor: 'Abel Chilundo', data: '2026-06-19', texto: 'Já comecei a estilizar a tabela, ficará idêntica ao modelo oficial.' }
    ]
  },
  {
    id: 'tsk_2',
    titulo: 'Revisão dos Contratos Próximos a Vencer',
    descricao: 'Emitir avisos e marcar reuniões com funcionários cujos contratos terminam em Julho (como o Abel Chilundo).',
    funcionarioId: 'emp_2', // Anabela
    prazo: '2026-06-22',
    priority: 'High',
    estado: 'Pendente',
    comentarios: []
  },
  {
    id: 'tsk_3',
    titulo: 'Organizar Escala do Armazém Centrado',
    descricao: 'Ajustar horários devido ao aumento do fluxo de entrada de insumos no próximo trimestre.',
    funcionarioId: 'emp_3', // Gervásio
    prazo: '2026-06-28',
    priority: 'Medium',
    estado: 'Concluída',
    comentarios: [
      { autor: 'Tomás Mandlate (Supervisor)', data: '2026-06-15', texto: 'Muito bom trabalho na distribuição das rotas e otimização da equipa.' }
    ]
  },
  {
    id: 'tsk_4',
    titulo: 'Planeamento Estratégico do Próximo Semestre',
    descricao: 'Reunião de conselho de administração para definir novas contratações previstas na área de engenharia.',
    funcionarioId: 'emp_4', // Mariana
    prazo: '2026-06-30',
    priority: 'High',
    estado: 'Em Progresso',
    comentarios: []
  },
  {
    id: 'tsk_5',
    titulo: 'Refatorar Roteamento de API de Autenticação',
    descricao: 'Migrar as chaves de geração do token para utilizar a biblioteca encriptada.',
    funcionarioId: 'emp_5', // Pedro
    prazo: '2026-06-24',
    priority: 'Low',
    estado: 'Pendente',
    comentarios: []
  }
];

// Prepopulate actual May 2026 Paychecks to provide rich dashboard statistics on load
export const generateMockPaymentsMay = (): PayrollProcessed[] => {
  const list: PayrollProcessed[] = [];
  const employees = MOCK_EMPLOYEES;

  employees.forEach(emp => {
    // Generate deterministic values for May
    let bonus = 0;
    let subsidioTransporte = 0;
    let subsidioAlimentacao = 1500; // standard 1500 MT allowance
    let horasExtrasHoras = 0;
    let comissoes = 0;
    let vales = 0;
    let outrosDescontos = 0;

    if (emp.id === 'emp_1') {
      bonus = 3000;
      subsidioTransporte = 2000;
      horasExtrasHoras = 8; // ~1500 MT 
    } else if (emp.id === 'emp_2') {
      bonus = 4000;
      subsidioTransporte = 3000;
    } else if (emp.id === 'emp_3') {
      horasExtrasHoras = 12;
      vales = 1000; // advance loan
    } else if (emp.id === 'emp_4') {
      bonus = 10000;
      subsidioTransporte = 5000;
      comissoes = 5000;
    } else if (emp.id === 'emp_5') {
      bonus = 2000;
      subsidioTransporte = 2000;
    }

    const pay = processFullPayroll({
      funcionarioId: emp.id,
      mes: 5,
      ano: 2026,
      salarioBase: emp.salarioBase,
      bonus,
      subsidioTransporte,
      subsidioAlimentacao,
      horasExtrasHoras,
      comissoes,
      vales,
      faltasInjustificadas: 0,
      outrosDescontos,
      processadoPor: 'Clara Nhantumbo'
    });

    // Mark as paid
    pay.pago = true;
    pay.dataPagamento = '2026-05-30';
    pay.referenciaBancaria = `BIM-${Math.floor(Math.random() * 900000) + 100000}`;

    list.push(pay);
  });

  return list;
};
