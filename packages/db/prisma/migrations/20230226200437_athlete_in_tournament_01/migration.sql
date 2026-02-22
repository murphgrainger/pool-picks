-- CreateTable
CREATE TABLE "AthletesInTournaments" (
    "status" TEXT NOT NULL,
    "position" INTEGER,
    "thru" INTEGER,
    "score_today" INTEGER,
    "score_round_one" INTEGER,
    "score_round_two" INTEGER,
    "score_round_three" INTEGER,
    "score_round_four" INTEGER,
    "score_playoff" INTEGER,
    "score_sum" INTEGER,
    "tournament_id" INTEGER NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthletesInTournaments_pkey" PRIMARY KEY ("tournament_id","athlete_id")
);

-- AddForeignKey
ALTER TABLE "AthletesInTournaments" ADD CONSTRAINT "AthletesInTournaments_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthletesInTournaments" ADD CONSTRAINT "AthletesInTournaments_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
