#!/usr/bin/env pwsh
$basedir="C:/Users/Administrator/AppData/Roaming/npm"

$exe=""
if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {
  # Fix case when both the Windows and Linux builds of Node
  # are installed in the same directory
  $exe=".exe"
}
$ret=0
if (Test-Path "$basedir/node$exe") {
  # Support pipeline input
  if ($MyInvocation.ExpectingInput) {
    $input | & "$basedir/node$exe"  --import "file:///C:/%E9%A1%B9%E7%9B%AE/dsh-group-chat/Docs/scope-repair/scope-singleton.mjs" "$basedir/node_modules/@deepseek-ai/dsh/lib/bin.js" $args
  } else {
    & "$basedir/node$exe"  --import "file:///C:/%E9%A1%B9%E7%9B%AE/dsh-group-chat/Docs/scope-repair/scope-singleton.mjs" "$basedir/node_modules/@deepseek-ai/dsh/lib/bin.js" $args
  }
  $ret=$LASTEXITCODE
} else {
  # Support pipeline input
  if ($MyInvocation.ExpectingInput) {
    $input | & "node$exe"  --import "file:///C:/%E9%A1%B9%E7%9B%AE/dsh-group-chat/Docs/scope-repair/scope-singleton.mjs" "$basedir/node_modules/@deepseek-ai/dsh/lib/bin.js" $args
  } else {
    & "node$exe"  --import "file:///C:/%E9%A1%B9%E7%9B%AE/dsh-group-chat/Docs/scope-repair/scope-singleton.mjs" "$basedir/node_modules/@deepseek-ai/dsh/lib/bin.js" $args
  }
  $ret=$LASTEXITCODE
}
exit $ret


