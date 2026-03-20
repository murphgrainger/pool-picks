# Last Left Off

## Branch: `feat/pool-invite-emails`

### What was done

- Integrated Resend for sending real emails when a commissioner creates a pool invite
- Added `packages/api/src/lib/email.ts` with lazy-initialized Resend client and styled HTML email template
- Updated `poolInvite.create` mutation to send an invite email after saving to DB (graceful — invite saves even if email fails)
- Added `poolInvite.pastEmails` tRPC query that returns distinct emails across all pools a commissioner manages
- Updated `PoolInviteForm` with autocomplete dropdown that suggests past invite emails/nicknames as the commissioner types
- Updated `.env.example` files with `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`
- Replaced Supabase OTP email with branded Resend email via `/api/auth/send-magic-link` route using `admin.generateLink`
- Restyled all email templates: white background, yellow (#EDEC32) header, clean design matching app brand
- Added three email types: invite, auth magic link, pool open notification
- Pool invitations for Setup-status pools now show on home page (not just Open)
- Added confirmation modal when commissioner moves pool to Open status ("This will notify all pool members...")
- Added server-side failsafe: cannot move pool to Open if tournament has no athletes
- When pool opens, all pool members receive email notification to make their picks
- Autocomplete dropdown shows already-invited emails greyed out with "(already invited)" — non-selectable

### What still needs to happen

- Test the Resend auth email flow end-to-end (requires `SUPABASE_SERVICE_ROLE_KEY` to be set) (doesn't work)
- Verify email template rendering across email clients (done)
- the pool invite success toast is showing twice - once under the pool status and once under the create invite button. i just want it once under the invite button. be thoughtful of how this adjustment affects other toast implementation and make sure those implementations make sense.
- update the pool invite template to be in "You have been invited to join the following pool:" instead of the email has invited you to join. remove the "You're invited!". add in smaller text underneath the pool name the tournament name and the dates of the tournament
- when typing in a pool invite email it should only show emails that start with the same letters typed. right now if i type "s" it is showing the list of everyone already invited (and maybe would show others invited to other pools but i don't have a lot of test data so i'm not sure)
- the magic link email looks great but it didn't work. the auth didn't work.
