$ErrorActionPreference = "Stop"
$walletFile = "C:\Users\cw_66\AppData\Local\Temp\opencode\pharmchain-mainnet-wallets.json"
if (-not (Test-Path -LiteralPath $walletFile)) { throw "Restricted wallet file is missing." }
$wallets = Get-Content -Raw -LiteralPath $walletFile | ConvertFrom-Json
$deployer = $wallets.wallets | Where-Object { $_.label -eq "deployer-owner" }
$manufacturers = @($wallets.wallets | Where-Object { $_.label -ne "deployer-owner" })
if ($null -eq $deployer -or $manufacturers.Count -ne 5) { throw "Wallet file does not contain the expected six wallets." }
$secureJwt = Read-Host "Paste Pinata JWT (input hidden)" -AsSecureString
$jwtPointer = [IntPtr]::Zero
$exitCode = 0
try {
    $jwtPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureJwt)
    $env:IPFS_API_URL = "https://api.pinata.cloud"
    $env:IPFS_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($jwtPointer)
    $env:PRIVATE_KEY = $deployer.privateKey
    $env:SEED_MANUFACTURER_PRIVATE_KEYS = ($manufacturers.privateKey -join ",")
    $env:DRUG_REGISTRY_ADDRESS = "0x0f784017793776A8D6537F827421696077aDb396"
    $env:MANUFACTURER_CREDENTIAL_ADDRESS = "0xb1B2b43dBb26C12b25e3eBd85418830413c55B0A"
    $env:PUBLIC_APP_URL = "https://pharmchain.vercel.app"
    $env:SEED_CONFIRM = "PHARMCHAIN-MAINNET"
    & npm.cmd run seed
    $exitCode = $LASTEXITCODE
}
finally {
    if ($jwtPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($jwtPointer)
    }
    Remove-Item Env:IPFS_API_URL -ErrorAction SilentlyContinue
    Remove-Item Env:IPFS_API_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:PRIVATE_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:SEED_MANUFACTURER_PRIVATE_KEYS -ErrorAction SilentlyContinue
    Remove-Item Env:DRUG_REGISTRY_ADDRESS -ErrorAction SilentlyContinue
    Remove-Item Env:MANUFACTURER_CREDENTIAL_ADDRESS -ErrorAction SilentlyContinue
    Remove-Item Env:PUBLIC_APP_URL -ErrorAction SilentlyContinue
    Remove-Item Env:SEED_CONFIRM -ErrorAction SilentlyContinue
}
exit $exitCode
