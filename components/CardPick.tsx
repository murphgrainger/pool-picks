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
        score_sum: number;
      }[];
    };
  }

export const CardPick: React.FC<Props> = ({ pick }) => {
    console.log('pick', pick)
    return (
        <div key={pick.id} className="bg-blue-100 mb-4 rounded p-4">
            <div className="flex items-center">
                <p className="flex-1 font-semibold text-xl">{pick.full_name}</p>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Pos</span>
                    <p className="text-xl">T12</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Tot</span>
                    <p className="text-xl">564</p>
                </div>
            </div>
            <div className="mt-4 flex justify-around bg-blue-200 p-4 rounded">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">Status</span>
                    <p className="">Active</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R1</span>
                    <p className="">65</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R2</span>
                    <p className="">62</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R3</span>
                    <p className="">77</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-xs">R4</span>
                    <p className="">79</p>
                </div>
            </div>
        </div>
    )

}
