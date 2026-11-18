$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$jmeter = $env:JMETER_BIN
if (-not $jmeter) {
  $jmeter = Join-Path $root '.tools\apache-jmeter\bin\jmeter.bat'
}
if (-not (Test-Path $jmeter)) {
  throw "No está JMeter. Instálalo y apunta JMETER_BIN al jmeter.bat, o déjalo en .tools\apache-jmeter."
}

$results = Join-Path $root 'jmeter\results'
$report = Join-Path $root 'jmeter\html-report'
New-Item -ItemType Directory -Force -Path $results | Out-Null
if (Test-Path $report) {
  Remove-Item -Recurse -Force $report
}

& $jmeter -n -t (Join-Path $root 'jmeter\booker-load-test.jmx') -l (Join-Path $results 'results.jtl') -e -o $report
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Informe: $report\index.html"
