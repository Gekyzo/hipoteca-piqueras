import type { Mortgage, MortgageCondition, MortgageBonification, AmortizationPayment } from '@/types';

// Calculate total rate reduction from active bonifications
export function calculateTotalBonification(bonifications: MortgageBonification[]): number {
  return bonifications
    .filter(b => b.is_active)
    .reduce((total, b) => total + b.rate_reduction, 0);
}

export function calculateAmortizationSchedule(
  mortgage: Mortgage,
  conditions: MortgageCondition[],
  bonifications: MortgageBonification[] = []
): AmortizationPayment[] {
  const schedule: AmortizationPayment[] = [];
  const startDate = new Date(mortgage.start_date);
  let balance = mortgage.total_amount;

  // Calculate total bonification (rate reduction)
  const totalBonification = calculateTotalBonification(bonifications);

  // Sort conditions by start_month
  const sortedConditions = [...conditions]
    .filter(c => c.interest_rate !== null)
    .sort((a, b) => a.start_month - b.start_month);

  // Helper to get the rate for a specific month (with bonification applied)
  const getRateForMonth = (month: number): number => {
    const condition = sortedConditions.find(
      c => month >= c.start_month && month <= c.end_month
    );
    const baseRate = condition?.interest_rate ?? mortgage.interest_rate;
    // Apply bonification reduction, ensuring rate doesn't go below 0
    return Math.max(0, baseRate - totalBonification);
  };

  // Calculate monthly payment for a given balance, rate, and remaining months
  const calculateMonthlyPayment = (
    principal: number,
    annualRate: number,
    months: number
  ): number => {
    if (annualRate === 0) {
      return principal / months;
    }
    const monthlyRate = annualRate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  };

  // Group consecutive months with the same rate to recalculate payments
  let currentMonth = 1;
  let remainingMonths = mortgage.term_months;

  while (currentMonth <= mortgage.term_months && balance > 0.01) {
    const currentRate = getRateForMonth(currentMonth);

    // Find how many consecutive months have the same rate
    let endMonthForRate = currentMonth;
    while (
      endMonthForRate < mortgage.term_months &&
      getRateForMonth(endMonthForRate + 1) === currentRate
    ) {
      endMonthForRate++;
    }

    // Calculate the monthly payment for this rate period
    const monthlyPayment = calculateMonthlyPayment(balance, currentRate, remainingMonths);
    const monthlyRate = currentRate / 100 / 12;

    // Generate payments for this rate period
    for (let month = currentMonth; month <= endMonthForRate && balance > 0.01; month++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + month - 1);

      let interestPayment: number;
      let principalPayment: number;
      let totalPayment: number;

      if (currentRate === 0) {
        // Grace period: no interest
        interestPayment = 0;
        principalPayment = monthlyPayment;
        totalPayment = monthlyPayment;
      } else {
        interestPayment = balance * monthlyRate;
        principalPayment = monthlyPayment - interestPayment;
        totalPayment = monthlyPayment;
      }

      // Adjust for final payment
      if (principalPayment > balance) {
        principalPayment = balance;
        totalPayment = principalPayment + interestPayment;
      }

      balance -= principalPayment;
      remainingMonths--;

      schedule.push({
        paymentNumber: month,
        date: paymentDate,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(balance * 100) / 100),
        interestRate: currentRate,
      });
    }

    currentMonth = endMonthForRate + 1;
  }

  return schedule;
}

