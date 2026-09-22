import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const INCIDENT_TITLE = '[Ops] Culture Walk production health incident';

const apiRequest = async (url, token, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: 'Bearer ' + token,
      'content-type': 'application/json',
      'user-agent': 'culture-walk-ops-watch/1.0',
      'x-github-api-version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error('GitHub API ' + response.status + ': ' + (await response.text()));
  }
  return response.status === 204 ? null : response.json();
};

export const buildIncidentBody = ({ runUrl, report }) => {
  const failures = Array.isArray(report?.failures) ? report.failures : [];
  const warnings = Array.isArray(report?.warnings) ? report.warnings : [];
  return [
    'Production monitoring detected an unhealthy Culture Walk deployment.',
    '',
    '- Run: ' + runUrl,
    '- Detected: ' + (report?.generatedAt ?? new Date().toISOString()),
    '- Smoke status: ' + (report?.status ?? 'failed'),
    '',
    '## Failures',
    ...(failures.length ? failures.map(item => '- ' + item) : ['- Smoke workflow failed before a report was produced.']),
    '',
    ...(warnings.length ? ['## Warnings', ...warnings.map(item => '- ' + item), ''] : []),
    'This issue is maintained automatically and will close after a healthy scheduled check.',
  ].join('\n');
};

const readReport = async reportPath => {
  try {
    return JSON.parse(await readFile(reportPath, 'utf8'));
  } catch {
    return null;
  }
};

const main = async () => {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const outcome = process.env.OPS_CHECK_OUTCOME;
  if (!token || !repository || !outcome) {
    throw new Error('GITHUB_TOKEN, GITHUB_REPOSITORY, and OPS_CHECK_OUTCOME are required.');
  }

  const runUrl =
    process.env.OPS_RUN_URL ||
    'https://github.com/' + repository + '/actions/runs/' + (process.env.GITHUB_RUN_ID ?? '');
  const report = await readReport(
    process.env.OPS_REPORT_PATH || 'test-results/production-smoke/report.json'
  );
  const issuesUrl = 'https://api.github.com/repos/' + repository + '/issues';
  const openIssues = await apiRequest(issuesUrl + '?state=open&per_page=100', token);
  const incident = openIssues.find(issue => !issue.pull_request && issue.title === INCIDENT_TITLE);

  if (outcome === 'success') {
    if (!incident) {
      console.log('[ops-watch] production healthy; no open incident');
      return;
    }
    await apiRequest(issuesUrl + '/' + incident.number + '/comments', token, {
      method: 'POST',
      body: JSON.stringify({ body: 'Recovered: ' + runUrl }),
    });
    await apiRequest(issuesUrl + '/' + incident.number, token, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
    });
    console.log('[ops-watch] closed recovered incident #' + incident.number);
    return;
  }

  const body = buildIncidentBody({ runUrl, report });
  if (incident) {
    await apiRequest(issuesUrl + '/' + incident.number, token, {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    });
    console.log('[ops-watch] refreshed incident #' + incident.number);
    return;
  }

  const created = await apiRequest(issuesUrl, token, {
    method: 'POST',
    body: JSON.stringify({ title: INCIDENT_TITLE, body }),
  });
  console.log('[ops-watch] opened incident #' + created.number);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
