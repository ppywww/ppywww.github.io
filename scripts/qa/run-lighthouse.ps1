# scripts/qa/run-lighthouse.ps1
# 用法: pwsh -NoProfile -File scripts/qa/run-lighthouse.ps1
# 用 npx -y lighthouse 对线上站点跑移动端 Lighthouse 四项，JSON 落到 scripts/qa/evidence/。
# 不安装项目依赖（npx 只写 npm 缓存），不触碰源码，不执行构建。
$ErrorActionPreference = 'Continue'
$chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' }
$env:CHROME_PATH = $chrome
$npx = 'C:/Program Files/nodejs/npx.cmd'
"CHROME_PATH=$env:CHROME_PATH"
"NPX=$npx (exists: $(Test-Path $npx))"
$out = Join-Path $PSScriptRoot 'evidence'
New-Item -ItemType Directory -Path $out -Force | Out-Null
$targets = @(
  @{ name = 'lh-home'; url = 'https://ppywww.github.io/' },
  @{ name = 'lh-post'; url = 'https://ppywww.github.io/posts/2026-09-30-build-this-blog/' },
  @{ name = 'lh-search'; url = 'https://ppywww.github.io/search/' }
)
foreach ($t in $targets) {
  $json = Join-Path $out ($t.name + '.json')
  if (Test-Path $json) { Remove-Item $json -Force }
  "=== RUN $($t.name) $($t.url) ==="
  $lhArgs = @(
    '--yes', 'lighthouse', $t.url,
    '--output=json', "--output-path=$json",
    '--only-categories=performance,accessibility,best-practices,seo',
    '--form-factor=mobile', '--screenEmulation.mobile=true',
    '--throttling-method=simulate',
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    '--quiet', '--max-wait-for-load=60000'
  )
  & $npx @lhArgs 2>&1 | Select-Object -Last 15
  if (Test-Path $json) {
    $j = Get-Content $json -Raw | ConvertFrom-Json
    foreach ($c in 'performance', 'accessibility', 'best-practices', 'seo') {
      "{0} = {1}" -f $c, [Math]::Round($j.categories.$c.score * 100)
    }
    "metrics: FCP=$([Math]::Round($j.audits.'first-contentful-paint'.numericValue))ms LCP=$([Math]::Round($j.audits.'largest-contentful-paint'.numericValue))ms TBT=$([Math]::Round($j.audits.'total-blocking-time'.numericValue))ms CLS=$($j.audits.'cumulative-layout-shift'.numericValue) SI=$([Math]::Round($j.audits.'speed-index'.numericValue))ms"
  } else { "!!! $($t.name) 未生成 JSON" }
}
'=== DONE ==='
