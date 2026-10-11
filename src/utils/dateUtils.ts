/**
 * Utility functions for formatting dates and times in Asia/Aden timezone (UTC+3)
 */

export const TIMEZONE = 'Asia/Aden';

export function formatDateTimeInAden(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat('ar-YE', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDateInAden(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('ar-YE', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatTimeInAden(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('ar-YE', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getNowInAdenISO(): string {
  return new Date().toISOString();
}

/**
 * Accurately calculates cycle boundaries in Asia/Aden timezone,
 * preventing month-overflow bugs (e.g., Jan 31 + 1 month becoming March 3).
 */
export function calculateCycleEnd(startDate: Date, recurrence: 'daily' | 'weekly' | 'monthly' | 'once'): Date {
  const end = new Date(startDate);
  
  switch (recurrence) {
    case 'daily':
      end.setDate(end.getDate() + 1);
      break;

    case 'weekly':
      end.setDate(end.getDate() + 7);
      break;

    case 'monthly': {
      const currentDay = end.getDate();
      // Move to 1st of next month, then find days in that month
      end.setDate(1);
      end.setMonth(end.getMonth() + 1);
      // Days in this new target month
      const daysInTargetMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
      end.setDate(Math.min(currentDay, daysInTargetMonth));
      break;
    }

    case 'once':
      end.setDate(end.getDate() + 30);
      break;
  }

  return end;
}

/**
 * Returns whether a cycle has ended relative to current Aden time
 */
export function isCycleEnded(endDateISO: string): boolean {
  if (!endDateISO) return false;
  const end = new Date(endDateISO);
  if (isNaN(end.getTime())) return false;
  return new Date() >= end;
}
