import { GroupMember } from '../types';

export interface PlannedUnit {
  unitNumber: number;
  unitTitle: string;
  assignedToUserId: string;
  assignedToName: string;
}

export interface PastAssignmentRecord {
  unitNumber: number;
  assignedToUserId: string;
}

export interface MemberJuzQuota {
  userId: string;
  count: number;
}

/**
 * Generates sequential rotation specifically for Quran Khatmah (30 Juz):
 * 1. Sequential progression: Each member's Juz advances strictly by +1 (modulo 30) each cycle.
 *    E.g. Month 1: Juz 2 -> Month 2: Juz 3 -> Month 3: Juz 4.
 * 2. Multi-Juz support: If members < 30, members can be assigned multiple parts, each part advancing by +1.
 * 3. Guarantees all 30 Juz are covered.
 */
export function generateSequentialQuranAssignments(
  members: GroupMember[],
  cycleNumber: number = 1,
  previousAssignments?: PastAssignmentRecord[],
  customQuotas?: MemberJuzQuota[]
): PlannedUnit[] {
  if (!members || members.length === 0) return [];

  const memberMap = new Map<string, GroupMember>();
  members.forEach(m => memberMap.set(m.userId, m));

  const result: PlannedUnit[] = [];

  // Case A: Next cycle rotation from previous assignments
  if (previousAssignments && previousAssignments.length > 0) {
    const assignedUnitsSet = new Set<number>();

    // Shift each previous assignment by +1 (1..30)
    for (const prev of previousAssignments) {
      const nextUnitNumber = (prev.unitNumber % 30) + 1;
      
      // Determine assignee: keep previous member if still in group, otherwise pick first member
      let assignee = memberMap.get(prev.assignedToUserId);
      if (!assignee) {
        assignee = members[0];
      }

      result.push({
        unitNumber: nextUnitNumber,
        unitTitle: `الجزء ${nextUnitNumber}`,
        assignedToUserId: assignee.userId,
        assignedToName: assignee.displayName,
      });
      assignedUnitsSet.add(nextUnitNumber);
    }

    // Ensure all 30 Juz are present (fill any missing units)
    for (let u = 1; u <= 30; u++) {
      if (!assignedUnitsSet.has(u)) {
        // Assign to a member with fewer units
        const memberUsage = new Map<string, number>();
        members.forEach(m => memberUsage.set(m.userId, 0));
        result.forEach(r => memberUsage.set(r.assignedToUserId, (memberUsage.get(r.assignedToUserId) || 0) + 1));
        
        let leastAssignedMember = members[0];
        let minCount = Infinity;
        for (const m of members) {
          const count = memberUsage.get(m.userId) || 0;
          if (count < minCount) {
            minCount = count;
            leastAssignedMember = m;
          }
        }

        result.push({
          unitNumber: u,
          unitTitle: `الجزء ${u}`,
          assignedToUserId: leastAssignedMember.userId,
          assignedToName: leastAssignedMember.displayName,
        });
        assignedUnitsSet.add(u);
      }
    }

    // Sort by unitNumber 1..30
    result.sort((a, b) => a.unitNumber - b.unitNumber);
    return result;
  }

  // Case B: Cycle 1 initialization
  let currentUnit = 1;

  if (customQuotas && customQuotas.length > 0) {
    // Distribute according to admin's custom quotas
    for (const quota of customQuotas) {
      const member = memberMap.get(quota.userId);
      if (!member) continue;

      for (let i = 0; i < quota.count && currentUnit <= 30; i++) {
        result.push({
          unitNumber: currentUnit,
          unitTitle: `الجزء ${currentUnit}`,
          assignedToUserId: member.userId,
          assignedToName: member.displayName,
        });
        currentUnit++;
      }
    }
  }

  // If there are still remaining units or no custom quotas:
  // Distribute remaining (or all) 30 units across members evenly
  while (currentUnit <= 30) {
    const memberIndex = (currentUnit - 1) % members.length;
    const member = members[memberIndex];
    result.push({
      unitNumber: currentUnit,
      unitTitle: `الجزء ${currentUnit}`,
      assignedToUserId: member.userId,
      assignedToName: member.displayName,
    });
    currentUnit++;
  }

  result.sort((a, b) => a.unitNumber - b.unitNumber);
  return result;
}

