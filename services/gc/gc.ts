import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import chalk from 'chalk'
import cron from 'node-cron'

interface GcConfig {
  projectRoot: string
  schedule: string
  maxReportAgeDays: number
  largeFileMB: number
  excludeDirs: string[]
  autoDeleteCategories: number[]
  reportDir: string
}

interface GcFinding {
  category: number
  filePath: string
  reason: string
  sizeBytes?: number
  lineNumber?: number
  message?: string
  safeToDelete: boolean
}

interface GcResult {
  category: number
  description: string
  findings: GcFinding[]
  autoDeleted: number
}

const args = process.argv.slice(2)
const isDryRun = !args.includes('--auto')
const saveReport = args.includes('--report')
const isSchedule = args.includes('--schedule')

import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configPath = path.resolve(__dirname, 'gc.config.json')
const config: GcConfig = JSON.parse(
  fs.readFileSync(configPath, 'utf-8')
)
const PROJECT_ROOT = path.resolve(__dirname, config.projectRoot)


function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

function isExcluded(filePath: string, excludeDirs: string[]): boolean {
  return excludeDirs.some(d => filePath.includes(path.sep + d + path.sep)
    || filePath.includes('/' + d + '/'))
}

function readFileLinesSync(filePath: string): string[] {
  try {
    return fs.readFileSync(filePath, 'utf-8').split('\n')
  } catch {
    return []
  }
}

function isInsideCatchBlock(lines: string[], lineIndex: number): boolean {
  for (let i = lineIndex - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('catch')) return true
    if (trimmed === '}') return false
  }
  return false
}

