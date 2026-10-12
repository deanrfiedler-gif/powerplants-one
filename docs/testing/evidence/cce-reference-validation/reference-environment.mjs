// Publication adaptation only. Historical database outcomes use the original
// source hashes in provenance/original-SHA256SUMS.json.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';

export function referenceRepository() {
  const configured = process.env.CCE_REPO_ROOT;
  assert(configured && path.isAbsolute(configured),
    'Set CCE_REPO_ROOT to an absolute disposable checkout of the recorded baseline');
  const root = realpathSync(configured);
  assert(existsSync(path.join(root, 'package.json')), 'Missing PPO package.json');
  const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim();
  assert.equal(head, 'ba1f4e3c155ce6a45dc15e87689de01d42a47e1f',
    'Database harness requires the recorded baseline; current-main compatibility is a separate test');
  const dirty = execFileSync('git', ['-C', root, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8', windowsHide: true }).trim();
  assert.equal(dirty, '', 'Use a clean recorded-baseline checkout');
  return root;
}
