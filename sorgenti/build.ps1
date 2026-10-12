# Unisce le parti in: dist\arduino-lab.html (pagina per claude.ai) e index.html (file locale completo)
$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot 'src'
$dist = Join-Path $PSScriptRoot 'versione-claude'
$workspace = Split-Path $PSScriptRoot -Parent
New-Item -ItemType Directory -Force $dist | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)
$leggi = { param($n) [System.IO.File]::ReadAllText((Join-Path $src $n), $utf8) }

$testa = & $leggi '01-head.html'
$corpo = (& $leggi '02-body.html') + "`n" + ((Get-ChildItem $src -Filter '*.js' | Sort-Object Name | ForEach-Object { & $leggi $_.Name }) -join "`n")

# Pagina per claude.ai: niente doctype/head/body (li aggiunge la piattaforma)
[System.IO.File]::WriteAllText((Join-Path $dist 'arduino-lab.html'), $testa + "`n" + $corpo, $utf8)

# File locale autonomo
$locale = "<!DOCTYPE html>`n<html lang=`"it`">`n<head>`n<meta charset=`"UTF-8`">`n<meta name=`"viewport`" content=`"width=device-width, initial-scale=1, viewport-fit=cover`">`n<meta name=`"description`" content=`"Laboratorio interattivo per imparare Arduino: simulatore LED, componenti, logica nel codice, calcolatore di resistenze, quiz e tutor AI.`">`n" + $testa + "`n</head>`n<body>`n" + $corpo + "`n</body>`n</html>`n"
[System.IO.File]::WriteAllText((Join-Path $workspace 'index.html'), $locale, $utf8)

"index.html: {0:N0} byte" -f (Get-Item (Join-Path $workspace 'index.html')).Length