function exists(p: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.access(p, fs.constants.F_OK, err => resolve(!err))
  })
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function nowStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function mdEscape(s: string): string {
  return s.replace(/([*_`])/g, '\\$1')
}

function writeReport(reportDir: string, filename: string, content: string): void {
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(path.join(reportDir, filename), content, 'utf-8')
}

function globWithIgnore(pattern: string, ignore: string[]): Promise<string[]> {
  return glob(pattern, {
    cwd: PROJECT_ROOT,
    absolute: true,
    ignore,
    dot: true,
    nodir: true,
  })
}

async function runGcOnce(): Promise<void> {
  const excludeDirs = config.excludeDirs

  const createdAt = new Date()
  const reportAgeMs = config.maxReportAgeDays * 24 * 60 * 60 * 1000
  const reportTimestamp = `${createdAt.getFullYear()}-${pad2(createdAt.getMonth() + 1)}-${pad2(createdAt.getDate())}`

  const autoDeleteCategories = new Set<number>(config.autoDeleteCategories)

  const categoryResults: GcResult[] = [
    { category: 1, description: 'Build artifacts', findings: [], autoDeleted: 0 },
    { category: 2, description: 'Stale installs', findings: [], autoDeleted: 0 },
    { category: 3, description: 'Likely orphaned source files', findings: [], autoDeleted: 0 },
    { category: 4, description: 'Large/binary files (report only)', findings: [], autoDeleted: 0 },
    { category: 5, description: 'Stray console.log statements (report only)', findings: [], autoDeleted: 0 },
    { category: 6, description: 'Stale GC reports', findings: [], autoDeleted: 0 },
  ]

  const getCategory = (cat: number) => {
    const c = categoryResults.find(x => x.category === cat)
    if (!c) throw new Error(`missing category ${cat}`)
    return c
  }

  // Category 6: stale GC reports cleanup (auto only)
  {
    const c6 = getCategory(6)
    const reportDirAbs = path.resolve(__dirname, config.reportDir)
    const reportPattern = path.join(reportDirAbs, '**/*.md')
    if (fs.existsSync(reportDirAbs)) {
      const files = await glob(reportPattern, { nodir: true, dot: true })
      const now = Date.now()
      for (const f of files) {
        try {
          const st = fs.statSync(f)
          if (now - st.mtimeMs > reportAgeMs) {
            c6.findings.push({
              category: 6,
              filePath: f,
              reason: `Report older than ${config.maxReportAgeDays} days`,
              sizeBytes: st.size,
              safeToDelete: true,
            })
          }
        } catch {
          // ignore
        }
      }

      const canAuto = !isDryRun && autoDeleteCategories.has(6)
      if (canAuto) {
        for (const f of c6.findings) {
          try {
            fs.rmSync(f.filePath, { force: true })
            c6.autoDeleted += 1
          } catch {
            // ignore
          }
        }
      }
    }
  }

  // Category 1: build artifacts (auto safe)
  {
    const c1 = getCategory(1)
    const patterns = [
      'dist/**',
      'build/**',
      '.vite/**',
      '**/*.tsbuildinfo',
      '__pycache__/**',
    ]

    const ignore = [...excludeDirs]
    const matches = new Set<string>()
    for (const pat of patterns) {
      const found = await globWithIgnore(pat, ignore)
      for (const m of found) matches.add(m)
    }

    const canAuto = !isDryRun && autoDeleteCategories.has(1)

    for (const p of Array.from(matches)) {
      try {
        const st = fs.statSync(p)
        c1.findings.push({
          category: 1,
          filePath: p,
          reason: st.isDirectory() ? 'artifact directory' : 'artifact file',
          sizeBytes: st.size,
          safeToDelete: true,
        })

        if (canAuto) {
          try {
            if (st.isDirectory()) fs.rmSync(p, { recursive: true, force: true })
            else fs.rmSync(p, { force: true })
            c1.autoDeleted += 1
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // Category 2: stale installs (report only)
  {
    const c2 = getCategory(2)
    const rootNodeModules = path.join(PROJECT_ROOT, 'node_modules')
    const rootVenv = path.join(PROJECT_ROOT, '.venv')
    const pkgJson = path.join(PROJECT_ROOT, 'package.json')
    const reqTxt = path.join(PROJECT_ROOT, 'requirements.txt')

    const pkgStat = fs.existsSync(pkgJson) ? fs.statSync(pkgJson) : null
    const reqStat = fs.existsSync(reqTxt) ? fs.statSync(reqTxt) : null
    const nodeStat = fs.existsSync(rootNodeModules) ? fs.statSync(rootNodeModules) : null
    const venvStat = fs.existsSync(rootVenv) ? fs.statSync(rootVenv) : null

    if (pkgStat && nodeStat) {
      if (nodeStat.mtimeMs < pkgStat.mtimeMs) {
        c2.findings.push({
          category: 2,
          filePath: rootNodeModules,
          reason: 'node_modules older than package.json',
          safeToDelete: false,
          message: 'Run: npm install',
        })
      }
    }
    if (pkgStat && !nodeStat) {
      c2.findings.push({
        category: 2,
        filePath: rootNodeModules,
        reason: 'node_modules missing',
        safeToDelete: false,
        message: 'Run: npm install',
      })
    }

    if (reqStat && venvStat) {
      if (venvStat.mtimeMs < reqStat.mtimeMs) {
        c2.findings.push({
          category: 2,
          filePath: rootVenv,
          reason: '.venv older than requirements.txt',
          safeToDelete: false,
          message: 'Run: pip install -r requirements.txt',
        })
      }
    }
    if (reqStat && !venvStat) {
      c2.findings.push({
        category: 2,
        filePath: rootVenv,
        reason: '.venv missing',
        safeToDelete: false,
        message: 'Run: pip install -r requirements.txt',
      })
    }
  }

  // Category 3: orphaned source files (heuristic)
  {
    const c3 = getCategory(3)
    const scanRoots = [path.join(PROJECT_ROOT, 'src'), path.join(PROJECT_ROOT, 'apps')]

    const filePaths: string[] = []
    for (const r of scanRoots) {
      if (!fs.existsSync(r)) continue
      const tsFiles = await globWithIgnore('**/*.ts', excludeDirs)
      const tsxFiles = await globWithIgnore('**/*.tsx', excludeDirs)
      filePaths.push(...tsFiles, ...tsxFiles)
    }

    const searchableFiles = Array.from(new Set([
      ...filePaths,
      ...await globWithIgnore('**/*.md', excludeDirs),
      ...await globWithIgnore('**/*.html', excludeDirs),
      ...await globWithIgnore('**/*.css', excludeDirs),
      ...await globWithIgnore('**/*.json', excludeDirs),
    ]))

    const capped = searchableFiles.slice(0, 4000)
    const cache = new Map<string, string>()
    for (const fp of capped) {
      const ext = path.extname(fp).toLowerCase()
      if (!['.ts','.tsx','.js','.jsx','.json','.md','.html','.css','.txt','.yml','.yaml','.toml','.sql'].includes(ext)) continue
      const txt = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : ''
      cache.set(fp, txt)
    }

    for (const f of filePaths) {
      const base = path.basename(f, path.extname(f))
      let appears = false
      for (const [other, content] of cache.entries()) {
        if (other === f) continue
        if (content.includes(base)) {
          appears = true
          break
        }
      }
      if (!appears) {
        c3.findings.push({
          category: 3,
          filePath: f,
          reason: 'Base filename does not appear in other scanned files',
          safeToDelete: false,
        })
      }
    }
  }

  // Category 4: large/binary report only
  {
    const c4 = getCategory(4)
    const largeLimitBytes = config.largeFileMB * 1024 * 1024
    const allFiles = await globWithIgnore('**/*', excludeDirs)
    const binaryExts = new Set(['.mp4','.zip','.tar','.rar','.exe'])

    for (const f of allFiles) {
      try {
        const st = fs.statSync(f)
        if (!st.isFile()) continue
        const ext = path.extname(f).toLowerCase()
        if (st.size > largeLimitBytes) {
          c4.findings.push({ category: 4, filePath: f, reason: 'File larger than threshold', sizeBytes: st.size, safeToDelete: false })
        } else if (binaryExts.has(ext)) {
          c4.findings.push({ category: 4, filePath: f, reason: 'Binary extension', sizeBytes: st.size, safeToDelete: false })
        }
      } catch {
        // ignore
      }
    }
  }

  // Category 5: stray console.log detection (report only)
  {
    const c5 = getCategory(5)
    const scanDirs = [path.join(PROJECT_ROOT, 'src'), path.join(PROJECT_ROOT, 'apps')]
    const ignore = config.excludeDirs

    const files: string[] = []
    for (const d of scanDirs) {
      if (!fs.existsSync(d)) continue
      const ts = await globWithIgnore('**/*.ts', ignore)
      const tsx = await globWithIgnore('**/*.tsx', ignore)
      files.push(...ts, ...tsx)
    }

    for (const fp of files) {
      const lines = readFileLinesSync(fp)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const has = /\bconsole\.log\b/.test(line)
        if (!has) continue

        const safeToDelete = false
        const insideCatch = isInsideCatchBlock(lines, i)

        c5.findings.push({
          category: 5,
          filePath: fp,
          lineNumber: i + 1,
          reason: insideCatch ? 'console.log inside catch (still a candidate)' : 'console.log statement',
          safeToDelete,
          message: `Consider removing debug log at ${fp}:${i + 1}`,
        })
      }
    }
  }

  // Output summary
  const totals = categoryResults.map(c => ({
    category: c.category,
    found: c.findings.length,
    autoDeleted: c.autoDeleted,
  }))

  console.log(chalk.cyan(`GC Run: dry=${isDryRun} report=${saveReport} schedule=${isSchedule}`))
  for (const t of totals) {
    console.log(`- Category ${t.category}: found=${t.found} autoDeleted=${t.autoDeleted}`)
  }

  // Save report
  if (saveReport) {
    const reportDirAbs = path.resolve(__dirname, config.reportDir)
    const fname = `gc-report-${reportTimestamp}.md`

    let md = `# Legis Garbage Collector Report\n\nGenerated: ${nowStamp()}\nDry run: ${isDryRun}\n\n`
    for (const c of categoryResults) {
      md += `\n## Category ${c.category}: ${c.description}\n`
      md += `Findings: ${c.findings.length}\n`
      if (c.autoDeleted) md += `Auto-deleted: ${c.autoDeleted}\n`
      if (c.findings.length) {
        md += `\n| File | Reason | Size | Line | SafeToDelete |\n|---|---|---|---|---|\n`
        for (const f of c.findings.slice(0, 2000)) {
          md += `| ${mdEscape(f.filePath)} | ${mdEscape(f.reason)} | ${f.sizeBytes !== undefined ? formatBytes(f.sizeBytes) : ''} | ${f.lineNumber ?? ''} | ${f.safeToDelete ? 'yes' : 'no'} |\n`
        }
      }
    }

    writeReport(reportDirAbs, fname, md)
    console.log(chalk.green(`Report saved: ${path.join(reportDirAbs, fname)}`))
  }
}

async function main(): Promise<void> {
  if (isSchedule) {
    cron.schedule(config.schedule, async () => {
      try {
        await runGcOnce()
      } catch (e) {
        console.error(e)
      }
    })
    console.log(`GC scheduled with cron: ${config.schedule}`)
    return
  }

  await runGcOnce()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

