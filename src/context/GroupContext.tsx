import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import {
  Group,
  GroupMember,
  Task,
  TaskCycle,
  TaskAssignment,
  ActivityRecord,
  SwapRequest,
  Invitation,
  TaskType,
  RecurrenceType,
  DependentChild
} from '../types';
import { getNowInAdenISO, calculateCycleEnd, isCycleEnded } from '../utils/dateUtils';
import { generateBalancedAssignments, generateSequentialQuranAssignments, MemberJuzQuota } from '../utils/rotation';
import { calculateHijriMonthEnd, isHijriMonthEnded } from '../utils/hijriCalendar';
import { QURAN_30_JUZ, isQuranTask } from '../utils/quranData';
import { getLatestActiveBookmark } from '../utils/quranService';
import confetti from 'canvas-confetti';

interface GroupContextType {
  groups: Group[];
  currentGroup: Group | null;
  members: GroupMember[];
  tasks: Task[];
  cycles: Record<string, TaskCycle>; // taskId -> active cycle
  assignments: Record<string, TaskAssignment[]>; // taskId -> list of assignments
  pendingOverdueAssignments: TaskAssignment[]; // past cycle assignments still pending on members
  activityFeed: ActivityRecord[];
  swapRequests: SwapRequest[];
  loadingGroups: boolean;
  isCurrentUserAdmin: boolean;
  activeQuranReader: { juzNumber: number; taskId: string; cycleNumber: number; unitNumber: number; isCompleted: boolean } | null;
  openQuranReader: (params?: { juzNumber?: number; taskId?: string; cycleNumber?: number; unitNumber?: number; isCompleted?: boolean }) => void;
  closeQuranReader: () => void;
  setCurrentGroupId: (id: string) => void;
  createGroup: (name: string, description?: string, autoCreateQuranTask?: boolean) => Promise<Group>;
  joinGroupByCode: (code: string) => Promise<{ success: boolean; message: string }>;
  generateInviteCode: (groupId: string) => Promise<string>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, newRole: 'admin' | 'member') => Promise<void>;
  createTask: (data: {
    name: string;
    instructions?: string;
    taskType: TaskType;
    recurrence: RecurrenceType;
    unitTemplate?: 'quran_30_juz' | 'custom' | 'counter';
    unitCount?: number;
    targetTotal?: number;
    showNamesOnCompletion: boolean;
    reminderTime?: string;
    customUnits?: { unitNumber: number; unitTitle: string }[];
    customQuotas?: MemberJuzQuota[];
  }) => Promise<string>;
  deleteTask: (taskId: string) => Promise<void>;
  startNewCycle: (taskId: string, manualUnits?: { unitNumber: number; unitTitle: string; assignedToUserId: string; assignedToName: string }[]) => Promise<void>;
  markUnitCompleted: (taskId: string, cycleNumber: number, unitNumber: number, notes?: string) => Promise<void>;
  markPendingUnitCompleted: (taskId: string, cycleNumber: number, unitNumber: number) => Promise<void>;
  undoUnitCompleted: (taskId: string, cycleNumber: number, unitNumber: number) => Promise<void>;
  excuseUnit: (taskId: string, cycleNumber: number, unitNumber: number, reason: string) => Promise<void>;
  incrementSharedTarget: (taskId: string, count: number, notes?: string) => Promise<void>;
  requestSwap: (taskId: string, requesterUnit: number, targetUserId: string, targetUnit: number) => Promise<void>;
  respondToSwap: (swapId: string, accept: boolean) => Promise<void>;
  reassignUnit: (taskId: string, cycleNumber: number, unitNumber: number, newUserId: string) => Promise<void>;
  autoRotateExpiredCycle: (taskId: string) => Promise<void>;
  seedDemoGroup: () => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  myDependents: GroupMember[];
  isMyDependent: (userId: string) => boolean;
  addDependentToGroup: (groupId: string, data: { displayName: string; relationship?: string; avatar?: string }) => Promise<void>;
  removeDependentFromGroup: (groupId: string, dependentUserId: string) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cycles, setCycles] = useState<Record<string, TaskCycle>>({});
  const [assignments, setAssignments] = useState<Record<string, TaskAssignment[]>>({});
  const [pendingOverdueAssignments, setPendingOverdueAssignments] = useState<TaskAssignment[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityRecord[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [activeQuranReader, setActiveQuranReader] = useState<{
    juzNumber: number;
    taskId: string;
    cycleNumber: number;
    unitNumber: number;
    isCompleted: boolean;
  } | null>(null);

  const myDependents = React.useMemo(() => {
    if (!currentUser) return [];
    return members.filter(m => m.parentUserId === currentUser.uid || (m.isDependent && m.parentUserId === currentUser.uid));
  }, [members, currentUser?.uid]);

  const isMyDependent = (userId: string): boolean => {
    if (!currentUser) return false;
    return members.some(m => m.userId === userId && m.parentUserId === currentUser.uid);
  };

  const openQuranReader = (params?: { juzNumber?: number; taskId?: string; cycleNumber?: number; unitNumber?: number; isCompleted?: boolean }) => {
    // 1. Explicit juzNumber provided
    if (params?.juzNumber) {
      setActiveQuranReader({
        juzNumber: params.juzNumber,
        taskId: params.taskId || 'general_quran',
        cycleNumber: params.cycleNumber || 1,
        unitNumber: params.unitNumber || params.juzNumber,
        isCompleted: params.isCompleted || false,
      });
      return;
    }

    // 2. Any overdue assignment for current user in past cycles?
    const myOverdue = pendingOverdueAssignments.find(a => a.assignedToUserId === currentUser?.uid);
    if (myOverdue) {
      setActiveQuranReader({
        juzNumber: myOverdue.unitNumber,
        taskId: myOverdue.taskId,
        cycleNumber: myOverdue.cycleNumber,
        unitNumber: myOverdue.unitNumber,
        isCompleted: false,
      });
      return;
    }

    // 3. Any active assignment in current group tasks?
    const quranTask = tasks.find(t => isQuranTask(t));
    if (quranTask) {
      const taskAssigns = assignments[quranTask.id] || [];
      const myAssign = taskAssigns.find(a => a.assignedToUserId === currentUser?.uid);
      if (myAssign) {
        setActiveQuranReader({
          juzNumber: myAssign.unitNumber,
          taskId: quranTask.id,
          cycleNumber: quranTask.currentCycleNumber || 1,
          unitNumber: myAssign.unitNumber,
          isCompleted: myAssign.status === 'completed',
        });
        return;
      }
    }

    // 4. Any latest active bookmark?
    const bookmark = getLatestActiveBookmark();
    if (bookmark && bookmark.unitNumber) {
      setActiveQuranReader({
        juzNumber: bookmark.unitNumber,
        taskId: bookmark.taskId || 'general_quran',
        cycleNumber: bookmark.cycleNumber || 1,
        unitNumber: bookmark.unitNumber,
        isCompleted: false,
      });
      return;
    }

    // 5. Default to Juz 1
    setActiveQuranReader({
      juzNumber: 1,
      taskId: 'general_quran',
      cycleNumber: 1,
      unitNumber: 1,
      isCompleted: false,
    });
  };

  const closeQuranReader = () => {
    setActiveQuranReader(null);
  };

  const currentGroup = groups.find(g => g.id === currentGroupId) || (groups.length > 0 ? groups[0] : null);

  const isCurrentUserAdmin = Boolean(
    currentUser &&
    currentGroup &&
    (currentGroup.createdBy === currentUser.uid ||
      members.some(m => m.userId === currentUser.uid && m.role === 'admin'))
  );

  // Sync groups user belongs to
  useEffect(() => {
    if (!currentUser) {
      setGroups([]);
      setCurrentGroupId(null);
      setLoadingGroups(false);
      return;
    }

    // 1. Immediately hydrate from local cache if available
    const cacheKey = `rifqa_groups_${currentUser.uid}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Group[];
        if (parsed && parsed.length > 0) {
          setGroups(parsed);
          setCurrentGroupId(prev => prev || parsed[0].id);
        }
      }
    } catch {}

    setLoadingGroups(true);

    // 2. Real-time Firestore sync
    const groupsRef = collection(db, 'groups');
    const unsub = onSnapshot(
      groupsRef,
      async (snapshot) => {
        const loadedGroups: Group[] = [];
        for (const docSnap of snapshot.docs) {
          const groupData = { id: docSnap.id, ...docSnap.data() } as Group;
          // Check if current user is creator or member
          if (groupData.createdBy === currentUser.uid) {
            loadedGroups.push(groupData);
          } else {
            try {
              const memberSnap = await getDoc(doc(db, `groups/${docSnap.id}/members`, currentUser.uid));
              if (memberSnap.exists()) {
                loadedGroups.push(groupData);
              }
            } catch {
              // Ignore if not a member
            }
          }
        }

        // Merge with existing state so local optimistic additions are preserved
        setGroups(prev => {
          const merged = [...loadedGroups];
          prev.forEach(pg => {
            if (!merged.some(mg => mg.id === pg.id) && pg.createdBy === currentUser.uid) {
              merged.push(pg);
            }
          });
          try {
            localStorage.setItem(cacheKey, JSON.stringify(merged));
          } catch {}
          return merged;
        });

        setCurrentGroupId(prev => {
          if (prev && loadedGroups.some(g => g.id === prev)) return prev;
          return loadedGroups.length > 0 ? loadedGroups[0].id : prev;
        });

        setLoadingGroups(false);
      },
      (error) => {
        console.warn("Firestore groups listener warning (using local cache):", error);
        setLoadingGroups(false);
      }
    );

    return () => unsub();
  }, [currentUser?.uid]);

  // Sync current group's subcollections: members, tasks, activity, swaps
  useEffect(() => {
    if (!currentGroup || !currentUser) {
      setMembers([]);
      setTasks([]);
      setCycles({});
      setAssignments({});
      setActivityFeed([]);
      setSwapRequests([]);
      return;
    }

    const groupId = currentGroup.id;

    // 1. Members
    const membersRef = collection(db, `groups/${groupId}/members`);
    const unsubMembers = onSnapshot(
      membersRef,
      (snap) => {
        const memList: GroupMember[] = [];
        snap.forEach(docSnap => {
          memList.push(docSnap.data() as GroupMember);
        });
        setMembers(memList);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `groups/${groupId}/members`)
    );

    // 2. Tasks
    const tasksRef = collection(db, `groups/${groupId}/tasks`);
    const unsubTasks = onSnapshot(
      tasksRef,
      (snap) => {
        const tList: Task[] = [];
        snap.forEach(docSnap => {
          const t = { id: docSnap.id, ...docSnap.data() } as Task;
          if (isQuranTask(t) && !t.unitTemplate) {
            t.unitTemplate = 'quran_30_juz';
          }
          tList.push(t);
        });
        setTasks(tList);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `groups/${groupId}/tasks`)
    );

    // 3. Activity Feed
    const activityRef = collection(db, `groups/${groupId}/activity`);
    const activityQuery = query(activityRef, orderBy('timestamp', 'desc'), limit(30));
    const unsubActivity = onSnapshot(
      activityQuery,
      (snap) => {
        const actList: ActivityRecord[] = [];
        snap.forEach(docSnap => {
          actList.push({ id: docSnap.id, ...docSnap.data() } as ActivityRecord);
        });
        setActivityFeed(actList);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `groups/${groupId}/activity`)
    );

    // 4. Swap Requests
    const swapRef = collection(db, `groups/${groupId}/swapRequests`);
    const unsubSwap = onSnapshot(
      swapRef,
      (snap) => {
        const sList: SwapRequest[] = [];
        snap.forEach(docSnap => {
          sList.push({ id: docSnap.id, ...docSnap.data() } as SwapRequest);
        });
        setSwapRequests(sList);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `groups/${groupId}/swapRequests`)
    );

    return () => {
      unsubMembers();
      unsubTasks();
      unsubActivity();
      unsubSwap();
    };
  }, [currentGroup?.id, currentUser?.uid]);

  // Sync active cycle and assignments for each task
  useEffect(() => {
    if (!currentGroup || tasks.length === 0) return;
    const unsubs: (() => void)[] = [];

    tasks.forEach(task => {
      const cycleId = `cycle_${task.currentCycleNumber || 1}`;
      const cycleDocRef = doc(db, `groups/${currentGroup.id}/tasks/${task.id}/cycles`, cycleId);

      const unsubCycle = onSnapshot(
        cycleDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setCycles(prev => ({ ...prev, [task.id]: { id: docSnap.id, ...docSnap.data() } as TaskCycle }));
          }
        },
        () => {}
      );
      unsubs.push(unsubCycle);

      // Assignments for this cycle
      const assignRef = collection(db, `groups/${currentGroup.id}/tasks/${task.id}/cycles/${cycleId}/assignments`);
      const unsubAssignments = onSnapshot(
        assignRef,
        (snap) => {
          const list: TaskAssignment[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as TaskAssignment));
          setAssignments(prev => ({ ...prev, [task.id]: list.sort((a, b) => a.unitNumber - b.unitNumber) }));
        },
        () => {}
      );
      unsubs.push(unsubAssignments);
    });

    return () => {
      unsubs.forEach(u => u());
    };
  }, [currentGroup?.id, tasks]);

  // Sync pending/overdue assignments from previous cycles ("معلق في الذمة")
  useEffect(() => {
    if (!currentGroup || tasks.length === 0 || !currentUser) {
      setPendingOverdueAssignments([]);
      return;
    }

    let isMounted = true;
    const fetchPendingOverdue = async () => {
      const overdueList: TaskAssignment[] = [];

      for (const task of tasks) {
        const currentCycle = task.currentCycleNumber || 1;
        if (currentCycle <= 1) continue;

        // Query past cycles
        for (let c = 1; c < currentCycle; c++) {
          try {
            const pastAssignRef = collection(db, `groups/${currentGroup.id}/tasks/${task.id}/cycles/cycle_${c}/assignments`);
            const snap = await getDocs(pastAssignRef);
            snap.forEach(d => {
              const data = d.data() as TaskAssignment;
              // If not completed and belongs to current user or admin reviewing
              if (data.status !== 'completed' && data.status !== 'excused') {
                overdueList.push(data);
              }
            });
          } catch (e) {
            console.warn(`Querying past cycle_${c} for task ${task.id}:`, e);
          }
        }
      }

      if (isMounted) {
        setPendingOverdueAssignments(overdueList);
      }
    };

    fetchPendingOverdue();

    return () => {
      isMounted = false;
    };
  }, [currentGroup?.id, tasks, currentUser?.uid, cycles]);

  // Check and auto-rotate monthly / Quran cycles when month concludes
  useEffect(() => {
    if (!currentGroup || tasks.length === 0 || !isCurrentUserAdmin) return;

    tasks.forEach(async (task) => {
      const activeCycle = cycles[task.id];
      if (!activeCycle) return;

      const isMonthly = task.recurrence === 'monthly';
      const isQuran = task.unitTemplate === 'quran_30_juz';

      if (isMonthly || isQuran) {
        const ended = isCycleEnded(activeCycle.endDate) || isHijriMonthEnded(activeCycle.startDate, activeCycle.endDate);
        if (ended && activeCycle.status === 'active') {
          try {
            await autoRotateExpiredCycle(task.id);
          } catch (err) {
            console.warn("Auto-rotation warning:", err);
          }
        }
      }
    });
  }, [currentGroup?.id, tasks, cycles, isCurrentUserAdmin]);

  // Log activity helper
  async function logActivity(groupId: string, type: ActivityRecord['type'], description: string, metadata?: Record<string, any>) {
    if (!currentUser) return;
    try {
      const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const actRef = doc(db, `groups/${groupId}/activity`, actId);
      const record: ActivityRecord = {
        id: actId,
        groupId,
        type,
        actorId: currentUser.uid,
        actorName: currentUser.displayName,
        description,
        timestamp: getNowInAdenISO(),
        metadata: metadata || {}
      };
      await setDoc(actRef, record);
    } catch (e) {
      console.warn("Could not record activity", e);
    }
  }

  // Award badge helper
  async function awardBadgeIfEligible(badgeId: string, title: string, description: string, icon: string, relatedRecordId?: string) {
    if (!currentUser) return;
    try {
      const badgeDocRef = doc(db, `users/${currentUser.uid}/badges`, badgeId);
      const existing = await getDoc(badgeDocRef);
      if (!existing.exists()) {
        await setDoc(badgeDocRef, {
          badgeId,
          title,
          description,
          icon,
          awardedAt: getNowInAdenISO(),
          relatedRecordId: relatedRecordId || ''
        });
      }
    } catch (e) {
      console.warn("Error awarding badge", e);
    }
  }

  // 1. Create Group
  const createGroup = async (name: string, description?: string, autoCreateQuranTask: boolean = true): Promise<Group> => {
    if (!currentUser) throw new Error("يجب تسجيل الدخول أولاً");

    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newGroup: Group = {
      id: groupId,
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: currentUser.uid,
      createdAt: getNowInAdenISO(),
    };

    const memberDoc: GroupMember = {
      userId: currentUser.uid,
      displayName: currentUser.displayName,
      email: currentUser.email || '',
      photoURL: currentUser.photoURL || '',
      role: 'admin',
      joinedAt: getNowInAdenISO(),
    };

    const inviteCode = `RIFQA-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 1. Optimistically update local state immediately so user is never blocked
    setGroups(prev => {
      const updated = [newGroup, ...prev.filter(g => g.id !== groupId)];
      try {
        localStorage.setItem(`rifqa_groups_${currentUser.uid}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCurrentGroupId(groupId);
    setMembers([memberDoc]);

    // 2. Persist to Firestore concurrently in background
    Promise.all([
      setDoc(doc(db, 'groups', groupId), newGroup),
      setDoc(doc(db, `groups/${groupId}/members`, currentUser.uid), memberDoc),
      setDoc(doc(db, 'invitations', inviteCode), {
        code: inviteCode,
        groupId,
        groupName: name.trim(),
        createdBy: currentUser.uid,
        createdAt: getNowInAdenISO(),
        active: true,
      }),
      logActivity(groupId, 'member_joined', `أنشأ ${currentUser.displayName} المجموعة وأصبح مشرفاً.`)
    ]).catch((e) => {
      console.warn("Firestore group sync completed with local backup:", e);
    });

    // 3. Automatically add monthly Quran 30 juz task if requested
    if (autoCreateQuranTask) {
      setTimeout(() => {
        createTask({
          name: 'ختمة القرآن الكريم الشهرية',
          instructions: 'توزيع أجزاء القرآن الثلاثين بين أعضاء المجموعة لتتم الختمة شهرياً.',
          taskType: 'distributed',
          recurrence: 'monthly',
          unitTemplate: 'quran_30_juz',
          unitCount: 30,
          showNamesOnCompletion: true,
          reminderTime: '20:00',
        }).catch(err => {
          console.warn("Auto-creation of Quran task completed locally:", err);
        });
      }, 50);
    }

    return newGroup;
  };

  // 2. Join group by invitation code
  const joinGroupByCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) throw new Error("يجب تسجيل الدخول");
    const cleanCode = code.trim().toUpperCase();

    // Check special demo group
    if (cleanCode === 'DEMO-QURAN') {
      await seedDemoGroup();
      return { success: true, message: 'تم فتح المجموعة النموذجية (ختمة القرآن 30 جزء + أذكار) بنجاح!' };
    }

    try {
      const invRef = doc(db, 'invitations', cleanCode);
      const invSnap = await getDoc(invRef);

      if (!invSnap.exists()) {
        return { success: false, message: 'رمز الدعوة غير صحيح أو منتهي الصلاحية.' };
      }

      const invData = invSnap.data() as Invitation;
      if (!invData.active) {
        return { success: false, message: 'هذه الدعوة لم تعد صالحة.' };
      }

      const groupId = invData.groupId;

      // Add to members
      const memberRef = doc(db, `groups/${groupId}/members`, currentUser.uid);
      const memberDoc: GroupMember = {
        userId: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        role: 'member',
        joinedAt: getNowInAdenISO(),
      };
      
      // Fetch group data to hydrate local state immediately
      let joinedGroup: Group | null = null;
      try {
        const groupSnap = await getDoc(doc(db, 'groups', groupId));
        if (groupSnap.exists()) {
          joinedGroup = { id: groupSnap.id, ...groupSnap.data() } as Group;
        }
      } catch {}

      if (!joinedGroup) {
        joinedGroup = {
          id: groupId,
          name: invData.groupName,
          description: '',
          createdBy: invData.createdBy,
          createdAt: getNowInAdenISO(),
        };
      }

      // Immediately set local groups
      setGroups(prev => {
        const next = [joinedGroup!, ...prev.filter(g => g.id !== groupId)];
        try {
          localStorage.setItem(`rifqa_groups_${currentUser.uid}`, JSON.stringify(next));
        } catch {}
        return next;
      });
      setCurrentGroupId(groupId);

      // Async Firestore write
      Promise.all([
        setDoc(memberRef, memberDoc),
        logActivity(groupId, 'member_joined', `انضم ${currentUser.displayName} إلى المجموعة.`)
      ]).catch(e => console.warn("Member join sync completed locally:", e));

      return { success: true, message: `أهلاً بك في مجموعة "${invData.groupName}"!` };
    } catch (err) {
      console.warn("Join group error:", err);
      return { success: false, message: 'حدث خطأ أثناء الانضمام للمجموعة. تأكد من صحة الرمز والاتصال.' };
    }
  };

  // 3. Generate invitation code
  const generateInviteCode = async (groupId: string): Promise<string> => {
    if (!currentGroup) throw new Error("لا توجد مجموعة نشطة");
    const code = `RIFQA-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await setDoc(doc(db, 'invitations', code), {
      code,
      groupId,
      groupName: currentGroup.name,
      createdBy: currentUser?.uid || '',
      createdAt: getNowInAdenISO(),
      active: true,
    });
    return code;
  };

  // 4. Remove member
  const removeMember = async (userId: string) => {
    if (!currentGroup || !isCurrentUserAdmin) throw new Error("غير مصرح لك");
    const targetMember = members.find(m => m.userId === userId);
    setMembers(prev => prev.filter(m => m.userId !== userId));
    try {
      await deleteDoc(doc(db, `groups/${currentGroup.id}/members`, userId));
      await logActivity(currentGroup.id, 'member_removed', `تمت إزالة العضو ${targetMember?.displayName || userId} مع الحفاظ على سجل إنجازاته السابقة.`);
    } catch (e) {
      console.warn("deleteDoc member fallback:", e);
    }
  };

  // 4b. Update member role (promote to admin or change to member)
  const updateMemberRole = async (userId: string, newRole: 'admin' | 'member') => {
    if (!currentGroup || !isCurrentUserAdmin) throw new Error("غير مصرح لك بتغيير رتب الأعضاء");
    const targetMember = members.find(m => m.userId === userId);
    if (!targetMember) return;

    setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: newRole } : m));
    try {
      await updateDoc(doc(db, `groups/${currentGroup.id}/members`, userId), {
        role: newRole,
      });
      await logActivity(
        currentGroup.id,
        'role_updated',
        `تم تغيير رتبة "${targetMember.displayName}" إلى ${newRole === 'admin' ? 'مشرف للمجموعة' : 'عضو عادي'}`
      );
    } catch (e) {
      console.warn("updateDoc member role fallback:", e);
    }
  };

  // 4c. Add dependent child / family member (without phone) to group
  const addDependentToGroup = async (groupId: string, data: { displayName: string; relationship?: string; avatar?: string }) => {
    if (!currentUser) throw new Error("يجب تسجيل الدخول أولاً");
    const depId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const rel = (data.relationship || 'son') as 'son' | 'daughter' | 'child' | 'family_member';
    const avatar = data.avatar || (rel === 'son' ? '👦' : rel === 'daughter' ? '👧' : '🧒');

    const newMember: GroupMember = {
      userId: depId,
      displayName: data.displayName,
      role: 'member',
      isDependent: true,
      parentUserId: currentUser.uid,
      parentDisplayName: currentUser.displayName,
      relationship: rel,
      avatar,
      joinedAt: getNowInAdenISO(),
    };

    setMembers(prev => [...prev.filter(m => m.userId !== depId), newMember]);

    try {
      await setDoc(doc(db, `groups/${groupId}/members`, depId), newMember);
    } catch (e) {
      console.warn("setDoc dependent member fallback:", e);
    }

    // Save in user profile dependents
    const currentDeps = userProfile?.dependents || [];
    if (!currentDeps.some(d => d.displayName === data.displayName)) {
      const newDepRecord: DependentChild = {
        id: depId,
        displayName: data.displayName,
        parentUserId: currentUser.uid,
        parentDisplayName: currentUser.displayName,
        relationship: rel,
        avatar,
        createdAt: getNowInAdenISO(),
      };
      await updateUserProfile({
        dependents: [...currentDeps, newDepRecord]
      }).catch(() => {});
    }

    await logActivity(
      groupId,
      'member_joined',
      `أضاف ${currentUser.displayName} ابنه/تابعه (${data.displayName} ${avatar}) إلى المجموعة للمشاركة في المهام والأوراد المباركة 🌿`,
      { dependentId: depId, parentUserId: currentUser.uid }
    );
  };

  // 4d. Remove dependent member from group
  const removeDependentFromGroup = async (groupId: string, dependentUserId: string) => {
    if (!currentUser) return;
    const targetMember = members.find(m => m.userId === dependentUserId);
    if (!targetMember) return;

    if (targetMember.parentUserId !== currentUser.uid && !isCurrentUserAdmin) {
      throw new Error("لا يمكنك حذف هذا العضو التابع");
    }

    setMembers(prev => prev.filter(m => m.userId !== dependentUserId));
    try {
      await deleteDoc(doc(db, `groups/${groupId}/members`, dependentUserId));
      await logActivity(
        groupId,
        'member_removed',
        `تمت إزالة العضو التابع (${targetMember.displayName}) من المجموعة.`
      );
    } catch (e) {
      console.warn("deleteDoc dependent error:", e);
    }
  };

  // 5. Create Task
  const createTask = async (data: {
    name: string;
    instructions?: string;
    taskType: TaskType;
    recurrence: RecurrenceType;
    unitTemplate?: 'quran_30_juz' | 'custom' | 'counter';
    unitCount?: number;
    targetTotal?: number;
    showNamesOnCompletion: boolean;
    reminderTime?: string;
    customUnits?: { unitNumber: number; unitTitle: string }[];
    customQuotas?: MemberJuzQuota[];
  }): Promise<string> => {
    if (!currentGroup || !currentUser) throw new Error("غير مصرح");

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const task: Task = {
      id: taskId,
      groupId: currentGroup.id,
      name: data.name,
      instructions: data.instructions || '',
      taskType: data.taskType,
      recurrence: data.recurrence,
      unitTemplate: data.unitTemplate,
      unitCount: data.unitTemplate === 'quran_30_juz' ? 30 : (data.unitCount || (data.customUnits?.length || 1)),
      targetTotal: data.targetTotal || (data.taskType === 'shared_target' ? 1000 : 0),
      currentTotal: 0,
      showNamesOnCompletion: data.showNamesOnCompletion,
      reminderTime: data.reminderTime || '',
      currentCycleNumber: 1,
      status: 'active',
      createdBy: currentUser.uid,
      createdAt: getNowInAdenISO(),
    };

    await setDoc(doc(db, `groups/${currentGroup.id}/tasks`, taskId), task);

    // Now initialize Cycle 1
    const startDate = new Date();
    const endDate = (data.recurrence === 'monthly' && data.unitTemplate === 'quran_30_juz')
      ? calculateHijriMonthEnd(startDate)
      : calculateCycleEnd(startDate, data.recurrence);
    const cycleId = 'cycle_1';

    let unitList: { unitNumber: number; unitTitle: string }[] = [];
    if (data.taskType === 'distributed') {
      if (data.unitTemplate === 'quran_30_juz') {
        unitList = QURAN_30_JUZ.map(j => ({ unitNumber: j.juzNumber, unitTitle: j.title }));
      } else if (data.customUnits && data.customUnits.length > 0) {
        unitList = data.customUnits;
      } else {
        const count = data.unitCount || 5;
        for (let i = 1; i <= count; i++) {
          unitList.push({ unitNumber: i, unitTitle: `الوحدة رقم ${i}` });
        }
      }
    } else if (data.taskType === 'individual') {
      // Individual: each member gets unit 1 (or their own assigned unit)
      unitList = members.map((m, idx) => ({ unitNumber: idx + 1, unitTitle: data.name }));
    }

    const totalUnitsCount = data.taskType === 'shared_target' ? (data.targetTotal || 1000) : unitList.length;

    const cycleDoc: TaskCycle = {
      id: cycleId,
      taskId,
      groupId: currentGroup.id,
      cycleNumber: 1,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      totalUnits: totalUnitsCount,
      completedUnits: 0,
      createdAt: getNowInAdenISO(),
    };

    await setDoc(doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles`, cycleId), cycleDoc);

    // Create assignments
    const batch = writeBatch(db);
    if (data.taskType === 'distributed') {
      const activeMembers = members.length > 0 ? members : [{
        userId: currentUser.uid,
        displayName: currentUser.displayName,
        role: 'admin' as const,
        joinedAt: getNowInAdenISO()
      }];

      const balanced = data.unitTemplate === 'quran_30_juz'
        ? generateSequentialQuranAssignments(activeMembers, 1, undefined, data.customQuotas)
        : generateBalancedAssignments(unitList, activeMembers, 1);

      balanced.forEach(u => {
        const assignId = `assign_${u.unitNumber}`;
        const ref = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignId);
        const assignData: TaskAssignment = {
          id: assignId,
          taskId,
          cycleNumber: 1,
          unitNumber: u.unitNumber,
          unitTitle: u.unitTitle,
          assignedToUserId: u.assignedToUserId,
          assignedToName: u.assignedToName,
          status: 'not_started',
        };
        batch.set(ref, assignData);
      });
    } else if (data.taskType === 'individual') {
      // For each member, create an assignment for this individual task
      const activeMembers = members.length > 0 ? members : [{
        userId: currentUser.uid,
        displayName: currentUser.displayName,
        role: 'admin',
        joinedAt: getNowInAdenISO()
      }];

      activeMembers.forEach((m, idx) => {
        const assignId = `assign_user_${m.userId}`;
        const ref = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignId);
        const assignData: TaskAssignment = {
          id: assignId,
          taskId,
          cycleNumber: 1,
          unitNumber: idx + 1,
          unitTitle: data.name,
          assignedToUserId: m.userId,
          assignedToName: m.displayName,
          status: 'not_started',
        };
        batch.set(ref, assignData);
      });
    }

    // Optimistically update local tasks immediately
    setTasks(prev => [...prev.filter(t => t.id !== taskId), task]);

    await batch.commit();
    await logActivity(currentGroup.id, 'task_created', `أنشأ المشرف مهمة جديدة: "${data.name}"`);

    return taskId;
  };

  // 6. Delete task
  const deleteTask = async (taskId: string) => {
    if (!currentGroup || !isCurrentUserAdmin) throw new Error("غير مصرح");
    await deleteDoc(doc(db, `groups/${currentGroup.id}/tasks`, taskId));
  };

  // 7. Start New Cycle with Assignment Rotation
  const startNewCycle = async (
    taskId: string,
    manualUnits?: { unitNumber: number; unitTitle: string; assignedToUserId: string; assignedToName: string }[]
  ) => {
    if (!currentGroup || !isCurrentUserAdmin) throw new Error("غير مصرح");
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const nextCycleNumber = (task.currentCycleNumber || 1) + 1;
    const cycleId = `cycle_${nextCycleNumber}`;

    // Mark previous cycle as completed
    const prevCycleId = `cycle_${task.currentCycleNumber || 1}`;
    try {
      await updateDoc(doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles`, prevCycleId), {
        status: 'completed'
      });
    } catch {}

    const startDate = new Date();
    const endDate = (task.recurrence === 'monthly' && task.unitTemplate === 'quran_30_juz')
      ? calculateHijriMonthEnd(startDate)
      : calculateCycleEnd(startDate, task.recurrence);

    let unitList: { unitNumber: number; unitTitle: string }[] = [];
    if (task.unitTemplate === 'quran_30_juz') {
      unitList = QURAN_30_JUZ.map(j => ({ unitNumber: j.juzNumber, unitTitle: j.title }));
    } else {
      const prevAssigns = assignments[taskId] || [];
      if (prevAssigns.length > 0) {
        unitList = prevAssigns.map(a => ({ unitNumber: a.unitNumber, unitTitle: a.unitTitle }));
      } else {
        const count = task.unitCount || 30;
        for (let i = 1; i <= count; i++) {
          unitList.push({ unitNumber: i, unitTitle: `الوحدة رقم ${i}` });
        }
      }
    }

    const newCycleDoc: TaskCycle = {
      id: cycleId,
      taskId,
      groupId: currentGroup.id,
      cycleNumber: nextCycleNumber,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      totalUnits: unitList.length,
      completedUnits: 0,
      createdAt: getNowInAdenISO(),
    };

    await setDoc(doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles`, cycleId), newCycleDoc);

    const batch = writeBatch(db);

    if (manualUnits && manualUnits.length > 0) {
      // Use manual adjustments confirmed by admin
      manualUnits.forEach(u => {
        const assignId = `assign_${u.unitNumber}`;
        const ref = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignId);
        const assignData: TaskAssignment = {
          id: assignId,
          taskId,
          cycleNumber: nextCycleNumber,
          unitNumber: u.unitNumber,
          unitTitle: u.unitTitle,
          assignedToUserId: u.assignedToUserId,
          assignedToName: u.assignedToName,
          status: 'not_started',
        };
        batch.set(ref, assignData);
      });
    } else {
      // Automatically generate rotated assignments!
      const prevAssigns = assignments[taskId] || [];
      const prevList = prevAssigns.map(a => ({ unitNumber: a.unitNumber, assignedToUserId: a.assignedToUserId }));
      
      const rotated = task.unitTemplate === 'quran_30_juz'
        ? generateSequentialQuranAssignments(members, nextCycleNumber, prevList)
        : generateBalancedAssignments(unitList, members, nextCycleNumber, prevList);

      rotated.forEach(u => {
        const assignId = `assign_${u.unitNumber}`;
        const ref = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignId);
        const assignData: TaskAssignment = {
          id: assignId,
          taskId,
          cycleNumber: nextCycleNumber,
          unitNumber: u.unitNumber,
          unitTitle: u.unitTitle,
          assignedToUserId: u.assignedToUserId,
          assignedToName: u.assignedToName,
          status: 'not_started',
        };
        batch.set(ref, assignData);
      });
    }

    // Update current cycle number on task
    const taskRef = doc(db, `groups/${currentGroup.id}/tasks`, taskId);
    batch.update(taskRef, { currentCycleNumber: nextCycleNumber });

    await batch.commit();

    await logActivity(
      currentGroup.id,
      'cycle_rotated',
      `بدأت الدورة الجديدة رقم (${nextCycleNumber}) لمهمة "${task.name}" وتدوير المهام بنجاح.`
    );
  };

  // Mark pending overdue unit completed ("قضاء ورد سابق معلق في الذمة")
  const markPendingUnitCompleted = async (taskId: string, cycleNumber: number, unitNumber: number) => {
    if (!currentGroup || !currentUser) return;
    const cycleId = `cycle_${cycleNumber}`;
    const assignId = `assign_${unitNumber}`;
    const assignRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignId);

    await updateDoc(assignRef, {
      status: 'completed',
      completedAt: getNowInAdenISO(),
      notes: 'تم قضاء وإنجاز الورد المعلق السابق بحمد الله',
      updatedAt: getNowInAdenISO()
    });

    // Update local pending list immediately
    setPendingOverdueAssignments(prev => 
      prev.filter(p => !(p.taskId === taskId && p.cycleNumber === cycleNumber && p.unitNumber === unitNumber))
    );

    await logActivity(
      currentGroup.id,
      'completed',
      `قضى وأتمّ ${currentUser.displayName} ورده المعلق من الدورة (${cycleNumber}) (الجزء ${unitNumber}) بحمد الله.`
    );

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  // Auto rotate expired cycle
  const autoRotateExpiredCycle = async (taskId: string) => {
    if (!currentGroup) return;
    await startNewCycle(taskId);
  };

  // 8. Mark unit complete ("أتممت")
  const markUnitCompleted = async (taskId: string, cycleNumber: number, unitNumber: number, notes?: string) => {
    if (!currentGroup || !currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    const cycleId = `cycle_${cycleNumber}`;

    const assignList = assignments[taskId] || [];
    const assignment = assignList.find(a => a.unitNumber === unitNumber);

    if (!assignment) return;

    const isMine = assignment.assignedToUserId === currentUser.uid;
    const isMyChild = assignment.parentUserId === currentUser.uid ||
      members.some(m => m.userId === assignment.assignedToUserId && m.parentUserId === currentUser.uid);

    // Permissions check: Member can mark ONLY own assigned task OR dependent's task, unless admin
    if (!isMine && !isMyChild && !isCurrentUserAdmin) {
      throw new Error("لا يمكنك إتمام مهمة مخصصة لعضو آخر.");
    }

    if (assignment.status === 'completed') {
      return; // Prevent duplicate completion
    }

    const assignRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignment.id);
    await updateDoc(assignRef, {
      status: 'completed',
      completedAt: getNowInAdenISO(),
      notes: notes || '',
      updatedAt: getNowInAdenISO()
    });

    // Record completion in audit log subcollection
    const compId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const compRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/completions`, compId);
    await setDoc(compRef, {
      id: compId,
      taskId,
      cycleNumber,
      unitNumber,
      unitTitle: assignment.unitTitle,
      userId: assignment.assignedToUserId,
      userName: assignment.assignedToName,
      isDependent: isMyChild,
      parentUserId: isMyChild ? currentUser.uid : undefined,
      parentDisplayName: isMyChild ? currentUser.displayName : undefined,
      completedAt: getNowInAdenISO(),
      notes: notes || '',
    });

    // Update cycle completedUnits count
    const cycleRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles`, cycleId);
    const newCompletedCount = (cycles[taskId]?.completedUnits || 0) + 1;
    await updateDoc(cycleRef, {
      completedUnits: newCompletedCount
    });

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#059669', '#10b981', '#34d399', '#f59e0b', '#fbbf24']
      });
    } catch {}

    // Activity log
    if (isMyChild) {
      await logActivity(
        currentGroup.id,
        'completed',
        `أتمّ ${assignment.assignedToName} (بإشراف ${currentUser.displayName}): ${assignment.unitTitle} 🌟`,
        { taskId, unitNumber, isDependent: true, parentUserId: currentUser.uid }
      );
    } else {
      await logActivity(
        currentGroup.id,
        'completed',
        `أتمّ ${task?.showNamesOnCompletion ? currentUser.displayName : 'أحد المشاركين'}: ${assignment.unitTitle}`,
        { taskId, unitNumber }
      );
    }

    // Award badges
    await awardBadgeIfEligible('daily_wird', 'أتممت ورد اليوم', 'أتممت مهمتك اليومية بنجاح ومثابرة.', '🌟', compId);
    if (task?.unitTemplate === 'quran_30_juz') {
      await awardBadgeIfEligible('khatmah_part', 'حامي الختمة', 'شاركت في إتمام جزء من الختمة المباركة.', '📖', compId);
    }
    await awardBadgeIfEligible('group_contrib', 'شاركت في إنجاز جماعي', 'ساهمت في تقدم هدف المجموعة المشترك.', '🤝', compId);
  };

  // 9. Undo completion ("تراجع عن الإتمام")
  const undoUnitCompleted = async (taskId: string, cycleNumber: number, unitNumber: number) => {
    if (!currentGroup || !currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    const cycleId = `cycle_${cycleNumber}`;

    const assignList = assignments[taskId] || [];
    const assignment = assignList.find(a => a.unitNumber === unitNumber);

    if (!assignment) return;
    const isMine = assignment.assignedToUserId === currentUser.uid;
    const isMyChild = assignment.parentUserId === currentUser.uid ||
      members.some(m => m.userId === assignment.assignedToUserId && m.parentUserId === currentUser.uid);

    if (!isMine && !isMyChild && !isCurrentUserAdmin) {
      throw new Error("لا يمكنك تعديل مهمة عضو آخر.");
    }

    const assignRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignment.id);
    await updateDoc(assignRef, {
      status: 'not_started',
      completedAt: null,
      notes: '',
      updatedAt: getNowInAdenISO()
    });

    const cycleRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles`, cycleId);
    const newCompletedCount = Math.max(0, (cycles[taskId]?.completedUnits || 1) - 1);
    await updateDoc(cycleRef, {
      completedUnits: newCompletedCount
    });

    await logActivity(
      currentGroup.id,
      'undo',
      isMyChild
        ? `تراجع ${currentUser.displayName} عن إتمام ورد: ${assignment.assignedToName} (${assignment.unitTitle})`
        : `تراجع ${currentUser.displayName} عن إتمام: ${assignment.unitTitle}`,
      { taskId, unitNumber }
    );
  };

  // 10. Excuse unit ("أعتذر عن هذه المهمة")
  const excuseUnit = async (taskId: string, cycleNumber: number, unitNumber: number, reason: string) => {
    if (!currentGroup || !currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    const cycleId = `cycle_${cycleNumber}`;

    const assignList = assignments[taskId] || [];
    const assignment = assignList.find(a => a.unitNumber === unitNumber);

    if (!assignment) return;
    const isMine = assignment.assignedToUserId === currentUser.uid;
    const isMyChild = assignment.parentUserId === currentUser.uid ||
      members.some(m => m.userId === assignment.assignedToUserId && m.parentUserId === currentUser.uid);

    if (!isMine && !isMyChild && !isCurrentUserAdmin) {
      throw new Error("لا يمكنك الاعتذار عن مهمة شخص آخر.");
    }

    const assignRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignment.id);
    await updateDoc(assignRef, {
      status: 'excused',
      excusedReason: reason || 'اعتذار لظرف طارئ',
      updatedAt: getNowInAdenISO()
    });

    await logActivity(
      currentGroup.id,
      'excused',
      isMyChild
        ? `اعتذر ${currentUser.displayName} نيابة عن ${assignment.assignedToName} عن ${assignment.unitTitle} (السبب: ${reason || 'ظرف طارئ'}) متاح للإسناد.`
        : `اعتذر ${currentUser.displayName} عن ${assignment.unitTitle} (السبب: ${reason || 'ظرف طارئ'}) متاح للمشرف لإعادة التوزيع.`,
      { taskId, unitNumber }
    );
  };

  // 11. Increment Shared Target (Atomic concurrent transactions)
  const incrementSharedTarget = async (taskId: string, count: number, notes?: string) => {
    if (!currentGroup || !currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const cycleId = `cycle_${task.currentCycleNumber || 1}`;
    const taskRef = doc(db, `groups/${currentGroup.id}/tasks`, taskId);
    const cycleRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles`, cycleId);

    let updatedCount = 0;
    await runTransaction(db, async (transaction) => {
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists()) throw new Error("المهمة غير موجودة");

      const currentTotal = Number(taskDoc.data().currentTotal || 0);
      updatedCount = currentTotal + count;

      transaction.update(taskRef, { currentTotal: updatedCount });

      const cycleDoc = await transaction.get(cycleRef);
      if (cycleDoc.exists()) {
        transaction.update(cycleRef, { completedUnits: updatedCount });
      }
    });

    await logActivity(
      currentGroup.id,
      'completed',
      `أضاف ${currentUser.displayName} (${count}) إلى هدف "${task.name}" الإجمالي (الإجمالي الآن: ${updatedCount}).`,
      { count, notes, updatedCount }
    );
  };

  // 12. Request Task Swap
  const requestSwap = async (taskId: string, requesterUnit: number, targetUserId: string, targetUnit: number) => {
    if (!currentGroup || !currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    const targetMember = members.find(m => m.userId === targetUserId);
    const assignList = assignments[taskId] || [];

    const myAssign = assignList.find(a => a.unitNumber === requesterUnit);
    const targetAssign = assignList.find(a => a.unitNumber === targetUnit);

    const swapId = `swap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const swapDoc: SwapRequest = {
      id: swapId,
      taskId,
      taskName: task?.name || 'المهمة',
      cycleNumber: task?.currentCycleNumber || 1,
      requesterUserId: currentUser.uid,
      requesterName: currentUser.displayName,
      requesterUnit,
      requesterUnitTitle: myAssign?.unitTitle || `الوحدة ${requesterUnit}`,
      targetUserId,
      targetName: targetMember?.displayName || 'العضو',
      targetUnit,
      targetUnitTitle: targetAssign?.unitTitle || `الوحدة ${targetUnit}`,
      status: 'pending',
      createdAt: getNowInAdenISO(),
    };

    await setDoc(doc(db, `groups/${currentGroup.id}/swapRequests`, swapId), swapDoc);

    await logActivity(
      currentGroup.id,
      'swap',
      `طلب ${currentUser.displayName} تبديل (${myAssign?.unitTitle}) مع (${targetMember?.displayName}) مقابل (${targetAssign?.unitTitle}).`
    );
  };

  // 13. Respond to Swap Request
  const respondToSwap = async (swapId: string, accept: boolean) => {
    if (!currentGroup || !currentUser) return;
    const swap = swapRequests.find(s => s.id === swapId);
    if (!swap) return;

    if (swap.targetUserId !== currentUser.uid && !isCurrentUserAdmin) {
      throw new Error("غير مصرح لك بالرد على هذا الطلب.");
    }

    const swapRef = doc(db, `groups/${currentGroup.id}/swapRequests`, swapId);

    if (!accept) {
      await updateDoc(swapRef, { status: 'rejected' });
      await logActivity(currentGroup.id, 'swap', `تم رفض طلب التبديل بين ${swap.requesterName} و ${swap.targetName}.`);
      return;
    }

    // Execute swap atomically
    const cycleId = `cycle_${swap.cycleNumber}`;
    const assignList = assignments[swap.taskId] || [];

    const reqAssign = assignList.find(a => a.unitNumber === swap.requesterUnit);
    const tgtAssign = assignList.find(a => a.unitNumber === swap.targetUnit);

    if (!reqAssign || !tgtAssign) {
      throw new Error("لم يتم العثور على الوحدات المطلوبة للتبديل.");
    }

    const batch = writeBatch(db);
    const reqRef = doc(db, `groups/${currentGroup.id}/tasks/${swap.taskId}/cycles/${cycleId}/assignments`, reqAssign.id);
    const tgtRef = doc(db, `groups/${currentGroup.id}/tasks/${swap.taskId}/cycles/${cycleId}/assignments`, tgtAssign.id);

    batch.update(reqRef, {
      assignedToUserId: swap.targetUserId,
      assignedToName: swap.targetName,
      updatedAt: getNowInAdenISO()
    });

    batch.update(tgtRef, {
      assignedToUserId: swap.requesterUserId,
      assignedToName: swap.requesterName,
      updatedAt: getNowInAdenISO()
    });

    batch.update(swapRef, { status: 'accepted' });

    await batch.commit();

    await logActivity(
      currentGroup.id,
      'swap',
      `تم قبول وتبديل المهام بنجاح: ${swap.requesterName} أخذ (${tgtAssign.unitTitle})، و ${swap.targetName} أخذ (${reqAssign.unitTitle}).`
    );

    await awardBadgeIfEligible('team_spirit', 'روح التعاون', 'وافقت على تبديل المهام لمساعدة رفيقك في الإنجاز.', '🤝', swapId);
  };

  // 13. Reassign Unit (Admin or Parent direct assignment adjustment)
  const reassignUnit = async (taskId: string, cycleNumber: number, unitNumber: number, newUserId: string) => {
    const cycleId = `cycle_${cycleNumber}`;
    const assignList = assignments[taskId] || [];
    const assignment = assignList.find(a => a.unitNumber === unitNumber);
    if (!assignment) return;

    const isMine = assignment.assignedToUserId === currentUser?.uid;
    const isMyChild = assignment.parentUserId === currentUser?.uid ||
      members.some(m => m.userId === assignment.assignedToUserId && m.parentUserId === currentUser?.uid);

    if (!currentGroup || (!isCurrentUserAdmin && !isMine && !isMyChild)) {
      throw new Error("فقط مشرف المجموعة أو ولي الأمر يمكنه تغيير تكليف هذه المهمة");
    }

    const targetMember = members.find(m => m.userId === newUserId);
    if (!targetMember) throw new Error("العضو غير موجود بالمجموعة");

    const assignRef = doc(db, `groups/${currentGroup.id}/tasks/${taskId}/cycles/${cycleId}/assignments`, assignment.id);
    await updateDoc(assignRef, {
      assignedToUserId: targetMember.userId,
      assignedToName: targetMember.displayName,
      isDependent: !!targetMember.isDependent,
      parentUserId: targetMember.parentUserId || null,
      parentDisplayName: targetMember.parentDisplayName || null,
      updatedAt: getNowInAdenISO()
    });

    await logActivity(
      currentGroup.id,
      'task_created',
      `تم إسناد (${assignment.unitTitle}) إلى "${targetMember.displayName}".`,
      { taskId, unitNumber, newUserId }
    );
  };

  // 14. Seed Demo Group with rich sample content
  const seedDemoGroup = async () => {
    if (!currentUser) throw new Error("يجب تسجيل الدخول");

    const demoGroupId = `demo_grp_${Date.now()}`;
    const demoGroup: Group = {
      id: demoGroupId,
      name: 'مجموعة الختمة والأذكار (محتوى تجريبي)',
      description: 'مجموعة نموذجية لمتابعة ختمة القرآن الشهرية، ورد قراءة سورة الكهف، والأذكار اليومية.',
      createdBy: currentUser.uid,
      isDemo: true,
      createdAt: getNowInAdenISO(),
    };

    await setDoc(doc(db, 'groups', demoGroupId), demoGroup);

    // Add currentUser as Admin
    await setDoc(doc(db, `groups/${demoGroupId}/members`, currentUser.uid), {
      userId: currentUser.uid,
      displayName: currentUser.displayName,
      email: currentUser.email || '',
      photoURL: currentUser.photoURL || '',
      role: 'admin',
      joinedAt: getNowInAdenISO(),
    });

    // Add demo companions to group including a dependent child
    const companions = [
      { userId: 'demo_member_omar', displayName: 'عمر اليماني', role: 'member' },
      { userId: 'demo_member_fatima', displayName: 'فاطمة الزهراء', role: 'member' },
      { userId: 'demo_member_khalid', displayName: 'خالد بن الوليد', role: 'member' },
      { userId: 'demo_member_mariam', displayName: 'مريم العدني', role: 'member' },
      { 
        userId: 'demo_child_abdullah', 
        displayName: 'عبدالله (ابن زين)', 
        role: 'member',
        isDependent: true,
        parentUserId: currentUser.uid,
        parentDisplayName: currentUser.displayName,
        relationship: 'son' as const,
        avatar: '👦'
      },
    ];

    for (const c of companions) {
      if (c.userId !== currentUser.uid) {
        await setDoc(doc(db, `groups/${demoGroupId}/members`, c.userId), {
          ...c,
          email: `${c.userId}@rifqa.app`,
          joinedAt: getNowInAdenISO(),
        });
      }
    }

    const allMembersList: GroupMember[] = [
      { userId: currentUser.uid, displayName: currentUser.displayName, role: 'admin', joinedAt: getNowInAdenISO() },
      ...companions.filter(c => c.userId !== currentUser.uid).map(c => ({
        ...c,
        role: c.role as 'member',
        joinedAt: getNowInAdenISO()
      }))
    ];

    // Create 1: Monthly Quran Khatmah (30 Juz distributed)
    const quranTaskId = `demo_task_quran_${Date.now()}`;
    const quranTask: Task = {
      id: quranTaskId,
      groupId: demoGroupId,
      name: 'ختمة القرآن الكريم الشهرية',
      instructions: 'قراءة الأجزاء الموزعة وتدبرها خلال الشهر، والضغط على "أتممت" فور الانتهاء من قراءة الجزء المخصص.',
      taskType: 'distributed',
      recurrence: 'monthly',
      unitTemplate: 'quran_30_juz',
      unitCount: 30,
      showNamesOnCompletion: true,
      reminderTime: '20:00',
      currentCycleNumber: 1,
      status: 'active',
      createdBy: currentUser.uid,
      createdAt: getNowInAdenISO(),
    };
    await setDoc(doc(db, `groups/${demoGroupId}/tasks`, quranTaskId), quranTask);

    const quranCycleDoc: TaskCycle = {
      id: 'cycle_1',
      taskId: quranTaskId,
      groupId: demoGroupId,
      cycleNumber: 1,
      startDate: new Date().toISOString(),
      endDate: calculateCycleEnd(new Date(), 'monthly').toISOString(),
      status: 'active',
      totalUnits: 30,
      completedUnits: 6, // 6 juz completed as demo
      createdAt: getNowInAdenISO(),
    };
    await setDoc(doc(db, `groups/${demoGroupId}/tasks/${quranTaskId}/cycles`, 'cycle_1'), quranCycleDoc);

    const quranUnits = QURAN_30_JUZ.map(j => ({ unitNumber: j.juzNumber, unitTitle: j.title }));
    const distributed = generateBalancedAssignments(quranUnits, allMembersList, 1);

    const batch = writeBatch(db);
    distributed.forEach((u, idx) => {
      const assignId = `assign_${u.unitNumber}`;
      const ref = doc(db, `groups/${demoGroupId}/tasks/${quranTaskId}/cycles/cycle_1/assignments`, assignId);
      const targetMember = allMembersList.find(m => m.userId === u.assignedToUserId);
      // Mark first 6 as completed for demo feeling, but leave Abdullah's uncompleted so parent can test completing it
      const isCompleted = idx < 6 && targetMember?.userId !== 'demo_child_abdullah';
      batch.set(ref, {
        id: assignId,
        taskId: quranTaskId,
        cycleNumber: 1,
        unitNumber: u.unitNumber,
        unitTitle: u.unitTitle,
        assignedToUserId: u.assignedToUserId,
        assignedToName: u.assignedToName,
        isDependent: !!targetMember?.isDependent,
        parentUserId: targetMember?.parentUserId || null,
        parentDisplayName: targetMember?.parentDisplayName || null,
        status: isCompleted ? 'completed' : 'not_started',
        completedAt: isCompleted ? getNowInAdenISO() : null,
      });
    });

    // Create 2: Weekly Surat Al-Kahf (Individual recurring)
    const kahfTaskId = `demo_task_kahf_${Date.now()}`;
    const kahfTask: Task = {
      id: kahfTaskId,
      groupId: demoGroupId,
      name: 'قراءة سورة الكهف يوم الجمعة',
      instructions: 'قراءة سورة الكهف المباركة كل يوم جمعة تدبراً واستنارة بنورها.',
      taskType: 'individual',
      recurrence: 'weekly',
      unitCount: allMembersList.length,
      showNamesOnCompletion: true,
      reminderTime: '09:00',
      currentCycleNumber: 1,
      status: 'active',
      createdBy: currentUser.uid,
      createdAt: getNowInAdenISO(),
    };
    await setDoc(doc(db, `groups/${demoGroupId}/tasks`, kahfTaskId), kahfTask);
    const kahfCycleDoc: TaskCycle = {
      id: 'cycle_1',
      taskId: kahfTaskId,
      groupId: demoGroupId,
      cycleNumber: 1,
      startDate: new Date().toISOString(),
      endDate: calculateCycleEnd(new Date(), 'weekly').toISOString(),
      status: 'active',
      totalUnits: allMembersList.length,
      completedUnits: 2,
      createdAt: getNowInAdenISO(),
    };
    await setDoc(doc(db, `groups/${demoGroupId}/tasks/${kahfTaskId}/cycles`, 'cycle_1'), kahfCycleDoc);

    allMembersList.forEach((m, idx) => {
      const assignId = `assign_user_${m.userId}`;
      const ref = doc(db, `groups/${demoGroupId}/tasks/${kahfTaskId}/cycles/cycle_1/assignments`, assignId);
      const isDone = idx < 2;
      batch.set(ref, {
        id: assignId,
        taskId: kahfTaskId,
        cycleNumber: 1,
        unitNumber: idx + 1,
        unitTitle: 'قراءة سورة الكهف',
        assignedToUserId: m.userId,
        assignedToName: m.displayName,
        status: isDone ? 'completed' : 'not_started',
        completedAt: isDone ? getNowInAdenISO() : null,
      });
    });

    // Create 3: Daily Morning & Evening Adhkar (Individual)
    const adhkarTaskId = `demo_task_adhkar_${Date.now()}`;
    const adhkarTask: Task = {
      id: adhkarTaskId,
      groupId: demoGroupId,
      name: 'أذكار الصباح والمساء اليومية',
      instructions: 'المحافظة على أذكار الصباح بعد الفجر وأذكار المساء قبل الغروب.',
      taskType: 'individual',
      recurrence: 'daily',
      unitCount: allMembersList.length,
      showNamesOnCompletion: true,
      reminderTime: '06:30',
      currentCycleNumber: 1,
      status: 'active',
      createdBy: currentUser.uid,
      createdAt: getNowInAdenISO(),
    };
    await setDoc(doc(db, `groups/${demoGroupId}/tasks`, adhkarTaskId), adhkarTask);
    const adhkarCycleDoc: TaskCycle = {
      id: 'cycle_1',
      taskId: adhkarTaskId,
      groupId: demoGroupId,
      cycleNumber: 1,
      startDate: new Date().toISOString(),
      endDate: calculateCycleEnd(new Date(), 'daily').toISOString(),
      status: 'active',
      totalUnits: allMembersList.length,
      completedUnits: 3,
      createdAt: getNowInAdenISO(),
    };
    await setDoc(doc(db, `groups/${demoGroupId}/tasks/${adhkarTaskId}/cycles`, 'cycle_1'), adhkarCycleDoc);

    allMembersList.forEach((m, idx) => {
      const assignId = `assign_user_${m.userId}`;
      const ref = doc(db, `groups/${demoGroupId}/tasks/${adhkarTaskId}/cycles/cycle_1/assignments`, assignId);
      const isDone = idx < 3;
      batch.set(ref, {
        id: assignId,
        taskId: adhkarTaskId,
        cycleNumber: 1,
        unitNumber: idx + 1,
        unitTitle: 'أذكار الصباح والمساء',
        assignedToUserId: m.userId,
        assignedToName: m.displayName,
        status: isDone ? 'completed' : 'not_started',
        completedAt: isDone ? getNowInAdenISO() : null,
      });
    });

    // Create 4: Shared target: 10,000 Salawat collectively
    const salawatTaskId = `demo_task_salawat_${Date.now()}`;
    const salawatTask: Task = {
      id: salawatTaskId,
      groupId: demoGroupId,
      name: 'عشرة آلاف صلاة على النبي ﷺ',
      instructions: 'هدف جماعي مشترك تشارك فيه المجموعة للوصول إلى 10,000 صلاة وسلام على رسول الله ﷺ.',
      taskType: 'shared_target',
      recurrence: 'monthly',
      targetTotal: 10000,
      currentTotal: 3450,
      showNamesOnCompletion: true,
      currentCycleNumber: 1,
      status: 'active',
      createdBy: currentUser.uid,
      createdAt: getNowInAdenISO(),
    };
    await setDoc(doc(db, `groups/${demoGroupId}/tasks`, salawatTaskId), salawatTask);
    const salawatCycleDoc: TaskCycle = {
      id: 'cycle_1',
      taskId: salawatTaskId,
      groupId: demoGroupId,
      cycleNumber: 1,
      startDate: new Date().toISOString(),
      endDate: calculateCycleEnd(new Date(), 'monthly').toISOString(),
      status: 'active',
      totalUnits: 10000,
      completedUnits: 3450,
      createdAt: getNowInAdenISO(),
    };
    await setDoc(doc(db, `groups/${demoGroupId}/tasks/${salawatTaskId}/cycles`, 'cycle_1'), salawatCycleDoc);

    // Initial invite code
    const inviteCode = 'DEMO-QURAN';
    batch.set(doc(db, 'invitations', inviteCode), {
      code: inviteCode,
      groupId: demoGroupId,
      groupName: demoGroup.name,
      createdBy: currentUser.uid,
      createdAt: getNowInAdenISO(),
      active: true,
    });

    await batch.commit();

    await logActivity(demoGroupId, 'member_joined', 'تم تجهيز المجموعة التجريبية بختمة القرآن والمهام الأسبوعية واليومية.');

    setCurrentGroupId(demoGroupId);
  };

  // 15. Delete group
  const deleteGroup = async (groupId: string) => {
    if (!currentUser) throw new Error("غير مصرح");
    await deleteDoc(doc(db, 'groups', groupId));
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (currentGroupId === groupId) {
      setCurrentGroupId(groups.length > 1 ? groups.find(g => g.id !== groupId)!.id : null);
    }
  };

  return (
    <GroupContext.Provider value={{
      groups,
      currentGroup,
      members,
      tasks,
      cycles,
      assignments,
      pendingOverdueAssignments,
      activityFeed,
      swapRequests,
      loadingGroups,
      isCurrentUserAdmin,
      setCurrentGroupId,
      createGroup,
      joinGroupByCode,
      generateInviteCode,
      removeMember,
      updateMemberRole,
      createTask,
      deleteTask,
      startNewCycle,
      markUnitCompleted,
      markPendingUnitCompleted,
      undoUnitCompleted,
      excuseUnit,
      incrementSharedTarget,
      requestSwap,
      respondToSwap,
      reassignUnit,
      autoRotateExpiredCycle,
      seedDemoGroup,
      deleteGroup,
      activeQuranReader,
      openQuranReader,
      closeQuranReader,
      myDependents,
      isMyDependent,
      addDependentToGroup,
      removeDependentFromGroup,
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
