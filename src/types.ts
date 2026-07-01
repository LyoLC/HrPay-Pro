/**
 * Types representing the domain elements of the HRPay Pro system.
 */

export enum UserRole {
  ADMIN = 'Administrador',
  RH = 'RH',
  SUPERVISOR = 'Supervisor',
  FUNCIONARIO = 'Funcionário'
}

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  funcionarioId?: string; // Links user accounts to their employee profile if they are an employee
  createdAt: string;
}

export type ContractType = 'Contrato a prazo' | 'Contrato sem termo' | 'Prestação de serviços';

export interface EmployeeDocument {
  id: string;
  nome: string;
  tipo: string;
  url: string;
  dataUpload: string;
  validade?: string; // YYYY-MM-DD
}

export interface Employee {
  id: string;
  nome: string;
  foto: string; // url or empty string
  bi: string; // Número de Bilhete de Identidade
  nuit: string; // Número Único de Identificação Tributária (9 digits)
  contacto: string;
  email: string;
  morada: string;
  departamento: string;
  cargo: string;
  dataAdmissao: string;
  dataNascimento?: string; // Optional for existing ones
  salarioBase: number; // in Meticais (MT)
  tipoContrato: ContractType;
  estado: 'Ativo' | 'Inativo';
  documentos?: EmployeeDocument[];
  skills?: string[];
}

export interface CustomReportConfig {
  id: string;
  name: string;
  description: string;
  dataSources: string[];
  filters: {
    dateRange?: { start: string; end: string };
    department?: string;
    employeeStatus?: 'Ativo' | 'Inativo' | 'Todos';
  };
  fields: string[];
  createdAt: string;
}

export const MOZAMBIQUE_DEPARTMENTS = [
  'Administração',
  'Operações',
  'Recursos Humanos',
  'Vendas',
  'Comercial',
  'Logística',
  'Jurídico',
  'Financeiro',
  'IT / Tecnologias de Informação',
  'Marketing',
  'Produção',
  'Atendimento ao Cliente',
  'Manutenção',
  'Engenharia de Software',
  'Qualidade e Segurança',
  'Compras e Aquisições'
];

export interface Contract_Doc {
  id: string;
  funcionarioId: string;
  departamento?: string;
  tipo: ContractType;
  dataInicio: string;
  dataFim?: string; // undefined means unlimited
  salarioBase: number;
  estado: 'Ativo' | 'Expirado' | 'Suspenso';
  renovacaoAutomatica: boolean;
  alertasVencimento: boolean; // toggle to notify before 30 days
  arquivoPdf: string; // Mock PDF link or placeholder name
}

export interface AttendanceRecord {
  id: string;
  funcionarioId: string;
  data: string; // YYYY-MM-DD
  presente: 'Presente' | 'Falta Justificada' | 'Falta Injustificada' | 'Atraso';
  horasExtras: number; // custom overtime hours
  comentario?: string;
}

export type TaskStatus = 'Pendente' | 'Em Progresso' | 'Concluída';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskCategory = 'Administrativo' | 'Salarial' | 'Recrutamento' | 'Geral';

export interface ActivityTask {
  id: string;
  titulo: string;
  descricao: string;
  funcionarioId: string; // assigned employee
  prazo: string; // YYYY-MM-DD
  dueDate?: string;
  priority: TaskPriority;
  categoria?: TaskCategory;
  estado: TaskStatus;
  comentarios: { autor: string; data: string; texto: string }[];
}

export type PayrollStatus = 'Pendente Revisão' | 'Aprovado' | 'Pago';

export interface PayrollProcessed {
  id: string;
  funcionarioId: string;
  mes: number; // 1 to 12
  ano: number;
  salarioBase: number;
  bonus: number;
  subsidioTransporte: number;
  subsidioAlimentacao: number;
  horasExtras: number; // amount of money earned on overtime
  horasExtrasHoras: number; // total overtime hours registered
  comissoes: number;
  vales: number; // loan advances
  faltasDeducao: number; // money deducted because of unjustified absences
  impostos: {
    inssTrabalhador: number; // 3% of gross salary
    inssPatronal: number; // 4% of gross salary paid by employer
    irps: number; // Calculated according to local Mozambican progressive tax rules
    outrosDescontos: number;
  };
  totalBruto: number;
  totalDescontos: number;
  salarioLiquido: number;
  processadoPor: string;
  dataProcessamento: string;
  status?: PayrollStatus;
  pago: boolean; // keep for legacy support
  dataPagamento?: string;
  referenciaBancaria?: string;
}

export interface IrpsBracket {
  minVal: number;
  maxVal: number; // use Infinity for the highest bracket
  taxRate: number; // percentage, e.g., 10% = 0.10
  deductionCoefficient: number; // MT deducted from calculated rate
}

export interface CompanySettings {
  nomeEmpresa: string;
  nuitEmpresa: string;
  bancoPrincipal: string;
  numeroContaPrincipal: string;
  nibEmpresa: string;
  enderecoEmpresa: string;
  contactoEmpresa: string;
  emailEmpresa: string;
  taxaInssTrabalhador: number; // default is 3% (.03)
  taxaInssPatronal: number;  // default is 4% (.04)
  prazoInss?: number; // default is 10 (10th of next month)
  prazoIrps?: number; // default is 20 (20th of next month)
  horarioAlertaContratos?: string; // Time to check contracts (e.g. '09:00')
  irpsBrackets: IrpsBracket[];
}

export type MenuSection = 
  | 'Dashboard'
  | 'Funcionários'
  | 'Contratos'
  | 'Assiduidade'
  | 'Atividades'
  | 'Processamento Salarial'
  | 'Relatórios'
  | 'Relatórios Dinâmicos'
  | 'Impressões'
  | 'Configurações'
  | 'Meu Perfil';
