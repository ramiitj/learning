-- Checks that a restored database is a working copy of the platform. Fails (ON_ERROR_STOP) on any problem.
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM lessons;
  IF n = 0 THEN RAISE EXCEPTION 'restore check failed: no lessons'; END IF;
  RAISE NOTICE 'lessons: %', n;

  SELECT count(*) INTO n FROM events;
  IF n = 0 THEN RAISE EXCEPTION 'restore check failed: no events'; END IF;
  RAISE NOTICE 'events: %', n;

  SELECT count(*) INTO n FROM payload_migrations;
  IF n = 0 THEN RAISE EXCEPTION 'restore check failed: no migrations recorded'; END IF;
  RAISE NOTICE 'migrations: %', n;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'lm_events_append_only' AND tgrelid = 'events'::regclass) THEN
    RAISE EXCEPTION 'restore check failed: the events append-only trigger is missing';
  END IF;
  RAISE NOTICE 'events append-only trigger: present';
END $$;
