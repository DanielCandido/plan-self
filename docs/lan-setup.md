# Instalacao em rede local com HTTPS

O Plan Self usa uma unica origem HTTPS para web, API e Socket.IO. O nome padrao e `plan-self.home.arpa`.

## 1. Escolha o endereco

Reserve um IP fixo para o servidor e crie no DNS da rede um registro apontando o hostname para esse IP. Exemplo:

```text
plan-self.home.arpa -> 192.168.1.20
```

Se a rede nao possuir DNS interno, configure temporariamente o arquivo hosts de cada cliente.

## 2. Gere a CA e o certificado

Windows:

```powershell
./scripts/generate-lan-cert.ps1 -Hostname plan-self.home.arpa -IpAddress 192.168.1.20
```

Linux:

```bash
./scripts/generate-lan-cert.sh plan-self.home.arpa 192.168.1.20
```

Os arquivos sao gravados em `infrastructure/pki` e nao sao versionados. Mantenha `root-ca.key` somente no servidor e em backup protegido.

## 3. Confie na CA local

Distribua apenas `infrastructure/pki/root-ca.crt`.

- Windows: importar em Computador Local > Autoridades de Certificacao Raiz Confiaveis.
- Linux: copiar para o diretorio de CAs da distribuicao e atualizar o trust store.
- Android: instalar como certificado de CA nas configuracoes de seguranca.
- iOS/iPadOS: instalar o perfil e habilitar confianca total em Ajustes > Geral > Sobre > Confianca do Certificado.

Dispositivos gerenciados devem receber a CA por politica corporativa. Nunca distribua `root-ca.key` ou `server.key`.

## 4. Inicie os servicos

Copie `.env.example` para `.env`, ajuste secrets e execute:

```bash
docker compose up -d --build
```

Acesse `https://plan-self.home.arpa`. A porta 80 apenas redireciona para HTTPS.

## Renovacao

Execute novamente o gerador com o mesmo hostname e IP e reinicie o Nginx. Uma nova CA tambem exige reinstalar `root-ca.crt` em todos os clientes; por isso, preserve a CA existente durante renovacoes normais do certificado do servidor.

