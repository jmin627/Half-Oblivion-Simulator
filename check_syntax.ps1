$files = Get-ChildItem -Path "C:\Users\user\.gemini\antigravity-ide\scratch\half-snap-simulator\js" -Recurse -Filter "*.js"

foreach ($f in $files) {
    $lines = Get-Content $f.FullName -Encoding UTF8
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        $trimmed = $line.Trim()
        if ($trimmed.StartsWith("//") -or $trimmed.StartsWith("/*") -or $trimmed.StartsWith("*")) {
            continue
        }
        $chars = $line.ToCharArray()
        $singleQuotes = ($chars | Where-Object { $_ -eq "'" }).Count
        if ($singleQuotes -gt 2) {
            Write-Host "MORE THAN 2 SINGLE QUOTES: $($f.Name):$($i+1) -> $line"
        }
        if ($singleQuotes % 2 -ne 0) {
            Write-Host "ODD SINGLE QUOTES: $($f.Name):$($i+1) -> $line"
        }
    }
}
