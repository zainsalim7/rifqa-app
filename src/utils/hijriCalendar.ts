/**
 * Hijri (Islamic/Arabic) Calendar helper utilities
 * Computes dates, Hijri month names, and cycle boundaries based on the Umm al-Qura calendar.
 */

export interface HijriDateInfo {
  day: number;
  monthNumber: number;
  monthName: string;
  year: number;
  formattedArabic: string;
}

export const HIJRI_MONTH_NAMES = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

/**
 * Returns formatted current Hijri date information
 */
export function getHijriDate(date: Date = new Date()): HijriDateInfo {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    
    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const monthNumber = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1448', 10);

    const monthName = HIJRI_MONTH_NAMES[monthNumber - 1] || `شهر ${monthNumber}`;

    const arabicFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      day,
      monthNumber,
      monthName,
      year,
      formattedArabic: arabicFormatter.format(date)
    };
  } catch (e) {
    // Fallback if Intl calendar extension is unsupported
    return {
      day: 1,
      monthNumber: 1,
      monthName: 'شهر عربي',
      year: 1448,
      formattedArabic: 'الشهر الهجري الحالي'
    };
  }
}

/**
 * Calculates approximately when the current Hijri month ends
 * Hijri months have 29 or 30 days.
 * If today is day D of Hijri month, end of month is in (30 - D) days.
 */
export function calculateHijriMonthEnd(startDate: Date = new Date()): Date {
  const hijri = getHijriDate(startDate);
  const daysRemaining = Math.max(1, 30 - hijri.day);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysRemaining);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
}

/**
 * Checks if the current Hijri month has advanced since a previous start date
 */
export function isHijriMonthEnded(startDateISO: string, endDateISO?: string): boolean {
  if (endDateISO) {
    const end = new Date(endDateISO);
    if (!isNaN(end.getTime()) && new Date() >= end) {
      return true;
    }
  }

  const start = new Date(startDateISO);
  if (isNaN(start.getTime())) return false;

  const currentHijri = getHijriDate(new Date());
  const startHijri = getHijriDate(start);

  // Month or year changed
  if (currentHijri.year > startHijri.year) return true;
  if (currentHijri.year === startHijri.year && currentHijri.monthNumber > startHijri.monthNumber) return true;

  return false;
}
