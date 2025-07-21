import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { CheckCircle, Users, ClipboardList, MessageSquare, Calendar, Send, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import './App.css'

// Configuração do webhook - pode ser alterada conforme necessário
const WEBHOOK_CONFIG = {
  url: 'https://n8n.gabrielpicanco.site/webhook/4925206b-8560-4390-9ec9-f2632c140fca', // Substitua pela URL real do n8n
  timeout: 10000, // 10 segundos
  retries: 3
}

// Definição das tarefas por tipo e dia
const TASKS_CONFIG = {
  abertura: {
    'segunda-feira': [
      '🗑️ organizar lixeiras',
      '☕ ligar máquina de café',
      '💧 encher galão d\'água',
      '💰 abrir caixa',
      '🧽 pegar perfex',
      '🍪 conferir crocantes',
      '🏪 montar vitrine de produtos',
      '📦 estoque coado P & G',
      '🔧 pegar porta filtros',
      '☕ colocar café na cuba',
      '🍫 montar caixas de barrinha',
      '🍯 montar colmeia de pães de mel',
      '❄️ tirar itens da geladeira',
      '☕ fazer café coado',
      '🎁 montar caixinhas de presente',
      '📦 montar caixinha de 3 do balcão',
      '🥤 repor água com e sem gás',
      '💧 encher reservas de água',
      '📱 verificar estoque ifood',
      '🍯 repor açúcar',
      '🏷️ fazer etiquetas de validade'
    ],
    default: [
      '🗑️ organizar lixeiras',
      '☕ ligar máquina de café',
      '💧 encher galão d\'água',
      '💰 abrir caixa',
      '🧽 pegar perfex',
      '🍪 conferir crocantes',
      '🏪 montar vitrine de produtos',
      '📦 estoque coado P & G',
      '🔧 pegar porta filtros',
      '☕ colocar café na cuba',
      '🍫 montar caixas de barrinha',
      '🍯 montar colmeia de pães de mel',
      '❄️ tirar itens da geladeira',
      '☕ fazer café coado',
      '🎁 montar caixinhas de presente',
      '📦 montar caixinha de 3 do balcão',
      '🥤 repor água com e sem gás',
      '💧 encher reservas de água',
      '📱 verificar estoque ifood',
      '🍯 repor açúcar',
      '🏷️ fazer etiquetas de validade'
    ]
  },
  fechamento: {
    'sábado': [
      '⚙️ desligar moinho e máquina de café',
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
      '🍯 guardar bolo de mel',
      '🧹 limpar grade máquina de café',
      '⚙️ desligar moinho de café limpar gaveta bate borra',
      '☕ desligar máquina de café',
      '❄️ desligar ar condicionado',
      '🌬️ desligar cortina de vento',
      '🗑️ tirar galão descarte',
      '❄️ guardar produtos na geladeira'
    ],
    default: [
      '⚙️ desligar moinho e máquina de café',
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
      '🍯 guardar bolo de mel',
      '🧹 limpar grade máquina de café',
      '⚙️ desligar moinho de café limpar gaveta bate borra',
      '☕ desligar máquina de café',
      '❄️ desligar ar condicionado',
      '🌬️ desligar cortina de vento',
      '🗑️ tirar galão descarte',
      '❄️ guardar produtos na geladeira'
    ]
  }
}

// Utilitários para localStorage
const STORAGE_KEY = 'checklist-progress'

const saveProgress = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Erro ao salvar progresso:', error)
  }
}

const loadProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Erro ao carregar progresso:', error)
    return null
  }
}

const clearProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Erro ao limpar progresso:', error)
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

