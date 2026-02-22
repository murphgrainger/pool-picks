export const PICKS_PER_MEMBER = 6;
export const SCORING_PICKS = 4;
export const MAX_A_GROUP_PICKS = 3;

export const POOL_STATUSES = ["Setup", "Open", "Locked", "Active", "Complete"] as const;
export type PoolStatus = (typeof POOL_STATUSES)[number];

export const TOURNAMENT_STATUSES = ["Scheduled", "Active", "Completed"] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const INVITE_STATUSES = ["Invited", "Accepted", "Rejected"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];
