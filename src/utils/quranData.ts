/**
 * Fully verified metadata for the 30 Juz of the Holy Quran
 * Based on the standard Mushaf al-Madinah an-Nabawiyyah (Hafs 'an 'Asim).
 * Every Surah name, Ayah start number, and Ayah end number has been strictly verified.
 */

export interface QuranJuzInfo {
  juzNumber: number;
  title: string;
  startSurah: string;
  startAyah: number;
  endSurah: string;
  endAyah: number;
  startText: string;
  description: string;
}

/**
 * Normalizes Arabic text for flexible matching (removes diacritics and unifies hamzas)
 */
function normalizeArabicText(str: string): string {
  return str
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel / harakat
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();
}

/**
 * Returns true if the task is a Quran Khatmah or Quran-related reading task,
 * matching by template, name, instructions, or 30-unit count.
 */
export function isQuranTask(task?: { name?: string; instructions?: string; unitTemplate?: string; unitCount?: number } | null): boolean {
  if (!task) return false;
  if (task.unitTemplate === 'quran_30_juz') return true;
  if (task.unitCount === 30) return true;
  
  const normName = normalizeArabicText(task.name || '');
  const normInst = normalizeArabicText(task.instructions || '');
  const combined = `${normName} ${normInst}`;

  const quranKeywords = [
    'قران', 'مصحف', 'ختمه', 'ورد', 'اجزاء', 'جزء', 'تلاوه', 'سوره', 'قراءه'
  ];

  return quranKeywords.some(keyword => combined.includes(keyword));
}

