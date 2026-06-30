import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../utils/mockData';
import { KeyRound, Mail, Shield, UserCheck, Sparkles, Building2 } from 'lucide-react';
import { googleSignIn } from '../lib/firebase';

import hrpayLogo from '../assets/images/hrpay_pro_logo_1782570869903.jpg';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPerfil, setRegPerfil] = useState<UserRole>(UserRole.RH);

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        let existingUser = MOCK_USERS.find(u => u.email.toLowerCase() === result.user.email?.toLowerCase());
        if (!existingUser) {
          existingUser = {
            id: result.user.uid,
            nome: result.user.displayName || 'Google User',
            email: result.user.email || '',
            perfil: UserRole.ADMIN,
            createdAt: new Date().toISOString().split('T')[0]
          };
          MOCK_USERS.push(existingUser);
        }
        onLoginSuccess(existingUser);
      }
    } catch (err: any) {
      setError('Erro ao fazer login com o Google: ' + err.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Locate matching user by email
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      setError('Credenciais incorretas ou utilizador não cadastrado.');
      return;
    }

    // Password validation (all mock users use simplified format)
    const expectedPassword = 
      user.perfil === UserRole.ADMIN ? 'admin123' :
      user.perfil === UserRole.RH ? 'rh123' :
      user.perfil === UserRole.SUPERVISOR ? 'super123' : 'emp123';

    if (password !== expectedPassword) {
      setError('Palavra-passe inválida para esta conta de teste.');
      return;
    }

    onLoginSuccess(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regNome.trim() || !regEmail.trim()) {
      setError('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      nome: regNome,
      email: regEmail,
      perfil: regPerfil,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Add to mock collection
    MOCK_USERS.push(newUser);
    onLoginSuccess(newUser);
  };

  const fillCredentialsAndLogin = (mockEmail: string, role: string) => {
    setEmail(mockEmail);
    const pass = 
      role === 'Administrador' ? 'admin123' :
      role === 'RH' ? 'rh123' :
      role === 'Supervisor' ? 'super123' : 'emp123';
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="hrpay-login-screen">
      {/* Upper header decoration */}
      <header className="p-6 flex items-center justify-between border-b border-slate-100 bg-white">
        <div className="flex items-center space-x-3">
          <img src={hrpayLogo} alt="HRPay Pro Logo" className="h-10 w-auto rounded" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">HRPay Pro</h1>
            <p className="text-xs text-slate-500 font-medium">Gestão de RH e Processamento Salarial</p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400">Moçambique v1.0</div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          
          {/* Brand Presentation Section */}
          <div className="bg-emerald-950 p-10 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-emerald-950 opacity-90 z-0" />
            
            {/* Background design accents */}
            <div className="absolute top-1/4 -right-12 w-48 h-48 rounded-full bg-emerald-800/10 blur-xl pointer-events-none" />
            <div className="absolute bottom-1/4 -left-12 w-48 h-48 rounded-full bg-teal-800/20 blur-xl pointer-events-none" />

            <div className="z-10 flex justify-between items-center">
              <span className="font-bold tracking-widest text-xs uppercase text-emerald-400">Software de RH profissional</span>
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>

            <div className="my-12 z-10">
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-4">
                Gestão completa de salário, com precisão legal.
              </h2>
              <p className="text-emerald-200 text-sm leading-relaxed">
                Desenvolvido especificamente para as directrizes legais vigentes em Moçambique. Calcule automaticamente INSS (3% / 4%), IRPS progressivo, subsídios de alimentação, faltas, adiantamentos e emita folhas prontas para impressão oficial.
              </p>
            </div>

            <div className="text-xs text-emerald-300 z-10 border-t border-emerald-800/60 pt-4">
              <p>© 2026 HRPay Pro. Todos os direitos reservados.</p>
              <p className="mt-1">Moeda Oficial: Metical (MT)</p>
            </div>
          </div>

          {/* Form Processing Area */}
          <div className="p-10 flex flex-col justify-center">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 font-medium">
                {error}
              </div>
            )}

            {!registering ? (
              // Login Form
              <div id="login-form-area animate-fade-in">
                <span className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">Acesso à Plataforma</span>
                <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-6">Entre na sua Conta</h3>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Endereço de E-mail</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                        placeholder="nome@empresa.co.mz"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        id="login-email-input"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-slate-600">Palavra-passe</label>
                      <button 
                        type="button" 
                        onClick={() => alert(`A palavra-passe padrão para quem tem o e-mail: ${email || 'algum'} é associada ao seu perfil. Selecione abaixo algum perfil de teste para preencher os campos automaticamente.`)} 
                        className="text-[10px] text-emerald-600 hover:underline hover:text-emerald-700"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="password"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        id="login-password-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/10 transition-colors flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                    id="submit-login-button"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Iniciar Sessão</span>
                  </button>
                </form>

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                  <span className="relative bg-white px-2.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ou continue com</span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center space-x-2 mb-4"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Iniciar Sessão com Google</span>
                </button>

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                  <span className="relative bg-white px-2.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Novo Administrador</span>
                </div>

                <button
                  type="button"
                  onClick={() => setRegistering(true)}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold py-2 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Cadastrar Administrador / RH</span>
                </button>
              </div>
            ) : (
              // Register Form
              <div id="register-form-area animate-fade-in">
                <span className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">Nova Conta</span>
                <h3 className="text-2xl font-bold text-slate-800 mt-1 mb-6">Cadastre-se na Plataforma</h3>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      placeholder="Ex: João Tembe"
                      value={regNome}
                      onChange={e => setRegNome(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">E-mail Profissional</label>
                    <input
                      type="email"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      placeholder="Ex: joao@empresa.co.mz"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Perfil de Acesso</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      value={regPerfil}
                      onChange={e => setRegPerfil(e.target.value as UserRole)}
                    >
                      <option value={UserRole.ADMIN}>Administrador (Acesso Total)</option>
                      <option value={UserRole.RH}>Gestor de RH (Contratos, Assiduidade, Salários)</option>
                      <option value={UserRole.SUPERVISOR}>Supervisor (Assiduidade e Tarefas)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/10 transition-colors flex items-center justify-center space-x-2 mt-2"
                  >
                    <span>Concluir Cadastro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegistering(false)}
                    className="w-full text-slate-500 hover:text-slate-700 py-1 text-xs text-center block mt-3"
                  >
                    Já tem conta? Entrar
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Preset Fast Login Selectors - Incredibly helpful for testing */}
      <footer className="bg-slate-100 border-t border-slate-200 p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-slate-500 mb-3 tracking-wide uppercase text-center md:text-left">
            ⚡ Contas de Demonstração (Clique para selecionar perfil e preencher credenciais instantly)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { role: 'Administrador', email: 'admin@hrpay.co.mz', badge: 'Admin - Acesso Total', color: 'border-amber-200 hover:bg-amber-50 text-amber-900 bg-white' },
              { role: 'RH', email: 'rh@hrpay.co.mz', badge: 'RH - Contratos & Salários', color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-900 bg-white' },
              { role: 'Supervisor', email: 'supervisor@hrpay.co.mz', badge: 'Supervisor - Equipas', color: 'border-blue-200 hover:bg-blue-50 text-blue-900 bg-white' },
              { role: 'Funcionário', email: 'abel@hrpay.co.mz', badge: 'Funcionário - Painel Pessoal', color: 'border-purple-200 hover:bg-purple-50 text-purple-900 bg-white' }
            ].map(preset => (
              <button
                key={preset.role}
                type="button"
                onClick={() => fillCredentialsAndLogin(preset.email, preset.role)}
                className={`p-3 border rounded-xl text-left transition-all tracking-tight cursor-pointer ${preset.color}`}
              >
                <div className="font-bold text-xs">{preset.role}</div>
                <div className="text-[10px] break-all font-mono text-slate-500 mt-0.5">{preset.email}</div>
                <div className="text-[9px] px-1.5 py-0.5 inline-block rounded-md mt-2 font-semibold bg-slate-100 text-slate-600">
                  {preset.badge}
                </div>
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
