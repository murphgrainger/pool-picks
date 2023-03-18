import React from 'react';

interface Props {
    status: string
}

export const CardPoolStatus : React.FC<Props> = ({ status }) => {

    let statusDescription = "";

    if(status === "Open") {
        statusDescription = "This pool is still accepting member picks. All member picks will be hidden from you except your own until the pool is activated by the commissioner."
    } else if (status === "Locked") {
        statusDescription = "All pool picks have been submitted and are locked for the rest of the tournament."
    } else if (status === "Complete") {
        statusDescription = "The tournament for this pool has finished and the results of the pool are final."
    } else if (status === "Setup") {
        statusDescription = "The commissioner is still setting up this pool. You can make your picks once the field is finalized."
    }

    return (
        <div className="w-full mt-6 p-6 rounded bg-yellow-300">
         <p>{ statusDescription }</p>
        </div>
    )
}
   

