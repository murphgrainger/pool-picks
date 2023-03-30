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

  export const sumMemberPicks: any = (athleteData: any[], tournamentId: number): number | null => {
    const validPicks = athleteData.filter((pick:any) => {
      return pick.athlete.tournaments?.filter((t:any) => t.status === 'Active' && t.tournament_id === tournamentId)
    }).map((pick:any) => {
      const tournament = pick.athlete.tournaments.find((tournament: any) => tournament.tournament_id === tournamentId);

      return {
        name: pick.athlete.full_name,
        score: tournament.score_under_par
      }
    }).sort((a: any, b: any) => a.score - b.score);
    
    const sum = validPicks.length >= 4
    ? validPicks.slice(0, 4).reduce((acc: number, pick: any) => acc + pick.score, 0)
    : null;

    return sum;
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
  