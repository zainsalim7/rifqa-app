import React, { useState } from 'react';
import { useAuth, PRESET_DEMO_USERS } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { 
  Users, 
  Plus, 
  LogIn, 
  LogOut, 
  HelpCircle, 
  Share2, 
  UserCheck, 
  ChevronDown, 
  CheckCircle2, 
  Sparkles,
  ArrowRightLeft,
  Bell,
  Smartphone,
  BookOpen,
  Lock,
  Download
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'group' | 'personal' | 'reports' | 'profile';
  setCurrentTab: (tab: 'home' | 'group' | 'personal' | 'reports' | 'profile') => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onOpenSetupGuide: () => void;
  onOpenUserSwitcher: () => void;
  onOpenSwapRequests: () => void;
  onOpenMobileShare?: () => void;
  onOpenNativeModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenSetupGuide,
  onOpenUserSwitcher,
  onOpenSwapRequests,
  onOpenMobileShare,
  onOpenNativeModal,
}) => {
  const { currentUser, signOut, isDemoUser } = useAuth();
  const { groups, currentGroup, setCurrentGroupId, swapRequests, openQuranReader } = useGroup();
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const pendingSwapsCount = swapRequests.filter(s => 
    s.status === 'pending' && (s.targetUserId === currentUser?.uid || s.requesterUserId === currentUser?.uid)
  ).length;

  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* App Title & Group Selector */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center text-amber-300 font-bold text-lg shadow-inner">
              ر
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight text-emerald-50">رفقة الإنجاز</h1>
              <span className="text-[10px] text-emerald-300 font-medium">المهام والأوراد الجماعية</span>
            </div>
          </div>

          {/* Group Switcher dropdown */}
          {currentUser && (
            <div className="relative mr-2">
              <button
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-xs text-emerald-100 border border-emerald-700 transition"
              >
                <Users className="w-3.5 h-3.5 text-amber-300" />
                <span className="max-w-[110px] md:max-w-[160px] truncate font-medium">
                  {currentGroup ? currentGroup.name : 'اختر مجموعة'}
                </span>
                <ChevronDown className="w-3 h-3 text-emerald-300" />
              </button>

              {groupDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1 w-64 bg-white text-stone-900 rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 text-sm"
                  onClick={() => setGroupDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-xs font-semibold text-stone-400 border-b border-stone-100">
                    مجموعاتك
                  </div>
                  {groups.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-stone-500">لا توجد مجموعات بعد</div>
                  ) : (
                    groups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setCurrentGroupId(g.id)}
                        className={`w-full text-right px-3 py-2 flex items-center justify-between hover:bg-emerald-50 transition ${
                          currentGroup?.id === g.id ? 'bg-emerald-50/80 font-bold text-emerald-900' : 'text-stone-700'
                        }`}
                      >
                        <span className="truncate">{g.name}</span>
                        {g.isDemo && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">تجريبية</span>
                        )}
                      </button>
                    ))
                  )}

                  <div className="border-t border-stone-100 mt-1 pt-1">
                    <button
                      onClick={onOpenCreateGroup}
                      className="w-full text-right px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إنشاء مجموعة جديدة
                    </button>
                    <button
                      onClick={onOpenJoinGroup}
                      className="w-full text-right px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      الانضمام برمز دعوة
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Tabs */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentTab === 'home' ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => setCurrentTab('group')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentTab === 'group' ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              المجموعة
            </button>
            <button
              onClick={() => setCurrentTab('personal')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                currentTab === 'personal' ? 'bg-amber-400 text-stone-950 font-bold shadow-sm' : 'text-amber-200 hover:text-amber-100 hover:bg-emerald-800/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>برنامجي الخاص</span>
            </button>
            <button
              onClick={() => setCurrentTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentTab === 'reports' ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              التقارير
            </button>
            <button
              onClick={() => setCurrentTab('profile')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentTab === 'profile' ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              إنجازاتي والأوسمة
            </button>
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              {/* Direct Holy Quran Reader button */}
              <button
                onClick={() => openQuranReader()}
                title="فتح المصحف الشريف وقراءة الورد بالرسم العثماني"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold transition shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-950" />
                <span className="hidden sm:inline">المصحف الشريف</span>
                <span className="sm:hidden">المصحف</span>
              </button>

              {/* Swap notifications */}
              {pendingSwapsCount > 0 && (
                <button
                  onClick={onOpenSwapRequests}
                  title="طلبات التبديل المعلقة"
                  className="relative p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-stone-900 font-bold text-[10px] rounded-full flex items-center justify-center">
                    {pendingSwapsCount}
                  </span>
                </button>
              )}

              {/* User Switcher (For easy multi-account testing) */}
              <button
                onClick={onOpenUserSwitcher}
                title="تبديل المستخدم لاختبار الأدوار"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-800/70 hover:bg-emerald-800 text-xs text-emerald-100 border border-emerald-700/60 transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="max-w-[70px] truncate">{currentUser.displayName}</span>
              </button>

              {/* Mobile Share / QR Code */}
              {onOpenMobileShare && (
                <button
                  onClick={onOpenMobileShare}
                  title="فتح التطبيق في الجوال (رمز QR)"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-xs text-amber-300 border border-emerald-600/70 transition"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-bold">الجوال</span>
                </button>
              )}

              {/* Native APK & GitHub modal */}
              {onOpenNativeModal && (
                <button
                  onClick={onOpenNativeModal}
                  title="بناء تطبيق APK والآيفون وحفظه في GitHub"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-800/90 hover:bg-teal-700 text-xs text-emerald-200 border border-teal-600/70 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden md:inline text-[11px] font-bold">APK و GitHub</span>
                </button>
              )}

              {/* Help & Setup Guide */}
              <button
                onClick={onOpenSetupGuide}
                title="دليل الإعداد ومعلومات التطبيق"
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 transition"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Sign out */}
              <button
                onClick={() => signOut()}
                title="تسجيل الخروج"
                className="p-1.5 rounded-lg text-emerald-300 hover:text-red-300 hover:bg-emerald-800/50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenUserSwitcher}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-lg text-xs font-bold transition shadow"
            >
              <LogIn className="w-3.5 h-3.5" />
              تسجيل الدخول
            </button>
          )}
        </div>
      </div>

      {/* Aden Timezone Notice Strip */}
      <div className="bg-emerald-950/80 text-emerald-300/90 text-[11px] py-0.5 px-4 text-center border-t border-emerald-800/40 flex items-center justify-center gap-2">
        <span>⏱ التوقيت المعتمد للمواعيد والتذكيرات: <strong>توقيت عدن (Asia/Aden)</strong></span>
      </div>
    </header>
  );
};
