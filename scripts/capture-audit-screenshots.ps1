$tempDir = "C:\temp\triple-zzz-screenshots"
if (!(Test-Path $tempDir)) { New-Item -ItemType Directory -Force -Path $tempDir }

$targetDir = (Resolve-Path "docs\ui-ux-audit\screenshots").Path

$pages = @(
  @{ name = "home"; url = "http://localhost:3000/" },
  @{ name = "shop"; url = "http://localhost:3000/shop" },
  @{ name = "product"; url = "http://localhost:3000/products/triple-z-la-pulga-hoodie" },
  @{ name = "collections"; url = "http://localhost:3000/collections" },
  @{ name = "collection-argentina"; url = "http://localhost:3000/collections/argentina" },
  @{ name = "lookbook"; url = "http://localhost:3000/lookbook" },
  @{ name = "cart"; url = "http://localhost:3000/cart" },
  @{ name = "checkout"; url = "http://localhost:3000/checkout" },
  @{ name = "size-guide"; url = "http://localhost:3000/size-guide" },
  @{ name = "account"; url = "http://localhost:3000/account" }
)

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$userData = "C:\temp\chrome-audit-session"

foreach ($p in $pages) {
  $deskTemp = Join-Path $tempDir "$($p.name)-desktop.png"
  $mobTemp = Join-Path $tempDir "$($p.name)-mobile.png"
  
  Write-Host "Capturing $($p.name) desktop..."
  Start-Process $chrome -ArgumentList @("--headless=new", "--disable-gpu", "--user-data-dir=$userData", "--window-size=1440,900", "--screenshot=$deskTemp", $p.url) -Wait
  
  Write-Host "Capturing $($p.name) mobile..."
  Start-Process $chrome -ArgumentList @("--headless=new", "--disable-gpu", "--user-data-dir=$userData", "--window-size=390,844", "--screenshot=$mobTemp", $p.url) -Wait
}

Write-Host "Copying to target directory..."
Get-ChildItem $tempDir -Filter "*.png" | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $targetDir $_.Name) -Force
}

Get-ChildItem $targetDir | Select-Object Name, Length
