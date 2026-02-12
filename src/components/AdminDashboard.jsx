import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, ArrowLeft, Users, ListCheck, GripVertical, Link as LinkIcon, Save, X } from 'lucide-react'
import { Reorder, useDragControls } from 'framer-motion'

// Componente para gerenciar funcionários
function EmployeesTab({ users, onAddUser, onRemoveUser, onUpdateUserStores }) {
    const [newUser, setNewUser] = useState('')

    const handleAdd = (e) => {
        e.preventDefault()
        if (newUser.trim()) {
            // Por padrão, adiciona em ambas as lojas
            onAddUser(newUser.trim(), ['248', '26'])
            setNewUser('')
        }
    }

    const handleToggleStore = (userName, storeId) => {
        const user = users.find(u => u.name === userName)
        if (!user) return

        const currentStores = user.stores || []
        const newStores = currentStores.includes(storeId)
            ? currentStores.filter(s => s !== storeId)
            : [...currentStores, storeId]

        onUpdateUserStores(userName, newStores)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Adicionar Funcionário</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <Input
                            placeholder="Nome do funcionário"
                            value={newUser}
                            onChange={(e) => setNewUser(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!newUser.trim()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider px-2">
                    Funcionários Cadastrados ({users.length})
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm divide-y dark:divide-gray-700">
                    {users.map((user) => (
                        <div key={user.name} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemoveUser(user.name)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex gap-4 ml-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`user-${user.name}-248`}
                                        checked={user.stores?.includes('248')}
                                        onCheckedChange={() => handleToggleStore(user.name, '248')}
                                    />
                                    <label
                                        htmlFor={`user-${user.name}-248`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        Loja 248
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`user-${user.name}-26`}
                                        checked={user.stores?.includes('26')}
                                        onCheckedChange={() => handleToggleStore(user.name, '26')}
                                    />
                                    <label
                                        htmlFor={`user-${user.name}-26`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        Loja 26
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Nenhum funcionário cadastrado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Item reordenável da lista com checkboxes de loja
function TaskItem({ task, index, onRemove, onEdit, onToggleStore }) {
    const controls = useDragControls()
    const [isEditing, setIsEditing] = useState(false)
    const [editedText, setEditedText] = useState(task.text || '')
    const [editedLink, setEditedLink] = useState(task.link || '')

    const handleSave = () => {
        if (editedText.trim()) {
            onEdit(index, {
                ...task,
                text: editedText.trim(),
                link: editedLink.trim()
            })
            setIsEditing(false)
        }
    }

    if (isEditing) {
        return (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                <Input
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    placeholder="Descrição da tarefa"
                    autoFocus
                />
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            value={editedLink}
                            onChange={(e) => setEditedLink(e.target.value)}
                            placeholder="URL opcional (ex: tutorial)"
                            className="pl-9"
                        />
                    </div>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Reorder.Item
            value={task}
            id={task.text + index}
            dragListener={false}
            dragControls={controls}
            className="flex flex-col p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-b last:border-b-0"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                        onPointerDown={(e) => controls.start(e)}
                    >
                        <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm block">
                            {task.text}
                        </span>
                        {task.link && (
                            <span className="text-xs text-blue-500 flex items-center gap-1 mt-0.5">
                                <LinkIcon className="h-3 w-3" /> Link anexo
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-gray-500 hover:text-blue-600"
                    >
                        Editar
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex gap-4 ml-9">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={`task-${index}-248`}
                        checked={task.stores?.includes('248')}
                        onCheckedChange={() => onToggleStore(index, '248')}
                    />
                    <label
                        htmlFor={`task-${index}-248`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        Loja 248
                    </label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={`task-${index}-26`}
                        checked={task.stores?.includes('26')}
                        onCheckedChange={() => onToggleStore(index, '26')}
                    />
                    <label
                        htmlFor={`task-${index}-26`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        Loja 26
                    </label>
                </div>
            </div>
        </Reorder.Item>
    )
}

// Componente para gerenciar tarefas
function TasksTab({ tasksConfig, onAddTask, onRemoveTask, onUpdateTasks, onUpdateTaskStores }) {
    const [selectedList, setSelectedList] = useState('abertura')
    const [selectedDay, setSelectedDay] = useState('default')
    const [newTask, setNewTask] = useState('')

    // Obter tarefas da configuração atual
    const currentTasks = tasksConfig[selectedList]?.[selectedDay] || []

    // Lista de dias da semana
    const days = [
        { value: 'default', label: 'Padrão (Todos os dias)' },
        { value: 'segunda-feira', label: 'Segunda-feira' },
        { value: 'terça-feira', label: 'Terça-feira' },
        { value: 'quarta-feira', label: 'Quarta-feira' },
        { value: 'quinta-feira', label: 'Quinta-feira' },
        { value: 'sexta-feira', label: 'Sexta-feira' },
        { value: 'sábado', label: 'Sábado' },
        { value: 'domingo', label: 'Domingo' }
    ]

    const handleAdd = (e) => {
        e.preventDefault()
        if (newTask.trim()) {
            onAddTask(selectedList, selectedDay, newTask.trim())
            setNewTask('')
        }
    }

    const handleReorder = (newOrder) => {
        onUpdateTasks(selectedList, selectedDay, newOrder)
    }

    const handleEdit = (index, updatedTask) => {
        const newTasks = [...currentTasks]
        newTasks[index] = updatedTask
        onUpdateTasks(selectedList, selectedDay, newTasks)
    }

    const handleToggleStore = (taskIndex, storeId) => {
        const task = currentTasks[taskIndex]
        if (!task) return

        const currentStores = task.stores || []
        const newStores = currentStores.includes(storeId)
            ? currentStores.filter(s => s !== storeId)
            : [...currentStores, storeId]

        onUpdateTaskStores(selectedList, selectedDay, taskIndex, newStores)
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Lista</label>
                    <Select value={selectedList} onValueChange={setSelectedList}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="abertura">Abertura</SelectItem>
                            <SelectItem value="fechamento">Fechamento</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dia da Semana</label>
                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {days.map(day => (
                                <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Adicionar Tarefa</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <Input
                            placeholder="Descrição da nova tarefa"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!newTask.trim()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider px-2">
                    Tarefas Atuais ({currentTasks.length})
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm max-h-[400px] overflow-y-auto">
                    {currentTasks.length > 0 ? (
                        <Reorder.Group axis="y" values={currentTasks} onReorder={handleReorder}>
                            {currentTasks.map((task, index) => (
                                <TaskItem
                                    key={task.text + index}
                                    task={task}
                                    index={index}
                                    onRemove={() => onRemoveTask(selectedList, selectedDay, index)}
                                    onEdit={handleEdit}
                                    onToggleStore={handleToggleStore}
                                />
                            ))}
                        </Reorder.Group>
                    ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            <ListCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma tarefa configurada para este dia.</p>
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-400 text-center pt-2">
                    Arraste os itens pelo ícone <GripVertical className="h-3 w-3 inline" /> para reordenar
                </p>
            </div>
        </div>
    )
}

export function AdminDashboard({
    users,
    tasksConfig,
    onAddUser,
    onRemoveUser,
    onUpdateUserStores,
    onAddTask,
    onRemoveTask,
    onUpdateTasks,
    onUpdateTaskStores,
    onBack
}) {
    return (
        <div className="checklist-container fade-in">
            <Card className="checklist-card w-full max-w-4xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Painel Administrativo
                        </CardTitle>
                        <p className="text-gray-600 dark:text-gray-400">Gerencie funcionários e tarefas de todas as lojas</p>
                    </div>
                    <Button variant="outline" onClick={onBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Sair
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs defaultValue="funcionarios" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="funcionarios" className="gap-2">
                                <Users className="h-4 w-4" />
                                Funcionários
                            </TabsTrigger>
                            <TabsTrigger value="tarefas" className="gap-2">
                                <ListCheck className="h-4 w-4" />
                                Tarefas
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="funcionarios" className="mt-0">
                            <EmployeesTab
                                users={users}
                                onAddUser={onAddUser}
                                onRemoveUser={onRemoveUser}
                                onUpdateUserStores={onUpdateUserStores}
                            />
                        </TabsContent>

                        <TabsContent value="tarefas" className="mt-0">
                            <TasksTab
                                tasksConfig={tasksConfig}
                                onAddTask={onAddTask}
                                onRemoveTask={onRemoveTask}
                                onUpdateTasks={onUpdateTasks}
                                onUpdateTaskStores={onUpdateTaskStores}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
