# Test basic message creation with valid channel UUID
$uri = "http://localhost:4000/api/chat/channels/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/messages"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer dev-fake-token-123"
    "x-dev-email" = "dev@example.com"
    "x-dev-user-id" = "01234567-89ab-cdef-0123-456789abcdef"
    "x-dev-role" = "mediator"
}
$body = @{
    content = "This is a simple test message"
} | ConvertTo-Json

Write-Host "🧪 Testing basic chat message creation..."

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ Message created successfully:"
    Write-Host "   ID: $($response.message.id)"
    Write-Host "   Content: $($response.message.content)"
}
catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody"
        } catch {
            Write-Host "Could not read response body"
        }
    }
}