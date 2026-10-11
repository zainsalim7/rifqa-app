import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  CheckCircle2, 
  Bookmark, 
  RotateCcw, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Moon, 
  Sun, 
  BookOpen, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Check,
  Play,
  Pause,
  Plus,
  Minus,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { fetchJuzContent, saveReadingBookmark, getReadingBookmark, JuzContent, QuranAyah } from '../utils/quranService';
import { QURAN_30_JUZ } from '../utils/quranData';

interface QuranReaderModalProps {
  juzNumber: number;
  taskId: string;
  cycleNumber: number;
  unitNumber: number;
  isCompleted: boolean;
  onMarkComplete: (taskId: string, cycleNumber: number, unitNumber: number) => Promise<void>;
  onUndoComplete?: (taskId: string, cycleNumber: number, unitNumber: number) => Promise<void>;
  onClose: () => void;
}

export const SPEED_CONFIG: { [level: number]: { label: string; desc: string; pxPerSec: number } } = {
  1: { label: 'بطيء جداً', desc: 'تلاوة وتدبّر', pxPerSec: 16 },
  2: { label: 'بطيء', desc: 'قراءة ميسرة هادئة', pxPerSec: 28 },
  3: { label: 'متوسط', desc: 'قراءة معتدلة', pxPerSec: 46 },
  4: { label: 'سريع', desc: 'قراءة سريعة', pxPerSec: 72 },
  5: { label: 'حدر', desc: 'أقصى سرعة', pxPerSec: 110 },
};

