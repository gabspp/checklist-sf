# Configuração do Webhook para n8n

## 📋 Instruções de Configuração

### 1. Obter URL do Webhook no n8n

1. Acesse seu n8n
2. Crie um novo workflow
3. Adicione um nó "Webhook"
4. Configure o método como "POST"
5. Copie a URL gerada

### 2. Configurar na Aplicação

Edite o arquivo `src/App.jsx` e localize a seção:

```javascript
const WEBHOOK_CONFIG = {
  url: 'https://webhook.site/your-webhook-url', // ← ALTERE AQUI
  timeout: 10000,
  retries: 3
}
```

Substitua `'https://webhook.site/your-webhook-url'` pela URL do seu webhook n8n.

### 3. Exemplo de URL
```javascript
const WEBHOOK_CONFIG = {
  url: 'https://seu-n8n.com/webhook/checklist-funcionarios',
  timeout: 10000,
  retries: 3
}
```

### 4. Rebuild e Deploy

Após alterar a URL:

```bash
# Rebuild da aplicação
pnpm run build

# Redeploy (se necessário)
# A aplicação atual está em: https://bsxgrpwd.manus.space
```

## 📊 Estrutura dos Dados Recebidos

O webhook receberá dados no seguinte formato:

```json
{
  "funcionario": "Maria",
  "tipo_lista": "Abertura",
  "data": "2024-12-25",
  "hora": "08:30",
  "dia_semana": "quarta-feira",
  "tarefas_concluidas": [
    "Verificar limpeza do ambiente",
    "Conferir estoque de materiais",
    "Testar equipamentos",
    "Verificar agenda do dia"
  ],
  "comentarios": "Tudo funcionando normalmente",
  "total_tarefas": 4,
  "timestamp": "2024-12-25T08:30:15.123Z"
}
```

## 🔧 Configuração no n8n

### Exemplo de Workflow n8n

1. **Webhook Node**: Recebe os dados
2. **Set Node**: Processa/formata os dados se necessário
3. **Database Node**: Salva no banco de dados
4. **Email Node**: Envia notificação (opcional)

### Exemplo de Processamento

```javascript
// No Set Node do n8n
return [
  {
    json: {
      id: Date.now(),
      funcionario: $json.funcionario,
      tipo: $json.tipo_lista,
      data_checklist: $json.data,
      hora_checklist: $json.hora,
      dia_semana: $json.dia_semana,
      tarefas: $json.tarefas_concluidas.join(', '),
      observacoes: $json.comentarios || '',
      total_tarefas: $json.total_tarefas,
      data_recebimento: new Date().toISOString()
    }
  }
];
```

## 🛡️ Segurança

### Validação Recomendada

No n8n, adicione validações:

```javascript
// Verificar se dados obrigatórios estão presentes
if (!$json.funcionario || !$json.tipo_lista || !$json.data) {
  throw new Error('Dados obrigatórios ausentes');
}

// Verificar funcionários válidos
const funcionariosValidos = ['Maria', 'Karla', 'Thamiris', 'Raíssa'];
if (!funcionariosValidos.includes($json.funcionario)) {
  throw new Error('Funcionário inválido');
}

// Verificar tipos válidos
const tiposValidos = ['Abertura', 'Fechamento'];
if (!tiposValidos.includes($json.tipo_lista)) {
  throw new Error('Tipo de lista inválido');
}
```

## 📈 Monitoramento

### Logs Recomendados

- Data/hora do recebimento
- Funcionário e tipo de checklist
- Número de tarefas concluídas
- Presença de comentários
- Status de processamento

### Alertas

Configure alertas para:
- Falhas no webhook
- Checklists não recebidos em horários esperados
- Tarefas incompletas frequentes

## 🔄 Backup e Recuperação

- Configure backup automático dos dados
- Mantenha logs de todas as requisições
- Implemente retry logic no n8n se necessário

---

**Nota**: Após configurar o webhook, teste enviando um checklist completo para verificar se os dados estão sendo recebidos corretamente.

