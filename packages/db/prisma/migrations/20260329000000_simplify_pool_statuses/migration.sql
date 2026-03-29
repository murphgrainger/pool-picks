-- Migrate "Active" pools to "Locked" — tournament status now drives the live experience
UPDATE "Pool" SET status = 'Locked' WHERE status = 'Active';

-- Auto-complete all pools whose tournament ended 7+ days ago.
-- This prevents spurious notification emails on first deploy.
UPDATE "Pool" SET status = 'Complete'
WHERE status IN ('Locked', 'Active')
AND tournament_id IN (
  SELECT id FROM "Tournament"
  WHERE end_date < NOW() - INTERVAL '7 days'
);