// Função para obter tarefas baseadas no tipo e dia
const getTasks = (listType, dayOfWeek) => {
  const config = TASKS_CONFIG[listType]
  if (!config) return []
  
  const dayKey = dayOfWeek.toLowerCase()
  return config[dayKey] || config.default
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
function UserSelection({ onUserSelect }) {
  const users = ['Maria', 'Karla', 'Thamiris', 'Raíssa']
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
    <div className="checklist-container fade-in">
      <Card className="checklist-card">
        <CardHeader className="text-center space-y-4">
          <div className="bounce-in">
            <Users className="w-16 h-16 mx-auto text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Selecione o Funcionário
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
            <ClipboardList className="w-16 h-16 mx-auto text-blue-600" />
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
function ChecklistView({ user, listType, onComplete, onBack }) {
  const dayInfo = getCurrentDayInfo()
  const tasks = getTasks(listType, dayInfo.dayOfWeek)
  
  // Estado para tarefas completadas
  const [completedTasks, setCompletedTasks] = useState(new Set())
  
  // Carregar progresso salvo ao montar o componente
  useEffect(() => {
    const savedProgress = loadProgress()
    if (savedProgress && 
        savedProgress.user === user && 
        savedProgress.listType === listType &&
        savedProgress.date === dayInfo.date) {
      setCompletedTasks(new Set(savedProgress.completedTaskIndices))
    }
  }, [user, listType, dayInfo.date])
  
  // Salvar progresso sempre que houver mudanças
  useEffect(() => {
    const progressData = {
      user,
      listType,
      date: dayInfo.date,
      dayOfWeek: dayInfo.dayOfWeek,
      completedTaskIndices: Array.from(completedTasks),
      tasks,
      timestamp: new Date().toISOString()
    }
    saveProgress(progressData)
  }, [completedTasks, user, listType, dayInfo.date, dayInfo.dayOfWeek, tasks])
  
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
  
  return (
    <div className="checklist-container fade-in">
      <Card className="checklist-card">
        <CardHeader className="space-y-4">
          <CardTitle className="text-center text-2xl font-bold">
            {listType === 'abertura' ? '🌅 Abertura' : '🌙 Fechamento'}
          </CardTitle>
          <div className="text-center space-y-3">
            <p className="text-gray-600 text-lg font-medium">{user} • {dayInfo.dayOfWeek}</p>
            <div className="progress-card">
              <div className="text-center mb-3">
                <span className="text-4xl font-bold text-blue-600">
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
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={index}
                className={`task-item ${
                  completedTasks.has(index) ? 'task-item-complete' : 'task-item-incomplete'
                } slide-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => toggleTask(index)}
              >
                <div className={`task-checkbox ${
                  completedTasks.has(index) ? 'task-checkbox-complete' : 'task-checkbox-incomplete'
                }`}>
                  {completedTasks.has(index) && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className={`flex-1 text-left font-medium ${
                  completedTasks.has(index) 
                    ? 'line-through text-gray-500' 
                    : 'text-gray-900'
                }`}>
                  {task}
                </span>
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
function CompletionView({ user, listType, completedTasks, onSubmit, onBack }) {
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
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto bounce-in ${
            submitStatus === 'success' ? 'bg-green-100' : 
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
          <CardTitle className={`text-2xl font-bold ${
            submitStatus === 'error' ? 'text-red-700' : 'text-green-700'
          }`}>
            {submitStatus === 'success' ? '🎉 Enviado com Sucesso!' :
             submitStatus === 'error' ? '❌ Erro no Envio' :
             '✅ Checklist Concluído!'}
          </CardTitle>
          <div className="space-y-2">
            <p className="text-gray-600 text-lg font-medium">
              {user} • {listType === 'abertura' ? 'Abertura' : 'Fechamento'}
            </p>
            <p className="text-gray-500">
              {dayInfo.dayOfWeek} • {dayInfo.date} • {dayInfo.time}
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
              <p className="text-green-700">Checklist enviado e registrado no sistema.</p>
            </div>
          )}
          
          <div className="success-card">
            <h3 className="font-bold text-green-800 mb-3 text-lg">📋 Tarefas Realizadas:</h3>
            <ul className="space-y-2">
              {completedTasks.map((task, index) => (
                <li key={index} className="text-green-700 flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{task}</span>
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
              className="w-full p-4 border-2 border-gray-300 rounded-xl resize-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300"
              rows="4"
              placeholder="Adicione observações ou comentários sobre as tarefas realizadas..."
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
  const [currentView, setCurrentView] = useState('userSelection')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedList, setSelectedList] = useState('')
  const [completedTasks, setCompletedTasks] = useState([])
  
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
    // Limpar progresso salvo após envio bem-sucedido
    clearProgress()
    
    // Resetar aplicação
    setCurrentView('userSelection')
    setSelectedUser('')
    setSelectedList('')
    setCompletedTasks([])
  }
  
  const goBack = () => {
    switch (currentView) {
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
      {currentView === 'userSelection' && (
        <UserSelection onUserSelect={handleUserSelect} />
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
          listType={selectedList}
          onComplete={handleChecklistComplete}
          onBack={goBack}
        />
      )}
      {currentView === 'completion' && (
        <CompletionView
          user={selectedUser}
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

