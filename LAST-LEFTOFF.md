# Last Left Off

## Branch: `feat/pool-invite-emails`

### What was done

- Integrated Resend for sending real emails when a commissioner creates a pool invite
- Added `packages/api/src/lib/email.ts` with lazy-initialized Resend client and styled HTML email template
- Updated `poolInvite.create` mutation to send an invite email after saving to DB (graceful — invite saves even if email fails)
- Added `poolInvite.pastEmails` tRPC query that returns distinct emails across all pools a commissioner manages
- Updated `PoolInviteForm` with autocomplete dropdown that suggests past invite emails/nicknames as the commissioner types
- Updated `.env.example` files with `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`

### What still needs to happen

- non oauth email uses resend
- email template coloring is fixed
- pool invitations sent for setup pools still show for pool member but say the field hasn't been finalized yet so they can't yet make their picks
- set up email notification when pool moves to open status and members can make their picks
- get rid of "You currently aren't in any active pools. Create one or ask a commissioner to invite you!" if someone actually has been invited to a pool
- on invite pre-fill email disallow selecting someone that already is invited and in parenthesis instead of their nickname put (already invited)
