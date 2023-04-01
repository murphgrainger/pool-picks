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
    return poolMembers.map((member: any) => {
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
        member_sum_under_par: sum,
        picks: picks,
      }
    }).sort((a: any, b: any) => a.member_sum_under_par - b.member_sum_under_par);
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