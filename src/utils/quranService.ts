import { QURAN_30_JUZ, QuranJuzInfo } from './quranData';

export interface QuranAyah {
  number: number;
  numberInSurah: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    numberOfAyahs: number;
  };
  juz: number;
  page?: number;
}

export interface JuzContent {
  juzNumber: number;
  info: QuranJuzInfo;
  ayahs: QuranAyah[];
}

export interface ReadingBookmark {
  taskId: string;
  cycleNumber: number;
  unitNumber: number;
  lastAyahNumber: number;
  lastAyahIndex: number;
  totalAyahs: number;
  surahName: string;
  progressPercent: number;
  scrollTop?: number;
  pageNumber?: number;
  autoScrollSpeed?: number;
  updatedAt: string;
}

const STORAGE_PREFIX = 'quran_juz_v1_';
const BOOKMARK_PREFIX = 'quran_bookmark_';
const memoryCache: Record<number, JuzContent> = {};

/**
 * Fetches full text for a given Juz with localStorage caching and memory caching
 */
export async function fetchJuzContent(juzNumber: number): Promise<JuzContent> {
  const info = QURAN_30_JUZ.find(j => j.juzNumber === juzNumber) || QURAN_30_JUZ[0];

  // 1. Check in-memory cache first
  if (memoryCache[juzNumber]) {
    return memoryCache[juzNumber];
  }

  // 2. Try localStorage cached version
  try {
    const cached = localStorage.getItem(`${STORAGE_PREFIX}${juzNumber}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.ayahs) && parsed.ayahs.length > 0) {
        const result: JuzContent = {
          juzNumber,
          info,
          ayahs: parsed.ayahs,
        };
        memoryCache[juzNumber] = result;
        return result;
      }
    }
  } catch (e) {
    console.warn('Failed reading from localStorage', e);
  }

  // 3. Fetch from Al-Quran Cloud API (Uthmani authentic script)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && data.data && Array.isArray(data.data.ayahs)) {
        const ayahs: QuranAyah[] = data.data.ayahs;
        
        // Cache in localStorage safely
        try {
          localStorage.setItem(
            `${STORAGE_PREFIX}${juzNumber}`,
            JSON.stringify({ juzNumber, ayahs })
          );
        } catch (storageErr) {
          console.warn('Storage quota full or disabled', storageErr);
        }

        const result: JuzContent = {
          juzNumber,
          info,
          ayahs,
        };
        memoryCache[juzNumber] = result;
        return result;
      }
    }
  } catch (err) {
    console.error(`Error fetching Juz ${juzNumber}:`, err);
  }

  // Fallback if offline/API down
  const fallbackAyahs: QuranAyah[] = [
    {
      number: 1,
      numberInSurah: info.startAyah,
      text: info.startText,
      surah: {
        number: 1,
        name: info.startSurah,
        englishName: 'Surah',
        numberOfAyahs: 100,
      },
      juz: juzNumber,
      page: 1,
    },
    {
      number: 2,
      numberInSurah: info.startAyah + 1,
      text: `ورد ${info.title} - ${info.description} (يمكن قراءته من المصحف الشريف المطبوع أيضاً، أو إعادة المحاولة عند توفر الاتصال بالإنترنت)`,
      surah: {
        number: 1,
        name: info.startSurah,
        englishName: 'Surah',
        numberOfAyahs: 100,
      },
      juz: juzNumber,
      page: 1,
    }
  ];

  return {
    juzNumber,
    info,
    ayahs: fallbackAyahs,
  };
}

/**
 * Saves reading position for a specific user and task unit
 */
export function saveReadingBookmark(
  taskId: string,
  cycleNumber: number,
  unitNumber: number,
  lastAyahNumber: number,
  lastAyahIndex: number,
  totalAyahs: number,
  surahName: string,
  scrollTop?: number,
  pageNumber?: number,
  autoScrollSpeed?: number
): void {
  try {
    const key = `${BOOKMARK_PREFIX}${taskId}_${cycleNumber}_${unitNumber}`;
    const juzKey = `${BOOKMARK_PREFIX}juz_${unitNumber}`;
    const progressPercent = totalAyahs > 0 ? Math.round(((lastAyahIndex + 1) / totalAyahs) * 100) : 0;
    const bookmark: ReadingBookmark = {
      taskId,
      cycleNumber,
      unitNumber,
      lastAyahNumber,
      lastAyahIndex,
      totalAyahs,
      surahName,
      progressPercent: Math.min(100, progressPercent),
      scrollTop,
      pageNumber,
      autoScrollSpeed,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(bookmark));
    localStorage.setItem(juzKey, JSON.stringify(bookmark));
    // Also save as latest active bookmark across the whole app
    localStorage.setItem('quran_latest_active_bookmark', JSON.stringify(bookmark));
  } catch (e) {
    console.warn('Could not save reading bookmark', e);
  }
}

/**
 * Gets saved reading bookmark
 */
export function getReadingBookmark(
  taskId: string,
  cycleNumber: number,
  unitNumber: number
): ReadingBookmark | null {
  try {
    const key = `${BOOKMARK_PREFIX}${taskId}_${cycleNumber}_${unitNumber}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    // Fallback to Juz-level bookmark
    const juzData = localStorage.getItem(`${BOOKMARK_PREFIX}juz_${unitNumber}`);
    if (juzData) {
      return JSON.parse(juzData);
    }
  } catch (e) {
    console.warn('Could not get reading bookmark', e);
  }
  return null;
}

/**
 * Gets the latest active bookmark anywhere in the app
 */
export function getLatestActiveBookmark(): ReadingBookmark | null {
  try {
    const data = localStorage.getItem('quran_latest_active_bookmark');
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Could not get latest active bookmark', e);
  }
  return null;
}
