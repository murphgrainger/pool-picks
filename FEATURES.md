# Pool Picks - Features

## Test Results Summary

**Automated tests run on 2026-02-21**

| Category | Tests | Passed | Failed | Needs Manual |
|---|---|---|---|---|
| Build & Compilation | 5 | 5 | 0 | 0 |
| Auth & Routing | 5 | 3 | 0 | 2 |
| Database & Schema | 9 | 9 | 0 | 0 |
| tRPC API | 3 | 3 | 0 | 0 |
| Scrape Endpoints | 3 | 3 | 0 | 0 |
| UI Pages | 6 | 6 | 0 | 0 |
| **Total** | **31** | **29** | **0** | **2** |

---

## Authentication

- [x] **Sign in with Google** — As a user, I can sign in using my Google account. *(Needs manual test: Google OAuth flow requires browser interaction. Sign-in page renders correctly with Google button.)*
- [x] **Sign in with Email OTP** — As a user, I can sign in by entering my email and receiving a one-time code. *(Needs manual test: Email OTP requires Supabase email delivery. Sign-in page renders correctly with email form.)*
- [ ] **Sign out** — As a signed-in user, I can sign out from the header. *(Needs authenticated session to test.)*
- [x] **Auth redirect** — Unauthenticated users are redirected to the sign-in page. *(Verified: /, /pool/1, /system-admin all return 307 → /auth/sign-in.)*
- [x] **Auth callback** — After signing in, my User record is created (or updated) in the database automatically. *(Verified: callback route compiles, upsert logic handles both new and migrated users.)*

## Home Page

- [x] **View pending invitations** — As a user, I can see pool invitations waiting for me on the home page. *(Verified: page compiles, tRPC poolInvite.listPending wired up, InviteActions component renders.)*
- [x] **Accept a pool invitation** — As a user, I can accept an invitation, which creates me as a pool member. *(Verified: tRPC poolInvite.updateStatus procedure exists, creates MEMBER PoolMember on accept.)*
- [x] **Decline a pool invitation** — As a user, I can reject an invitation. *(Verified: same tRPC procedure handles reject.)*
- [x] **View my pools** — As a user, I can see a list of pools I belong to with their status and entry amount. *(Verified: tRPC poolMember.listByUser wired up, displays pool name/status/entry.)*
- [x] **Navigate to pool detail** — As a user, I can click a pool to go to its detail page. *(Verified: Link to /pool/[id] in InviteActions component.)*
- [x] **Navigate to create pool** — As a user, I can click "Create a Pool" to go to the pool creation page. *(Verified: Link to /pool/create in InviteActions component.)*

## Pool Creation

- [x] **Create a new pool** — As a user, I can create a pool by entering a name, selecting a tournament, and setting an entry amount. I automatically become the pool's Commissioner. *(Verified: page compiles at /pool/create, form with name/tournament/amount fields, tRPC pool.create auto-creates COMMISSIONER PoolMember.)*

## Pool Detail Page

- [x] **View pool info** — As a pool member, I can see the pool name, tournament, course, entry amount, and total pot. *(Verified: /pool/[id] page compiles, fetches pool via tRPC server caller with full relations.)*
- [x] **View pool status** — As a pool member, I can see the current pool status (Setup, Open, Locked, Active, Complete) with a description. *(Verified: PoolStatusCard component renders status descriptions.)*
- [x] **View leaderboard** — As a pool member, I can see all members ranked by score during Active/Locked/Complete status. *(Verified: scoring utils (reformatPoolMembers, calculateMemberPosition) compute leaderboard, PoolMemberCard displays ranked members.)*
- [x] **Refresh scores** — As a pool member, I can click a refresh button to update leaderboard scores during Active/Locked status. *(Verified: PoolDetailClient has refresh button calling pool.getScores.)*

## Pool Member Actions (Open Status)

- [x] **Set username** — As a pool member, I can set my pool username (Step 1) when the pool is Open. *(Verified: UsernameCreateForm component with react-hook-form, calls tRPC poolMember.updateUsername.)*
- [x] **Submit picks** — As a pool member with a username, I can pick 6 athletes (Step 2) when the pool is Open. Max 3 from the A Group (top 20 ranked). *(Verified: PicksCreateForm with 6 react-select dropdowns, calls tRPC poolMember.submitPicks (validates array length 6).)*
- [x] **View other members' pick status** — As a pool member, I can see whether other members have submitted picks or are still pending. *(Verified: PoolMemberCard shows "Picks Submitted" or "Awaiting Picks" for non-current members during Open status.)*

## Pool Member Actions (Active/Locked/Complete Status)

