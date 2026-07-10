import { D1Binding, SyncResult } from './cultureSyncTypes';

const toRunId = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const createCultureSyncRun = async (d1: D1Binding, trigger: string) => {
  const result = await d1
    .prepare(
      `INSERT INTO culture_sync_runs (trigger, status)
       VALUES (?, 'running')
       RETURNING id`
    )
    .bind(trigger)
    .all();

  return toRunId(result.results?.[0]?.id);
};

export const completeCultureSyncRun = async (d1: D1Binding, runId: number, result: SyncResult) => {
  await d1
    .prepare(
      `UPDATE culture_sync_runs
       SET status = 'success',
           fetched_count = ?,
           normalized_count = ?,
           staged_count = ?,
           inserted_count = ?,
           updated_count = ?,
           reactivated_count = ?,
           deactivated_count = ?,
           skipped_count = ?,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(
      result.fetched,
      result.normalized,
      result.deduplicated,
      result.inserted,
      result.updated,
      result.reactivated,
      result.deactivated,
      result.skipped,
      runId
    )
    .run();
};

export const failCultureSyncRun = async (d1: D1Binding, runId: number, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown sync error';
  await d1
    .prepare(
      `UPDATE culture_sync_runs
       SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(message.slice(0, 1000), runId)
    .run();
};
