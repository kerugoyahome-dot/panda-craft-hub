// ========================================
// UNIFIED STATUS ENGINE
// ========================================

export type UnifiedStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "in_progress"
  | "completed"
  | "rejected"
  | "archived";

export const statusLabels: Record<UnifiedStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  archived: "Archived",
};

export const statusColors: Record<UnifiedStatus, string> = {
  draft: "bg-muted/30 text-muted-foreground border-muted",
  submitted: "bg-cyan-500/15 text-cyan-500 border-cyan-500/40",
  under_review: "bg-purple-500/15 text-purple-500 border-purple-500/40",
  approved: "bg-green-500/15 text-green-500 border-green-500/40",
  in_progress: "bg-primary/15 text-primary border-primary/40",
  completed: "bg-green-600/15 text-green-600 border-green-600/40",
  rejected: "bg-destructive/15 text-destructive border-destructive/40",
  archived: "bg-muted/40 text-muted-foreground border-muted",
};

// Allowed transitions per entity type
export const workflowRules: Record<string, Record<string, UnifiedStatus[]>> = {
  project: {
    draft: ["submitted", "in_progress"],
    submitted: ["under_review", "rejected"],
    under_review: ["approved", "rejected"],
    approved: ["in_progress"],
    in_progress: ["completed", "under_review"],
    completed: ["archived"],
    rejected: ["draft"],
    archived: [],
  },
  proposal: {
    draft: ["submitted"],
    submitted: ["under_review"],
    under_review: ["approved", "rejected"],
    approved: ["in_progress"],
    in_progress: ["completed"],
    completed: ["archived"],
    rejected: ["draft"],
    archived: [],
  },
  document: {
    draft: ["submitted", "in_progress"],
    submitted: ["under_review", "approved"],
    under_review: ["approved", "rejected"],
    approved: ["archived"],
    in_progress: ["completed"],
    completed: ["archived"],
    rejected: ["draft"],
    archived: [],
  },
  expense: {
    draft: ["submitted"],
    submitted: ["under_review"],
    under_review: ["approved", "rejected"],
    approved: ["completed"],
    completed: ["archived"],
    rejected: ["draft"],
    archived: [],
    in_progress: [],
  },
};

export const getNextStatuses = (
  entityType: string,
  currentStatus: string
): UnifiedStatus[] => {
  const rules = workflowRules[entityType];
  if (!rules) return [];
  return rules[currentStatus] || [];
};

// Map legacy statuses to unified statuses
export const mapLegacyStatus = (status: string): UnifiedStatus => {
  const map: Record<string, UnifiedStatus> = {
    planning: "draft",
    "in-progress": "in_progress",
    in_progress: "in_progress",
    review: "under_review",
    completed: "completed",
    submitted: "submitted",
    pending: "submitted",
    approved: "approved",
    rejected: "rejected",
    active: "in_progress",
    inactive: "archived",
    draft: "draft",
    archived: "archived",
  };
  return map[status] || "draft";
};
