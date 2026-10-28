$sdkDir = "C:\Users\21779\AppData\Local\Android\Sdk"
$zipPath = "$env:TEMP\cmdline-tools.zip"
$tempExtract = "$env:TEMP\cmdline-extracted"

New-Item -ItemType Directory -Force -Path "$sdkDir\cmdline-tools\latest" | Out-Null

if (Test-Path $tempExtract) {
    Remove-Item -Recurse -Force $tempExtract
}

Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force
Get-ChildItem -Path "$tempExtract\cmdline-tools\*" | Move-Item -Destination "$sdkDir\cmdline-tools\latest" -Force

Set-Content -Path "d:\Git\android\local.properties" -Value "sdk.dir=C:\\Users\\21779\\AppData\\Local\\Android\\Sdk"
Write-Output "SDK extracted successfully and local.properties configured"
