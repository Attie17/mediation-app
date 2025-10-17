param(
    [string]$JwtToken = $env:MEDIATION_JWT,
    [string]$ApiBaseUrl = $(if ($env:API_BASE_URL) { $env:API_BASE_URL } elseif ($env:MEDIATION_API_URL) { $env:MEDIATION_API_URL } else { "http://localhost:4000" })
)

function Show-Usage {
    @"
Usage:
  MEDIATION_JWT=<token> .\notifications-smoke.ps1

Parameters / Environment variables:
  -JwtToken / MEDIATION_JWT   Bearer token used for authenticated calls. (Required)
  -ApiBaseUrl / API_BASE_URL  Backend API base URL. Defaults to http://localhost:4000.

Steps performed:
  1. Fetch notifications for the authenticated user.
  2. Mark the newest notification as read (when available).
  3. Delete that same notification to confirm the lifecycle endpoints.
"@
}

if ($PSBoundParameters.ContainsKey('Help') -or $args -contains '-h' -or $args -contains '--help') {
    Show-Usage
    exit 0
}

if (-not $JwtToken) {
    Write-Error "MEDIATION_JWT environment variable (or -JwtToken) is required."
    Show-Usage
    exit 1
}

$headers = @{ Authorization = "Bearer $JwtToken" }
Write-Host "Using API base URL: $ApiBaseUrl"

try {
    Write-Host "`nFetching notifications..."
    $response = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/notifications" -Headers $headers -ErrorAction Stop
    $response | ConvertTo-Json -Depth 6 | Write-Host

    if (-not $response.success -or -not $response.data -or $response.data.Count -eq 0) {
        Write-Warning "No notifications returned; nothing to mark as read or delete."
        exit 0
    }

    $first = $response.data[0]
    Write-Host "`nMarking notification $($first.id) as read..."
    $markResponse = Invoke-RestMethod -Method Patch -Uri "$ApiBaseUrl/api/notifications/$($first.id)/read" -Headers $headers -Body '{}' -ContentType 'application/json' -ErrorAction Stop
    $markResponse | ConvertTo-Json -Depth 6 | Write-Host

    Write-Host "`nDeleting notification $($first.id)..."
    $deleteResponse = Invoke-RestMethod -Method Delete -Uri "$ApiBaseUrl/api/notifications/$($first.id)" -Headers $headers -ErrorAction Stop
    $deleteResponse | ConvertTo-Json -Depth 6 | Write-Host

    Write-Host "`nDone."
}
catch {
    Write-Error $_
    exit 1
}
