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

- don't allow duplicate pool invite nicknames
- don't allow pool members to update nicknames to not be unique
- when creating a pool and it redirects to the pool - load the pool page with the commissioner panel open when redirecting after creation
