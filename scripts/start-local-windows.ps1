[CmdletBinding()]
param(
  [ValidateSet("start", "stop", "status")]
  [string]$Command = "start"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

if ($env:OS -ne "Windows_NT") {
  throw "This script is for Windows only."
}

Require-Command node

Set-Location $ProjectRoot
& node scripts/local-runtime.js $Command
