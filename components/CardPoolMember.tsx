import React, { useState } from 'react';
import PicksCreate from './PicksCreate';
import { Athlete } from '@prisma/client';
import { CardPick } from './CardPick';

interface Props {
    member: Record<string, any>;
    currentMemberId: number,
    poolStatus: string,
    tournamentId: number
  }

export const CardPoolMember: React.FC<Props> = ({ member, currentMemberId, poolStatus, tournamentId }) => {
    
    const currentUserCard = member.id === currentMemberId;
    const pickStatus = member.athletes.length ? "Picks Submitted" : "Awaiting Picks"

    const[showPicks, setShowPicks] = useState(false)

    const togglePicks = () => {
        setShowPicks(!showPicks)
    }

    if(poolStatus === "Open") {
        return (
            <div className="w-full mt-6 p-6 rounded bg-blue-300" key={member.id}>
                <h3>{member?.user?.nickname}</h3>
                { !currentUserCard &&  
                    <p className="font-semibold">{ pickStatus }</p>
                }
                { currentUserCard && !member.athletes.length &&
                    <PicksCreate 
                    memberId={currentMemberId}
                    tournamentId={tournamentId}
                    />
                }
                { currentUserCard && member?.athletes?.map(({ athlete }: { athlete: Athlete }) => {
                    return (
                    <p key={athlete.id}>{athlete.full_name}</p>
                    )
                })}
         </div>  
        )
    }

    return (
        <div className="w-full mt-6 p-6 pb-2 rounded bg-blue-300" key={member.id}>
            <div className="flex items-center p-4 pt-0">
                <h3 className="flex-1 text-2xl">{member?.user?.nickname}</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Pos</span>
                    <p className="text-xl">3</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Tot</span>
                    <p className="text-xl">929</p>
                </div>
                <div className="accordion-header" onClick={togglePicks}>
                    <span className={`accordion-arrow text-blue-900 ${showPicks ? 'open' : ''}`}>&#9660;</span>
                </div>
            </div>
            {showPicks &&
            member?.athletes
                ?.sort((a: any, b: any) => a.athlete.score_under_par - b.athlete.score_under_par)
                .map(({ athlete }: { athlete: any }) => (
                <CardPick pick={athlete} tournamentId={tournamentId} />
                ))
            }
        </div>
   )
}

export default CardPoolMember;

