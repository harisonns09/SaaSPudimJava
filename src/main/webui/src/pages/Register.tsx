import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
    const [storeName, setStoreName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const session = await api.register(email, password, storeName);
            login(session);
            navigate('/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Crie sua loja">
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="storeName" className="block text-sm font-medium text-[#5C4A3E]">
                        Nome da sua confeitaria
                    </label>
                    <input
                        id="storeName"
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="mt-1 block w-full rounded-lg border-[#EAE1D5] bg-[#FAF7F2] px-3 py-2 text-sm text-[#291D16] shadow-sm transition-colors focus:border-[#D97706] focus:ring-[#D97706] disabled:opacity-50"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#5C4A3E]">
                        Seu e-mail de acesso
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="mt-1 block w-full rounded-lg border-[#EAE1D5] bg-[#FAF7F2] px-3 py-2 text-sm text-[#291D16] shadow-sm transition-colors focus:border-[#D97706] focus:ring-[#D97706] disabled:opacity-50"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#5C4A3E]">
                        Crie uma senha
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={isLoading}
                        className="mt-1 block w-full rounded-lg border-[#EAE1D5] bg-[#FAF7F2] px-3 py-2 text-sm text-[#291D16] shadow-sm transition-colors focus:border-[#D97706] focus:ring-[#D97706] disabled:opacity-50"
                    />
                </div>

                {error && (
                    <p className="text-center text-sm text-red-600">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-lg bg-[#B45309] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#92400E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45309] disabled:opacity-50"
                >
                    {isLoading ? 'Criando sua loja...' : 'Criar minha loja grátis'}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-[#7A6658]">
                Já tem uma conta?{' '}
                <Link to="/login" className="font-semibold text-[#B45309] hover:text-[#92400E]">
                    Faça login
                </Link>
            </p>
        </AuthLayout>
    );
}
