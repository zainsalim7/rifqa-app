import React from 'react';
import { Home, Users, BarChart3, Award, BookOpen, Lock } from 'lucide-react';
import { useGroup } from '../context/GroupContext';
import { usePersonalTasks } from '../context/PersonalTasksContext';

interface BottomNavProps {
  currentTab: 'home' | 'group' | 'personal' | 'reports' | 'profile';
  setCurrentTab: (tab: 'home' | 'group' | 'personal' | 'reports' | 'profile') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { openQuranReader } = useGroup();
  const { personalTasks } = usePersonalTasks();

  const activePersonalCount = personalTasks.filter(t => !t.isCompleted || t.frequency === 'daily').length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-1 py-1.5 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setCurrentTab('home')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition ${
          currentTab === 'home'
            ? 'text-emerald-800 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">الرئيسية</span>
      </button>

      <button
        onClick={() => setCurrentTab('group')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition ${
          currentTab === 'group'
            ? 'text-emerald-800 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px]">المجموعة</span>
      </button>

      {/* Private Personal Program Tab with lock */}
      <button
        onClick={() => setCurrentTab('personal')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition relative ${
          currentTab === 'personal'
            ? 'text-amber-800 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <div className="relative">
          <Lock className="w-5 h-5" />
          {activePersonalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </div>
        <span className="text-[10px] font-bold">برنامجي 🔒</span>
      </button>

      <button
        onClick={() => setCurrentTab('reports')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition ${
          currentTab === 'reports'
            ? 'text-emerald-800 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px]">التقارير</span>
      </button>

      <button
        onClick={() => setCurrentTab('profile')}
        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition ${
          currentTab === 'profile'
            ? 'text-emerald-800 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <Award className="w-5 h-5" />
        <span className="text-[10px]">إنجازاتي</span>
      </button>
    </nav>
  );
};
