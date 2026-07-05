import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useAppStore } from '../store/db';
import DespachaLogo from '../components/DespachaLogo';

interface AuthProps {
  mode: 'login' | 'register';
}

const Auth = ({ mode }: AuthProps) => {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { login, registerUser } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (isLogin) {
      const user = await login(email, password);
      if (!user) {
        setError('E-mail ou senha incorretos.');
        return;
      }
      if (user.role === 'superAdmin') navigate('/superadmin');
      else if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'delivery') navigate('/delivery');
      else navigate('/client');
      return;
    }

    try {
      await registerUser(name, email, password);
      navigate('/admin');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao registrar. Tente novamente.');
    }
  };

  return (
    <main className="screen center-screen">
      <section className="surface auth-card stack">
        <div className="auth-brand">
          <DespachaLogo />
          <span>Área do lojista</span>
        </div>
        <div className="center-text stack compact">
          <div className="round-icon">{isLogin ? <Lock /> : <User />}</div>
          <h1>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h1>
          <p className="muted">{isLogin ? 'Faça login para continuar' : 'Comece a usar agora mesmo'}</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form className="stack" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              className="input-field"
              placeholder="Nome completo"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          )}
          <input
            className="input-field"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="input-field"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit">{isLogin ? 'Entrar' : 'Registrar'}</button>
        </form>

        <p className="muted center-text">
          {isLogin ? (
            <>Não tem uma conta? <Link to="/register">Registre-se</Link></>
          ) : (
            <>Já tem uma conta? <Link to="/login">Faça login</Link></>
          )}
        </p>
      </section>
    </main>
  );
};

export default Auth;