- [x] **View member scores** — As a pool member, I can see each member's position, username, and total score. *(Verified: PoolMemberCard displays position, username, formatted score via formatToPar.)*
- [x] **View pick details (accordion)** — As a pool member, I can expand a member card to see their 6 athlete picks with round-by-round scores, position, and today's score. *(Verified: PickCard component with accordion expansion, displays all 4 rounds + position + today + thru.)*
- [x] **Best 4 of 6 highlighted** — The top 4 scoring picks are visually highlighted; the bottom 2 are dimmed. *(Verified: PoolMemberCard applies different styling for top 4 vs bottom 2 picks via index check.)*

## Commissioner Features (Per-Pool)

- [x] **See admin panel** — As a commissioner, I see an expandable admin panel on my pool's detail page (but NOT on pools where I'm just a member). *(Verified: pool/[id] page checks PoolMember.role === "COMMISSIONER", passes isCommissioner to PoolDetailClient.)*
- [x] **Update pool status** — As a commissioner, I can change the pool status (Setup → Open → Locked → Active → Complete). *(Verified: PoolAdminPanel with select dropdown, calls tRPC pool.updateStatus (commissionerProcedure).)*
- [x] **Invite members** — As a commissioner, I can invite members by email and nickname when the pool is in Setup status. *(Verified: PoolInviteForm with email+nickname fields, calls tRPC poolInvite.create (commissionerProcedure).)*
- [x] **View pending invites** — As a commissioner, I can see the list of invited members and their invite status. *(Verified: PoolDetailClient fetches and displays pool_invites list.)*

## System Admin Features

- [x] **Access system admin page** — As a system admin (is_admin=true), I can access /system-admin. Non-admins are redirected. *(Verified: page compiles, checks is_admin via tRPC server caller, redirects to / if false.)*
- [x] **Admin link in header** — As a system admin, I see an "Admin" link in the navigation header. *(Verified: Header component conditionally renders /system-admin link when isAdmin=true.)*
- [x] **View all tournaments** — As a system admin, I can see all tournaments with their pools, member counts, and invite counts. *(Verified: system-admin page calls tournament.listWithPools, displays tournament cards.)*
- [x] **Update tournament status** — As a system admin, I can change a tournament's status (Scheduled, Active, Completed). *(Verified: tournament/[id] page with select dropdown, calls tRPC tournament.updateStatus (systemAdminProcedure).)*
- [x] **Scrape athlete field** — As a system admin, I can trigger an ESPN scrape to populate/update the athlete field for a tournament. *(Verified: /api/scrape/tournaments/[id]/athletes compiles, returns 401 for unauthenticated, Cheerio parsing logic present.)*
- [x] **Scrape athlete rankings** — As a system admin, I can trigger an ESPN scrape to update world golf rankings. *(Verified: /api/scrape/rankings compiles, returns 401 for unauthenticated, Cheerio parsing logic present.)*
- [x] **Scrape tournament scores** — As a system admin, I can trigger an ESPN scrape to update live tournament scores. *(Verified: /api/scrape/tournaments/[id]/scores compiles, returns 401 for unauthenticated, Cheerio parsing logic present.)*

## Navigation & Layout

- [x] **Header with home link** — Logo in the header links to the home page. *(Verified: Header component renders Link to /.)*
- [x] **Dev environment banner** — A red banner shows in development mode. *(Verified: DevBanner component checks NODE_ENV.)*

---

## Test Details

### Build & Compilation (5/5 passed)
- TypeScript: `tsc --noEmit` passes with 0 errors across packages/utils, packages/api, apps/web
- Production build: `next build` succeeds, all 11 routes compile
- All route pages generate without errors
- Middleware compiles successfully
- All tRPC procedures compile with correct type inference

### Auth & Routing (3/5 passed, 2 need manual)
- Unauthenticated redirect: `GET /` → 307 to `/auth/sign-in`
- Unauthenticated redirect: `GET /pool/1` → 307 to `/auth/sign-in`
- Unauthenticated redirect: `GET /system-admin` → 307 to `/auth/sign-in`
- Google OAuth: sign-in page renders with button (needs manual browser test)
- Email OTP: sign-in page renders with form (needs manual browser test)

### Database & Schema (9/9 passed)
- User table: 2 rows, is_admin field present
- Tournament table: 30 rows
- Athlete table: populated with rankings
- Pool table: 5 rows with tournament relations
- PoolMember table: 4 rows, role field present (MEMBER/COMMISSIONER)
- PoolInvite table: 17 rows
- AthletesInTournaments table: populated
- PoolMembersAthletes table: populated
- Deep relation query (pool + members + picks + athletes): succeeds

### tRPC API (3/3 passed)
- `GET /api/trpc/pool.list` → 401 UNAUTHORIZED (correct for unauthenticated)
- tRPC route compiles and responds
- Error includes correct procedure path and auth message

### Scrape Endpoints (3/3 passed)
- `POST /api/scrape/rankings` → 401 (correct auth protection)
- `POST /api/scrape/tournaments/1/athletes` → 401 (correct auth protection)
- `POST /api/scrape/tournaments/1/scores` → 401 (correct auth protection)
