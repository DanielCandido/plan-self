# Backup e restauracao local

O backup operacional inclui o PostgreSQL e o volume de arquivos dos projetos. A aplicacao entra em uma breve janela de manutencao para manter os dois conjuntos consistentes; PostgreSQL, Redis e volumes nao sao removidos.

## Criar e verificar

```powershell
./scripts/backup.ps1
Get-FileHash ./backups/plan-self-backup-*.zip -Algorithm SHA256
```

O arquivo ZIP contem `database.dump`, `files.tar.gz` e um manifesto com checksums internos. Copie tambem o arquivo `.sha256` para a midia protegida. O `.env`, as chaves em `infrastructure/pki` e a CA privada devem ser guardados separadamente em cofre operacional.

## Restaurar

A restauracao substitui o banco e todo o conteudo de `/data/files`. Use apenas em janela de manutencao e mantenha o backup anterior.

```powershell
./scripts/restore.ps1 -BackupFile ./backups/plan-self-backup-20260830-120000.zip -ConfirmRestore
```

Sem `-ConfirmRestore` o script recusa a operacao. Depois, confirme `https://plan-self.home.arpa:8443/api/health/ready` e realize login e download de um arquivo de teste.

## Politica minima

- backup diario e antes de cada atualizacao;
- uma copia fora do servidor, em midia aprovada;
- teste trimestral de restauracao em ambiente separado;
- retencao sugerida: 7 diarios, 4 semanais e 6 mensais.
