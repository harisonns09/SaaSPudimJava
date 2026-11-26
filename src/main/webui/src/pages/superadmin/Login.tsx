import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { api, clearSession, isSuperAdminToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function SuperAdminLoginPage() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login: setAuthSession } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const session = await api.login(login, password);
            if (!isSuperAdminToken(session.token)) {
                clearSession();
                setError('Esta conta não tem acesso ao painel do superadmin.');
                return;
            }
            setAuthSession(session);
            navigate('/superadmin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        'mt-1 block w-full rounded-lg border-[#EAE1D5] bg-[#FAF7F2] px-3 py-2 text-sm text-[#291D16] shadow-sm transition-colors focus:border-[#D97706] focus:ring-[#D97706] disabled:opacity-50';

    return (
        <AuthLayout title="Painel do superadmin">
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="login" className="block text-sm font-medium text-[#5C4A3E]">
                        Login
                    </label>
                    <input
                        id="login"
                        type="text"
                        autoComplete="username"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                        disabled={isLoading}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#5C4A3E]">
                        Senha
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className={inputClass}
                    />
                </div>

                {error && <p className="text-center text-sm text-red-600">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-lg bg-[#B45309] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#92400E] disabled:opacity-50"
                >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </AuthLayout>
    );
}
