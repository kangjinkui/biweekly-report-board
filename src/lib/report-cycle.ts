type CyclePeriods = {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
  currentStartDate: Date;
  currentEndDate: Date;
};

export function formatKoreanDate(date: Date) {
  return `${date.getUTCFullYear()}. ${date.getUTCMonth() + 1}. ${date.getUTCDate()}.`;
}

export function formatKoreanDateRange(startDate: Date, endDate: Date) {
  return `${formatKoreanDate(startDate)} ～ ${formatKoreanDate(endDate)}`;
}

export function formatCyclePeriodSummary(cycle: CyclePeriods) {
  return {
    project: `추진기간 : ${formatKoreanDateRange(cycle.startDate, cycle.endDate)}`,
    previous: `지난주실적(${formatKoreanDateRange(
      cycle.previousStartDate,
      cycle.previousEndDate,
    )})`,
    current: `금주계획(${formatKoreanDateRange(
      cycle.currentStartDate,
      cycle.currentEndDate,
    )})`,
  };
}
