# scripts/qa/run-lighthouse-v11.ps1
# 用法: pwsh -NoProfile -File scripts/qa/run-lighthouse-v11.ps1
# v1.1 终验：8 个页面各跑一次四项（+ P/BP/SEO），文章页额外重复 2 次以观察 LCP 波动
# （上一轮文章页 LCP 1498ms / 门禁 1500ms，余量仅 2ms，必须看重复性）。
$ErrorActionPreference = 'Continue'
$chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' }
$env:CHROME_PATH = $chrome
$npx = 'C:/Program Files/nodejs/npx.cmd'
$out = Join-Path $PSScriptRoot 'evidence'
New-Item -ItemType Directory -Path $out -Force | Out-Null
$base = 'https://ppywww.github.io'
$targets = @(
  @{ name = 'lh11-post-a'; url = "$base/posts/2026-09-30-build-this-blog/" },
  @{ name = 'lh11-post-b'; url = "$base/posts/2026-09-30-build-this-blog/" },
  @{ name = 'lh11-post-c'; url = "$base/posts/2026-09-30-build-this-blog/" },
  @{ name = 'lh11-home';   url = "$base/" },
  @{ name = 'lh11-posts';  url = "$base/posts/" },
  @{ name = 'lh11-works';  url = "$base/works/" },
  @{ name = 'lh11-archives'; url = "$base/archives/" },
  @{ name = 'lh11-tag';    url = "$base/tags/Astro/" },
  @{ name = 'lh11-about';  url = "$base/about/" },
  @{ name = 'lh11-search'; url = "$base/search/" }
)
foreach ($t in $targets) {
  $json = Join-Path $out ($t.name + '.json')
  if (Test-Path $json) { Remove-Item $json -Force }
  $lhArgs = @(
    '--yes', 'lighthouse', $t.url,
    '--output=json', "--output-path=$json",
    '--only-categories=performance,accessibility,best-practices,seo',
    '--form-factor=mobile', '--screenEmulation.mobile=true',
    '--throttling-method=simulate',
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    '--quiet', '--max-wait-for-load=60000'
  )
  & $npx @lhArgs 2>&1 | Out-Null
  if (Test-Path $json) {
    $j = Get-Content $json -Raw | ConvertFrom-Json
    $scores = @()
    foreach ($c in 'performance', 'accessibility', 'best-practices', 'seo') { $scores += "$c=$([Math]::Round($j.categories.$c.score * 100))" }
    $lcp = [Math]::Round($j.audits.'largest-contentful-paint'.numericValue)
    $fcp = [Math]::Round($j.audits.'first-contentful-paint'.numericValue)
    $tbt = [Math]::Round($j.audits.'total-blocking-time'.numericValue)
    $cls = $j.audits.'cumulative-layout-shift'.numericValue
    $ho = $j.audits.'heading-order'.score
    $ts = $j.audits.'target-size'.score
    $cc = $j.audits.'color-contrast'.score
    "{0} | {1} | LCP={2}ms FCP={3}ms TBT={4}ms CLS={5} | heading-order={6} target-size={7} color-contrast={8}" -f $t.name, ($scores -join ' '), $lcp, $fcp, $tbt, $cls, $ho, $ts, $cc
  } else { "!!! $($t.name) 未生成 JSON" }
}
'=== DONE ==='
