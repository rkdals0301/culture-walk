CREATE TRIGGER IF NOT EXISTS protect_active_cultures_from_delete
BEFORE DELETE ON cultures
WHEN OLD.is_active = 1
BEGIN
  SELECT RAISE(ABORT, 'active cultures must be deactivated before deletion');
END;
