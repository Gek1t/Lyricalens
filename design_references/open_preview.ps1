$targetFile = "d:\Git\design_references\preview_personal_hub_refined.html"
$action = New-ScheduledTaskAction -Execute "explorer.exe" -Argument "`"$targetFile`""
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
Register-ScheduledTask -TaskName "LaunchPreviewRefined" -Action $action -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName "LaunchPreviewRefined"
Start-Sleep -Seconds 1
Unregister-ScheduledTask -TaskName "LaunchPreviewRefined" -Confirm:$false
