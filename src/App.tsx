import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider, useGroup } from './context/GroupContext';
import { PersonalTasksProvider, usePersonalTasks } from './context/PersonalTasksContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { GroupView } from './components/GroupView';
import { PersonalProgramView } from './components/PersonalProgramView';
import { ReportsView } from './components/ReportsView';
import { ProfileView } from './components/ProfileView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { QuranReaderModal } from './components/QuranReaderModal';
import { listenToForegroundMessages } from './utils/fcmService';
import { isNativeApp, initNativePushNotifications } from './utils/nativePushService';
import { Task } from './types';

import { useTaskReminder } from './hooks/useTaskReminder';

function MainLayout() {
  const { currentUser, loading } = useAuth();
  useTaskReminder();
  const { 
    groups, 
     
    joinGroupByCode, 
    activeQuranReader, 
    closeQuranReader, 
    markUnitCompleted, 
    markPendingUnitCompleted, 
    undoUnitCompleted, 
    pendingOverdueAssignments 
  } = useGroup();

  const {
    activePersonalReader,
    closePersonalQuranReader,
    togglePersonalUnit
  } = usePersonalTasks();

  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<'home' | 'group' | 'personal' | 'reports' | 'profile'>('home');
  const [taskDetailTarget, setTaskDetailTarget] = useState<Task | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);


  // Setup native push notifications if running in Android / iOS container
  useEffect(() => {
    if (isNativeApp()) {
      initNativePushNotifications(
        currentUser?.uid,
        (token) => {
          console.log('[Native App] FCM Token generated:', token);
        },
        (notification) => {
          showToast(`${notification.title || 'إشعار جديد'}: ${notification.body || ''}`, 'info');
        }
      );
    }
  }, [currentUser]);

  // Setup foreground push notification listener for web preview
  useEffect(() => {
    let unsub: (() => void) | null = null;
    listenToForegroundMessages((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'إشعار جديد 🌿';
      const body = payload.notification?.body || payload.data?.body || '';
      showToast(`${title}: ${body}`, 'info');
    }).then((fn) => {
      unsub = fn;
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);
  
  // Check URL query parameters for invitation code (e.g. ?invite=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite') || params.get('join');
    if (inviteParam && currentUser) {
      joinGroupByCode(inviteParam).then(res => {
        if (res.success) {
          showToast(res.message, 'success');
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          showToast(res.message, 'error');
        }
      }).catch(() => {});
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 font-bold flex items-center justify-center text-xl animate-pulse shadow-md">
          ر
        </div>
        <p className="mt-3 text-sm font-bold text-stone-700">رفقة الإنجاز</p>
        <span className="text-xs text-stone-400">جارٍ تهيئة البيانات...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col antialiased selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCreateGroup={() => setCreateGroupOpen(true)}
        onOpenJoinGroup={() => setJoinGroupOpen(true)}

      />



              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">
        
        {/* If no user signed in, show gentle greeting CTA */}
        {!currentUser ? (
          <div className="py-12 px-4 max-w-md mx-auto text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-800 text-white flex items-center justify-center text-3xl font-bold shadow-lg border border-emerald-700">
              ر
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-stone-900">رفقة الإنجاز</h2>
              <p className="text-stone-600 text-xs leading-relaxed">
                منصة لإدارة وتوزيع الأوراد والختمات والمهام الجماعية الدورية بهدوء ودون إحراج.
              </p>
            </div>

                className="w-full py-2.5 bg-white border border-stone-200 text-stone-700 rounded-2xl text-xs font-semibold hover:bg-stone-50 transition"
              >
                دليل الإعداد وحالة الربط
              </button>
            </div>
          </div>
        ) : (
          /* Signed In Views */
          <>
            {currentTab === 'home' && (
              <HomeView
                onOpenTaskDetail={(task) => setTaskDetailTarget(task)}
                onOpenCreateTask={() => setCreateTaskOpen(true)}
                onOpenCreateGroup={() => setCreateGroupOpen(true)}
                onOpenJoinGroup={() => setJoinGroupOpen(true)}
                onNavigateToPersonal={() => setCurrentTab('personal')}
              />
            )}

            {currentTab === 'group' && (
              <GroupView
                onOpenCreateTask={() => setCreateTaskOpen(true)}
                onOpenJoinGroup={() => setJoinGroupOpen(true)}
              />
            )}

            {currentTab === 'personal' && (
              <PersonalProgramView />
            )}

            {currentTab === 'reports' && (
              <ReportsView />
            )}

            {currentTab === 'profile' && (
              <ProfileView 

              />
            )}
          </>
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      {currentUser && (
        <BottomNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      )}

      {/* Modals & Dialogs */}
      {taskDetailTarget && (
        <TaskDetailModal
          task={taskDetailTarget}
          onClose={() => setTaskDetailTarget(null)}
        />
      )}

      {createTaskOpen && (
        <CreateTaskModal
          onClose={() => setCreateTaskOpen(false)}
        />
      )}

      {createGroupOpen && (
        <CreateGroupModal
          onClose={() => setCreateGroupOpen(false)}
        />
      )}

      {joinGroupOpen && (
        <JoinGroupModal
          onClose={() => setJoinGroupOpen(false)}
        />
      )}

        />
      )}

      {/* Global Quran Reader Modal for Group Tasks */}
      {activeQuranReader && (
        <QuranReaderModal
          juzNumber={activeQuranReader.juzNumber}
          taskId={activeQuranReader.taskId}
          cycleNumber={activeQuranReader.cycleNumber}
          unitNumber={activeQuranReader.unitNumber}
          isCompleted={activeQuranReader.isCompleted}
          onMarkComplete={async (tId, cNum, uNum) => {
            const isOverdue = pendingOverdueAssignments.some(
              ov => ov.taskId === tId && ov.cycleNumber === cNum && ov.unitNumber === uNum
            );
            if (isOverdue) {
              await markPendingUnitCompleted(tId, cNum, uNum);
            } else {
              await markUnitCompleted(tId, cNum, uNum);
            }
          }}
          onUndoComplete={async (tId, cNum, uNum) => {
            await undoUnitCompleted(tId, cNum, uNum);
          }}
          onClose={closeQuranReader}
        />
      )}

      {/* Global Quran Reader Modal for Personal Private Khatmah */}
      {activePersonalReader && (
        <QuranReaderModal
          juzNumber={activePersonalReader.juzNumber}
          taskId={activePersonalReader.personalTaskId}
          cycleNumber={1}
          unitNumber={activePersonalReader.juzNumber}
          isCompleted={activePersonalReader.isCompleted}
          onMarkComplete={async (tId, _cNum, uNum) => {
            await togglePersonalUnit(tId, uNum);
          }}
          onUndoComplete={async (tId, _cNum, uNum) => {
            await togglePersonalUnit(tId, uNum);
          }}
          onClose={closePersonalQuranReader}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <GroupProvider>
          <PersonalTasksProvider>
            <MainLayout />
          </PersonalTasksProvider>
        </GroupProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