export function getScheduleSummary(schedule: AmortizationPayment[]) {
  const totalPrincipal = schedule.reduce((sum, p) => sum + p.principal, 0);
  const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
  const totalPayments = schedule.reduce((sum, p) => sum + p.totalPayment, 0);

  return {
    totalPrincipal: Math.round(totalPrincipal * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayments: Math.round(totalPayments * 100) / 100,
    numberOfPayments: schedule.length,
  };
}

export type EarlyPayoffStrategy = 'reduce_payment' | 'reduce_term';

export interface EarlyPayoffSimulation {
  strategy: EarlyPayoffStrategy;
  extraPaymentAmount: number;
  paymentNumber: number;
  // Before early payment
  originalTotalInterest: number;
  originalRemainingPayments: number;
  originalMonthlyPayment: number;
  // After early payment
  newTotalInterest: number;
  newRemainingPayments: number;
  newMonthlyPayment: number;
  // Savings
  interestSaved: number;
  monthsSaved: number;
  newSchedule: AmortizationPayment[];
}

/**
 * Simulates an early payoff (amortización anticipada) and calculates its impact.
 *
 * @param mortgage - The mortgage details
 * @param conditions - Special rate conditions
 * @param bonifications - Rate bonifications
 * @param extraPaymentAmount - Amount to pay off early (reduces principal)
 * @param afterPaymentNumber - Apply extra payment after this payment number (0 = before first payment)
 * @param strategy - 'reduce_payment' keeps term, lowers quota; 'reduce_term' keeps quota, shortens term
 */
export function simulateEarlyPayoff(
  mortgage: Mortgage,
  conditions: MortgageCondition[],
  bonifications: MortgageBonification[],
  extraPaymentAmount: number,
  afterPaymentNumber: number,
  strategy: EarlyPayoffStrategy
): EarlyPayoffSimulation {
  // Get original schedule
  const originalSchedule = calculateAmortizationSchedule(mortgage, conditions, bonifications);
  const originalSummary = getScheduleSummary(originalSchedule);

  // Find the balance after the specified payment
  const paymentAfter = originalSchedule.find(p => p.paymentNumber === afterPaymentNumber);
  const balanceBeforeExtra = afterPaymentNumber === 0
    ? mortgage.total_amount
    : (paymentAfter?.remainingBalance ?? mortgage.total_amount);

  // Apply extra payment to principal
  const newBalance = Math.max(0, balanceBeforeExtra - extraPaymentAmount);

  if (newBalance <= 0) {
    // Mortgage fully paid off
    const interestPaidSoFar = originalSchedule
      .filter(p => p.paymentNumber <= afterPaymentNumber)
      .reduce((sum, p) => sum + p.interest, 0);

    return {
      strategy,
      extraPaymentAmount,
      paymentNumber: afterPaymentNumber,
      originalTotalInterest: originalSummary.totalInterest,
      originalRemainingPayments: originalSchedule.length - afterPaymentNumber,
      originalMonthlyPayment: originalSchedule[afterPaymentNumber]?.totalPayment ?? 0,
      newTotalInterest: Math.round(interestPaidSoFar * 100) / 100,
      newRemainingPayments: 0,
      newMonthlyPayment: 0,
      interestSaved: Math.round((originalSummary.totalInterest - interestPaidSoFar) * 100) / 100,
      monthsSaved: originalSchedule.length - afterPaymentNumber,
      newSchedule: originalSchedule.filter(p => p.paymentNumber <= afterPaymentNumber),
    };
  }

  // Calculate remaining months and rate info
  const remainingOriginalMonths = mortgage.term_months - afterPaymentNumber;
  const totalBonification = calculateTotalBonification(bonifications);

  // Get the rate that would apply after the extra payment
  const sortedConditions = [...conditions]
    .filter(c => c.interest_rate !== null)
    .sort((a, b) => a.start_month - b.start_month);

  const getRateForMonth = (month: number): number => {
    const condition = sortedConditions.find(
      c => month >= c.start_month && month <= c.end_month
    );
    const baseRate = condition?.interest_rate ?? mortgage.interest_rate;
    return Math.max(0, baseRate - totalBonification);
  };

  // Create modified mortgage for new schedule calculation
  const nextMonth = afterPaymentNumber + 1;
  const currentRate = getRateForMonth(nextMonth);

  let newTermMonths: number;
  let newMonthlyPayment: number;

  if (strategy === 'reduce_payment') {
    // Keep the same term, calculate new lower payment
    newTermMonths = remainingOriginalMonths;
    if (currentRate === 0) {
      newMonthlyPayment = newBalance / newTermMonths;
    } else {
      const monthlyRate = currentRate / 100 / 12;
      newMonthlyPayment = (newBalance * monthlyRate * Math.pow(1 + monthlyRate, newTermMonths)) /
        (Math.pow(1 + monthlyRate, newTermMonths) - 1);
    }
  } else {
    // Keep similar payment, calculate new shorter term
    const originalPayment = originalSchedule[afterPaymentNumber]?.totalPayment ??
      originalSchedule[0]?.totalPayment ?? mortgage.monthly_payment;
    newMonthlyPayment = originalPayment;

    if (currentRate === 0) {
      newTermMonths = Math.ceil(newBalance / newMonthlyPayment);
    } else {
      const monthlyRate = currentRate / 100 / 12;
      // Solve for n: P = (L * r * (1+r)^n) / ((1+r)^n - 1)
      // Rearranging: n = log(P / (P - L*r)) / log(1+r)
      const numerator = newMonthlyPayment;
      const denominator = newMonthlyPayment - newBalance * monthlyRate;
      if (denominator <= 0) {
        // Payment not enough to cover interest, keep original term
        newTermMonths = remainingOriginalMonths;
      } else {
        newTermMonths = Math.ceil(Math.log(numerator / denominator) / Math.log(1 + monthlyRate));
      }
    }
  }

  // Generate new schedule starting from the payment after extra payment
  const newSchedule: AmortizationPayment[] = [];

  // Copy payments before the extra payment
  originalSchedule
    .filter(p => p.paymentNumber <= afterPaymentNumber)
    .forEach(p => newSchedule.push({ ...p }));

  // Generate remaining payments with new balance
  let balance = newBalance;
  const startDate = new Date(mortgage.start_date);
  let paymentNum = afterPaymentNumber + 1;
  let monthsProcessed = 0;

  while (balance > 0.01 && monthsProcessed < newTermMonths) {
    const rate = getRateForMonth(paymentNum);
    const monthlyRate = rate / 100 / 12;

    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + paymentNum - 1);

    let interestPayment: number;
    let principalPayment: number;
    let totalPayment: number;

    if (rate === 0) {
      interestPayment = 0;
      principalPayment = newMonthlyPayment;
      totalPayment = newMonthlyPayment;
    } else {
      interestPayment = balance * monthlyRate;

      if (strategy === 'reduce_term') {
        // Recalculate payment each period when reducing term
        const remainingMonths = newTermMonths - monthsProcessed;
        totalPayment = (balance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
          (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        principalPayment = totalPayment - interestPayment;
      } else {
        principalPayment = newMonthlyPayment - interestPayment;
        totalPayment = newMonthlyPayment;
      }
    }

    // Adjust for final payment
    if (principalPayment > balance) {
      principalPayment = balance;
      totalPayment = principalPayment + interestPayment;
    }

    balance -= principalPayment;

    newSchedule.push({
      paymentNumber: paymentNum,
      date: paymentDate,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      remainingBalance: Math.max(0, Math.round(balance * 100) / 100),
      interestRate: rate,
    });

    paymentNum++;
    monthsProcessed++;
  }

  const newSummary = getScheduleSummary(newSchedule);

  return {
    strategy,
    extraPaymentAmount,
    paymentNumber: afterPaymentNumber,
    originalTotalInterest: originalSummary.totalInterest,
    originalRemainingPayments: originalSchedule.length - afterPaymentNumber,
    originalMonthlyPayment: originalSchedule[afterPaymentNumber]?.totalPayment ?? originalSchedule[0]?.totalPayment ?? 0,
    newTotalInterest: newSummary.totalInterest,
    newRemainingPayments: newSchedule.length - afterPaymentNumber,
    newMonthlyPayment: Math.round(newMonthlyPayment * 100) / 100,
    interestSaved: Math.round((originalSummary.totalInterest - newSummary.totalInterest) * 100) / 100,
    monthsSaved: (originalSchedule.length - afterPaymentNumber) - (newSchedule.length - afterPaymentNumber),
    newSchedule,
  };
}
