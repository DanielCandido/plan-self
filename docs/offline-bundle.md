# Bundle de instalacao offline

O bundle contem as imagens de todos os servicos, Compose sem etapas de build, configuracao de exemplo, Nginx, instaladores e geradores de certificado. Ele nao inclui o `.env`, certificados ou dados da instalacao que gerou a release.

## Criar uma release

Windows:

```powershell
./scripts/create-offline-bundle.ps1
```

Linux:

```bash
./scripts/create-offline-bundle.sh
```

Use `-SkipBuild` no PowerShell ou `SKIP_BUILD=true` no Linux somente quando as imagens locais ja tiverem sido construidas e validadas.

O resultado e gravado em `release/plan-self-offline-<versao>.tar`, acompanhado por um SHA-256.

## Transportar

Copie o arquivo TAR e o arquivo `.sha256` para uma midia aprovada. Verifique o checksum antes de extrair no servidor sem internet.

Windows:

```powershell
Get-FileHash ./plan-self-offline-0.1.0.tar -Algorithm SHA256
tar.exe -xf ./plan-self-offline-0.1.0.tar -C ./plan-self
```

Linux:

```bash
sha256sum -c plan-self-offline-0.1.0.tar.sha256
mkdir plan-self
tar -xf plan-self-offline-0.1.0.tar -C plan-self
```

## Instalar

Windows:

```powershell
cd plan-self
./scripts/install-offline.ps1 -Hostname plan-self.home.arpa -IpAddress 192.168.1.20
```

Linux:

```bash
cd plan-self
./scripts/install-offline.sh plan-self.home.arpa 192.168.1.20
```

Os instaladores carregam `images.tar`, geram novos secrets e certificados exclusivos da instalacao e iniciam o Compose com `--no-build`. Nenhuma chave ou segredo da maquina de release e transportado.

As portas externas padrao sao 8080 e 8443 para compatibilidade com Docker/Podman rootless. Em um engine rootful, informe 80 e 443 aos instaladores se desejar as portas padrao.

