/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { API_URL } from '../config';
import { t } from '../i18n';

export default function Dictionary({ lang }) {
  const [terms, setTerms] = useState([]);
  const [stats, setStats] = useState({ categories: [] });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = useMemo(() => stats.categories || [], [stats]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/terms/stats`);
      setStats(res.data);
    } catch {
      setStats({ total: 0, with_english: 0, categories: [] });
    }
  }, []);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/terms/`, { params: { limit: 200, search, category: category || undefined } });
      setTerms(res.data);
    } catch {
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchStats();
    fetchTerms();
  }, [fetchStats, fetchTerms]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTerms(), 250);
    return () => clearTimeout(timer);
  }, [fetchTerms]);

  return (
    <div className="page-shell py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-600">Terminology DB</p>
          <h1 className="text-3xl font-black">{t(lang, 'termsTitle')}</h1>
          <p className="mt-2 text-slate-600">{lang === 'kz' ? 'Үш тілдегі эталон терминдер және балама атаулар.' : 'Эталонные термины на трех языках и дополнительные варианты.'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Stat label={lang === 'kz' ? 'Барлығы' : 'Всего'} value={stats.total || 0} />
          <Stat label="English" value={stats.with_english || 0} />
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_260px]">
        <label className="field mb-0">
          <span>{t(lang, 'search')}</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} />
            <input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="абсорбция, сіңіру, absorption" />
          </div>
        </label>
        <label className="field mb-0">
          <span>{t(lang, 'category')}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{t(lang, 'allCategories')}</option>
            {categories.map((item) => <option key={item._id || 'none'} value={item._id || ''}>{item._id || '—'} ({item.count})</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Қазақша</th>
                <th className="px-4 py-3">Русский</th>
                <th className="px-4 py-3">English</th>
                <th className="px-4 py-3">{t(lang, 'category')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-4 py-8 text-center text-slate-500" colSpan="4">Loading...</td></tr>
              ) : terms.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-slate-500" colSpan="4">{lang === 'kz' ? 'Ештеңе табылмады' : 'Ничего не найдено'}</td></tr>
              ) : terms.map((term) => (
                <tr className="hover:bg-slate-50" key={term._id}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{term.kz}</td>
                  <td className="px-4 py-3 text-slate-700">{term.ru}</td>
                  <td className="px-4 py-3 text-slate-600">{term.en || '—'}</td>
                  <td className="px-4 py-3"><span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{term.category || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
}
