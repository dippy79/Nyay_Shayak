# Legis Migration TODO
## Approved Plan - Breaking into Steps

### 1. Preview Changes [ ]
`powershell -c "Get-ChildItem -Recurse -Exclude node_modules,.git,dist,build,.env* | Select-String -Pattern 'Nyay[aA]?[-_]?Sahayak|nyay.*sahayak'"`

### 2. Global String Replace [ ]
```powershell
Get-ChildItem -Recurse -Exclude "node_modules",".git","dist","build",".env*" -Include *.json,*.html,*.ts,*.tsx,*.py,*.md | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $content = $content -replace 'Nyaya-Sahayak', 'Legis'
    $content = $content -replace 'Nyay_Shayak', 'Legis'
    $content = $content -replace 'NyayaSahayak', 'Legis'
    $content = $content -replace 'nyay_sahayak', 'legis'
    [System.IO.File]::WriteAllText($_.FullName, $content, [System.Text.UTF8Encoding]::new($false))
}
```

### 3. Targeted Metadata Updates [ ]
- [ ] package.json: Add name/description
- [ ] index.html: Update title  
- [ ] public/manifest.json: PWA names/descriptions
- [ ] vite.config.ts: Sync manifest
- [ ] README.md: New branding/About

### 4. UI/Backend Branding [ ]
- [ ] src/App.tsx: LegalHelp welcome
- [ ] src/components/Auth/LoginScreen.tsx: Welcome text
- [ ] src/context/AppContext.tsx: Chat prompt
- [ ] server.ts: Admin dashboard
- [ ] crawler.py: FastAPI title

### 5. Verify & Test [ ]
```bash
npm run lint
npm run build
npx vite preview
```

### 6. Supabase Check [ ]
- Verify no bucket/table renames needed
- Test RLS policies

**Status: Ready to execute Step 1 (Preview) → Step 2 (Global Replace) → Step 3-4 (Targeted)**

