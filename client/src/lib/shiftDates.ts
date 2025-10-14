import { startOfWeek, endOfWeek, addWeeks as dateFnsAddWeeks, isSameDay as dateFnsIsSameDay } from "date-fns";

export interface WeekRange {
  start: Date;
  end: Date;
}

/**
 * Gets the start and end dates of the week containing the given date
 * Week starts on Monday
 */
export function getWeekRange(date: Date): WeekRange {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  
  return { start, end };
}

/**
 * Adds or subtracts weeks from a date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return dateFnsAddWeeks(date, weeks);
}

/**
 * Checks if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return dateFnsIsSameDay(date1, date2);
}
