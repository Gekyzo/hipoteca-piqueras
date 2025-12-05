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
