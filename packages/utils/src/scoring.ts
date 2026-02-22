import { SCORING_PICKS } from "./constants";

interface AthletePickData {
  status: string;
  score_under_par: number | null;
}

export interface PoolMemberFormatted {
  id: number;
  nickname?: string;
  username?: string;
  member_sum_under_par: number | null;
  member_position?: number;
  isTied?: boolean;
  picks: AthletePickFormatted[];
}

export interface AthletePickFormatted {
  id: number;
  full_name: string;
  status: string;
  position: number | null;
  score_today: number | null;
  score_round_one: number | null;
  score_round_two: number | null;
  score_round_three: number | null;
  score_round_four: number | null;
  score_sum: number | null;
  score_under_par: number | null;
  thru: string | null;
  tournament_id: number | null;
}

export function sumMemberPicks(athleteData: AthletePickData[]): number | null {
  const validPicks = athleteData
    .filter((pick) => pick.status === "Active")
    .sort((a, b) => (a.score_under_par ?? 0) - (b.score_under_par ?? 0));

  if (validPicks.length < SCORING_PICKS) return null;

  return validPicks
    .slice(0, SCORING_PICKS)
    .reduce((acc, pick) => acc + (pick.score_under_par ?? 0), 0);
}

export function reformatPoolMembers(
  poolMembers: any[],
  tournamentId: number
): PoolMemberFormatted[] {
  const reformattedMembers: PoolMemberFormatted[] = poolMembers.map(
    (member: any) => {
      const picks: AthletePickFormatted[] = member.athletes.map(
        (athletePick: any) => {
          const tournament = athletePick.athlete.tournaments.find(
            (t: any) => t.tournament_id === tournamentId
          );

          return {
            id: athletePick.athlete.id,
            full_name: athletePick.athlete.full_name,
            status: tournament?.status ?? "",
            position: tournament?.position ?? null,
            score_today: tournament?.score_today ?? null,
            score_round_one: tournament?.score_round_one ?? null,
            score_round_two: tournament?.score_round_two ?? null,
            score_round_three: tournament?.score_round_three ?? null,
            score_round_four: tournament?.score_round_four ?? null,
            score_sum: tournament?.score_sum ?? null,
            score_under_par: tournament?.score_under_par ?? null,
            thru: tournament?.thru ?? null,
            tournament_id: tournament?.tournament_id ?? null,
          };
        }
      );

      const sum = sumMemberPicks(picks);

      return {
        id: member.id,
        nickname: member.user.nickname,
        username: member.username,
        member_sum_under_par: sum,
        picks,
      };
    }
  );

  return calculateMemberPosition(reformattedMembers);
}

export function calculateMemberPosition(
  members: PoolMemberFormatted[]
): PoolMemberFormatted[] {
  const nonNullMembers = members.filter(
    (member) => member.member_sum_under_par !== null
  ) as (PoolMemberFormatted & { member_sum_under_par: number })[];

  const sortedNonNullMembers = nonNullMembers.sort(
    (a, b) => a.member_sum_under_par - b.member_sum_under_par
  );

  let lastPosition = 1;
  let lastScore: number | null = sortedNonNullMembers[0]?.member_sum_under_par;

  const nonNullMembersWithPosition = sortedNonNullMembers.map((member, i) => {
    const isTiedWithNext =
      member.member_sum_under_par ===
      sortedNonNullMembers[i + 1]?.member_sum_under_par;

    if (i === 0) {
      return {
        ...member,
        member_position: lastPosition,
        isTied: isTiedWithNext,
      };
    } else if (member.member_sum_under_par === lastScore) {
      return {
        ...member,
        member_position: lastPosition,
        isTied: true,
      };
    } else {
      lastScore = member.member_sum_under_par;
      lastPosition = i + 1;
      return {
        ...member,
        member_position: lastPosition,
        isTied: isTiedWithNext,
      };
    }
  });

  const nullMembers = members
    .filter((member) => member.member_sum_under_par === null)
    .map((member) => ({
      ...member,
      member_position: nonNullMembersWithPosition.length + 1,
      isTied: false,
    }));

  return [...nonNullMembersWithPosition, ...nullMembers];
}
