[CmdletBinding()]
param(
  [string]$ManifestUrl = "https://alphabetc1.github.io/word-copilot/word-copilot.xml",
  [string]$ManifestPath,
  [string]$OfficeVersion = "16.0",
  [string]$ShareName = "OfficeAddinManifests",
  [switch]$SkipShare
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $PSCommandPath
$FallbackManifestUrls = @(
  "https://raw.githubusercontent.com/alphabetc1/word-copilot/main/word-copilot.xml"
)

function Get-ManifestSource {
  param(
    [string]$SourcePath,
    [string]$SourceUrl
  )

  if ($SourcePath) {
    $resolved = Resolve-Path -Path $SourcePath -ErrorAction Stop
    return $resolved.Path
  }

  $localCandidates = @(
    (Join-Path $ScriptDir "..\word-copilot.xml"),
    (Join-Path (Get-Location) "word-copilot.xml")
  )

  foreach ($candidate in $localCandidates) {
    if (Test-Path -Path $candidate -PathType Leaf) {
      $resolved = Resolve-Path -Path $candidate -ErrorAction Stop
      Write-Host "Using local manifest: $($resolved.Path)"
      return $resolved.Path
    }
  }

  $tempPath = Join-Path $env:TEMP "word-copilot.xml"
  $candidateUrls = @($SourceUrl) + $FallbackManifestUrls
  foreach ($url in $candidateUrls) {
    try {
      Write-Host "Downloading manifest from: $url"
      Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $tempPath
      return $tempPath
    } catch {
      Write-Warning "Download failed: $url"
    }
  }

  throw "Failed to download manifest from all known URLs. If you already cloned the repo, run with -ManifestPath .\word-copilot.xml"
}

function Test-Manifest {
  param([string]$Path)

  if (-not (Test-Path -Path $Path -PathType Leaf)) {
    throw "Manifest not found: $Path"
  }

  if (-not (Select-String -Path $Path -Pattern "<OfficeApp" -Quiet)) {
    throw "The manifest file is invalid or incomplete."
  }
}

function Ensure-Share {
  param(
    [string]$FolderPath,
    [string]$Name
  )

  & net.exe share $Name *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Share already exists: \\$env:COMPUTERNAME\$Name"
    return $true
  }

  Write-Host "Creating share \\$env:COMPUTERNAME\$Name ..."
  & net.exe share "$Name=$FolderPath" /grant:everyone,read | Out-Host
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Shared folder created."
    return $true
  }

  Write-Warning "Automatic folder sharing failed. Re-run this script in an elevated terminal or share the folder manually."
  return $false
}

if ($env:OS -ne "Windows_NT") {
  throw "This installer is for Windows only."
}

$catalogDir = Join-Path $HOME "Documents\OfficeAddinManifests"
$destPath = Join-Path $catalogDir "word-copilot.xml"

New-Item -ItemType Directory -Force -Path $catalogDir | Out-Null

$sourcePath = Get-ManifestSource -SourcePath $ManifestPath -SourceUrl $ManifestUrl
Test-Manifest -Path $sourcePath
Copy-Item -Path $sourcePath -Destination $destPath -Force

Write-Host "Installed manifest to: $destPath"

$shareReady = $false
if (-not $SkipShare) {
  $shareReady = Ensure-Share -FolderPath $catalogDir -Name $ShareName
} else {
  Write-Host "Skipping share setup."
}

$catalogRoot = "HKCU:\Software\Microsoft\Office\$OfficeVersion\WEF\TrustedCatalogs"
$catalogId = [guid]::NewGuid().ToString("B")
$catalogKey = Join-Path $catalogRoot $catalogId
$catalogPath = "\\$env:COMPUTERNAME\$ShareName"

New-Item -Path $catalogRoot -Force | Out-Null
New-Item -Path $catalogKey -Force | Out-Null
New-ItemProperty -Path $catalogKey -Name "Id" -PropertyType String -Value $catalogId -Force | Out-Null
New-ItemProperty -Path $catalogKey -Name "Url" -PropertyType String -Value $catalogPath -Force | Out-Null
New-ItemProperty -Path $catalogKey -Name "Flags" -PropertyType DWord -Value 1 -Force | Out-Null

Write-Host "Trusted catalog registered: $catalogPath"
Write-Host ""
if (Get-Process WINWORD -ErrorAction SilentlyContinue) {
  Write-Host "Word is running. Close it completely and reopen it before loading the add-in."
} else {
  Write-Host "Open Word after this script finishes."
}

Write-Host "Windows limitation: the first load still requires Insert -> Add-ins -> My Add-ins -> SHARED FOLDER -> Word Copilot -> Add."
if (-not $shareReady -and -not $SkipShare) {
  Write-Host "The manifest and registry entry are ready, but the shared folder still needs admin/manual setup."
}