export const QURAN_30_JUZ: QuranJuzInfo[] = [
  {
    juzNumber: 1,
    title: "الجزء الأول (الم)",
    startSurah: "الفاتحة",
    startAyah: 1,
    endSurah: "البقرة",
    endAyah: 141,
    startText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    description: "من سورة الفاتحة (آية 1) إلى سورة البقرة (آية 141)"
  },
  {
    juzNumber: 2,
    title: "الجزء الثاني (سيقول)",
    startSurah: "البقرة",
    startAyah: 142,
    endSurah: "البقرة",
    endAyah: 252,
    startText: "سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ",
    description: "سورة البقرة: من آية 142 إلى آية 252"
  },
  {
    juzNumber: 3,
    title: "الجزء الثالث (تلك الرسل)",
    startSurah: "البقرة",
    startAyah: 253,
    endSurah: "آل عمران",
    endAyah: 92,
    startText: "تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ",
    description: "من سورة البقرة (آية 253) إلى سورة آل عمران (آية 92)"
  },
  {
    juzNumber: 4,
    title: "الجزء الرابع (لن تنالوا)",
    startSurah: "آل عمران",
    startAyah: 93,
    endSurah: "النساء",
    endAyah: 23,
    startText: "كُلُّ الطَّعَامِ كَانَ حِلًّا لِّبَنِي إِسْرَائِيلَ",
    description: "من سورة آل عمران (آية 93) إلى سورة النساء (آية 23)"
  },
  {
    juzNumber: 5,
    title: "الجزء الخامس (والمحصنات)",
    startSurah: "النساء",
    startAyah: 24,
    endSurah: "النساء",
    endAyah: 147,
    startText: "وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ إِلَّا مَا مَلَكَتْ أَيْمَانُكُمْ",
    description: "سورة النساء: من آية 24 إلى آية 147"
  },
  {
    juzNumber: 6,
    title: "الجزء السادس (لا يحب الله)",
    startSurah: "النساء",
    startAyah: 148,
    endSurah: "المائدة",
    endAyah: 81,
    startText: "لَّا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ مِنَ الْقَوْلِ",
    description: "من سورة النساء (آية 148) إلى سورة المائدة (آية 81)"
  },
  {
    juzNumber: 7,
    title: "الجزء السابع (وإذا سمعوا)",
    startSurah: "المائدة",
    startAyah: 82,
    endSurah: "الأنعام",
    endAyah: 110,
    startText: "لَتَجِدَنَّ أَشَدَّ النَّاسِ عَدَاوَةً لِّلَّذِينَ آمَنُوا الْيَهُودَ",
    description: "من سورة المائدة (آية 82) إلى سورة الأنعام (آية 110)"
  },
  {
    juzNumber: 8,
    title: "الجزء الثامن (ولو أننا)",
    startSurah: "الأنعام",
    startAyah: 111,
    endSurah: "الأعراف",
    endAyah: 87,
    startText: "وَلَوْ أَنَّنَا نَزَّلْنَا إِلَيْهِمُ الْمَلَائِكَةَ",
    description: "من سورة الأنعام (آية 111) إلى سورة الأعراف (آية 87)"
  },
  {
    juzNumber: 9,
    title: "الجزء التاسع (قال الملأ)",
    startSurah: "الأعراف",
    startAyah: 88,
    endSurah: "الأنفال",
    endAyah: 40,
    startText: "قَالَ الْمَلَأُ الَّذِينَ اسْتَكْبَرُوا مِن قَوْمِهِ",
    description: "من سورة الأعراف (آية 88) إلى سورة الأنفال (آية 40)"
  },
  {
    juzNumber: 10,
    title: "الجزء العاشر (واعلموا)",
    startSurah: "الأنفال",
    startAyah: 41,
    endSurah: "التوبة",
    endAyah: 92,
    startText: "وَاعْلَمُوا أَنَّمَا غَنِمْتُم مِّن شَيْءٍ فَأَنَّ لِلَّهِ خُمُسَهُ",
    description: "من سورة الأنفال (آية 41) إلى سورة التوبة (آية 92)"
  },
  {
    juzNumber: 11,
    title: "الجزء الحادي عشر (يعتذرون)",
    startSurah: "التوبة",
    startAyah: 93,
    endSurah: "هود",
    endAyah: 5,
    startText: "إِنَّمَا السَّبِيلُ عَلَى الَّذِينَ يَسْتَأْذِنُونَكَ وَهُمْ أَغْنِيَاءُ",
    description: "من سورة التوبة (آية 93) إلى سورة هود (آية 5)"
  },
  {
    juzNumber: 12,
    title: "الجزء الثاني عشر (وما من دابة)",
    startSurah: "هود",
    startAyah: 6,
    endSurah: "يوسف",
    endAyah: 52,
    startText: "وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا",
    description: "من سورة هود (آية 6) إلى سورة يوسف (آية 52)"
  },
  {
    juzNumber: 13,
    title: "الجزء الثالث عشر (وما أبرئ)",
    startSurah: "يوسف",
    startAyah: 53,
    endSurah: "إبراهيم",
    endAyah: 52,
    startText: "وَمَا أُبَرِّئُ نَفْسِي إِنَّ النَّفْسَ لَأَمَّارَةٌ بِالسُّوءِ",
    description: "من سورة يوسف (آية 53) إلى سورة إبراهيم (آية 52)"
  },
  {
    juzNumber: 14,
    title: "الجزء الرابع عشر (ربما)",
    startSurah: "الحجر",
    startAyah: 1,
    endSurah: "النحل",
    endAyah: 128,
    startText: "الر تِلْكَ آيَاتُ الْكِتَابِ وَقُرْآنٍ مُّبِينٍ",
    description: "من سورة الحجر (آية 1) إلى نهاية سورة النحل (آية 128)"
  },
  {
    juzNumber: 15,
    title: "الجزء الخامس عشر (سبحان الذي)",
    startSurah: "الإسراء",
    startAyah: 1,
    endSurah: "الكهف",
    endAyah: 74,
    startText: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا",
    description: "من سورة الإسراء (آية 1) إلى سورة الكهف (آية 74)"
  },
  {
    juzNumber: 16,
    title: "الجزء السادس عشر (قال ألم)",
    startSurah: "الكهف",
    startAyah: 75,
    endSurah: "طه",
    endAyah: 135,
    startText: "قَالَ أَلَمْ أَقُل لَّكَ إِنَّكَ لَن تَسْتَطِيعَ مَعِيَ صَبْرًا",
    description: "من سورة الكهف (آية 75) إلى نهاية سورة طه (آية 135)"
  },
  {
    juzNumber: 17,
    title: "الجزء السابع عشر (اقترب)",
    startSurah: "الأنبياء",
    startAyah: 1,
    endSurah: "الحج",
    endAyah: 78,
    startText: "اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ وَهُمْ فِي غَفْلَةٍ مُّعْرِضُونَ",
    description: "من سورة الأنبياء (آية 1) إلى نهاية سورة الحج (آية 78)"
  },
  {
    juzNumber: 18,
    title: "الجزء الثامن عشر (قد أفلح)",
    startSurah: "المؤمنون",
    startAyah: 1,
    endSurah: "الفرقان",
    endAyah: 20,
    startText: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ",
    description: "من سورة المؤمنون (آية 1) إلى سورة الفرقان (آية 20)"
  },
  {
    juzNumber: 19,
    title: "الجزء التاسع عشر (وقال الذين)",
    startSurah: "الفرقان",
    startAyah: 21,
    endSurah: "النمل",
    endAyah: 55,
    startText: "وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا لَوْلَا أُنزِلَ عَلَيْنَا الْمَلَائِكَةُ",
    description: "من سورة الفرقان (آية 21) إلى سورة النمل (آية 55)"
  },
  {
    juzNumber: 20,
    title: "الجزء العشرون (فما كان)",
    startSurah: "النمل",
    startAyah: 56,
    endSurah: "العنكبوت",
    endAyah: 45,
    startText: "فَمَا كَانَ جَوَابَ قَوْمِهِ إِلَّا أَن قَالُوا أَخْرِجُوا آلَ لُوطٍ",
    description: "من سورة النمل (آية 56) إلى سورة العنكبوت (آية 45)"
  },
  {
    juzNumber: 21,
    title: "الجزء الحادي والعشرون (اتل ما أوحي)",
    startSurah: "العنكبوت",
    startAyah: 46,
    endSurah: "الأحزاب",
    endAyah: 30,
    startText: "وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ إِلَّا بِالَّتِي هِيَ أَحْسَنُ",
    description: "من سورة العنكبوت (آية 46) إلى سورة الأحزاب (آية 30)"
  },
  {
    juzNumber: 22,
    title: "الجزء الثاني والعشرون (ومن يقنت)",
    startSurah: "الأحزاب",
    startAyah: 31,
    endSurah: "يس",
    endAyah: 27,
    startText: "وَمَن يَقْنُتْ مِنكُنَّ لِلَّهِ وَرَسُولِهِ وَتَعْمَلْ صَالِحًا",
    description: "من سورة الأحزاب (آية 31) إلى سورة يس (آية 27)"
  },
  {
    juzNumber: 23,
    title: "الجزء الثالث والعشرون (وما أنزلنا)",
    startSurah: "يس",
    startAyah: 28,
    endSurah: "الزمر",
    endAyah: 31,
    startText: "وَمَا أَنزَلْنَا عَلَىٰ قَوْمِهِ مِن بَعْدِهِ مِن جُندٍ مِّنَ السَّمَاءِ",
    description: "من سورة يس (آية 28) إلى سورة الزمر (آية 31)"
  },
  {
    juzNumber: 24,
    title: "الجزء الرابع والعشرون (فمن أظلم)",
    startSurah: "الزمر",
    startAyah: 32,
    endSurah: "فصلت",
    endAyah: 46,
    startText: "فَمَنْ أَظْلَمُ مِمَّن كَذَبَ عَلَى اللَّهِ وَكَذَّبَ بِالصِّدْقِ",
    description: "من سورة الزمر (آية 32) إلى سورة فصلت (آية 46)"
  },
  {
    juzNumber: 25,
    title: "الجزء الخامس والعشرون (إليه يرد)",
    startSurah: "فصلت",
    startAyah: 47,
    endSurah: "الجاثية",
    endAyah: 37,
    startText: "إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ",
    description: "من سورة فصلت (آية 47) إلى نهاية سورة الجاثية (آية 37)"
  },
  {
    juzNumber: 26,
    title: "الجزء السادس والعشرون (حم)",
    startSurah: "الأحقاف",
    startAyah: 1,
    endSurah: "الذاريات",
    endAyah: 30,
    startText: "حم تَنزِيلُ الْكِتَابِ مِنَ اللَّهِ الْعَزِيزِ الْحَكِيمِ",
    description: "من سورة الأحقاف (آية 1) إلى سورة الذاريات (آية 30)"
  },
  {
    juzNumber: 27,
    title: "الجزء السابع والعشرون (قال فما خطبكم)",
    startSurah: "الذاريات",
    startAyah: 31,
    endSurah: "الحديد",
    endAyah: 29,
    startText: "قَالَ فَمَا خَطْبُكُمْ أَيُّهَا الْمُرْسَلُونَ",
    description: "من سورة الذاريات (آية 31) إلى نهاية سورة الحديد (آية 29)"
  },
  {
    juzNumber: 28,
    title: "الجزء الثامن والعشرون (قد سمع)",
    startSurah: "المجادلة",
    startAyah: 1,
    endSurah: "التحريم",
    endAyah: 12,
    startText: "قَدْ سَمِعَ اللَّهُ قَوْلَ الَّتِي تُجَادِلُكَ فِي زَوْجِهَا",
    description: "من سورة المجادلة (آية 1) إلى نهاية سورة التحريم (آية 12)"
  },
  {
    juzNumber: 29,
    title: "الجزء التاسع والعشرون (تبارك)",
    startSurah: "الملك",
    startAyah: 1,
    endSurah: "المرسلات",
    endAyah: 50,
    startText: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    description: "من سورة الملك (آية 1) إلى نهاية سورة المرسلات (آية 50)"
  },
  {
    juzNumber: 30,
    title: "الجزء الثلاثون (عمّ)",
    startSurah: "النبأ",
    startAyah: 1,
    endSurah: "الناس",
    endAyah: 6,
    startText: "عَمَّ يَتَسَاءَلُونَ عَنِ النَّبَإِ الْعَظِيمِ",
    description: "من سورة النبأ (آية 1) إلى نهاية سورة الناس (آية 6)"
  }
];
