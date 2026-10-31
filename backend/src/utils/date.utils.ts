import { BillingInterval } from "@prisma/client";

/**
 * Checks if a given year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns number of days in a specific month of a specific year (0-indexed month)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Add billing interval to a date with leap year and month-end clamping
 */
export function calculateNextBillingDate(
  startDate: Date,
  interval: BillingInterval
): Date {
  const result = new Date(startDate.getTime());

  switch (interval) {
    case BillingInterval.DAILY:
      result.setDate(result.getDate() + 1);
      return result;

    case BillingInterval.WEEKLY:
      result.setDate(result.getDate() + 7);
      return result;

    case BillingInterval.MONTHLY:
      return addMonthsClamped(result, 1);

    case BillingInterval.QUARTERLY:
      return addMonthsClamped(result, 3);

    case BillingInterval.HALF_YEARLY:
      return addMonthsClamped(result, 6);

    case BillingInterval.YEARLY:
      return addMonthsClamped(result, 12);

    default:
      return addMonthsClamped(result, 1);
  }
}

/**
 * Safely adds months to a date, clamping day to end of month if destination month has fewer days.
 * E.g. Jan 31 + 1 month = Feb 28 (or Feb 29 in leap year).
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date.getTime());
  const originalDay = target.getDate();

  target.setDate(1);
  target.setMonth(target.getMonth() + months);

  const daysInTargetMonth = getDaysInMonth(
    target.getFullYear(),
    target.getMonth()
  );
  target.setDate(Math.min(originalDay, daysInTargetMonth));

  return target;
}

