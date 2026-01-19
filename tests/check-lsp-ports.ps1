# Start LSP test in background
$job = Start-Job -ScriptBlock {
    Set-Location "C:\work\oh-my-opencode"
    bun run quick-lsp-test.mjs
}

# Wait 3 seconds for LSP server to start
Start-Sleep -Seconds 3

# Check new node processes
Write-Host "=== Node processes after LSP start ==="
Get-Process node | Select-Object Id, ProcessName, CPU, WorkingSet | Format-Table

# Check if any process is listening on ports
Write-Host "`n=== Network connections for Node processes ==="
$processIds = Get-Process node | Select-Object -ExpandProperty Id
foreach ($procId in $processIds) {
    Get-NetTCPConnection -OwningProcess $procId -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, State, OwningProcess
}

# Wait for job to complete
Wait-Job $job
Remove-Job $job

Write-Host "`n=== LSP test completed ==="