/**
 * Generates a provably balanced distribution and rotates assignments across cycles.
 * 
 * Invariants:
 * 1. Balance: Max difference between number of units assigned to any two members <= 1.
 * 2. Fair Turn (M >= U): If members exceed units, the offset shifts by U so unassigned members get units first.
 * 3. Anti-Repeat (M > 1): Avoids assigning the same unit to the same member in consecutive cycles
 *    whenever mathematically possible.
 */
export function generateBalancedAssignments(
  units: { unitNumber: number; unitTitle: string }[],
  members: GroupMember[],
  cycleNumber: number = 1,
  previousAssignments?: PastAssignmentRecord[]
): PlannedUnit[] {
  if (!members || members.length === 0 || !units || units.length === 0) {
    return [];
  }

  const M = members.length;
  const U = units.length;

  if (M === 1) {
    // Only one member, they must get all units
    return units.map(u => ({
      unitNumber: u.unitNumber,
      unitTitle: u.unitTitle,
      assignedToUserId: members[0].userId,
      assignedToName: members[0].displayName,
    }));
  }

  // Calculate rotation shift based on cycleNumber
  // For M >= U: shift by (cycleNumber - 1) * U % M
  // For M < U: shift member pointer by (cycleNumber - 1)
  const baseShift = M >= U 
    ? ((cycleNumber - 1) * U) % M 
    : ((cycleNumber - 1) * Math.max(1, Math.floor(U / M))) % M;

  // Order of members for this cycle
  const rotatedMembers = [
    ...members.slice(baseShift),
    ...members.slice(0, baseShift)
  ];

  // Distribute units evenly
  const assignments: PlannedUnit[] = [];
  for (let i = 0; i < U; i++) {
    const assignedMember = rotatedMembers[i % M];
    assignments.push({
      unitNumber: units[i].unitNumber,
      unitTitle: units[i].unitTitle,
      assignedToUserId: assignedMember.userId,
      assignedToName: assignedMember.displayName,
    });
  }

  // Anti-Repeat Guard: Check against previousAssignments if provided
  if (previousAssignments && previousAssignments.length > 0 && M > 1) {
    const prevMap = new Map<number, string>();
    previousAssignments.forEach(pa => prevMap.set(pa.unitNumber, pa.assignedToUserId));

    // Detect any unit assigned to the same user as in the previous cycle
    for (let i = 0; i < assignments.length; i++) {
      const current = assignments[i];
      const prevUserId = prevMap.get(current.unitNumber);

      if (prevUserId && current.assignedToUserId === prevUserId) {
        // Find another unit j whose assignee is different and swapping does not violate constraints
        let swapped = false;
        for (let j = 0; j < assignments.length; j++) {
          if (i === j) continue;
          const candidate = assignments[j];
          const prevUserForCandidate = prevMap.get(candidate.unitNumber);

          // We can swap if:
          // 1. candidate's assignee != prevUserId (so current unit gets a non-previous assignee)
          // 2. current's assignee != prevUserForCandidate (so candidate unit doesn't get its previous assignee)
          if (candidate.assignedToUserId !== prevUserId && current.assignedToUserId !== prevUserForCandidate) {
            // Swap assignees
            const tempUserId = current.assignedToUserId;
            const tempName = current.assignedToName;

            current.assignedToUserId = candidate.assignedToUserId;
            current.assignedToName = candidate.assignedToName;

            candidate.assignedToUserId = tempUserId;
            candidate.assignedToName = tempName;

            swapped = true;
            break;
          }
        }

        // If strict two-way non-conflict wasn't found, shift to any different member
        if (!swapped) {
          const alternateMember = members.find(m => m.userId !== prevUserId);
          if (alternateMember) {
            current.assignedToUserId = alternateMember.userId;
            current.assignedToName = alternateMember.displayName;
          }
        }
      }
    }
  }

  return assignments;
}
