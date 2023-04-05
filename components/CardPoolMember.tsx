import React, { useState, useEffect } from 'react';
import PicksCreate from './PicksCreate';
import { CardPick } from './CardPick';
import UsernameCreate  from './UsernameCreate';

import { ordinalSuffix, formatToPar } from '../utils/utils';

interface Props {
    member: Record<string, any>;
    currentMemberId: number,
    poolStatus: string,
    tournamentId: number,
    position: number,
    tournamentExternalUrl: string | null
  }

export const CardPoolMember: React.FC<Props> = ({ member, currentMemberId, poolStatus, tournamentId, position, tournamentExternalUrl }) => {
    const currentUserCard = member.id === currentMemberId;
    const pickStatus = member.picks.length ? "Picks Submitted" : "Awaiting Picks"

    const[showPicks, setShowPicks] = useState(false)
    const [hasSubmittedUsername, setHasSubmittedUsername] = useState(!!member.username); // initialize the state based on whether the member has a username

    const togglePicks = () => { setShowPicks(!showPicks) }

    const suffix = ordinalSuffix(position);
    const underParFormatted = formatToPar(member.member_sum_under_par);

    useEffect(() => {
        if (member.username) {
          setHasSubmittedUsername(true);
        }
      }, [member.username]);


  const handleUsernameSubmitSuccess = (username: string) => {
    setHasSubmittedUsername(true);
    member.username = username;
  };

    if(poolStatus === "Open") {
        return (
            <div className="w-full mt-6 p-6 rounded bg-grey-200" key={member.id}>
               { !currentUserCard &&  
                <div className="flex justify-between">
                    <h3 className="">{hasSubmittedUsername ? member.username : member?.nickname}</h3>
                    <p className="font-semibold">{ pickStatus }</p>
                </div>
                }
                { currentUserCard && member.picks &&
                    <h3 className="mb-4">{member.username || member?.nickname}</h3>
                }
               { currentUserCard && !hasSubmittedUsername &&
                <UsernameCreate
                    memberId={currentMemberId}
                    onSubmitSuccess={handleUsernameSubmitSuccess}
                />
                }
                { currentUserCard && hasSubmittedUsername && !member.picks.length &&
                    <PicksCreate 
                    memberId={currentMemberId}
                    tournamentId={tournamentId}
                    tournamentExternalUrl={tournamentExternalUrl}
                    />
                }

                { currentUserCard && member?.picks
                ?.sort((a: any, b: any) => a.full_name.localeCompare(b.full_name))
                ?.map((athlete:any) => {
                    return (
                    <p key={athlete.id} className="p-2 mb-2 bg-grey-100 rounded">{athlete.full_name}</p>
                    )
                })
                }
         </div>  
        )
    }

    if(!member.picks.length) {
        return (
            <div className="w-full mt-6 p-6 rounded bg-grey-200 flex justify-between items-center">
                <h3 className="">{hasSubmittedUsername ? member.username : member?.nickname}</h3>
             <span className="italic text-xs">No Picks Submitted</span>
            </div>
        )
    }

    return (
        <div className="w-full mt-6 p-6 pb-2 rounded bg-grey-200" key={member.id}>
            <div className="flex items-center pb-4 pt-0">
                <div className="flex-1 flex items-center">
                 <p className="text-xl mr-4 text-yellow font-extrabold">{ member.member_sum_under_par ? position : '--' }</p>
                <h3 className="">{hasSubmittedUsername ? member.username : member?.nickname}</h3>

                <div className="flex-1 flex flex-col items-end pr-6 justify-center">
                    <p className="text-xl rounded-lg bg-grey-100 p-2 pr-3 pl-3 font-bold text-white">{ underParFormatted }</p>
                </div>
            </div>
                <div className="accordion-header" onClick={togglePicks}>
                    <span className={`accordion-arrow text-yellow ${showPicks ? 'open' : ''}`}>&#9660;</span>
                </div>
            </div>
            {showPicks &&
                member?.picks
                    ?.sort((a: any, b: any) => {
                    if (a.score_under_par !== null && b.score_under_par !== null) {
                        return a.score_under_par - b.score_under_par;
                    } else if (a.score_under_par !== null) {
                        return -1;
                    } else if (b.score_under_par !== null) {
                        return 1;
                    } else {
                        return a.full_name.localeCompare(b.full_name);
                    }
                    })
                    .map((athlete: any, i: number) => <CardPick key={i} pick={athlete} index={i} />)
                }
        </div>
   )
}

export default CardPoolMember;

