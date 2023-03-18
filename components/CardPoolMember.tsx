import React from 'react';
import PicksCreate from './PicksCreate';
import { Athlete } from '@prisma/client';


interface Props {
    member: Record<string, any>;
    currentMemberId: number,
    poolStatus: string,
    tournamentId: number
  }

export const CardPoolMember: React.FC<Props> = ({ member, currentMemberId, poolStatus, tournamentId }) => {
    
    const currentUserCard = member.id === currentMemberId;
    const pickStatus = member.athletes.length ? "Picks Submitted" : "Awaiting Picks"

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
        <div className="w-full mt-6 p-6 rounded bg-blue-300" key={member.id}>
            <h3>{member?.user?.nickname}</h3>
            { member?.athletes?.map(({ athlete }: { athlete: Athlete }) => {
                return (
                <p key={athlete.id}>{athlete.full_name}</p>
                )
            })}
        </div>
   )
}

export default CardPoolMember;

