# Run this once as Administrator in PowerShell
# It creates a Windows Task Scheduler job that starts the Telegram bot on login

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c pm2 resurrect" -WorkingDirectory "D:\AI\workout"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName "ClaudeTelegramBot" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

Write-Host "✅ Auto-start registered. Bot will start automatically on every login."
