# Aplicação de Checklist de Funcionários

Uma aplicação web mobile-first para gestão de checklists de funcionários com sistema de tarefas baseado no dia da semana, interface intuitiva e integração via webhook.

## 🚀 Características

### ✨ Funcionalidades Principais
- **Seleção de Funcionários**: 4 funcionários pré-configurados (Maria, Karla, Thamiris, Raíssa)
- **Tipos de Checklist**: Abertura e Fechamento
- **Tarefas Dinâmicas**: Diferentes conjuntos de tarefas baseados no dia da semana
- **Progresso Visual**: Barra de progresso e contador de tarefas concluídas
- **Comentários**: Campo opcional para observações
- **Integração Webhook**: Envio automático para sistemas externos (n8n)

### 📱 Design Mobile-First
- Interface otimizada para smartphones
- Botões grandes e fáceis de tocar (mínimo 64px)
- Tipografia legível em telas pequenas
- Animações suaves e feedback visual
- Suporte a touch gestures

### 🔧 Recursos Técnicos
- **LocalStorage**: Salva progresso automaticamente
- **Conectividade**: Detecção de status online/offline
- **Retry Logic**: Tentativas automáticas em caso de falha
- **Validação**: Impede envio incompleto
- **Responsividade**: Funciona em todos os dispositivos

## 📋 Sistema de Tarefas

### Abertura
**Segunda-feira:**
- Verificar limpeza do ambiente
- Conferir estoque de materiais
- Testar equipamentos
- Preparar documentação semanal
- Verificar agenda do dia

**Outros dias:**
- Verificar limpeza do ambiente
- Conferir estoque de materiais
- Testar equipamentos
- Verificar agenda do dia

### Fechamento
**Sábado:**
- Organizar estoque
- Limpeza completa
- Relatório semanal
- Backup de dados
- Trancar todas as áreas

**Outros dias:**
- Organizar estoque
- Limpeza básica
- Verificar pendências
- Trancar todas as áreas

## 🔗 Integração Webhook

### Formato dos Dados Enviados
```json
{
  "funcionario": "Nome do atendente",
  "tipo_lista": "Abertura/Fechamento",
  "data": "YYYY-MM-DD",
  "hora": "HH:MM",
  "dia_semana": "Segunda/Terça/etc",
  "tarefas_concluidas": ["tarefa1", "tarefa2", ...],
  "comentarios": "Texto dos comentários",
  "total_tarefas": 10,
  "timestamp": "ISO 8601 timestamp"
}
```

### Configuração do Webhook
Para configurar o webhook, edite o arquivo `src/App.jsx` e altere a URL:

```javascript
const WEBHOOK_CONFIG = {
  url: 'https://sua-url-do-n8n.com/webhook/checklist', // Substitua pela URL real
  timeout: 10000, // 10 segundos
  retries: 3
}
```

## 🛠️ Instalação e Uso

### Pré-requisitos
- Node.js 18+ 
- pnpm (recomendado) ou npm

### Instalação
```bash
# Clone o repositório
git clone <url-do-repositorio>
cd checklist-app

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm run dev
```

### Build para Produção
```bash
# Gere o build otimizado
pnpm run build

# Visualize o build localmente
pnpm run preview
```

## 🎨 Tecnologias Utilizadas

- **React 18**: Framework principal
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Framework de estilos
- **shadcn/ui**: Componentes de UI
- **Lucide React**: Ícones
- **JavaScript**: Linguagem principal

## 📱 Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões modernas)
- **Dispositivos**: Smartphones, tablets, desktop
- **Sistemas**: iOS, Android, Windows, macOS, Linux

## 🔒 Recursos de Segurança

- Validação de dados no frontend
- Sanitização de inputs
- Timeout de requisições
- Retry com backoff exponencial
- Armazenamento local seguro

## 🚀 Deploy

A aplicação pode ser facilmente deployada em:
- Vercel
- Netlify
- GitHub Pages
- Qualquer servidor web estático

## 📞 Suporte

Para suporte técnico ou dúvidas sobre a implementação, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

---

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2024

