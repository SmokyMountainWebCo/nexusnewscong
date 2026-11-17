import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseStoryIndex, parseStoryMarkdown } from '../lib/content.ts';
import { decideHistory, searchEntry, versionFromMarkdown, versionsFromSnapshots, type HistoryVersion } from '../lib/chronicle.ts';

const root = process.cwd();

function git(args: string[]): string {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function insideRepo(): boolean {
  try {
    return git(['rev-parse', '--is-inside-work-tree']).trim() === 'true';
  } catch {
    return false;
  }
}

function ensureHistory() {
  let shallow = false;
  try {
    shallow = git(['rev-parse', '--is-shallow-repository']).trim() === 'true';
  } catch {
    return;
  }
  if (shallow) {
    try {
      git(['fetch', '--unshallow']);
      console.log('chronicle: fetched the full git history');
    } catch (error) {
      console.warn('chronicle: this clone is shallow and unshallow failed. Story revisions fall back to the commits that are present.');
      console.warn(error instanceof Error ? error.message : error);
    }
  }
  try {
    execFileSync('git', ['backfill'], { cwd: root, stdio: 'ignore' });
  } catch {
    // Optional. Older Git builds omit backfill; blobless clones still return file contents on demand.
  }
}

function storyFiles(): string[] {
  const dir = path.join(root, 'public/stories');
  return fs.readdirSync(dir).filter((name) => name.endsWith('.md')).sort();
}

function snapshots(file: string): Array<{ sha: string; at: string; raw: string }> {
  let log = '';
  try {
    log = git(['log', '--follow', '--format=%H%x09%cI', '--name-only', '--', file]);
  } catch (error) {
    console.warn(`chronicle: no git history for ${file}`);
    console.warn(error instanceof Error ? error.message : error);
    return [];
  }
  const found: Array<{ sha: string; at: string; name: string }> = [];
  let sha = '';
  let at = '';
  for (const line of log.split('\n')) {
    if (!line.trim()) continue;
    if (line.includes('\t')) {
      const [nextSha, nextAt] = line.split('\t');
      sha = nextSha;
      at = nextAt;
      continue;
    }
    if (sha && line.endsWith('.md')) found.push({ sha, at, name: line.trim() });
  }
  const shots: Array<{ sha: string; at: string; raw: string }> = [];
  for (const item of found) {
    try {
      const raw = git(['show', `${item.sha}:${item.name}`]);
      shots.push({ sha: item.sha, at: item.at, raw });
    } catch (error) {
      console.warn(`chronicle: skipped ${item.sha} for ${file}`);
      console.warn(error instanceof Error ? error.message : error);
    }
  }
  return shots;
}

function writeSearchIndex() {
  const index = parseStoryIndex(JSON.parse(fs.readFileSync(path.join(root, 'public/stories/index.json'), 'utf8')));
  const entries = index.stories.map((card) => {
    const file = path.join(root, 'public', card.path.replace(/^\//, ''));
    const doc = fs.existsSync(file) ? parseStoryMarkdown(fs.readFileSync(file, 'utf8')) : null;
    return searchEntry({
      title: doc?.title || card.title,
      slug: card.slug,
      eventType: doc?.eventType || card.eventType,
      summary: card.summary || doc?.body.slice(0, 280) || '',
      tags: doc?.tags.length ? doc.tags : card.tags,
      date: card.date || doc?.date || card.timestamp || doc?.timestamp || card.updated || doc?.updated,
    });
  });
  const payload = { generated_at: new Date().toISOString(), stories: entries };
  fs.writeFileSync(path.join(root, 'public/search-index.json'), `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`chronicle: wrote ${entries.length} search records`);
}

function readCommitted(dir: string, slug: string): HistoryVersion[] | null {
  const file = path.join(dir, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as { versions?: HistoryVersion[] };
    return Array.isArray(data.versions) ? data.versions : null;
  } catch (error) {
    console.warn(`chronicle: could not read committed history for ${slug}`);
    console.warn(error instanceof Error ? error.message : error);
    return null;
  }
}

function currentVersion(file: string): HistoryVersion | null {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) return null;
  const stamp = fs.statSync(absolute).mtime.toISOString();
  return versionFromMarkdown('current', stamp, fs.readFileSync(absolute, 'utf8'));
}

function writeHistories() {
  const dir = path.join(root, 'public/stories/history');
  fs.mkdirSync(dir, { recursive: true });
  const repo = insideRepo();
  if (!repo) console.warn('chronicle: no git repository. Existing history files are left unchanged.');
  for (const name of storyFiles()) {
    const slug = name.replace(/\.md$/, '');
    const file = path.join('public/stories', name);
    const committed = readCommitted(dir, slug);
    const fromGit = repo ? versionsFromSnapshots(snapshots(file)) : [];
    const decision = decideHistory({
      repo,
      committed,
      fromGit,
      current: currentVersion(file),
    });
    if (!decision.write) {
      console.log(`chronicle: ${slug} kept ${decision.versions.length} committed version${decision.versions.length === 1 ? '' : 's'}`);
      continue;
    }
    fs.writeFileSync(path.join(dir, `${slug}.json`), `${JSON.stringify({ slug, versions: decision.versions }, null, 2)}\n`);
    console.log(`chronicle: ${slug} wrote ${decision.versions.length} version${decision.versions.length === 1 ? '' : 's'}`);
  }
}

const repo = insideRepo();
if (repo) ensureHistory();
else console.warn('chronicle: no git repository. Search still rebuilds from the story files.');
writeSearchIndex();
writeHistories();
