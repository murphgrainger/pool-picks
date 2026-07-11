import { router } from "./trpc";
import { poolRouter } from "./routers/pool";
import { tournamentRouter } from "./routers/tournament";
import { athleteRouter } from "./routers/athlete";
import { poolInviteRouter } from "./routers/poolInvite";
import { poolMemberRouter } from "./routers/poolMember";
import { userRouter } from "./routers/user";

export const appRouter = router({
  pool: poolRouter,
  tournament: tournamentRouter,
  athlete: athleteRouter,
  poolInvite: poolInviteRouter,
  poolMember: poolMemberRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export { createContext } from "./context";
export type { UserContext, CreateContextOptions, Context } from "./context";
export { autoAdvanceScheduledTournaments } from "./routers/tournament";
export { autoLockPoolsBeforeTournament } from "./routers/pool";
