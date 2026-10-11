// linear-roadmap-audit.mjs — read-only Linear hygiene check for the solo-agile roadmap.
// Usage: node scripts/linear-roadmap-audit.mjs issues.json [milestones.json]
//   issues.json:     array of { id, title, labels[], projectMilestone?|milestone?, parentId?, status? }
//   milestones.json: array of { id, name, completed?|archived? } (optional; open = not completed/archived)
// Exit 0 when clean, exit 1 with violations listed. No network, no writes.
import { readFile } from "node:fs/promises";

const ALLOWED_LABELS = new Set(["feature", "bug", "chore", "docs", "spike"]);
const TITLE_RE = /^\[[a-z0-9]+\] \S/;
const MAX_TITLE = 60;
const MAX_PER_MILESTONE = 10;
const MAX_SUBS = 10;
const MAX_OPEN_MILESTONES = 2;

function milestoneOf(issue) {
  const m = issue.projectMilestone ?? issue.milestone ?? null;
  if (m == null) return null;
  if (typeof m === "string") return m;
  return m.id ?? m.name ?? null;
}

function parentOf(issue) {
  return issue.parentId ?? issue.parent ?? null;
}

export function auditIssues(issues, milestones = []) {
  const violations = [];
  const perMilestone = new Map();
  const subsPerParent = new Map();

  for (const issue of issues) {
    const id = issue.id ?? "(no-id)";
    const title = issue.title ?? "";
    if (!TITLE_RE.test(title)) {
      violations.push(`${id}: title must match ^\\[[a-z0-9]+\\] (got ${JSON.stringify(title)})`);
    }
    if (title.length > MAX_TITLE) {
      violations.push(`${id}: title ${title.length} chars exceeds ${MAX_TITLE}`);
    }
    const labels = Array.isArray(issue.labels) ? issue.labels : [];
    const typeLabels = labels.filter((l) => ALLOWED_LABELS.has(typeof l === "string" ? l : l?.name));
    if (typeLabels.length !== 1) {
      violations.push(`${id}: exactly one type label required (got ${typeLabels.length})`);
    }
    const type = typeof typeLabels[0] === "string" ? typeLabels[0] : typeLabels[0]?.name;
    const m = milestoneOf(issue);
    if ((type === "feature" || type === "bug") && m == null) {
      violations.push(`${id}: ${type} must carry exactly one milestone`);
    }
    if (m != null) perMilestone.set(m, (perMilestone.get(m) ?? 0) + 1);
    const p = parentOf(issue);
    if (p != null) subsPerParent.set(p, (subsPerParent.get(p) ?? 0) + 1);
  }

  for (const [m, count] of perMilestone) {
    if (count > MAX_PER_MILESTONE) {
      violations.push(`milestone ${m}: ${count} issues exceeds ${MAX_PER_MILESTONE} (split the phase)`);
    }
  }
  for (const [p, count] of subsPerParent) {
    if (count > MAX_SUBS) {
      violations.push(`parent ${p}: ${count} subs exceeds ${MAX_SUBS}`);
    }
  }
  if (milestones.length > 0) {
    const open = milestones.filter((m) => !(m.completed ?? m.archived ?? false));
    if (open.length > MAX_OPEN_MILESTONES) {
      violations.push(`${open.length} open milestones exceeds ${MAX_OPEN_MILESTONES} (close phases JIT)`);
    }
  }
  return violations;
}

async function readJson(path) {
  const raw = await readFile(path, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : (data.issues ?? data.nodes ?? []);
}

const invokedDirectly =
  process.argv[1] != null && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/").split("/").pop());

if (invokedDirectly) {
  const [issuesPath, milestonesPath] = process.argv.slice(2);
  if (issuesPath == null) {
    process.stderr.write("usage: node scripts/linear-roadmap-audit.mjs issues.json [milestones.json]\n");
    process.exitCode = 2;
  } else {
    try {
      const issues = await readJson(issuesPath);
      const milestones = milestonesPath ? await readJson(milestonesPath) : [];
      const violations = auditIssues(issues, milestones);
      if (violations.length === 0) {
        process.stdout.write(`roadmap audit clean: ${issues.length} issues checked\n`);
      } else {
        for (const v of violations) process.stdout.write(`- ${v}\n`);
        process.stdout.write(`${violations.length} violation(s) in ${issues.length} issues\n`);
        process.exitCode = 1;
      }
    } catch (err) {
      process.stderr.write(`audit failed: ${err.message}\n`);
      process.exitCode = 2;
    }
  }
}
