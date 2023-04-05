import React from 'react';

interface Props {
    status: string
}

export const CardPoolStatus : React.FC<Props> = ({ status }) => {

    if(status === "Active" || status === "Locked") return null;

    let statusDescription = "";

    if(status === "Open") {
        statusDescription = "This pool is still accepting member picks. You cannot view other members' picks until the commissioner locks the pool prior to the tournament start."
    } else if (status === "Locked") {
        statusDescription = "The deadline to submit picks has passed. This pool is locked for the rest of the tournament. As the event progresses, your individual pick scores and overall pool place will update."
    } else if (status === "Complete") {
        statusDescription = "The tournament for this pool has finished and the results of the pool are final."
    } else if (status === "Setup") {
        statusDescription = "The commissioner is still setting up this pool. You can make your picks once the field is finalized."
    }

    return (
        <div className="w-full mt-4 p-4 rounded bg-grey-200">
         <p className="text-white text-xs">⭐ { statusDescription }</p>
        </div>
    )
}
   

