$urls = @(
    'http://localhost:8080/',
    'http://localhost:8080/css/style.css',
    'http://localhost:8080/js/app.js',
    'http://localhost:8080/js/state.js',
    'http://localhost:8080/js/particles.js',
    'http://localhost:8080/js/audio.js',
    'http://localhost:8080/js/data/targets.js',
    'http://localhost:8080/js/data/achievements.js'
)

foreach ($url in $urls) {
    try {
        $res = Invoke-WebRequest -Uri $url -UseBasicParsing
        $status = $res.StatusCode
        $type = $res.Headers["Content-Type"]
        $len = $res.Content.Length
        Write-Host "SUCCESS: $url -> Status: $status | Content-Type: $type | Length: $len bytes"
    } catch {
        Write-Host "ERROR: $url -> $_"
    }
}
