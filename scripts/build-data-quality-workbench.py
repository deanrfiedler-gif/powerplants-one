#!/usr/bin/env python3
"""Rebuild the maintained AD-03 preview while preserving the issued r01 bytes."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/data-quality'
EVIDENCE = ROOT / 'docs/testing/evidence/data-quality-r01'
OUTPUT = ROOT / 'docs/reference/ui/data-quality/PPO-Data-Quality-Workbench-working.html'
ISSUED = ROOT / 'docs/reference/ui/data-quality/PPO-Data-Quality-Workbench-r01.html'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true', help='Compare the rebuilt working preview with the checked-in file.')
args = parser.parse_args()
original = json.loads((EVIDENCE / 'original/build-manifest.json').read_text())
assert hashlib.sha256(ISSUED.read_bytes()).hexdigest() == original['htmlSHA256'], 'Issued r01 changed'
with tempfile.TemporaryDirectory(prefix='ppo-ad03-build-') as temp:
    staging = Path(temp)
    source = staging / 'ad03-src'
    source.mkdir()
    # Retain original metadata key order without depending on checkout enumeration.
    for name in original['sources']:
        shutil.copyfile(SOURCE / name, source / name)
    shutil.copyfile(SOURCE / 'build.py', source / 'build.py')
    subprocess.run([sys.executable, str(source / 'build.py')], cwd=staging, check=True, stdout=subprocess.PIPE)
    generated = (staging / ISSUED.name).read_bytes()
    manifest = json.loads((staging / 'evidence/build-manifest.json').read_text())
    if args.check:
        assert OUTPUT.read_bytes() == generated, 'Maintained preview is out of date; rebuild deliberately'
    else:
        OUTPUT.write_bytes(generated)
        (EVIDENCE / 'repository').mkdir(exist_ok=True)
        (EVIDENCE / 'repository/build-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(('Verified' if args.check else 'Built') + ' maintained preview: ' + str(OUTPUT.relative_to(ROOT)))
print('SHA-256 ' + hashlib.sha256(generated).hexdigest())
print('Issued r01 preserved: ' + original['htmlSHA256'])
