import React, { useState } from 'react';

import { formatToPar } from '../utils/utils';

interface Props {
    index: number;
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

export const CardPick: React.FC<Props> = ({ pick, index }) => {

    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => {
        setIsOpen(!isOpen)
    }

    // WIP: will refactor gql instead to just pull the correct tournament
    
    const underParFormatted = formatToPar(pick.score_under_par);
    const scoreTodayFormatted = formatToPar(pick.score_today);
    const thruIsTeeTime = pick.thru && (pick.thru.includes('AM') || pick.thru.includes('PM'));
    const thruFormatted = thruIsTeeTime ? null : pick.thru;

    const showStatus = pick.status === 'CUT' || pick.status === 'WD' ? pick.status : '--'
    const bgColorClass = (index > 3 || pick.score_under_par === null) ? "bg-black" : "bg-grey-100";

    return (
        <div className={`${bgColorClass} mb-4 rounded p-4`}>
            <div className="flex items-center">
                <p className="flex-1 font-semibold text-base">{pick.full_name}</p>
                <div className="flex-1 flex flex-col items-center justify-center">
                <span className="text-xs">Pos</span>
                    <p className="text-xl">{ pick.position || showStatus }</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Score</span>
                    <p className="text-xl">{ underParFormatted }</p>
                </div>
                <div className="accordion-header" onClick={ toggle }>
                    <span className={`accordion-arrow text-grey-200 ${isOpen ? 'open' : ''}`}>&#9660;</span>
                </div>
            </div>
            { isOpen &&
            <div className="mt-4 flex justify-around bg-grey-200 p-4 rounded">
                { scoreTodayFormatted && 
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Today</span>
                    <p className="">{ scoreTodayFormatted }</p>
                </div>
                 }

                { thruFormatted && <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Thru</span>
                    <p className="">{ thruFormatted  || "-"}</p>
                </div>
                }
                { thruIsTeeTime && <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Tee Time</span>
                    <p className="">{ pick.thru  || "-"}</p>
                </div>
                }
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
