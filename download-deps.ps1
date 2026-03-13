[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$downloads = @(
    @{
        Url = "https://github.com/electron-userland/electron-builder-binaries/releases/download/nsis-3.0.4.1/nsis-3.0.4.1.7z"
        Dir = "$env:LOCALAPPDATA\electron-builder\Cache\nsis\nsis-3.0.4.1"
        File = "nsis-3.0.4.1.7z"
    },
    @{
        Url = "https://github.com/electron-userland/electron-builder-binaries/releases/download/nsis-resources-3.4.1/nsis-resources-3.4.1.7z"
        Dir = "$env:LOCALAPPDATA\electron-builder\Cache\nsis\nsis-resources-3.4.1"
        File = "nsis-resources-3.4.1.7z"
    }
)

foreach ($dl in $downloads) {
    $outPath = Join-Path $dl.Dir $dl.File
    New-Item -ItemType Directory -Force -Path $dl.Dir | Out-Null
    Write-Host "Downloading $($dl.File)..."
    try {
        $wc = New-Object System.Net.WebClient
        $wc.DownloadFile($dl.Url, $outPath)
        $size = (Get-Item $outPath).Length
        Write-Host "  OK: $size bytes"
    } catch {
        Write-Host "  FAILED: $_"
    }
}

# Extract all 7z archives
$sevenZip = "C:\Users\a49988i\OneDrive - Newrez\Desktop\DownNotice\node_modules\7zip-bin\win\x64\7za.exe"

$extracts = @(
    "$env:LOCALAPPDATA\electron-builder\Cache\nsis\nsis-3.0.4.1\nsis-3.0.4.1.7z",
    "$env:LOCALAPPDATA\electron-builder\Cache\nsis\nsis-resources-3.4.1\nsis-resources-3.4.1.7z"
)

foreach ($archive in $extracts) {
    if (Test-Path $archive) {
        $dir = Split-Path $archive
        Write-Host "Extracting $archive..."
        & $sevenZip x $archive "-o$dir" -y 2>&1 | Select-Object -Last 5
    } else {
        Write-Host "Archive not found: $archive"
    }
}

Write-Host "`nDone. Cache contents:"
Get-ChildItem "$env:LOCALAPPDATA\electron-builder\Cache" -Recurse -Depth 3 -File | Select-Object @{N='Size';E={$_.Length}}, FullName | Format-Table -AutoSize
