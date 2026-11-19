$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$bat = $env:JMETER_BAT
if (-not $bat) {
  $candidates = @(
    (Join-Path $root '.tools\apache-jmeter-5.6.3\bin\jmeter.bat'),
    (Join-Path $root '.tools\apache-jmeter\bin\jmeter.bat')
  )
  $bat = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $bat -or -not (Test-Path $bat)) {
  throw "No está JMeter. Instálalo y apunta JMETER_BAT a jmeter.bat."
}

$results = Join-Path $root 'jmeter\results'
$report = Join-Path $root 'jmeter\html-report'
New-Item -ItemType Directory -Force -Path $results | Out-Null
if (Test-Path $report) {
  Remove-Item -Recurse -Force $report
}

# JMeter guarda en JMETER_BIN la carpeta bin. Si esa variable apunta al .bat, no encuentra el jar.
Remove-Item Env:JMETER_BIN -ErrorAction SilentlyContinue
$plan = Join-Path $root 'jmeter\booker-load-test.jmx'
$log = Join-Path $results 'results.jtl'
$bin = Split-Path -Parent $bat
Push-Location $bin
try {
  & java -jar (Join-Path $bin 'ApacheJMeter.jar') -n -t $plan -l $log -e -o $report
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}
if (-not (Test-Path (Join-Path $report 'index.html'))) {
  throw "JMeter no generó el informe HTML."
}
Write-Host "Informe: $report\index.html"
