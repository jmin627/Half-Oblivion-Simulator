$locations = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\git.exe",
    "$env:ProgramData\chocolatey\bin\git.exe",
    "$env:USERPROFILE\scoop\shims\git.exe"
)

foreach ($loc in $locations) {
    if (Test-Path $loc) {
        Write-Host "GIT FOUND AT: $loc"
    }
}

# Also search GitHub Desktop git
$ghPath = "$env:LOCALAPPDATA\GitHubDesktop"
if (Test-Path $ghPath) {
    $ghGits = Get-ChildItem -Path $ghPath -Recurse -Filter "git.exe" -ErrorAction SilentlyContinue
    foreach ($g in $ghGits) {
        Write-Host "GH DESKTOP GIT: $($g.FullName)"
    }
}
