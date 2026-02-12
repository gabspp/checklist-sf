import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Store, ShoppingBag, Lock } from 'lucide-react'

export function StoreSelection({ onStoreSelect, onAdminClick }) {
    return (
        <div className="checklist-container fade-in relative">
            <button
                onClick={onAdminClick}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
                title="Área Administrativa"
            >
                <Lock className="w-6 h-6" />
            </button>

            <Card className="checklist-card">
                <CardHeader className="text-center space-y-4">
                    <div className="bounce-in">
                        <Store className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Selecione a Loja
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400">
                        Escolha uma unidade para acessar
                    </p>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <button
                        onClick={() => onStoreSelect('248')}
                        className="group relative flex items-center p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-300 slide-up"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                Loja 248
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Acessar checklists da unidade 248
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => onStoreSelect('26')}
                        className="group relative flex items-center p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-300 slide-up"
                        style={{ animationDelay: '0.2s' }}
                    >
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                Loja 26
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Acessar checklists da unidade 26
                            </p>
                        </div>
                    </button>
                </CardContent>
            </Card>
        </div>
    )
}
