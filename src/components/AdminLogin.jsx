import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react'

export function AdminLogin({ onLogin, onBack }) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        // Hardcoded password for simplicity as per plan
        if (password === 'admin') {
            onLogin()
        } else {
            setError(true)
            setPassword('')
        }
    }

    return (
        <div className="checklist-container fade-in">
            <Card className="checklist-card max-w-sm mx-auto">
                <CardHeader className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto bounce-in dark:bg-gray-800">
                        <Lock className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        Área Administrativa
                    </CardTitle>
                    <p className="text-gray-600">Digite a senha para continuar</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError(false)
                                }}
                                className={`text-center text-lg ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                autoFocus
                            />
                            {error && (
                                <div className="flex items-center justify-center gap-2 text-red-500 text-sm animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Senha incorreta</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 space-y-3">
                            <Button
                                type="submit"
                                className="w-full bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                                Entrar
                            </Button>

                            <button
                                type="button"
                                onClick={onBack}
                                className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Voltar ao menu
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
