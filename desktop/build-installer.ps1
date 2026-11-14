# Builds the Windows installer WibeMusic-Setup.exe without Docker, system Python or Node on the target PC.
# Needs on the build machine: uv, Inno Setup 6, internet. Output: desktop\dist\WibeMusic-Setup.exe
param(
    [string]$Navidrome = "0.64.2",
    [string]$Deno = "2.9.8",
    [string]$Ffmpeg = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$work = Join-Path $env:LOCALAPPDATA "Temp\opencode\build\installer"
$stage = Join-Path $work "stage"
$dist = Join-Path $PSScriptRoot "dist"
$iscc = @("$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe", "C:\Program Files (x86)\Inno Setup 6\ISCC.exe") |
    Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { throw "Inno Setup 6 не найден" }

Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$stage\bin", "$stage\hub", "$stage\navidrome", $work, $dist | Out-Null

# Python 3.12 from uv, with Hub dependencies installed into site\
$env:UV_PYTHON_INSTALL_DIR = Join-Path $work "py"
python -m uv python install 3.12 --no-bin | Out-Null
$py = Get-ChildItem $env:UV_PYTHON_INSTALL_DIR -Directory -Filter "cpython-3.12.*-windows-x86_64-none" |
    Sort-Object Name | Select-Object -Last 1
Copy-Item -LiteralPath $py.FullName -Destination "$stage\python" -Recurse -Force
Push-Location "$root\hub"
python -m uv export --frozen --no-dev --no-hashes --no-emit-project -o "$work\req.txt" | Out-Null
Pop-Location
python -m uv pip install --python "$stage\python\python.exe" --target "$stage\site" -r "$work\req.txt" | Out-Null

# Navidrome, Deno, ffmpeg
Invoke-WebRequest "https://github.com/navidrome/navidrome/releases/download/v$Navidrome/navidrome_${Navidrome}_windows_amd64.zip" -OutFile "$work\nd.zip" -UseBasicParsing
Expand-Archive "$work\nd.zip" -DestinationPath "$work\nd" -Force
Copy-Item "$work\nd\navidrome.exe" "$stage\bin\" -Force
Invoke-WebRequest "https://github.com/denoland/deno/releases/download/v$Deno/deno-x86_64-pc-windows-msvc.zip" -OutFile "$work\deno.zip" -UseBasicParsing
Expand-Archive "$work\deno.zip" -DestinationPath "$stage\bin" -Force
Invoke-WebRequest $Ffmpeg -OutFile "$work\ffmpeg.zip" -UseBasicParsing
Expand-Archive "$work\ffmpeg.zip" -DestinationPath "$work\ffmpeg" -Force
Get-ChildItem "$work\ffmpeg" -Recurse -Include ffmpeg.exe, ffprobe.exe | Copy-Item -Destination "$stage\bin\" -Force

# Application files
Copy-Item "$root\hub\app" "$stage\hub\app" -Recurse -Force
Copy-Item "$root\hub\migrations" "$stage\hub\migrations" -Recurse -Force
Copy-Item "$root\hub\alembic.ini" "$stage\hub\" -Force
Copy-Item "$root\config.example.yaml" "$stage\" -Force
Copy-Item "$root\navidrome\navidrome.toml" "$stage\navidrome\" -Force
Copy-Item "$PSScriptRoot\launcher.py" "$stage\" -Force
Copy-Item "$root\LICENSE" "$stage\" -Force -ErrorAction SilentlyContinue

Get-ChildItem $stage -Recurse -Filter __pycache__ | Remove-Item -Recurse -Force
& $iscc "/O$dist" "/DStageDir=$stage" "/DRoot=$root" "$PSScriptRoot\WibeMusic.iss"
if ($LASTEXITCODE -ne 0) { throw "ISCC завершился с ошибкой $LASTEXITCODE" }
Get-Item "$dist\WibeMusic-Setup.exe" | Select-Object FullName, @{n = 'MB'; e = { [math]::Round($_.Length / 1MB, 1) } }
