import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { CheckCircle, Users, ClipboardList, MessageSquare, Calendar, Send, AlertCircle, Wifi, WifiOff, Lock, Store, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { AdminLogin } from '@/components/AdminLogin.jsx'
import { AdminDashboard } from '@/components/AdminDashboard.jsx'
import { StoreSelection } from '@/components/StoreSelection.jsx'
import './App.css'

// Configuração do webhook - pode ser alterada conforme necessário
const WEBHOOK_CONFIG = {
  url: 'https://n8n.gabrielpicanco.site/webhook/4925206b-8560-4390-9ec9-f2632c140fca', // Substitua pela URL real do n8n
  timeout: 10000, // 10 segundos
  retries: 3
}

// Configuração padrão de tarefas
const COMMON_TASKS = {
  abertura: {
    'segunda-feira': [
      '🗑️ organizar lixeiras',
      '☕ ligar máquina de café',
      '💧 encher galão d\'água',
      '💰 abrir caixa',
      '💳 conferir bateria das máquinas de cartão',
      '🧽 pegar perfex',
      '🍪 conferir crocantes',
      '📋 conferir estoque itens takeat',
      '🏪 montar vitrine de produtos',
      '📦 estoque coado P & G',
      '🔧 pegar porta filtros',
      '☕ colocar café na cuba',
      '🍫 montar caixas de barrinha',
      '🍯 montar colmeia de pães de mel',
      '❄️ tirar itens da geladeira',
      '☕ fazer café coado',
      '🎁 montar caixinhas de presente',
      '🎁 montar caixinha de 3 do balcão',
      '🥤 repor água com e sem gás',
      '💧 encher reservas de água',
      '📱 verificar estoque ifood',
      '🍯 repor açúcar',
      '🏷️ fazer etiquetas de validade',
      '📆 fazer papel do mês'
    ],
    default: [
      '🗑️ organizar lixeiras',
      '☕ ligar máquina de café',
      '💧 encher galão d\'água',
      '💰 abrir caixa',
      '💳 conferir bateria das máquinas de cartão',
      '🧽 pegar perfex',
      '🍪 conferir crocantes',
      '📋 conferir estoque itens takeat',
      '🏪 montar vitrine de produtos',
      '📦 estoque coado P & G',
      '🔧 pegar porta filtros',
      '☕ colocar café na cuba',
      '🍫 montar caixas de barrinha',
      '🍯 montar colmeia de pães de mel',
      '❄️ tirar itens da geladeira',
      '☕ fazer café coado',
      '🎁 montar caixinhas de presente',
      '🎁 montar caixinha de 3 do balcão',
      '🥤 repor água com e sem gás',
      '💧 encher reservas de água',
      '📱 verificar estoque ifood',
      '🍯 repor açúcar',
      '🏷️ fazer etiquetas de validade',
      '📆 fazer papel do mês'
    ]
  },
  fechamento: {
    'sábado': [
      '❄️ guardar encomendas na geladeira',
      '🧼 lavar porta filtros',
      '🧹 limpar gaveta de borra de café',
      '✨ limpar bancada barista',
      '🛒 conferir itens no carrinho',
      '♻️ esvaziar cuba de café e moer descarte',
      '🪧 virar placa',
      '🫖 limpar garrafa térmica',
      '🔌 deixar maquininhas carregando',
      '☕ limpar máquina de café',
      '🗑️ tirar lixo do café',
      '🍰 atualizar encomendas de bolo no vidro',
      '📸 enviar foto estoque de pães de mel',
      '📝 cadastrar novos pedidos no NOTION',
      '💰 fechar caixa',
      '🔢 contar pães de mel',
      '📱 finalizar comandas no takeat',
      '🍯 guardar bolinho de mel',
      '🧹 limpar grade máquina de café',
      '⚙️ desligar moinho de café',
      '☕ limpar gaveta bate borra',
      '☕ desligar máquina de café',
      '❄️ desligar ar condicionado',
      '🌬️ desligar cortina de vento',
      '🗑️ tirar galão descarte',
      '❄️ guardar produtos na geladeira'
    ],
    default: [
      '❄️ guardar encomendas na geladeira',
      '🧼 lavar porta filtros',
      '🧹 limpar gaveta de borra de café',
      '✨ limpar bancada barista',
      '🛒 conferir itens no carrinho',
      '♻️ esvaziar cuba de café e moer descarte',
      '🪧 virar placa',
      '🫖 limpar garrafa térmica',
      '🔌 deixar maquininhas carregando',
      '☕ limpar máquina de café',
      '🗑️ tirar lixo do café',
      '🍰 atualizar encomendas de bolo no vidro',
      '📸 enviar foto estoque de pães de mel',
      '📝 cadastrar novos pedidos no NOTION',
      '💰 fechar caixa',
      '🔢 contar pães de mel',
      '📱 finalizar comandas no takeat',
      '🍯 guardar bolinho de mel',
      '🧹 limpar grade máquina de café',
      '⚙️ desligar moinho de café',
      '☕ limpar gaveta bate borra',
      '☕ desligar máquina de café',
      '❄️ desligar ar condicionado',
      '🌬️ desligar cortina de vento',
      '🗑️ tirar galão descarte',
      '❄️ guardar produtos na geladeira'
    ]
  }
}

// Nova estrutura unificada com checkboxes por loja
const DEFAULT_USERS = [
  { name: 'Maria', stores: ['248'] },
  { name: 'Karla', stores: ['248'] },
  { name: 'Thamiris', stores: ['26'] },
  { name: 'Raíssa', stores: ['26'] }
]

// Converte tarefas para formato com stores
const convertTasksToUnifiedFormat = (tasks) => {
  const result = {}
  for (const [listType, days] of Object.entries(tasks)) {
    result[listType] = {}
    for (const [day, taskList] of Object.entries(days)) {
      result[listType][day] = taskList.map(task => ({
        text: typeof task === 'string' ? task : task.text,
        link: typeof task === 'string' ? '' : (task.link || ''),
        stores: ['248', '26'] // Por padrão, todas as tarefas estão em ambas as lojas
      }))
    }
  }
  return result
}

const DEFAULT_TASKS = convertTasksToUnifiedFormat(COMMON_TASKS)

// Chaves do LocalStorage
const STORAGE_KEY_PROGRESS = 'checklist-progress'
const STORAGE_KEY_USERS = 'checklist-users-v2'
const STORAGE_KEY_TASKS = 'checklist-tasks-v2'

// Utilitários para localStorage
const saveProgress = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(data))
  } catch (error) {
    console.error('Erro ao salvar progresso:', error)
  }
}

const loadProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROGRESS)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Erro ao carregar progresso:', error)
    return null
  }
}

const clearProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_PROGRESS)
  } catch (error) {
    console.error('Erro ao limpar progresso:', error)
  }
}

// Funções para persistência de configuração
const saveConfig = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Erro ao salvar configuração (${key}):`, error)
  }
}

const loadConfig = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : defaultValue
  } catch (error) {
    console.error(`Erro ao carregar configuração (${key}):`, error)
    return defaultValue
  }
}

// Função para enviar dados via webhook
const sendWebhook = async (data, retryCount = 0) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.timeout)

    const response = await fetch(WEBHOOK_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error(`Tentativa ${retryCount + 1} falhou:`, error)

    if (retryCount < WEBHOOK_CONFIG.retries - 1) {
      // Aguardar antes de tentar novamente (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      return sendWebhook(data, retryCount + 1)
    }

    return {
      success: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message
    }
  }
}

// Função para verificar conectividade
const checkConnectivity = async () => {
  try {
    const response = await fetch('https://httpbin.org/get', {
      method: 'HEAD',
      mode: 'no-cors'
    })
    return true
  } catch {
    return navigator.onLine
  }
}

// Função para obter informações do dia atual
const getCurrentDayInfo = () => {
  const today = new Date()
  const dayOfWeek = today.toLocaleDateString('pt-BR', { weekday: 'long' })
  const date = today.toISOString().split('T')[0]
  const time = today.toTimeString().split(' ')[0].substring(0, 5)

  return { dayOfWeek, date, time }
}

// Componente de Seleção de Usuário
function UserSelection({ storeId, users, onUserSelect, onAdminClick, onBack }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="checklist-container fade-in relative">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" onClick={onBack} className="text-gray-500 hover:text-gray-700">
          ← Voltar
        </Button>
      </div>

      <Card className="checklist-card">
        <CardHeader className="text-center space-y-4">
          <div className="bounce-in">
            <Users className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Loja {storeId} - Funcionários
          </CardTitle>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">{getCurrentDayInfo().dayOfWeek}</span>
            </div>
            <div className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`}>
              {isOnline ? (
                <><Wifi className="w-4 h-4" /><span>Online</span></>
              ) : (
                <><WifiOff className="w-4 h-4" /><span>Offline</span></>
              )}
            </div>
          </div>
          {!isOnline && (
            <div className="error-card slide-up">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Sem conexão - dados serão salvos localmente
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {users.map((user, index) => (
            <button
              key={user}
              onClick={() => onUserSelect(user)}
              className="user-button slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {user}
            </button>
          ))}
          {users.length === 0 && (
            <div className="text-center p-4 text-gray-500">
              Nenhum funcionário cadastrado nesta loja.
              <br />
              Acesse a área administrativa para adicionar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de Seleção de Lista
function ListSelection({ user, onListSelect, onBack }) {
  const lists = [
    { id: 'abertura', name: 'Abertura', icon: '🌅', description: 'Checklist de início do expediente' },
    { id: 'fechamento', name: 'Fechamento', icon: '🌙', description: 'Checklist de fim do expediente' }
  ]

  return (
    <div className="checklist-container fade-in">
      <Card className="checklist-card">
        <CardHeader className="text-center space-y-4">
          <div className="bounce-in">
            <ClipboardList className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Olá, {user}!
          </CardTitle>
          <p className="text-gray-600 text-lg">Selecione o tipo de checklist</p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">{getCurrentDayInfo().dayOfWeek}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lists.map((list, index) => (
            <button
              key={list.id}
              onClick={() => onListSelect(list.id)}
              className="list-button slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{list.icon}</span>
                <div className="text-left">
                  <div className="font-bold text-xl">{list.name}</div>
                  <div className="text-gray-600 font-normal">{list.description}</div>
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={onBack}
            className="secondary-button mt-6"
          >
            Voltar
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de Checklist
function ChecklistView({ user, storeId, listType, tasksConfig, onComplete, onBack }) {
  const dayInfo = getCurrentDayInfo()

  // Lógica para obter tarefas filtradas por loja
  const getTasks = (type, dayOfWeek) => {
    const config = tasksConfig[type]
    if (!config) return []

    // Tenta encontrar pelo dia específico ou usa o default
    const dayKey = dayOfWeek.toLowerCase()
    const allTasks = config[dayKey] || config.default || []

    // Filtra tarefas ativas na loja atual
    return allTasks.filter(task => task.stores && task.stores.includes(storeId))
  }

  const tasks = getTasks(listType, dayInfo.dayOfWeek)

  // Estado para tarefas completadas
  const [completedTasks, setCompletedTasks] = useState(new Set())

  // Carregar progresso salvo ao montar o componente
  useEffect(() => {
    const savedProgress = loadProgress()
    if (savedProgress &&
      savedProgress.user === user &&
      savedProgress.storeId === storeId &&
      savedProgress.listType === listType &&
      savedProgress.date === dayInfo.date) {
      setCompletedTasks(new Set(savedProgress.completedTaskIndices))
    }
  }, [user, storeId, listType, dayInfo.date])

  // Salvar progresso sempre que houver mudanças
  useEffect(() => {
    const progressData = {
      user,
      storeId,
      listType,
      date: dayInfo.date,
      dayOfWeek: dayInfo.dayOfWeek,
      completedTaskIndices: Array.from(completedTasks),
      tasks, // Salva tarefas atuais para referência
      timestamp: new Date().toISOString()
    }
    saveProgress(progressData)
  }, [completedTasks, user, storeId, listType, dayInfo.date, dayInfo.dayOfWeek, tasks])

  const progress = completedTasks.size
  const total = tasks.length
  const isComplete = progress === total

  const toggleTask = (index) => {
    const newCompleted = new Set(completedTasks)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedTasks(newCompleted)
  }

  const handleComplete = () => {
    const completedTaskNames = tasks.filter((_, index) => completedTasks.has(index))
    onComplete(completedTaskNames)
  }

  // Renderiza tarefa (suporta string ou objeto se implementarmos edição avançada depois)
  const renderTaskContent = (task) => {
    if (typeof task === 'string') return task
    return (
      <div className="flex items-center gap-2">
        <span>{task.text}</span>
        {task.link && (
          <a
            href={task.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="checklist-container fade-in">
        <Card className="checklist-card">
          <CardHeader>
            <CardTitle className="text-center">Sem Tarefas</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Não há tarefas configuradas para {listType === 'abertura' ? 'Abertura' : 'Fechamento'} nesta loja ({storeId}) hoje.</p>
            <button onClick={onBack} className="secondary-button">Voltar</button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="checklist-container fade-in">
      <Card className="checklist-card">
        <CardHeader className="space-y-4">
          <CardTitle className="text-center text-2xl font-bold">
            {listType === 'abertura' ? '🌅 Abertura' : '🌙 Fechamento'}
          </CardTitle>
          <div className="text-center space-y-3">
            <p className="text-gray-600 text-lg font-medium">Loja {storeId} • {user}</p>
            <div className="progress-card">
              <div className="text-center mb-3">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {progress}/{total}
                </span>
                <p className="text-gray-600 font-medium">tarefas concluídas</p>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 task-grid-container">
            {tasks.map((task, index) => (
              <div
                key={index}
                className={`task-item ${completedTasks.has(index) ? 'task-item-complete' : 'task-item-incomplete'
                  } slide-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => toggleTask(index)}
              >
                <div className={`task-checkbox ${completedTasks.has(index) ? 'task-checkbox-complete' : 'task-checkbox-incomplete'
                  }`}>
                  {completedTasks.has(index) && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className={`text-left font-medium ${completedTasks.has(index)
                    ? 'line-through text-gray-500'
                    : 'text-gray-900'
                    }`}>
                    {renderTaskContent(task)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleComplete}
              className="primary-button"
              disabled={!isComplete}
            >
              {isComplete ? '✓ Finalizar Checklist' : `Faltam ${total - progress} tarefas`}
            </button>
            <button
              onClick={onBack}
              className="secondary-button"
            >
              Voltar
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de Finalização
function CompletionView({ user, storeId, listType, completedTasks, onSubmit, onBack }) {
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState('')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const dayInfo = getCurrentDayInfo()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitStatus(null)
    setErrorMessage('')

    try {
      // Verificar conectividade
      const isConnected = await checkConnectivity()

      if (!isConnected) {
        throw new Error('Sem conexão com a internet')
      }

      const webhookData = {
        loja: storeId,
        funcionario: user,
        tipo_lista: listType === 'abertura' ? 'Abertura' : 'Fechamento',
        data: dayInfo.date,
        hora: dayInfo.time,
        dia_semana: dayInfo.dayOfWeek,
        tarefas_concluidas: completedTasks,
        comentarios: comments.trim(),
        total_tarefas: completedTasks.length,
        timestamp: new Date().toISOString()
      }

      const result = await sendWebhook(webhookData)

      if (result.success) {
        setSubmitStatus('success')
        // Aguardar um pouco para mostrar o sucesso antes de continuar
        setTimeout(() => {
          onSubmit(comments)
        }, 2000)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao enviar checklist:', error)
      setSubmitStatus('error')
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="checklist-container fade-in">
      <Card className="checklist-card">
        <CardHeader className="text-center space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto bounce-in ${submitStatus === 'success' ? 'bg-green-100' :
            submitStatus === 'error' ? 'bg-red-100' : 'bg-green-100'
            }`}>
            {submitStatus === 'success' ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : submitStatus === 'error' ? (
              <AlertCircle className="w-10 h-10 text-red-600" />
            ) : (
              <CheckCircle className="w-10 h-10 text-green-600" />
            )}
          </div>
          <CardTitle className={`text-2xl font-bold ${submitStatus === 'error' ? 'text-red-700' : 'text-green-700'
            }`}>
            {submitStatus === 'success' ? '🎉 Enviado com Sucesso!' :
              submitStatus === 'error' ? '❌ Erro no Envio' :
                '✅ Checklist Concluído!'}
          </CardTitle>
          <div className="space-y-2">
            <p className="text-gray-600 text-lg font-medium">
              Loja {storeId} • {user}
            </p>
            <p className="text-gray-500">
              {listType === 'abertura' ? 'Abertura' : 'Fechamento'} • {dayInfo.dayOfWeek}
            </p>
            <div className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`}>
              {isOnline ? (
                <><Wifi className="w-4 h-4" /><span>Online</span></>
              ) : (
                <><WifiOff className="w-4 h-4" /><span>Offline</span></>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {submitStatus === 'error' && (
            <div className="error-card slide-up">
              <p className="text-red-800 font-bold mb-1">❌ Erro:</p>
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="success-card slide-up">
              <p className="text-green-800 font-bold mb-1">✅ Sucesso!</p>
              <p className="text-green-700">Checklist enviado.</p>
            </div>
          )}

          <div className="success-card">
            <h3 className="font-bold text-green-800 mb-3 text-lg">📋 Tarefas Realizadas:</h3>
            <ul className="space-y-2">
              {completedTasks.map((task, index) => (
                <li key={index} className="text-green-700 flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{task.text || task}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-lg font-bold mb-3 text-gray-800">
              💬 Comentários (opcional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-xl resize-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              rows="4"
              placeholder="Adicione observações ou comentários..."
              disabled={isSubmitting || submitStatus === 'success'}
            />
          </div>

          <div className="space-y-3">
            {submitStatus !== 'success' && (
              <button
                onClick={handleSubmit}
                className="primary-button flex items-center justify-center gap-3"
                disabled={isSubmitting || !isOnline}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Checklist
                  </>
                )}
              </button>
            )}

            <button
              onClick={onBack}
              className="secondary-button"
              disabled={isSubmitting}
            >
              {submitStatus === 'success' ? '🔄 Novo Checklist' : 'Voltar'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente Principal da Aplicação
function App() {
  const [currentView, setCurrentView] = useState('storeSelection') // Inicializa com seleção de loja
  const [currentStore, setCurrentStore] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedList, setSelectedList] = useState('')
  const [completedTasks, setCompletedTasks] = useState([])

  // Estado para dados configuráveis  
  const [users, setUsers] = useState(() => loadConfig(STORAGE_KEY_USERS, DEFAULT_USERS))
  const [tasksConfig, setTasksConfig] = useState(() => loadConfig(STORAGE_KEY_TASKS, DEFAULT_TASKS))

  // Funções de Gerenciamento de Dados
  const handleAddUser = (userName, selectedStores = ['248', '26']) => {
    const newUsers = [...users, { name: userName, stores: selectedStores }]
    setUsers(newUsers)
    saveConfig(STORAGE_KEY_USERS, newUsers)
  }

  const handleRemoveUser = (userName) => {
    const newUsers = users.filter(u => u.name !== userName)
    setUsers(newUsers)
    saveConfig(STORAGE_KEY_USERS, newUsers)
  }

  const handleUpdateUserStores = (userName, stores) => {
    const newUsers = users.map(u =>
      u.name === userName ? { ...u, stores } : u
    )
    setUsers(newUsers)
    saveConfig(STORAGE_KEY_USERS, newUsers)
  }

  const handleAddTask = (listType, day, taskDescription) => {
    const newConfig = { ...tasksConfig }

    if (!newConfig[listType]) newConfig[listType] = {}
    if (!newConfig[listType][day]) newConfig[listType][day] = []

    const newTask = {
      text: typeof taskDescription === 'string' ? taskDescription : taskDescription.text,
      link: typeof taskDescription === 'string' ? '' : (taskDescription.link || ''),
      stores: ['248', '26'] // Por padrão ativo em ambas
    }

    newConfig[listType][day] = [...newConfig[listType][day], newTask]
    setTasksConfig(newConfig)
    saveConfig(STORAGE_KEY_TASKS, newConfig)
  }

  const handleRemoveTask = (listType, day, taskIndex) => {
    const newConfig = { ...tasksConfig }

    if (newConfig[listType] && newConfig[listType][day]) {
      newConfig[listType][day] = newConfig[listType][day].filter((_, i) => i !== taskIndex)
      setTasksConfig(newConfig)
      saveConfig(STORAGE_KEY_TASKS, newConfig)
    }
  }

  const handleUpdateTasks = (listType, day, newTasks) => {
    const newConfig = { ...tasksConfig }

    if (!newConfig[listType]) newConfig[listType] = {}
    newConfig[listType][day] = newTasks

    setTasksConfig(newConfig)
    saveConfig(STORAGE_KEY_TASKS, newConfig)
  }

  const handleUpdateTaskStores = (listType, day, taskIndex, stores) => {
    const newConfig = { ...tasksConfig }

    if (newConfig[listType] && newConfig[listType][day] && newConfig[listType][day][taskIndex]) {
      newConfig[listType][day][taskIndex] = {
        ...newConfig[listType][day][taskIndex],
        stores
      }
      setTasksConfig(newConfig)
      saveConfig(STORAGE_KEY_TASKS, newConfig)
    }
  }

  const handleStoreSelect = (storeId) => {
    setCurrentStore(storeId)
    setCurrentView('userSelection')
  }

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setCurrentView('listSelection')
  }

  const handleListSelect = (listType) => {
    setSelectedList(listType)
    setCurrentView('checklist')
  }

  const handleChecklistComplete = (tasks) => {
    setCompletedTasks(tasks)
    setCurrentView('completion')
  }

  const handleSubmit = async (comments) => {
    clearProgress()
    // Retorna para seleção de usuário da mesma loja
    setCurrentView('userSelection')
    setSelectedUser('')
    setSelectedList('')
    setCompletedTasks([])
  }

  const goBack = () => {
    switch (currentView) {
      case 'userSelection':
        setCurrentView('storeSelection')
        setCurrentStore('')
        break
      case 'adminLogin':
        setCurrentView('storeSelection') // Volta para seleção de loja
        break
      case 'adminDashboard':
        setCurrentView('storeSelection') // Volta para seleção de loja
        break
      case 'listSelection':
        setCurrentView('userSelection')
        setSelectedUser('')
        break
      case 'checklist':
        setCurrentView('listSelection')
        setSelectedList('')
        break
      case 'completion':
        setCurrentView('checklist')
        setCompletedTasks([])
        break
    }
  }

  return (
    <div className="App">
      {currentView === 'storeSelection' && (
        <StoreSelection
          onStoreSelect={handleStoreSelect}
          onAdminClick={() => setCurrentView('adminLogin')}
        />
      )}

      {currentView === 'userSelection' && (
        <UserSelection
          storeId={currentStore}
          users={users.filter(u => u.stores.includes(currentStore)).map(u => u.name)}
          onUserSelect={handleUserSelect}
          onAdminClick={() => setCurrentView('adminLogin')}
          onBack={goBack}
        />
      )}

      {currentView === 'adminLogin' && (
        <AdminLogin
          onLogin={() => setCurrentView('adminDashboard')}
          onBack={goBack}
        />
      )}

      {currentView === 'adminDashboard' && (
        <AdminDashboard
          users={users}
          tasksConfig={tasksConfig}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
          onUpdateUserStores={handleUpdateUserStores}
          onAddTask={handleAddTask}
          onRemoveTask={handleRemoveTask}
          onUpdateTasks={handleUpdateTasks}
          onUpdateTaskStores={handleUpdateTaskStores}
          onBack={goBack}
        />
      )}

      {currentView === 'listSelection' && (
        <ListSelection
          user={selectedUser}
          onListSelect={handleListSelect}
          onBack={goBack}
        />
      )}
      {currentView === 'checklist' && (
        <ChecklistView
          user={selectedUser}
          storeId={currentStore}
          listType={selectedList}
          tasksConfig={tasksConfig}
          onComplete={handleChecklistComplete}
          onBack={goBack}
        />
      )}
      {currentView === 'completion' && (
        <CompletionView
          user={selectedUser}
          storeId={currentStore}
          listType={selectedList}
          completedTasks={completedTasks}
          onSubmit={handleSubmit}
          onBack={goBack}
        />
      )}
    </div>
  )
}

export default App
