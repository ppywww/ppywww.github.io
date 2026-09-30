# scripts/qa/check-feed.ps1
# 用法: pwsh -NoProfile -File scripts/qa/check-feed.ps1
# 独立复核 RSS 与 sitemap：XML 良构性（.NET XmlDocument 真解析）、item 数、
# channel description 与 src/consts.ts 中 SITE.description 的逐字符一致性、sitemap URL 数与中文百分号编码。
$ErrorActionPreference = 'Continue'
$origin = 'https://ppywww.github.io'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$consts = Join-Path $repo 'src\consts.ts'
"consts.ts 存在: $(Test-Path $consts)"

'--- RSS ---'
$rssRaw = (Invoke-WebRequest -Uri "$origin/rss.xml" -UseBasicParsing -TimeoutSec 60).Content
try {
  $rss = New-Object System.Xml.XmlDocument
  $rss.LoadXml($rssRaw)
  "XML 良构: PASS (根节点 <$($rss.DocumentElement.Name)>)"
} catch { "XML 良构: FAIL - $($_.Exception.Message)"; exit 1 }
$ch = $rss.rss.channel
"channel.title       = $($ch.title)"
"channel.link        = $($ch.link)"
"channel.language    = $($ch.language)"
"channel.description = $($ch.description)"
$items = @($ch.item)
"item 数 = $($items.Count)"
foreach ($it in $items) {
  $cats = (@($it.category) | ForEach-Object { $_.'#text' }) -join ','
  "  - $($it.title) | $($it.link) | $($it.pubDate) | desc.len=$($it.description.Length) | cats=$cats"
}
if (Test-Path $consts) {
  $ts = Get-Content $consts -Raw -Encoding UTF8
  $m = [regex]::Match($ts, "description:\s*'([^']*)'")
  if (-not $m.Success) { $m = [regex]::Match($ts, 'description:\s*"([^"]*)"') }
  if ($m.Success) {
    $siteDesc = $m.Groups[1].Value
    $rssDesc = [string]$ch.description
    "consts.description  = $siteDesc"
    "逐字符相等: $($siteDesc -ceq $rssDesc)"
    if ($siteDesc -cne $rssDesc) {
      "  consts.len=$($siteDesc.Length) rss.len=$($rssDesc.Length)"
      for ($i = 0; $i -lt [Math]::Max($siteDesc.Length, $rssDesc.Length); $i++) {
        $a = if ($i -lt $siteDesc.Length) { $siteDesc[$i] } else { '<eos>' }
        $b = if ($i -lt $rssDesc.Length) { $rssDesc[$i] } else { '<eos>' }
        if ($a -ne $b) { "  首个差异 @$i : consts=[$a] rss=[$b]"; break }
      }
    }
  } else { '未能从 consts.ts 提取 description' }
}
'--- sitemap ---'
$smRaw = (Invoke-WebRequest -Uri "$origin/sitemap.xml" -UseBasicParsing -TimeoutSec 60).Content
$sm = New-Object System.Xml.XmlDocument
$sm.LoadXml($smRaw)
$locs = @($sm.urlset.url | ForEach-Object { $_.loc })
"sitemap URL 数 = $($locs.Count)"
$nonAscii = @($locs | Where-Object { $_ -match '[^\x00-\x7F]' })
"含非 ASCII 字符的 loc 数 = $($nonAscii.Count)"
if ($nonAscii.Count -gt 0) { $nonAscii | Select-Object -First 5 | ForEach-Object { "  RAW: $_" } }
$encoded = @($locs | Where-Object { $_ -match '%[0-9A-Fa-f]{2}' })
"含百分号编码的 loc 数 = $($encoded.Count)"
$encoded | Select-Object -First 6 | ForEach-Object { "  ENC: $_" }
$outOfScope = @($locs | Where-Object { $_ -notlike "$origin*" })
"站外 loc 数 = $($outOfScope.Count)"
'--- robots.txt ---'
try {
  $rb = Invoke-WebRequest -Uri "$origin/robots.txt" -UseBasicParsing -TimeoutSec 40
  "robots.txt status=$($rb.StatusCode)"
  ($rb.Content -split [char]10) | Select-Object -First 8
} catch { "robots.txt 不可用: $($_.Exception.Message)" }
'--- 逐条 loc 状态码（前 25 条）---'
$bad = 0
foreach ($l in ($locs | Select-Object -First 25)) {
  try {
    $r = Invoke-WebRequest -Uri $l -UseBasicParsing -TimeoutSec 40 -Method Get
    if ($r.StatusCode -ne 200) { "  $($r.StatusCode) $l"; $bad++ }
  } catch { "  ERR $l"; $bad++ }
}
"sitemap 前 25 条中非 200 数 = $bad"
'=== DONE ==='
