export type TaskType = 'distributed' | 'individual' | 'shared_target';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'once';
export type TaskUnitStatus = 'not_started' | 'in_progress' | 'completed' | 'excused';
export type GroupRole = 'admin' | 'member';

export interface DependentChild {
  id: string;
  displayName: string;
  parentUserId: string;
  parentDisplayName: string;
  relationship?: 'son' | 'daughter' | 'child' | 'family_member';
  avatar?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  dailyUncompletedReminderEnabled?: boolean;
  dailyUncompletedReminderTime?: string;
  reminderSoundEnabled?: boolean;
  lastReminderSentDate?: string;
  dependents?: DependentChild[];
  createdAt: string;
  updatedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  role: GroupRole;
  isDependent?: boolean;
  parentUserId?: string;
  parentDisplayName?: string;
  relationship?: 'son' | 'daughter' | 'child' | 'family_member';
  avatar?: string;
  joinedAt: string;
}

export interface Invitation {
  code: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  createdAt: string;
  active: boolean;
}

export interface Task {
  id: string;
  groupId: string;
  name: string;
  instructions?: string;
  taskType: TaskType;
  recurrence: RecurrenceType;
  unitTemplate?: 'quran_30_juz' | 'custom' | 'counter';
  unitCount?: number;
  targetTotal?: number; // for shared_target (e.g. 10000 salawat)
  currentTotal?: number; // progress towards shared_target
  showNamesOnCompletion: boolean;
  reminderTime?: string;
  currentCycleNumber: number;
  status: 'active' | 'archived';
  createdBy: string;
  createdAt: string;
}

export interface TaskCycle {
  id: string;
  taskId: string;
  groupId: string;
  cycleNumber: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  totalUnits: number;
  completedUnits: number;
  createdAt: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  cycleNumber: number;
  unitNumber: number;
  unitTitle: string;
  assignedToUserId: string;
  assignedToName: string;
  isDependent?: boolean;
  parentUserId?: string;
  parentDisplayName?: string;
  status: TaskUnitStatus;
  completedAt?: string;
  notes?: string;
  excusedReason?: string;
  updatedAt?: string;
}

export interface CompletionRecord {
  id: string;
  taskId: string;
  cycleNumber: number;
  unitNumber: number;
  unitTitle: string;
  userId: string;
  userName: string;
  isDependent?: boolean;
  parentUserId?: string;
  parentDisplayName?: string;
  completedAt: string;
  notes?: string;
}

export interface SwapRequest {
  id: string;
  taskId: string;
  taskName: string;
  cycleNumber: number;
  requesterUserId: string;
  requesterName: string;
  requesterUnit: number;
  requesterUnitTitle: string;
  targetUserId: string;
  targetName: string;
  targetUnit: number;
  targetUnitTitle: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

export interface ActivityRecord {
  id: string;
  groupId: string;
  type: 'completed' | 'undo' | 'excused' | 'swap' | 'member_joined' | 'member_removed' | 'cycle_rotated' | 'task_created' | 'role_updated';
  actorId: string;
  actorName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  title: string;
  description: string;
  icon: string;
  awardedAt: string;
  relatedRecordId?: string;
}

export type PersonalTaskCategory = 'khatmah' | 'dhikr' | 'wird' | 'custom';
export type PersonalTaskFrequency = 'daily' | 'weekly' | 'specific_date' | 'open';

export interface PersonalCompletionLog {
  date: string;
  count?: number;
  unitNumber?: number;
  notes?: string;
  timestamp: string;
}

export interface PersonalTask {
  id: string;
  userId: string;
  title: string;
  category: PersonalTaskCategory;
  description?: string;
  targetCount?: number;
  currentCount?: number;
  targetDate?: string;
  targetTime?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  reminderSoundEnabled?: boolean;
  frequency: PersonalTaskFrequency;
  completedUnits?: number[];
  totalUnits?: number;
  isCompleted: boolean;
  completedAt?: string;
  streakDays?: number;
  lastCompletedDate?: string;
  completionHistory?: PersonalCompletionLog[];
  createdAt: string;
  updatedAt?: string;
}
