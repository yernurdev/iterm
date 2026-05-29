import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ lang, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const isKz = lang === 'kz';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, role);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || (isKz ? 'Қате пайда болды' : 'Произошла ошибка'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-600">Iterm ID</p>
            <h2 className="text-2xl font-black">{isLogin ? (isKz ? 'Жүйеге кіру' : 'Вход') : (isKz ? 'Тіркелу' : 'Регистрация')}</h2>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="field">
            <span>Email</span>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </label>
          <label className="field">
            <span>{isKz ? 'Құпиясөз' : 'Пароль'}</span>
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
          </label>
          {!isLogin && (
            <label className="field">
              <span>{isKz ? 'Рөл' : 'Роль'}</span>
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="user">{isKz ? 'Пайдаланушы' : 'Пользователь'}</option>
                <option value="admin">{isKz ? 'Әкімші' : 'Администратор'}</option>
              </select>
            </label>
          )}
          <button className="btn btn-primary w-full" type="submit">
            {isLogin ? (isKz ? 'Кіру' : 'Войти') : (isKz ? 'Аккаунт жасау' : 'Создать аккаунт')}
          </button>
        </form>

        <button className="mt-5 w-full text-sm font-semibold text-slate-600 hover:text-slate-950" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? (isKz ? 'Аккаунт жоқ па? Тіркелу' : 'Нет аккаунта? Зарегистрироваться') : (isKz ? 'Аккаунт бар ма? Кіру' : 'Уже есть аккаунт? Войти')}
        </button>
      </div>
    </div>
  );
}
