#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const databaseName = 'culture-walk-db';
const localDirectory = path.join(projectRoot, '.local');
const sampleSqlRelativePath = '.local/culture-walk-sample.sql';
const sampleSqlPath = path.join(projectRoot, sampleSqlRelativePath);
const applySqlPath = path.join(localDirectory, 'culture-walk-sample.apply.sql');
const wranglerPath = path.join(projectRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const defaultLimit = 200;
const defaultPerCategory = 50;
const sourceQueryLimit = 500;

const runWrangler = args =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wranglerPath, ...args], {
      cwd: projectRoot,
      env: process.env,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const details = stderr.trim() || stdout.trim() || 'exit code ' + code;
      reject(new Error('Wrangler command failed: ' + details));
    });
  });

const printUsage = () => {
  console.log(
    [
      'Usage:',
      '  npm run db:seed:local',
      '  npm run db:seed:local:from-production',
      '',
      'Options:',
      '  --from-production  Read a representative sample from production D1 once.',
      '  --from-local       Rebuild the sample from the existing local D1.',
      '  --reset-local      Clear local culture and sync tables before applying.',
      '  --limit <count>    Maximum number of cultures to copy (default: ' + defaultLimit + ').',
      '  --per-category <count>',
      '                     Maximum number per classification (default: ' + defaultPerCategory + ').',
      '',
    ].join('\n')
  );
};

const parsePositiveInteger = (value, optionName, max) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new Error(optionName + ' must be an integer between 1 and ' + max + '.');
  }

  return parsed;
};

const parseArgs = argv => {
  const options = {
    fromProduction: false,
    fromLocal: false,
    resetLocal: false,
    limit: defaultLimit,
    perCategory: defaultPerCategory,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      printUsage();
      process.exit(0);
    }

    if (argument === '--from-production') {
      options.fromProduction = true;
      continue;
    }

    if (argument === '--from-local') {
      options.fromLocal = true;
      continue;
    }

    if (argument === '--reset-local') {
      options.resetLocal = true;
      continue;
    }

    if (argument === '--limit' || argument === '--per-category') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(argument + ' requires a value.');
      }
      index += 1;

      if (argument === '--limit') {
        options.limit = parsePositiveInteger(value, argument, sourceQueryLimit);
      } else {
        options.perCategory = parsePositiveInteger(value, argument, 100);
      }
      continue;
    }

    if (argument.startsWith('--limit=')) {
      options.limit = parsePositiveInteger(argument.slice('--limit='.length), '--limit', sourceQueryLimit);
      continue;
    }

    if (argument.startsWith('--per-category=')) {
      options.perCategory = parsePositiveInteger(
        argument.slice('--per-category='.length),
        '--per-category',
        100
      );
      continue;
    }

    throw new Error('Unknown option: ' + argument);
  }

  if (options.fromProduction && options.fromLocal) {
    throw new Error('Use only one of --from-production or --from-local.');
  }

  return options;
};

const parseWranglerResults = stdout => {
  const output = stdout.trim();
  let payload;

  try {
    payload = JSON.parse(output);
  } catch {
    const starts = [output.indexOf('['), output.indexOf('{')]
      .filter(index => index >= 0)
      .sort((left, right) => left - right);
    let parsed = false;

    for (const jsonStart of starts) {
      try {
        payload = JSON.parse(output.slice(jsonStart));
        parsed = true;
        break;
      } catch {
        // Wrangler may print progress lines before its JSON response.
      }
    }

    if (!parsed) {
      throw new Error('Could not parse Wrangler JSON output: ' + output);
    }
  }

  const entries = Array.isArray(payload) ? payload : [payload];
  const failedEntry = entries.find(entry => entry && entry.success === false);
  if (failedEntry) {
    throw new Error('D1 query failed: ' + JSON.stringify(failedEntry));
  }

  return entries.flatMap(entry => (Array.isArray(entry?.results) ? entry.results : []));
};

