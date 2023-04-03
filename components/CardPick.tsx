import React, { useState } from 'react';

import { ordinalSuffix, formatToPar } from '../utils/utils';

interface Props {
    pick: {
    id: number;
    full_name: string;
    status: string;
    position: number;
    thru: string;
    score_today: number;
    score_round_one: number;
    score_round_two: number;
    score_round_three: number;
    score_round_four: number;
    score_under_par: number;
    score_sum: number;
    tournament_id: number;
    }
  }

export const CardPick: React.FC<Props> = ({ pick }) => {

    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => {
        setIsOpen(!isOpen)
    }

    // WIP: will refactor gql instead to just pull the correct tournament
    
    const underParFormatted = formatToPar(pick.score_under_par);
    const scoreTodayFormatted = formatToPar(pick.score_today);
    const suffix = ordinalSuffix(pick.position);


    return (
        <div key={pick.id} className="bg-blue-100 mb-4 rounded p-4">
            <div className="flex items-center">
                <p className="flex-1 font-semibold text-base">{pick.full_name}</p>
                <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs">Pos</span>
                    <p className="text-xl">{ pick.position || pick.status }</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Score</span>
                    <p className="text-xl">{ underParFormatted }</p>
                </div>
                <div className="accordion-header" onClick={ toggle }>
                    <span className={`accordion-arrow text-blue-400 ${isOpen ? 'open' : ''}`}>&#9660;</span>
                </div>
            </div>
            { isOpen &&
            <div className="mt-4 flex justify-around bg-blue-200 p-4 rounded">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Today</span>
                    <p className="">{ scoreTodayFormatted || "-" }</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Thru</span>
                    <p className="">{ pick.thru || "-" }</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R1</span>
                    <p className="">{ pick.score_round_one || "-" }</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R2</span>
                    <p className="">{ pick.score_round_two || "-" }</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R3</span>
                    <p className="">{ pick.score_round_three || "-" }</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R4</span>
                    <p className="">{ pick.score_round_four || "-" }</p>
                </div>
            </div>
            }
        </div>
    )

}
