const levels = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const isDevelopmentOnly = (entry, lockfile) => entry.nodes?.length > 0 &&
  entry.nodes.every(node => lockfile.packages?.[node]?.dev === true);
const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export const evaluateDependencySecurity = (report, lockfile, policy, {
  date = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10),
} = {}) => {
  if (report?.error || !report?.vulnerabilities || typeof report.vulnerabilities !== 'object' ||
    Array.isArray(report.vulnerabilities)) throw new Error('Invalid npm audit report or registry error.');
  if (!lockfile?.packages || levels[policy?.minimumSeverity] === undefined ||
    !Array.isArray(policy.exceptions)) throw new Error('Invalid dependency security policy or lockfile.');

  const packages = report.vulnerabilities;
  const collect = (name, visited = new Set()) => {
    const entry = packages[name];
    if (!entry || visited.has(name) || !Array.isArray(entry.via)) return [{ advisory: null, owner: entry }];
    const next = new Set(visited).add(name);
    return entry.via.flatMap(via => typeof via === 'string'
      ? collect(via, next)
      : [{ advisory: via, owner: entry }]);
  };
  const result = { blocked: [], accepted: [], informational: [] };
  for (const [name, entry] of Object.entries(packages)) {
    const advisories = collect(name);
    const item = { package: name, severity: entry.severity, advisories: [...new Set(advisories.map(({ advisory }) => advisory?.url ?? 'unresolved'))] };
    if (levels[entry.severity] !== undefined && levels[entry.severity] < levels[policy.minimumSeverity]) {
      result.informational.push(item);
      continue;
    }
    const reviewed = levels[entry.severity] !== undefined && isDevelopmentOnly(entry, lockfile) &&
      advisories.length > 0 && advisories.every(({ advisory, owner }) => advisory &&
        isDevelopmentOnly(owner, lockfile) && policy.exceptions.some(exception =>
          exception.advisory === advisory.url && exception.package === owner.name &&
          exception.scope === 'development' && typeof exception.reason === 'string' && exception.reason.trim() &&
          isDate(exception.expires) && exception.expires > date &&
          levels[advisory.severity] !== undefined && levels[advisory.severity] <= levels[exception.maximumSeverity ?? 'high'] &&
          owner.nodes.every(node => lockfile.packages[node]?.version === exception.version)));
    (reviewed ? result.accepted : result.blocked).push(item);
  }
  return result;
};
