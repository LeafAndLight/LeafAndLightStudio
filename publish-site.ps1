[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Message
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "O comando 'git $($Arguments -join ' ')' falhou com o código $LASTEXITCODE."
    }
}

try {
    $repositoryRoot = (& git rev-parse --show-toplevel 2>$null)
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repositoryRoot)) {
        throw 'Não foi possível localizar a raiz do repositório Git.'
    }

    $repositoryRoot = $repositoryRoot.Trim()
    Set-Location -LiteralPath $repositoryRoot

    if (-not (Test-Path -LiteralPath (Join-Path $repositoryRoot 'index.html') -PathType Leaf)) {
        throw "index.html não foi encontrado na raiz do repositório: $repositoryRoot"
    }

    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível determinar a branch atual.'
    }
    if ($branch -ne 'main') {
        throw "A branch atual é '$branch'. A publicação só pode ser feita a partir de 'main'."
    }

    $origin = (& git remote get-url origin).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível consultar o remote origin.'
    }
    if ($origin -notmatch '(?i)(?:github\.com[/:])LeafAndLight/LeafAndLightStudio(?:\.git)?/?$') {
        throw "O remote origin não corresponde a LeafAndLight/LeafAndLightStudio: $origin"
    }

    Write-Host 'Atualizando referências remotas...'
    Invoke-Git -Arguments @('fetch', 'origin')
    Invoke-Git -Arguments @('pull', '--rebase', '--autostash', 'origin', 'main')

    $deployId = '{0}-{1}' -f (Get-Date -Format 'yyyyMMddHHmmss'), ([guid]::NewGuid().ToString('N').Substring(0, 12))
    $deployVersionPath = Join-Path $repositoryRoot 'deploy-version.txt'
    [System.IO.File]::WriteAllText($deployVersionPath, $deployId, (New-Object System.Text.UTF8Encoding($false)))

    $indexPath = Join-Path $repositoryRoot 'index.html'
    $indexContent = [System.IO.File]::ReadAllText($indexPath)
    $assetPattern = '(?i)(?<prefix>\b(?:href|src)\s*=\s*["''])(?<url>(?![a-z][a-z0-9+.-]*:|//|/|#|data:)[^"'']+\.(?:css|js)(?:\?[^"'']*)?(?:#[^"'']*)?)(?<suffix>["''])'
    $indexContent = [regex]::Replace($indexContent, $assetPattern, {
        param($match)

        $url = $match.Groups['url'].Value
        $fragment = ''
        $fragmentIndex = $url.IndexOf('#')
        if ($fragmentIndex -ge 0) {
            $fragment = $url.Substring($fragmentIndex)
            $url = $url.Substring(0, $fragmentIndex)
        }

        $queryIndex = $url.IndexOf('?')
        $path = $url
        $query = ''
        if ($queryIndex -ge 0) {
            $path = $url.Substring(0, $queryIndex)
            $query = $url.Substring($queryIndex + 1)
        }

        $parameters = New-Object System.Collections.Generic.List[string]
        if (-not [string]::IsNullOrWhiteSpace($query)) {
            foreach ($parameter in $query.Split('&')) {
                if ($parameter -notmatch '^(?i)(?:v|deploy)=') {
                    $parameters.Add($parameter)
                }
            }
        }
        $parameters.Add("v=$deployId")

        return $match.Groups['prefix'].Value + $path + '?' + ($parameters -join '&') + $fragment + $match.Groups['suffix'].Value
    })
    [System.IO.File]::WriteAllText($indexPath, $indexContent, (New-Object System.Text.UTF8Encoding($false)))

    Write-Host 'Alterações que serão publicadas:'
    Invoke-Git -Arguments @('diff', '--', 'index.html', 'deploy-version.txt', 'CNAME', 'AGENTS.md', 'publish-site.ps1')

    Invoke-Git -Arguments @('add', '-A')
    Invoke-Git -Arguments @('commit', '-m', $Message)
    $commit = (& git rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível obter o hash do commit criado.'
    }

    Invoke-Git -Arguments @('push', 'origin', 'main')
    Invoke-Git -Arguments @('fetch', 'origin')

    $localHead = (& git rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível obter o hash de HEAD.'
    }
    $remoteHead = (& git rev-parse origin/main).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível obter o hash de origin/main.'
    }
    if ($localHead -ne $remoteHead) {
        throw "Falha de confirmação do push: HEAD ($localHead) é diferente de origin/main ($remoteHead)."
    }

    $pagesBaseUrl = 'https://leaflight.com.br'
    $deadline = (Get-Date).AddMinutes(10)
    $published = $false
    Write-Host "Aguardando o GitHub Pages publicar o deploy $deployId..."

    while ((Get-Date) -lt $deadline) {
        $nonce = [guid]::NewGuid().ToString('N')
        $verificationUrl = "$pagesBaseUrl/deploy-version.txt?nocache=$nonce"
        try {
            $response = Invoke-WebRequest -Uri $verificationUrl -Headers @{
                'Cache-Control' = 'no-cache, no-store, must-revalidate'
                'Pragma'        = 'no-cache'
            } -UseBasicParsing -TimeoutSec 30

            if ($response.Content.Trim() -ceq $deployId) {
                $published = $true
                break
            }
        }
        catch {
            Write-Warning "GitHub Pages ainda não respondeu com a versão esperada: $($_.Exception.Message)"
        }

        Start-Sleep -Seconds 15
    }

    if (-not $published) {
        throw "Timeout: o GitHub Pages não publicou o identificador '$deployId' em aproximadamente 10 minutos."
    }

    $onlineUrl = "$pagesBaseUrl/?deploy=$deployId"
    Start-Process $onlineUrl

    Write-Host ''
    Write-Host 'PUBLICAÇÃO CONFIRMADA'
    Write-Host "Commit: $commit"
    Write-Host "Identificador: $deployId"
    Write-Host "HEAD = origin/main: $localHead"
    Write-Host "Endereço online: $onlineUrl"
}
catch {
    Write-Error "Falha na publicação: $($_.Exception.Message)"
    exit 1
}
