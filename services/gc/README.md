# Legis Garbage Collector

## Quick Start
From project root (F:\Nyay_Shayak):
  npm run gc:dry    ← safe scan, no deletions
  npm run gc        ← scan + auto-clean safe categories

## CLI Usage (from services/gc/)
  ts-node gc.ts --dry-run          # scan only
  ts-node gc.ts --dry-run --report # scan + save markdown report
  ts-node gc.ts --auto             # scan + delete safe categories
  ts-node gc.ts --auto --report    # scan + delete + save report
  ts-node gc.ts --schedule         # run on cron (Sunday 2am default)

## What Gets Auto-Deleted (safe)
  - dist/, build/, .vite/ folders
  - *.tsbuildinfo files
  - __pycache__/ folders
  - GC reports older than 30 days

## What Gets Reported Only (you decide)
  - Stale node_modules or .venv installs
  - Likely orphaned source files
  - Large files not in .gitignore
  - Stray console.log statements

## Configure
Edit services/gc/gc.config.json to change:
  - schedule (cron expression)
  - largeFileMB threshold
  - maxReportAgeDays
  - autoDeleteCategories

════════════════════════════════════════
AFTER CREATING ALL 4 FILES:

1. Install GC dependencies:
   cd F:\Nyay_Shayak\services\gc
   npm install

2. Run a test dry-run:
   node_modules\.bin\ts-node.cmd gc.ts --dry-run

3. Paste the dry-run output here.

RULES:
- Output FULL gc.ts file content — no truncation with "..."
- gc.ts must be TypeScript strict compatible
- Do not touch any other file in the project
- Print: "PHASE 3 COMPLETE. 4 files created."