export const QuranReaderModal: React.FC<QuranReaderModalProps> = ({
  juzNumber,
  taskId,
  cycleNumber,
  unitNumber,
  isCompleted,
  onMarkComplete,
  onUndoComplete,
  onClose,
}) => {
  const [juzData, setJuzData] = useState<JuzContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('quran_reader_fontsize');
    return saved ? parseInt(saved, 10) : 22;
  });
  const [theme, setTheme] = useState<'parchment' | 'dark' | 'light'>(() => {
    const saved = localStorage.getItem('quran_reader_theme');
    return (saved as any) || 'parchment';
  });
  const [autoCompleteOnEnd, setAutoCompleteOnEnd] = useState<boolean>(() => {
    return localStorage.getItem('quran_auto_complete_enabled') !== 'false';
  });

  // Auto-Scroll States (Requirement: تشغيل الصفحات بالتمرير إلى أعلى بسرعات تناسب سرعة قراءتنا)
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('quran_autoscroll_speed');
    return saved ? parseInt(saved, 10) : 2;
  });

  // Reading position & bookmark restoration (Requirement: حفظ مرجع القراءة والصفحة بدقة عند الخروج)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [savedBookmark, setSavedBookmark] = useState<{ ayahIndex: number; surahName: string; ayahNumber: number; pageNumber?: number } | null>(null);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);
  const [manualSavedNotice, setManualSavedNotice] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [submittingComplete, setSubmittingComplete] = useState(false);
  const [showCompleteSuccessModal, setShowCompleteSuccessModal] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0); // Subpixel accumulator to prevent auto-scroll stalling
  const ayahRefs = useRef<{ [key: number]: HTMLElement | null }>({});
  const saveTimeoutRef = useRef<any>(null);
  const lastPeriodicSaveRef = useRef<number>(Date.now());

  const juzMeta = QURAN_30_JUZ.find(j => j.juzNumber === juzNumber) || QURAN_30_JUZ[0];

  // Helper to save current reading position and current page
  const saveCurrentPosition = useCallback(() => {
    if (!contentRef.current || !juzData || juzData.ayahs.length === 0) return;

    const scrollTop = contentRef.current.scrollTop;
    const containerRect = contentRef.current.getBoundingClientRect();

    // Find the ayah element currently closest to the viewing top of container
    let bestIndex = currentAyahIndex;
    let minDiff = Infinity;

    juzData.ayahs.forEach((ayah, index) => {
      const el = ayahRefs.current[index];
      if (el) {
        const rect = el.getBoundingClientRect();
        const diff = Math.abs(rect.top - containerRect.top);
        if (rect.top >= containerRect.top - 80 && diff < minDiff) {
          minDiff = diff;
          bestIndex = index;
        }
      }
    });

    const activeAyah = juzData.ayahs[bestIndex] || juzData.ayahs[0];
    setCurrentAyahIndex(bestIndex);
    if (activeAyah.page) {
      setCurrentPage(activeAyah.page);
    }

    saveReadingBookmark(
      taskId,
      cycleNumber,
      unitNumber,
      activeAyah.numberInSurah,
      bestIndex,
      juzData.ayahs.length,
      activeAyah.surah.name,
      scrollTop,
      activeAyah.page,
      scrollSpeed
    );

    setSavedBookmark({
      ayahIndex: bestIndex,
      surahName: activeAyah.surah.name,
      ayahNumber: activeAyah.numberInSurah,
      pageNumber: activeAyah.page,
    });
  }, [currentAyahIndex, juzData, taskId, cycleNumber, unitNumber, scrollSpeed]);

  // Load Juz content and restore bookmark
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchJuzContent(juzNumber).then(data => {
      if (!isMounted) return;
      setJuzData(data);
      setLoading(false);

      if (data.ayahs.length > 0 && data.ayahs[0].page) {
        setCurrentPage(data.ayahs[0].page);
      }

      // Check saved bookmark for this task & unit (Requirement: حفظ تلك الصفحة مرجع لقراءتي)
      const bookmark = getReadingBookmark(taskId, cycleNumber, unitNumber);
      if (bookmark) {
        setSavedBookmark({
          ayahIndex: bookmark.lastAyahIndex,
          surahName: bookmark.surahName,
          ayahNumber: bookmark.lastAyahNumber,
          pageNumber: bookmark.pageNumber,
        });

        if (bookmark.pageNumber) {
          setCurrentPage(bookmark.pageNumber);
        }

        if (bookmark.autoScrollSpeed) {
          setScrollSpeed(bookmark.autoScrollSpeed);
        }

        // Automatically scroll to the exact saved page & position!
        setTimeout(() => {
          if (!isMounted || !contentRef.current) return;
          if (bookmark.scrollTop && bookmark.scrollTop > 30) {
            contentRef.current.scrollTop = bookmark.scrollTop;
            scrollPosRef.current = bookmark.scrollTop;
          } else if (bookmark.lastAyahIndex > 0) {
            const el = ayahRefs.current[bookmark.lastAyahIndex];
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => {
                if (contentRef.current) {
                  scrollPosRef.current = contentRef.current.scrollTop;
                }
              }, 200);
            }
          }

          const pageText = bookmark.pageNumber ? `(صفحة ${bookmark.pageNumber}) ` : '';
          setRestoredNotice(
            `📌 تم استئناف قراءتك من حيث توقفت: ${pageText}سورة ${bookmark.surahName} (الآية ${bookmark.lastAyahNumber})`
          );
          setTimeout(() => {
            if (isMounted) setRestoredNotice(null);
          }, 7000);
        }, 350);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [juzNumber, taskId, cycleNumber, unitNumber]);

  // Save bookmark immediately when user leaves app or tab or when unmounting
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentPosition();
        setIsAutoScrolling(false);
      }
    };

    const handleBeforeUnload = () => {
      saveCurrentPosition();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Save position upon modal unmount or exit
      saveCurrentPosition();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveCurrentPosition]);

  // Smooth Auto-Scrolling animation loop (Requirement: تشغيل الصفحات بالتمرير إلى أعلى بسرعات تناسب القراءة)
  useEffect(() => {
    if (!isAutoScrolling) return;

    let animId: number;
    let lastTime = performance.now();

    // Initialize accumulator to current scroll
    if (contentRef.current) {
      scrollPosRef.current = contentRef.current.scrollTop;
    }

    const scrollStep = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (contentRef.current) {
        const speedSetting = SPEED_CONFIG[scrollSpeed] || SPEED_CONFIG[2];
        const pxToScroll = speedSetting.pxPerSec * deltaTime;
        
        // Accumulate sub-pixels smoothly
        scrollPosRef.current += pxToScroll;
        contentRef.current.scrollTop = scrollPosRef.current;

        // Periodic bookmark save during auto-scroll every 1.5 seconds
        if (Date.now() - lastPeriodicSaveRef.current > 1500) {
          lastPeriodicSaveRef.current = Date.now();
          saveCurrentPosition();
        }

        // Check if reached end of content
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          setIsAutoScrolling(false);
          setReachedEnd(true);
          if (autoCompleteOnEnd && !isCompleted && !submittingComplete) {
            triggerCompletion(true);
          }
          return;
        }
      }

      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isAutoScrolling, scrollSpeed, autoCompleteOnEnd, isCompleted, submittingComplete, saveCurrentPosition]);

  // Quick page jumps: Next and Previous Mushaf page
  const goToNextPage = () => {
    if (!juzData) return;
    const nextAyah = juzData.ayahs.find(a => (a.page || 0) > currentPage);
    if (nextAyah) {
      const idx = juzData.ayahs.indexOf(nextAyah);
      const el = ayahRefs.current[idx];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(nextAyah.page || currentPage + 1);
      }
    }
  };

  const goToPrevPage = () => {
    if (!juzData) return;
    const prevAyah = [...juzData.ayahs].reverse().find(a => (a.page || 0) < currentPage);
    if (prevAyah) {
      const idx = juzData.ayahs.indexOf(prevAyah);
      const el = ayahRefs.current[idx];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentPage(prevAyah.page || Math.max(1, currentPage - 1));
      }
    }
  };

  const handleManualSave = () => {
    saveCurrentPosition();
    setManualSavedNotice(`✓ تم حفظ صفحة ${currentPage} كمرجع لقراءتك بنجاح 🔖`);
    setTimeout(() => {
      setManualSavedNotice(null);
    }, 4000);
  };

  // Auto-scroll Speed controls
  const changeSpeed = (delta: number) => {
    setScrollSpeed(prev => {
      const next = Math.min(5, Math.max(1, prev + delta));
      localStorage.setItem('quran_autoscroll_speed', next.toString());
      return next;
    });
  };

  const toggleAutoScroll = () => {
    setIsAutoScrolling(prev => !prev);
  };

  // Font size adjustments
  const changeFontSize = (delta: number) => {
    setFontSize(prev => {
      const next = Math.min(34, Math.max(16, prev + delta));
      localStorage.setItem('quran_reader_fontsize', next.toString());
      return next;
    });
  };

  const changeTheme = (newTheme: 'parchment' | 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('quran_reader_theme', newTheme);
  };

  const toggleAutoComplete = () => {
    setAutoCompleteOnEnd(prev => {
      const next = !prev;
      localStorage.setItem('quran_auto_complete_enabled', next ? 'true' : 'false');
      return next;
    });
  };

  // Jump to saved bookmark
  const jumpToSavedBookmark = () => {
    if (!savedBookmark) return;
    const el = ayahRefs.current[savedBookmark.ayahIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle Ayah Click / Manual bookmark
  const handleAyahClick = (index: number, ayah: QuranAyah) => {
    setCurrentAyahIndex(index);
    if (!juzData || !contentRef.current) return;

    saveReadingBookmark(
      taskId,
      cycleNumber,
      unitNumber,
      ayah.numberInSurah,
      index,
      juzData.ayahs.length,
      ayah.surah.name,
      contentRef.current.scrollTop,
      ayah.page,
      scrollSpeed
    );

    setSavedBookmark({
      ayahIndex: index,
      surahName: ayah.surah.name,
      ayahNumber: ayah.numberInSurah,
    });
  };

  // Handle Manual Scroll: debounce save reading position
  const handleScroll = () => {
    if (!contentRef.current || !juzData || juzData.ayahs.length === 0) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    scrollPosRef.current = scrollTop;
    
    // Check if scrolled near the bottom
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (!reachedEnd) {
        setReachedEnd(true);
        if (autoCompleteOnEnd && !isCompleted && !submittingComplete) {
          triggerCompletion(true);
        }
      }
    }

    // Debounced position saving while user is scrolling
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentPosition();
    }, 500);
  };

  const handleClose = () => {
    saveCurrentPosition();
    setIsAutoScrolling(false);
    onClose();
  };

  const triggerCompletion = async (isAuto: boolean = false) => {
    if (isCompleted || submittingComplete) return;
    try {
      setSubmittingComplete(true);
      await onMarkComplete(taskId, cycleNumber, unitNumber);
      setShowCompleteSuccessModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComplete(false);
    }
  };

  // Group ayahs by Surah for pristine Quran presentation
  const groupedSurahs: { surahName: string; surahNumber: number; ayahs: { ayah: QuranAyah; index: number }[] }[] = [];
  if (juzData && juzData.ayahs) {
    let currentSurahNum = -1;
    let currentGroup: { surahName: string; surahNumber: number; ayahs: { ayah: QuranAyah; index: number }[] } | null = null;

    juzData.ayahs.forEach((ayah, index) => {
      if (ayah.surah.number !== currentSurahNum) {
        currentSurahNum = ayah.surah.number;
        currentGroup = {
          surahName: ayah.surah.name,
          surahNumber: ayah.surah.number,
          ayahs: []
        };
        groupedSurahs.push(currentGroup);
      }
      currentGroup?.ayahs.push({ ayah, index });
    });
  }

  const totalAyahs = juzData?.ayahs.length || 0;
  const progressPercent = totalAyahs > 0 ? Math.min(100, Math.round(((currentAyahIndex + 1) / totalAyahs) * 100)) : 0;

  // Colors based on theme
  const themeClasses = {
    parchment: {
      wrapper: 'bg-[#fbf7ee] text-stone-900',
      header: 'bg-[#f4ebd9] text-stone-900 border-[#e3d5be]',
      surahHeader: 'bg-gradient-to-r from-[#eadecc] via-[#f5ede2] to-[#eadecc] border-[#d8c5aa] text-amber-950',
      bismillah: 'text-amber-900',
      ayahText: 'text-[#2a241e]',
      ayahEnd: 'text-amber-700 bg-amber-100/60 border-amber-300',
      activeAyah: 'bg-amber-200/40 rounded-xl',
      footer: 'bg-[#f4ebd9] border-[#e3d5be]',
    },
    dark: {
      wrapper: 'bg-[#18181b] text-stone-100',
      header: 'bg-[#27272a] text-stone-100 border-zinc-700',
      surahHeader: 'bg-zinc-800 border-zinc-700 text-amber-300',
      bismillah: 'text-amber-300',
      ayahText: 'text-zinc-100',
      ayahEnd: 'text-amber-400 bg-zinc-800 border-zinc-600',
      activeAyah: 'bg-zinc-800/80 rounded-xl',
      footer: 'bg-[#27272a] border-zinc-700',
    },
    light: {
      wrapper: 'bg-white text-stone-900',
      header: 'bg-stone-100 text-stone-900 border-stone-200',
      surahHeader: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      bismillah: 'text-emerald-800',
      ayahText: 'text-stone-900',
      ayahEnd: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      activeAyah: 'bg-emerald-50/80 rounded-xl',
      footer: 'bg-stone-50 border-stone-200',
    }
  }[theme];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-0 md:p-3 overflow-hidden select-none">
      <div className={`w-full max-w-4xl h-full md:h-[95vh] flex flex-col shadow-2xl md:rounded-3xl border border-stone-300/40 overflow-hidden relative ${themeClasses.wrapper}`}>
        
        {/* Top App Bar / Reader Header */}
        <div className={`p-3 md:p-4 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${themeClasses.header}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl hover:bg-black/10 transition text-stone-700"
              title="إغلاق وحفظ المرجع"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-bold">
                  الجزء {juzNumber}
                </span>
                {currentPage > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-950 dark:text-amber-200 font-bold border border-amber-500/40 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                    <span>صفحة {currentPage}</span>
                  </span>
                )}
                <h2 className="text-sm md:text-base font-bold font-amiri line-clamp-1">
                  {juzMeta.title}
                </h2>
              </div>
              <p className="text-[11px] opacity-75 line-clamp-1">
                {juzMeta.description}
              </p>
            </div>
          </div>

          {/* Reading Controls Toolbar */}
          <div className="flex items-center gap-1.5 md:gap-2 mr-auto flex-wrap">
            
            {/* Auto-Scroll Toggle Button (Requirement: تشغيل الصفحات بالتمرير إلى أعلى بسرعات تناسب القراءة) */}
            <div className="flex items-center bg-emerald-950/10 dark:bg-zinc-800 rounded-xl p-0.5 border border-emerald-700/20">
              <button
                onClick={toggleAutoScroll}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  isAutoScrolling
                    ? 'bg-amber-500 text-stone-950 shadow-xs animate-pulse'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-2xs'
                }`}
                title={isAutoScrolling ? 'إيقاف التمرير التلقائي' : 'تشغيل التمرير التلقائي للأعلى'}
              >
                {isAutoScrolling ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>إيقاف التمرير</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>تمرير تلقائي للأعلى</span>
                  </>
                )}
              </button>

              {/* Speed Controller +/- */}
              <div className="flex items-center px-1.5 gap-1 border-r border-black/10 dark:border-zinc-700">
                <button
                  onClick={() => changeSpeed(-1)}
                  disabled={scrollSpeed <= 1}
                  className="p-1 rounded-md hover:bg-black/10 disabled:opacity-30 transition"
                  title="إنقاص سرعة التمرير"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-bold min-w-14 text-center text-emerald-950 dark:text-emerald-200">
                  {SPEED_CONFIG[scrollSpeed].label}
                </span>
                <button
                  onClick={() => changeSpeed(1)}
                  disabled={scrollSpeed >= 5}
                  className="p-1 rounded-md hover:bg-black/10 disabled:opacity-30 transition"
                  title="زيادة سرعة التمرير"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Page Jump navigation */}
            <div className="hidden sm:flex items-center bg-black/5 rounded-xl p-0.5 border border-black/10">
              <button
                onClick={goToPrevPage}
                className="px-2 py-1 text-[11px] font-semibold hover:bg-black/10 rounded-lg transition"
                title="الانتقال إلى الصفحة السابقة"
              >
                السابقة ◀
              </button>
              <button
                onClick={goToNextPage}
                className="px-2 py-1 text-[11px] font-semibold hover:bg-black/10 rounded-lg transition"
                title="الانتقال إلى الصفحة التالية"
              >
                ▶ التالية
              </button>
            </div>

            {/* Manual Save Bookmark Button (Requirement: حفظ تلك الصفحة مرجع لقراءتي) */}
            <button
              onClick={handleManualSave}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-200 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition"
              title="حفظ موضع قراءتك الحالي كمرجع للرجوع إليه لاحقاً"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
              <span>حفظ كمرجع</span>
            </button>

            {/* Jump to saved bookmark button */}
            {savedBookmark && (
              <button
                onClick={jumpToSavedBookmark}
                className="px-2 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-[11px] font-bold flex items-center gap-1 transition"
                title="الانتقال إلى آخر موضع محفوظ لقرائتك"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">موضع التوقف</span>
              </button>
            )}

            {/* Font size adjustments */}
            <div className="flex items-center bg-black/5 rounded-xl p-0.5 border border-black/10">
              <button
                onClick={() => changeFontSize(2)}
                className="p-1.5 hover:bg-black/10 rounded-lg transition"
                title="تكبير الخط"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] px-1 font-bold">{fontSize}</span>
              <button
                onClick={() => changeFontSize(-2)}
                className="p-1.5 hover:bg-black/10 rounded-lg transition"
                title="تصغير الخط"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme switcher */}
            <div className="flex items-center bg-black/5 rounded-xl p-0.5 border border-black/10">
              <button
                onClick={() => changeTheme('parchment')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${theme === 'parchment' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'opacity-60'}`}
                title="مصحف تراثي"
              >
                مصحف
              </button>
              <button
                onClick={() => changeTheme('dark')}
                className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'bg-zinc-800 text-amber-300 shadow-xs' : 'opacity-60'}`}
                title="ليلي"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => changeTheme('light')}
                className={`p-1.5 rounded-lg transition ${theme === 'light' ? 'bg-white text-emerald-800 shadow-xs' : 'opacity-60'}`}
                title="نهاري"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar line */}
        <div className="w-full bg-black/10 h-1 relative shrink-0">
          <div 
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Reading Content Area */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 md:px-14 py-6 space-y-8 select-text"
        >
          {loading ? (
            <div className="py-28 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold opacity-75">
                جاري فتح الجزء {juzNumber} من المصحف الشريف بالرسم العثماني...
              </p>
            </div>
          ) : (
            <>
              {/* Notification when manual bookmark was saved */}
              {manualSavedNotice && (
                <div className="p-3 rounded-2xl bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-between gap-2 shadow-md animate-in fade-in slide-in-from-top-2 border border-amber-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-stone-950 shrink-0" />
                    <span>{manualSavedNotice}</span>
                  </div>
                  <button 
                    onClick={() => setManualSavedNotice(null)} 
                    className="text-stone-900 hover:underline text-[11px] shrink-0"
                  >
                    حسناً
                  </button>
                </div>
              )}

              {/* Notification when position was automatically restored */}
              {restoredNotice && (
                <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between gap-2 shadow-md animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                    <span>{restoredNotice}</span>
                  </div>
                  <button 
                    onClick={() => setRestoredNotice(null)} 
                    className="text-emerald-200 hover:text-white text-[11px] underline shrink-0"
                  >
                    حسناً
                  </button>
                </div>
              )}

              {/* Automatic Bookmark & Resume Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    حفظ تلقائي لمرجع القراءة: حتى لو خرجت من التطبيق أو أغلقت الصفحة، ستعود لنفس الموضع بدقة.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCompleteOnEnd}
                      onChange={toggleAutoComplete}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>إتمام تلقائي عند النهاية</span>
                  </label>
                </div>
              </div>

              {groupedSurahs.map(group => (
                <div key={group.surahNumber} className="space-y-6">
                  {/* Surah Banner */}
                  <div className={`py-2.5 px-4 rounded-2xl border text-center font-bold text-sm md:text-base font-amiri shadow-xs ${themeClasses.surahHeader}`}>
                    <span>{group.surahName}</span>
                  </div>

                  {/* Bismillah Header (except Surah Tawbah #9) */}
                  {group.surahNumber !== 9 && (
                    <div className={`text-center font-amiri text-lg md:text-xl font-bold py-2 ${themeClasses.bismillah}`}>
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                  )}

                  {/* Flowing Ayahs in Uthmani Script */}
                  <div 
                    className={`leading-[2.7] text-justify font-amiri ${themeClasses.ayahText}`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {group.ayahs.map(({ ayah, index }) => {
                      const isActive = currentAyahIndex === index;
                      return (
                        <span
                          key={ayah.number}
                          ref={el => { ayahRefs.current[index] = el; }}
                          onClick={() => handleAyahClick(index, ayah)}
                          className={`cursor-pointer transition-colors p-1 ${isActive ? themeClasses.activeAyah : 'hover:bg-black/5'}`}
                          title={`سورة ${ayah.surah.name} - الآية ${ayah.numberInSurah} (انقر للتثبيت كمرجع للقراءة)`}
                        >
                          {ayah.text}{' '}
                          <span className={`inline-flex items-center justify-center text-[13px] px-2 py-0.5 rounded-full border mx-1 font-sans font-bold select-none ${themeClasses.ayahEnd}`}>
                            {ayah.numberInSurah}
                          </span>{' '}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* End of Juz Card */}
              <div className="mt-12 p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7 text-amber-300" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-amiri">
                    نهاية الجزء {juzNumber} بحمد الله وفضله
                  </h3>
                  <p className="text-xs opacity-80 max-w-md mx-auto">
                    اللهم اجعل القرآن العظيم ربيع قلوبنا ونور صدورنا وجلاء أحزاننا وذهاب همومنا.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {isCompleted ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>تم تسجيل إتمام هذا الجزء في الختمة</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerCompletion(false)}
                      disabled={submittingComplete}
                      className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>{submittingComplete ? 'جاري التسجيل...' : 'تأكيد إتمام الجزء الآن'}</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Floating Auto-Scroll Control Capsule (Requirement #1) */}
        {isAutoScrolling && (
          <div className="absolute bottom-18 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 text-white backdrop-blur-md px-3 sm:px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 border border-stone-700 animate-in fade-in slide-in-from-bottom-3 max-w-[95vw] overflow-x-auto">
            <button
              onClick={() => setIsAutoScrolling(false)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition shadow shrink-0"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>إيقاف</span>
            </button>
            <div className="h-4 w-px bg-stone-700 shrink-0" />
            <div className="flex items-center gap-1 text-xs shrink-0">
              <span className="text-stone-400 text-[11px] hidden sm:inline">السرعة:</span>
              <button
                onClick={() => changeSpeed(-1)}
                disabled={scrollSpeed <= 1}
                className="p-1 rounded-lg hover:bg-stone-800 disabled:opacity-30 transition"
                title="إبطاء التمرير"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              
              {/* Direct speed presets 1..5 */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setScrollSpeed(lvl);
                      localStorage.setItem('quran_autoscroll_speed', lvl.toString());
                    }}
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold transition flex items-center justify-center ${
                      scrollSpeed === lvl
                        ? 'bg-amber-400 text-stone-950 shadow-xs'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                    title={SPEED_CONFIG[lvl].desc}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={() => changeSpeed(1)}
                disabled={scrollSpeed >= 5}
                className="p-1 rounded-lg hover:bg-stone-800 disabled:opacity-30 transition"
                title="تسريع التمرير"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold px-1 text-amber-300 text-[11px] min-w-16 text-center hidden md:inline">
                {SPEED_CONFIG[scrollSpeed].label}
              </span>
            </div>

            <div className="h-4 w-px bg-stone-700 shrink-0" />
            <button
              onClick={handleManualSave}
              className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-[10px] font-semibold flex items-center gap-1 shrink-0"
              title="حفظ موضع القراءة الحالي الآن"
            >
              <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="hidden sm:inline">حفظ صفحة {currentPage}</span>
            </button>
          </div>
        )}

        {/* Reader Footer Toolbar */}
        <div className={`p-3 md:p-4 border-t flex items-center justify-between gap-3 shrink-0 ${themeClasses.footer}`}>
          <div className="flex items-center gap-2 text-xs">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">
              {isCompleted ? 'حالة الورد: مكتمل ومُنجز ✅' : `تقدمك في الجزء: ${progressPercent}%`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              onUndoComplete && (
                <button
                  onClick={() => onUndoComplete(taskId, cycleNumber, unitNumber)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-black/5 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تراجع عن الإتمام</span>
                </button>
              )
            ) : (
              <button
                onClick={() => triggerCompletion(false)}
                disabled={submittingComplete}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>{submittingComplete ? 'جاري التسجيل...' : 'أتممت قراءة الجزء (يدوياً)'}</span>
              </button>
            )}

            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-xs font-bold transition"
            >
              حفظ وخروج
            </button>
          </div>
        </div>
      </div>

      {/* Completion Congratulatory Dialog */}
      {showCompleteSuccessModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-3xl shadow-xs">
              🤲
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900 font-amiri">
                تقبل الله طاعتكم!
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                تم تسجيل إتمام {juzMeta.title} بنجاح واحتسابه في ختمة المجموعة المباركة.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowCompleteSuccessModal(false);
                  handleClose();
                }}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                الحمد لله (متابعة)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
