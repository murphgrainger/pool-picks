export const redirectToSignIn = () => ({
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      }
  })

  export const redirectToHome = () => ({
    redirect: {
      destination: '/',
      permanent: false,
    }
})

  export const formatToPar = (score : number | null) => {
    const underParFormatted = score === null
    ? '--'
    : score === 0
    ? 'E'
    : score > 0
    ? `+${score}`
    : score < 0
    ? `${score}`
    : ''

    return underParFormatted;
  }

  export const sumMemberPicks: any = (athleteData: any[]): number | null => {
    const validPicks = athleteData.filter((pick:any) => {
      return pick.status === 'Active'
    }).sort((a: any, b: any) => {
      return a.score_under_par - b.score_under_par
    })
  
    const sum = validPicks.length >= 4
    ? validPicks.slice(0, 4).reduce((acc: number, pick: any) => acc + pick.score_under_par, 0)
    : null;

    return sum;
  }

  interface PoolMemberFormatted {
    id: number
    nickname?: string
    username?: string
    member_sum_under_par?: number
    member_position?: string,
    tied?: boolean,
    picks?: any,
}
  
export const reformatPoolMembers = (poolMembers: any[], tournamentId: number) => {
  const reformattedMembers = poolMembers.map((member: any) => {

    const picks = member.athletes.map((athletePick: any) => {

      const tournament = athletePick.athlete.tournaments.find((t: any) => t.tournament_id === tournamentId);
      
      return {
        id: athletePick.athlete.id,
        full_name: athletePick.athlete.full_name,
        status: tournament?.status ?? '',
        position: tournament?.position ?? '',
        score_today: tournament?.score_today ?? null,
        score_round_one: tournament?.score_round_one ?? null,
        score_round_two: tournament?.score_round_two ?? null,
        score_round_three: tournament?.score_round_three ?? null,
        score_round_four: tournament?.score_round_four ?? null,
        score_sum: tournament?.score_sum ?? null,
        score_under_par: tournament?.score_under_par ?? null,
        thru: tournament?.thru ?? null,
        tournament_id: tournament?.tournament_id ?? null,
      }
    });
    
    const sum = sumMemberPicks(picks);

    return {
      id: member.id,
      nickname: member.user.nickname,
      username: member.username,
      member_sum_under_par: sum,
      picks: picks,
    }
  })
 
  const hasMemberSumUnderPar = reformattedMembers.some((member: any) => member.member_sum_under_par !== null);
  const sortedMembers = reformattedMembers.sort((a, b) => (a.member_sum_under_par === null || b.member_sum_under_par === null) ? 1 : a.member_sum_under_par - b.member_sum_under_par);

  let currentPosition: string | undefined = undefined;
  let prevScore: number | null = null;
  let ties: { [score: number]: string } = {};

  const membersWithPosition: PoolMemberFormatted[] = sortedMembers.map((member, index) => {
    if (member.member_sum_under_par === null) {
      currentPosition = '--';
    } else if (prevScore === null) {
      currentPosition = '1';
      prevScore = member.member_sum_under_par;
    } else if (member.member_sum_under_par !== prevScore) {
      currentPosition = (index + 1 - Object.keys(ties).length).toString();
      ties = {};
      prevScore = member.member_sum_under_par;
    } else {
      currentPosition = ties[member.member_sum_under_par];
    }

    if (currentPosition !== undefined) {
      ties[member.member_sum_under_par] = currentPosition;
    }

    const memberWithPosition = { ...member, member_position: currentPosition };
    return memberWithPosition;
  });

  let prevPositionStr: string | undefined;
  membersWithPosition.forEach((member, index) => {
    if (member.member_sum_under_par !== null && index > 0 && member.member_sum_under_par === membersWithPosition[index - 1].member_sum_under_par) {
      member.tied = true;
      member.member_position = prevPositionStr;
    } else {
      prevPositionStr = member.member_position as string;
    }
  });

  membersWithPosition.forEach((member, index, array) => {
    if (member.tied) {
      array.forEach((otherMember, otherIndex) => {
        if (otherIndex !== index && otherMember.member_sum_under_par === member.member_sum_under_par) {
          otherMember.tied = true;
        }
      });
    }
  });
  
  return membersWithPosition;
}

  
  export const ordinalSuffix = (i: number) => {
    const j = i % 10;
    const k = i % 100;
    if (j === 1 && k !== 11) {
      return `st`;
    }
    if (j === 2 && k !== 12) {
      return `nd`;
    }
    if (j === 3 && k !== 13) {
      return `rd`;
    }
    return `th`;
  }

  export const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000 / 60; // difference in minutes
    const rounded = Math.round(diff);
    
    if (rounded === 0) {
      return "just now";
    } else if (rounded === 1) {
      return "1 minute ago";
    } else if (rounded < 60) {
      return `${rounded} minutes ago`;
    } else if (rounded < 120) {
      return "1 hour ago";
    } else if (rounded < 1440) {
      return `${Math.floor(rounded / 60)} hours ago`;
    } else if (rounded < 2880) {
      return "1 day ago";
    } else {
      return `${Math.floor(rounded / 1440)} days ago`;
    }
  }

  export const formattedDate = (date: Date) => {
    const formatted = new Date(date).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return formatted.replace(',', '');
  };

  export const timeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const elapsed = Math.floor((now.getTime() - time.getTime()) / 1000 / 60); // convert to minutes
  
    if (elapsed < 1) {
      return 'just now';
    } else if (elapsed === 1) {
      return '1 minute ago';
    } else {
      return `${elapsed} minutes ago`;
    }
  }