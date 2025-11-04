# Backup Automático do Banco de Dados

## Configuração Implementada

O sistema agora possui backup automático do banco de dados configurado para executar **todos os dias às 2h da manhã**.

### Características

- ✅ **Backup Diário Automático**: Executa às 2h da manhã
- ✅ **Retenção de 30 dias**: Mantém os últimos 30 backups
- ✅ **Limpeza Automática**: Remove backups antigos automaticamente
- ✅ **API REST**: Endpoints para criar e listar backups manualmente

### Arquivos Criados

1. `src/modules/backup/backup.service.ts` - Serviço de backup
2. `src/modules/backup/backup.controller.ts` - Controller REST
3. `src/modules/backup/backup.module.ts` - Módulo NestJS

### Instalação

Execute no diretório `backend`:

```bash
npm install
```

Isso instalará a dependência `@nestjs/schedule` necessária para os cron jobs.

### Endpoints da API

#### Criar Backup Manual (apenas ADMIN)
```
POST /backup
Authorization: Bearer <token>
```

#### Listar Backups (ADMIN e MANAGER)
```
GET /backup
Authorization: Bearer <token>
```

### Localização dos Backups

Os backups são salvos em: `backend/backups/`

Formato do nome: `backup_YYYY-MM-DDTHH-MM-SS.db`

### Como Funciona

1. **Automático**: Todo dia às 2h da manhã, o sistema cria um backup
2. **Manual**: Administradores podem criar backups via API
3. **Limpeza**: Backups com mais de 30 dias são removidos automaticamente
4. **Logs**: Todas as operações são registradas no console

### Restaurar um Backup

Para restaurar um backup:

1. Pare o servidor backend
2. Copie o arquivo de backup desejado
3. Substitua o arquivo `backend/prisma/dev.db`
4. Reinicie o servidor

```bash
# Exemplo (Windows)
copy backups\backup_2024-01-15T02-00-00.db prisma\dev.db
```

### Monitoramento

Verifique os logs do servidor para confirmar que os backups estão sendo executados:

```
[BackupService] Iniciando backup automático diário...
[BackupService] Backup criado: backup_2024-01-15T02-00-00.db
[BackupService] Backup automático concluído com sucesso!
```
