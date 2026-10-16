import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { Users, Plus, LogIn, LogOut, HelpCircle, Share2, ChevronDown, BookOpen, Lock } from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'group' | 'personal' | 'reports' | 'profile';
  setCurrentTab: (tab: 'home' | 'group' | 'personal' | 'reports' | 'profile') => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCreateGroup,
  onOpenJoinGroup,
}) => {
  const { currentUser, signOut } = useAuth();
  const { groups, currentGroup, setCurrentGroupId } = useGroup();
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

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
                  <div className="px-3 py-2 text-xs font-semibold text-stone-700 border-b border-stone-100">
                    تحديد المجموعة
                  </div>
                  {groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setCurrentGroupId(group.id);
                        setGroupDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-stone-50 transition"
                    >
                      <span>{group.name}</span>
                      <span className="text-[10px] text-stone-400">{group.memberCount || 0} عضو</span>
                    </button>
                  ))}
                  <div className="pt-2 px-3">
                    <button
                      onClick={() => onOpenCreateGroup()}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition"
                    >
                      <span>مجموعة جديدة</span>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="pt-2 px-3">
                    <button
                      onClick={() => onOpenJoinGroup()}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition"
                    >
                      <span>انضمام برمز</span>
                      <Share2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {currentUser ? (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => signOut()}
                title="تسجيل الخروج"
                className="p-1.5 rounded-lg text-emerald-300 hover:text-red-300 hover:bg-emerald-800/50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => onOpenJoinGroup()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-lg text-xs font-bold transition shadow"
          >
            <LogIn className="w-3.5 h-3.5" />
            تسجيل الدخول
          </button>
        )}
      </div>

      {/* Aden Timezone Notice Strip */}
      <div className="bg-emerald-950/80 text-emerald-300/90 text-[11px] py-0.5 px-4 text-center border-t border-emerald-800/40 flex items-center justify-center gap-2">
        <span>⏱ التوقيت المعتمد للمواعيد والتذكيرات: <strong>توقيت عدن (Asia/Aden)</strong></span>
      </div>
    </header>
  );
};
