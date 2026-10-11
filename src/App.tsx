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
import { SetupGuideModal } from './components/SetupGuideModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { SwapRequestsModal } from './components/SwapRequestsModal';
import { AssignmentPreviewModal } from './components/AssignmentPreviewModal';
import { MobileShareModal } from './components/MobileShareModal';
import { QuranReaderModal } from './components/QuranReaderModal';
import { FCMSetupModal } from './components/FCMSetupModal';
import { NativeAppGuideModal } from './components/NativeAppGuideModal';
import { listenToForegroundMessages } from './utils/fcmService';
import { isNativeApp, initNativePushNotifications } from './utils/nativePushService';
import { Task } from './types';
import { Sparkles, Download, Smartphone } from 'lucide-react';
import { useTaskReminder } from './hooks/useTaskReminder';

function MainLayout() {
  const { currentUser, loading } = useAuth();
  useTaskReminder();
  const { 
    groups, 
    seedDemoGroup, 
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
  const [setupGuideOpen, setSetupGuideOpen] = useState(false);
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [swapRequestsOpen, setSwapRequestsOpen] = useState(false);
  const [rotationPreviewTask, setRotationPreviewTask] = useState<Task | null>(null);
  const [mobileShareOpen, setMobileShareOpen] = useState(false);
  const [fcmModalOpen, setFcmModalOpen] = useState(false);
  const [nativeModalOpen, setNativeModalOpen] = useState(false);

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
  
  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

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
        onOpenSetupGuide={() => setSetupGuideOpen(true)}
        onOpenUserSwitcher={() => setUserSwitcherOpen(true)}
        onOpenSwapRequests={() => setSwapRequestsOpen(true)}
        onOpenMobileShare={() => setMobileShareOpen(true)}
        onOpenNativeModal={() => setNativeModalOpen(true)}
      />

      {/* Native App / GitHub Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-emerald-100">
            تطبيق الهاتف الأصيل جاهز: يمكنك بناء ملف <strong>APK للأندرويد</strong> والآيفون وحفظ المشروع في <strong>GitHub</strong> مع إشعارات FCM الخارجية.
          </span>
        </div>
        <button
          onClick={() => setNativeModalOpen(true)}
          className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] transition shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-stone-950" />
          <span>خطوات بناء الـ APK و GitHub 📱</span>
        </button>
      </div>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-inner">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span>يمكنك تثبيت "رفقة الإنجاز" كتطبيق على هاتفك لسهولة الوصول اليومي.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition"
            >
              تثبيت التطبيق
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-stone-800 hover:text-stone-950 px-1"
            >
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

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setUserSwitcherOpen(true)}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
              >
                <span>تسجيل الدخول / تجربة التطبيق</span>
              </button>
              <button
                onClick={() => setSetupGuideOpen(true)}
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
                onOpenFCM={() => setFcmModalOpen(true)}
                onOpenNativeModal={() => setNativeModalOpen(true)}
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
          onOpenRotationPreview={(task) => {
            setTaskDetailTarget(null);
            setRotationPreviewTask(task);
          }}
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

      {setupGuideOpen && (
        <SetupGuideModal
          onClose={() => setSetupGuideOpen(false)}
          onOpenFCM={() => setFcmModalOpen(true)}
          onOpenNative={() => setNativeModalOpen(true)}
        />
      )}

      {fcmModalOpen && (
        <FCMSetupModal
          onClose={() => setFcmModalOpen(false)}
        />
      )}

      {nativeModalOpen && (
        <NativeAppGuideModal
          onClose={() => setNativeModalOpen(false)}
        />
      )}

      {userSwitcherOpen && (
        <UserSwitcherModal
          onClose={() => setUserSwitcherOpen(false)}
        />
      )}

      {swapRequestsOpen && (
        <SwapRequestsModal
          onClose={() => setSwapRequestsOpen(false)}
        />
      )}

      {rotationPreviewTask && (
        <AssignmentPreviewModal
          task={rotationPreviewTask}
          onClose={() => setRotationPreviewTask(null)}
        />
      )}

      {mobileShareOpen && (
        <MobileShareModal
          onClose={() => setMobileShareOpen(false)}
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
