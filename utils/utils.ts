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

    return reformattedMembers.sort((a: any, b: any) => {
      if(!a.picks.length) {
        return a.member_sum_under_par - b.member_sum_under_par;
      }
      if (hasMemberSumUnderPar) {
        return a.member_sum_under_par - b.member_sum_under_par;
      } else {
        return a.nickname.localeCompare(b.nickname);
      }
    });
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