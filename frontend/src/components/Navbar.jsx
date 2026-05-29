import { Link, NavLink } from 'react-router-dom';
import { Database, FileText, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

export default function Navbar({ lang, onLangChange, onLoginClick }) {
  const { user, logout } = useAuth();
  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-black tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-white">IT</span>
            <span>Iterm</span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/checker" className={linkClass}>
              <FileText size={17} /> {t(lang, 'navCheck')}
            </NavLink>
            <NavLink to="/dictionary" className={linkClass}>
              <Database size={17} /> {t(lang, 'navTerms')}
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={linkClass}>
                <Shield size={17} /> {t(lang, 'navAdmin')}
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="segmented">
            <button className={lang === 'kz' ? 'active' : ''} onClick={() => onLangChange('kz')}>KZ</button>
            <button className={lang === 'ru' ? 'active' : ''} onClick={() => onLangChange('ru')}>RU</button>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-48 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 sm:block">
                {user.email}
              </span>
              <button className="icon-btn" title={t(lang, 'logout')} onClick={logout}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={onLoginClick} className="btn btn-primary">
              <User size={18} /> {t(lang, 'login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
