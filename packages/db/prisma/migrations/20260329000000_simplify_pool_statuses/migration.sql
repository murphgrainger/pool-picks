-- Migrate "Active" pools to "Locked" — tournament status now drives the live experience
UPDATE "Pool" SET status = 'Locked' WHERE status = 'Active';
