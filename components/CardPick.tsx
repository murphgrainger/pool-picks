import React from 'react';

interface Props {
    pick: {
      id: number;
      full_name: string;
      tournaments: {
        status: string;
        position: number;
        thru: number;
        score_today: number;
        score_round_one: number;
        score_round_two: number;
        score_round_three: number;
        score_round_four: number;
        score_under_par: number;
        score_sum: number;
        tournament_id: number;
      }[];
    },
    tournamentId: number;
  }

export const CardPick: React.FC<Props> = ({ pick, tournamentId }) => {

    // WIP: will refactor gql instead to just pull the correct tournament
    const data = pick.tournaments.filter(t => t.tournament_id === tournamentId)[0]

    return (
        <div key={pick.id} className="bg-blue-100 mb-4 rounded p-4">
            <div className="flex items-center">
                <p className="flex-1 font-semibold text-xl">{pick.full_name}</p>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Pos</span>
                    <p className="text-xl">{data.position || "-"}</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Score</span>
                    <p className="text-xl">{data.score_under_par || "-"}</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Tot</span>
                    <p className="text-xl">{data.score_sum || "-"}</p>
                </div>
            </div>
            <div className="mt-4 flex justify-around bg-blue-200 p-4 rounded">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Status</span>
                    <p className="">{data.status || "-"}</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R1</span>
                    <p className="">{data.score_round_one || "-"}</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R2</span>
                    <p className="">{data.score_round_two || "-"}</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R3</span>
                    <p className="">{data.score_round_three || "-"}</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R4</span>
                    <p className="">{data.score_round_four || "-"}</p>
                </div>
            </div>
        </div>
    )

}
