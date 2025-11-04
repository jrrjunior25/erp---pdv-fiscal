import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import type { User } from '@types';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LOGIN_ATTEMPTS_KEY = 'pdv-login-attempts';
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 60;

interface LoginAttemptInfo {
    count: number;
    lockoutUntil: number | null; // Store as timestamp
}

const getLoginAttempts = (): Record<string, LoginAttemptInfo> => {
    try {
        const attempts = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
        return attempts ? JSON.parse(attempts) : {};
    } catch {
        return {};
    }
};

const recordFailedAttempt = (email: string) => {
    const attempts = getLoginAttempts();
    const currentAttempt = attempts[email] || { count: 0, lockoutUntil: null };
    currentAttempt.count += 1;
    if (currentAttempt.count >= MAX_LOGIN_ATTEMPTS) {
        currentAttempt.lockoutUntil = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
    }
    attempts[email] = currentAttempt;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
};

const clearLoginAttempts = (email: string) => {
    const attempts = getLoginAttempts();
    if (attempts[email]) {
        delete attempts[email];
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    }
};


const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState<number | null>(null);

    const validate = useCallback(() => {
        const errors: { email?: string; password?: string } = {};
        if (!email) {
            errors.email = 'O email é obrigatório.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'O formato do email é inválido.';
        }
        if (!password) {
            errors.password = 'A senha é obrigatória.';
        } else if (password.length < 6) {
            errors.password = 'A senha deve ter no mínimo 6 caracteres.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [email, password]);

    useEffect(() => {
        validate();
    }, [email, password, validate]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (lockoutTimeRemaining !== null && lockoutTimeRemaining > 0) {
            timer = setTimeout(() => {
                setLockoutTimeRemaining(lockoutTimeRemaining - 1);
            }, 1000);
        } else if (lockoutTimeRemaining === 0) {
            setLockoutTimeRemaining(null);
            setLoginError(null);
            clearLoginAttempts(email.toLowerCase());
        }
        return () => clearTimeout(timer);
    }, [lockoutTimeRemaining, email]);

    const checkLockout = useCallback(() => {
        const attempts = getLoginAttempts();
        const info = attempts[email.toLowerCase()];
        if (info?.lockoutUntil && info.lockoutUntil > Date.now()) {
            const remaining = Math.ceil((info.lockoutUntil - Date.now()) / 1000);
            setLockoutTimeRemaining(remaining);
            setLoginError(`Muitas tentativas falhas. Tente novamente em ${remaining} segundos.`);
            return true;
        }
        return false;
    }, [email]);

    useEffect(() => {
        if(email) checkLockout();
    }, [email, checkLockout]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);

        if (!validate()) return;
        if (checkLockout()) return;

        setIsLoading(true);
        try {
            const user = await login(email, password);
            clearLoginAttempts(email.toLowerCase());
            onLogin(user);
        } catch (error) {
            recordFailedAttempt(email.toLowerCase());
            const errorMessage = (error as any)?.message || 'Credenciais inválidas ou usuário inativo.';
            setLoginError(errorMessage);
            checkLockout();
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = Object.keys(formErrors).length === 0;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMzI3MmEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTEwIDBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTEwIDBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            
            <div className="relative w-full max-w-md mx-4">
                <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-10 text-center">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">ERP + PDV Fiscal</h2>
                        <p className="text-blue-100 text-sm">Sistema de Gestão Empresarial</p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`block w-full pl-10 pr-3 py-3 border bg-gray-900/50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${formErrors.email ? 'border-red-500' : 'border-gray-700'}`}
                                        placeholder="seu@email.com"
                                    />
                                </div>
                                {formErrors.email && <p className="mt-2 text-xs text-red-400">{formErrors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="password-for-ui" className="block text-sm font-medium text-gray-300 mb-2">
                                    Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password-for-ui"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`block w-full pl-10 pr-3 py-3 border bg-gray-900/50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${formErrors.password ? 'border-red-500' : 'border-gray-700'}`}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {formErrors.password && <p className="mt-2 text-xs text-red-400">{formErrors.password}</p>}
                            </div>

                            {loginError && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm text-red-400">{loginError}</p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !isFormValid || lockoutTimeRemaining !== null}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner />
                                        <span className="ml-2">Entrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Entrar no Sistema
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-gray-900/50 border-t border-gray-700/50">
                        <div className="flex items-center justify-center text-xs text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Conexão segura e criptografada
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <p className="text-center text-xs text-gray-600 mt-6">
                    © 2024 ERP + PDV Fiscal. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
};

export default Login;