const queryDatabase = async (command, target) => {
  const result = await runWrangler([
    'd1',
    'execute',
    databaseName,
    target === 'remote' ? '--remote' : '--local',
    '--json',
    '--command',
    command,
  ]);
  return parseWranglerResults(result.stdout);
};

const quoteSqlString = value =>
  "'" + String(value).replaceAll('\u0000', '').replaceAll("'", "''") + "'";

const toSqlValue = value => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'object') return quoteSqlString(JSON.stringify(value));
  return quoteSqlString(value);
};

const quoteIdentifier = identifier => '"' + identifier.replaceAll('"', '""') + '"';

const getKoreaDate = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value])
  );
  return values.year + '-' + values.month + '-' + values.day;
};

const getCultureSourceQuery = () => {
  const koreaDate = getKoreaDate();
  return [
    'SELECT * FROM cultures',
    'WHERE is_active = 1',
    'AND end_date >= ' + quoteSqlString(koreaDate),
    'AND lat IS NOT NULL',
    'AND lng IS NOT NULL',
    'ORDER BY start_date ASC, id ASC',
    'LIMIT ' + sourceQueryLimit,
    ';',
  ].join(' ');
};

const selectRepresentativeCultures = (rows, { limit, perCategory }) => {
  const selected = [];
  const selectedIds = new Set();
  const categoryCounts = new Map();

  for (const row of rows) {
    const category = typeof row?.classification === 'string' && row.classification.trim() ? row.classification : '기타';
    const count = categoryCounts.get(category) ?? 0;
    if (count >= perCategory || selected.length >= limit) continue;

    const id = Number(row?.id);
    if (!Number.isInteger(id) || id < 1 || selectedIds.has(id)) continue;
    selected.push(row);
    selectedIds.add(id);
    categoryCounts.set(category, count + 1);
  }

  if (selected.length < limit) {
    for (const row of rows) {
      if (selected.length >= limit) break;
      const id = Number(row?.id);
      if (!Number.isInteger(id) || id < 1 || selectedIds.has(id)) continue;
      selected.push(row);
      selectedIds.add(id);
    }
  }

  return selected;
};

const buildUpsertStatement = (tableName, columns, rows, conflictColumn) => {
  if (rows.length === 0) return '';

  const columnSql = columns.map(quoteIdentifier).join(', ');
  const valuesSql = rows
    .map(row => '(' + columns.map(column => toSqlValue(row[column])).join(', ') + ')')
    .join(',\n');
  const updateColumns = columns
    .filter(column => column !== conflictColumn)
    .map(
      column =>
        quoteIdentifier(column) +
        ' = excluded.' +
        quoteIdentifier(column)
    )
    .join(',\n');

  return [
    'INSERT INTO ' + quoteIdentifier(tableName) + ' (' + columnSql + ') VALUES',
    valuesSql,
    'ON CONFLICT (' + quoteIdentifier(conflictColumn) + ') DO UPDATE SET',
    updateColumns + ';',
  ].join('\n');
};

const buildInsertStatements = (tableName, columns, rows, conflictColumn) => {
  if (rows.length === 0) return '';

  const rowsPerStatement = tableName === 'cultures' ? 10 : 5;
  const statements = [];
  for (let index = 0; index < rows.length; index += rowsPerStatement) {
    statements.push(
      buildUpsertStatement(tableName, columns, rows.slice(index, index + rowsPerStatement), conflictColumn)
    );
  }

  return statements.join('\n\n');
};

const buildSampleSql = (cultures, details) => {
  const cultureColumns = cultures.length > 0 ? Object.keys(cultures[0]) : [];
  const detailColumns = details.length > 0 ? Object.keys(details[0]) : [];
  const cultureSql = buildInsertStatements('cultures', cultureColumns, cultures, 'id');
  const detailSql = buildInsertStatements('culture_tour_api_details', detailColumns, details, 'source_key');

  return [
    '-- Generated by scripts/seed-local-sample.mjs. Do not commit this file.',
    '-- This file contains a small development snapshot, not the production database.',
    cultureSql,
    detailSql,
    '',
  ]
    .filter(Boolean)
    .join('\n\n');
};

