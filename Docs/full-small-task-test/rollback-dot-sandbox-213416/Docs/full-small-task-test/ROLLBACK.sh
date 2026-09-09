$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$baseline = Join-Path $root 'Docs\full-small-task-test\original'
$pairs = @(
  @('src\client\GroupChatSideDock.tsx', 'src\client\GroupChatSideDock.tsx'),
  @('lib\client.js', 'lib\client.js'),
  @('lib\client.js.map', 'lib\client.js.map')
)
foreach ($pair in $pairs) {
  $src = Join-Path $baseline $pair[0]
  $dst = Join-Path $root $pair[1]
  New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
  Copy-Item -LiteralPath $src -Destination $dst -Force
}
Write-Output 'ROLLBACK_OK restored GroupChatSideDock.tsx, lib/client.js, lib/client.js.map'
