param(
    [string]$Task,
    [string]$TaskFile,
    [string]$PlanFile = "docs/IMPLEMENTATION_PLAN.md",
    [string]$InstructionsFile = ".claude/prompts/phase-implementer.md",
    [string]$Model = "claude-opus-4-6",
    [ValidateSet("acceptEdits", "bypassPermissions", "default", "delegate", "dontAsk", "plan")]
    [string]$PermissionMode = "acceptEdits",
    [switch]$ContinueLatest,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $Task -and -not $TaskFile) {
    throw "Provide -Task or -TaskFile."
}

if ($Task -and $TaskFile) {
    throw "Use either -Task or -TaskFile, not both."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Resolve-RepoPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathText
    )

    if ([System.IO.Path]::IsPathRooted($PathText)) {
        if (-not (Test-Path -LiteralPath $PathText)) {
            throw "Path not found: $PathText"
        }
        return (Resolve-Path -LiteralPath $PathText).Path
    }

    $candidate = Join-Path $repoRoot $PathText
    if (-not (Test-Path -LiteralPath $candidate)) {
        throw "Path not found: $candidate"
    }
    return (Resolve-Path -LiteralPath $candidate).Path
}

function Get-PromptPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$OriginalPath,
        [Parameter(Mandatory = $true)]
        [string]$ResolvedPath
    )

    if ([System.IO.Path]::IsPathRooted($OriginalPath)) {
        return $ResolvedPath
    }

    return ($OriginalPath -replace "\\", "/")
}

function ConvertTo-WslPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WindowsPath
    )

    $fullPath = [System.IO.Path]::GetFullPath($WindowsPath)

    if ($fullPath -match '^([A-Za-z]):\\(.*)$') {
        $drive = $matches[1].ToLowerInvariant()
        $rest = $matches[2] -replace '\\', '/'
        return "/mnt/$drive/$rest"
    }

    throw "Unable to convert Windows path to WSL path: $WindowsPath"
}

function Quote-Bash {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $escapedSingleQuote = "'" + '"' + "'" + '"' + "'"
    return "'" + $Value.Replace("'", $escapedSingleQuote) + "'"
}

$instructionsPath = Resolve-RepoPath -PathText $InstructionsFile
$planPath = Resolve-RepoPath -PathText $PlanFile

if ($TaskFile) {
    $taskPath = Resolve-RepoPath -PathText $TaskFile
    $taskText = (Get-Content -LiteralPath $taskPath -Raw).Trim()
} else {
    $taskText = $Task.Trim()
}

if (-not $taskText) {
    throw "Task text is empty."
}

$instructionsPromptPath = Get-PromptPath -OriginalPath $InstructionsFile -ResolvedPath $instructionsPath
$planPromptPath = Get-PromptPath -OriginalPath $PlanFile -ResolvedPath $planPath
$repoRootWsl = ConvertTo-WslPath -WindowsPath $repoRoot
$promptTempDir = Join-Path $repoRoot ".claude\tmp"
$promptTempFile = Join-Path $promptTempDir "phase-prompt.txt"
$promptTempFileWsl = ConvertTo-WslPath -WindowsPath $promptTempFile

$prompt = @"
Read these repo files before editing:
- $instructionsPromptPath
- $planPromptPath

Then execute this task only:
$taskText
"@

$claudeArgs = @("--model", $Model, "--permission-mode", $PermissionMode, "-p")

if ($ContinueLatest) {
    $claudeArgs += "-c"
}

$claudeArgsString = ($claudeArgs | ForEach-Object { Quote-Bash -Value $_ }) -join " "
$repoRootBash = Quote-Bash -Value $repoRootWsl
$promptTempFileBash = Quote-Bash -Value $promptTempFileWsl
$bashCommand = "cd $repoRootBash && { command -v claude >/dev/null 2>&1 || { echo 'claude not found in WSL PATH' >&2; exit 127; }; command -v node >/dev/null 2>&1 || { echo 'node not found in WSL PATH (required by the Claude CLI wrapper)' >&2; exit 126; }; claude $claudeArgsString < $promptTempFileBash; }"
$wslArgs = @("bash", "-lic", $bashCommand)

if ($DryRun) {
    Write-Host "Repo root: $repoRoot"
    Write-Host "Repo root (WSL): $repoRootWsl"
    Write-Host "Model: $Model"
    Write-Host "Permission mode: $PermissionMode"
    Write-Host "Continue latest: $ContinueLatest"
    Write-Host "Prompt temp file: $promptTempFile"
    Write-Host "Prompt temp file (WSL): $promptTempFileWsl"
    Write-Host "WSL command preview:"
    Write-Host ("wsl.exe " + ($wslArgs -join " "))
    Write-Host ""
    Write-Host "Prompt preview:"
    Write-Host $prompt
    exit 0
}

try {
    if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
        throw "wsl.exe is not available on PATH."
    }

    New-Item -ItemType Directory -Force -Path $promptTempDir | Out-Null
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($promptTempFile, $prompt, $utf8NoBom)

    & wsl.exe @wslArgs
    exit $LASTEXITCODE
}
finally {
    if (Test-Path -LiteralPath $promptTempFile) {
        Remove-Item -LiteralPath $promptTempFile -Force -ErrorAction SilentlyContinue
    }
}
