import { IrpsBracket, PayrollProcessed } from '../types';

/**
 * Standard Monthly IRPS Brackets for Mozambique Currency: Metical (MT)
 * Exemption goes up to 20,250 MT. 
 */
export const DEFAULT_IRPS_BRACKETS: IrpsBracket[] = [
  { minVal: 0, maxVal: 20250, taxRate: 0, deductionCoefficient: 0 },
  { minVal: 20250, maxVal: 32750, taxRate: 10, deductionCoefficient: 2025 },
  { minVal: 32750, maxVal: 60750, taxRate: 15, deductionCoefficient: 3662.5 },
  { minVal: 60750, maxVal: 144750, taxRate: 20, deductionCoefficient: 6700 },
  { minVal: 144750, maxVal: 289500, taxRate: 25, deductionCoefficient: 13937.5 },
  { minVal: 289500, maxVal: Infinity, taxRate: 32, deductionCoefficient: 34202.5 }
];

/**
 * Computes IRPS (progressive tax) on a given monthly taxable base.
 */
export function calculateIrps(taxableBase: number, brackets: IrpsBracket[] = DEFAULT_IRPS_BRACKETS): number {
  if (taxableBase <= 20250) {
    return 0; // Completely exempt below 20250 MT
  }

  // Find the matching bracket
  const bracket = brackets.find(b => taxableBase >= b.minVal && taxableBase < b.maxVal);
  if (!bracket) {
    // Fallback if none matched
    const highestBracket = brackets[brackets.length - 1];
    const tax = (taxableBase * (highestBracket.taxRate / 100)) - highestBracket.deductionCoefficient;
    return Math.max(0, parseFloat(tax.toFixed(2)));
  }

  const tax = (taxableBase * (bracket.taxRate / 100)) - bracket.deductionCoefficient;
  return Math.max(0, parseFloat(tax.toFixed(2)));
}

interface ComputeParams {
  funcionarioId: string;
  mes: number;
  ano: number;
  salarioBase: number;
  bonus: number;
  subsidioTransporte: number;
  subsidioAlimentacao: number;
  horasExtrasHoras: number;
  comissoes: number;
  vales: number;
  faltasInjustificadas: number;
  outrosDescontos: number;
  taxaInssTrabalhador?: number; // 0.03
  taxaInssPatronal?: number; // 0.04
  brackets?: IrpsBracket[];
  processadoPor: string;
}

/**
 * Executes full salary components calculation
 */
export function processFullPayroll(params: ComputeParams): PayrollProcessed {
  const {
    funcionarioId,
    mes,
    ano,
    salarioBase,
    bonus,
    subsidioTransporte,
    subsidioAlimentacao,
    horasExtrasHoras,
    comissoes,
    vales,
    faltasInjustificadas,
    outrosDescontos,
    taxaInssTrabalhador = 0.03,
    taxaInssPatronal = 0.04,
    brackets = DEFAULT_IRPS_BRACKETS,
    processadoPor
  } = params;

  // 1. Calculate Overtime wage
  // Base hourly wage assumes standard 173.33 hours in a month for 40 hours/week
  const valorHoraBase = salarioBase / 173.33;
  // Mozambique standard overtime multiplier: usually 1.5x during normal work days
  const valorHoraExtra = valorHoraBase * 1.5;
  const horasExtrasValor = parseFloat((horasExtrasHoras * valorHoraExtra).toFixed(2));

  // 2. Calculate Unjustified Absence Deductions
  // Absence deduction: (Base Salary / 30) * amount of absences
  const faltasDeducao = parseFloat(((salarioBase / 30) * faltasInjustificadas).toFixed(2));

  // 3. Gross Salary (Total Bruto)
  // Subsidies, bonuses, commissions, and overtime sum up to gross income
  const totalBruto = parseFloat(
    (salarioBase + bonus + subsidioTransporte + subsidioAlimentacao + horasExtrasValor + comissoes).toFixed(2)
  );

  // 4. INSS calculation base
  // In Mozambique, typical INSS applies to all cash remunerations (excluding specific non-taxable allowances)
  // Let's apply standard INSS to Base Salary + Bonus + Commissions + Overtime Wages
  const baseCalculoInss = Math.max(0, salarioBase + bonus + comissoes + horasExtrasValor - faltasDeducao);
  const inssTrabalhador = parseFloat((baseCalculoInss * taxaInssTrabalhador).toFixed(2));
  const inssPatronal = parseFloat((baseCalculoInss * taxaInssPatronal).toFixed(2));

  // 5. Taxable Base for IRPS (Worker INSS is excluded from IRPS tax calculations in Mozambique)
  const baseIrps = Math.max(0, totalBruto - inssTrabalhador - faltasDeducao);
  
  // 6. IRPS Tax
  const irps = calculateIrps(baseIrps, brackets);

  // 7. Deductions Sum
  const totalDescontos = parseFloat(
    (inssTrabalhador + irps + vales + faltasDeducao + outrosDescontos).toFixed(2)
  );

  // 8. Net Salary (Salário Líquido)
  const salarioLiquido = parseFloat((totalBruto - totalDescontos).toFixed(2));

  return {
    id: `pay_${funcionarioId}_${ano}_${mes.toString().padStart(2, '0')}`,
    funcionarioId,
    mes,
    ano,
    salarioBase,
    bonus,
    subsidioTransporte,
    subsidioAlimentacao,
    horasExtras: horasExtrasValor,
    horasExtrasHoras,
    comissoes,
    vales,
    faltasDeducao,
    impostos: {
      inssTrabalhador,
      inssPatronal,
      irps,
      outrosDescontos
    },
    totalBruto,
    totalDescontos,
    salarioLiquido,
    processadoPor,
    dataProcessamento: new Date().toISOString().split('T')[0],
    pago: false
  };
}