const exportSample = async ({ target, limit, perCategory }) => {
  await fs.mkdir(localDirectory, { recursive: true });
  const sourceRows = await queryDatabase(getCultureSourceQuery(), target);
  const cultures = selectRepresentativeCultures(sourceRows, { limit, perCategory });

  if (cultures.length === 0) {
    throw new Error('No active culture rows were returned from the ' + target + ' D1 database.');
  }

  const sourceKeys = cultures
    .map(culture => (typeof culture.source_key === 'string' ? culture.source_key : null))
    .filter(Boolean);
  let details = [];

  if (sourceKeys.length > 0) {
    const detailQuery =
      'SELECT * FROM culture_tour_api_details WHERE source_key IN (' +
      sourceKeys.map(quoteSqlString).join(', ') +
      ') ORDER BY source_key;';
    details = await queryDatabase(detailQuery, target);
  }

  await fs.writeFile(sampleSqlPath, buildSampleSql(cultures, details), 'utf8');
  return { cultures, details };
};

const resetLocalSql = [
  'UPDATE cultures SET is_active = 0 WHERE is_active = 1;',
  'DELETE FROM cultures;',
  'DELETE FROM culture_tour_api_details;',
  'DELETE FROM culture_sync_staging;',
  'DELETE FROM culture_sync_runs;',
  'DELETE FROM initialize_sync_locks;',
].join('\n');

const clearLocalKv = async () => {
  const { stdout } = await runWrangler([
    'kv',
    'key',
    'list',
    '--local',
    '--binding',
    'CULTURE_CACHE',
    '--preview',
    'false',
  ]);
  let keys;

  try {
    keys = JSON.parse(stdout);
  } catch (error) {
    throw new Error('Could not parse the local KV key list:\n' + stdout, { cause: error });
  }

  for (const key of Array.isArray(keys) ? keys : []) {
    if (typeof key?.name !== 'string') continue;
    await runWrangler([
      'kv',
      'key',
      'delete',
      key.name,
      '--local',
      '--binding',
      'CULTURE_CACHE',
      '--preview',
      'false',
    ]);
  }

  return Array.isArray(keys) ? keys.length : 0;
};

const fileExists = async filePath => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const applyLocalSample = async ({ resetLocal }) => {
  if (!(await fileExists(sampleSqlPath))) {
    throw new Error(
      'No local sample found. Run "npm run db:seed:local:from-production" once first.'
    );
  }

  const sampleSql = await fs.readFile(sampleSqlPath, 'utf8');
  const applySql = (resetLocal ? resetLocalSql + '\n\n' : '') + sampleSql;
  await fs.writeFile(applySqlPath, applySql, 'utf8');

  try {
    await runWrangler([
      'd1',
      'execute',
      databaseName,
      '--local',
      '--yes',
      '--file=' + path.relative(projectRoot, applySqlPath),
    ]);
    return await clearLocalKv();
  } finally {
    await fs.rm(applySqlPath, { force: true });
  }
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));

  if (options.fromProduction) {
    const result = await exportSample({
      target: 'remote',
      limit: options.limit,
      perCategory: options.perCategory,
    });
    console.log(
      'Exported ' + result.cultures.length + ' cultures and ' + result.details.length + ' detail rows from production D1.'
    );
  } else if (options.fromLocal) {
    const result = await exportSample({
      target: 'local',
      limit: options.limit,
      perCategory: options.perCategory,
    });
    console.log(
      'Exported ' + result.cultures.length + ' cultures and ' + result.details.length + ' detail rows from local D1.'
    );
  }

  const clearedKvKeys = await applyLocalSample({ resetLocal: options.resetLocal });
  console.log('Seeded local D1 from ' + sampleSqlRelativePath + '.');
  console.log('Cleared ' + clearedKvKeys + ' local KV cache keys.');
};

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[db:seed:local] ' + message);
  process.exitCode = 1;
});
