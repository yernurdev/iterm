import { useState } from 'react';
import axios from 'axios';
import { Database, Plus, UploadCloud } from 'lucide-react';
import { API_URL } from '../config';
import { t } from '../i18n';

const emptyTerm = { kz: '', ru: '', en: '', category: 'Фармацевтика', aliases: '', deprecated: '', notes: '' };

export default function Admin({ lang }) {
  const [term, setTerm] = useState(emptyTerm);
  const [file, setFile] = useState(null);
  const [replace, setReplace] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isKz = lang === 'kz';

  const update = (key, value) => setTerm((current) => ({ ...current, [key]: value }));

  const handleAddTerm = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post(`${API_URL}/terms/`, {
        ...term,
        en: term.en || null,
        aliases: splitList(term.aliases),
        deprecated: splitList(term.deprecated),
        notes: term.notes || null,
      });
      setTerm(emptyTerm);
      setMessage(isKz ? 'Термин сақталды' : 'Термин сохранен');
    } catch (err) {
      setMessage(err.response?.data?.detail || (isKz ? 'Сақтау қатесі' : 'Ошибка сохранения'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setMessage('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(`${API_URL}/terms/import`, form, { params: { replace } });
      setMessage(`${isKz ? 'Импорт аяқталды' : 'Импорт завершен'}: +${res.data.inserted}, обновлено ${res.data.updated}`);
      setFile(null);
    } catch (err) {
      setMessage(err.response?.data?.detail || (isKz ? 'Импорт қатесі' : 'Ошибка импорта'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell py-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase text-emerald-600">Admin Console</p>
        <h1 className="flex items-center gap-3 text-3xl font-black"><Database /> {t(lang, 'adminTitle')}</h1>
        <p className="mt-2 text-slate-600">{isKz ? 'MongoDB термин базасын қолмен және файлмен жаңарту.' : 'Ручное и массовое обновление базы терминов MongoDB.'}</p>
      </div>

      {message && <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 font-semibold text-slate-700">{message}</div>}

      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-black"><Plus size={20} /> {t(lang, 'addTerm')}</h2>
          <form onSubmit={handleAddTerm} className="grid gap-4 md:grid-cols-2">
            <label className="field"><span>Қазақша</span><input required value={term.kz} onChange={(e) => update('kz', e.target.value)} /></label>
            <label className="field"><span>Русский</span><input required value={term.ru} onChange={(e) => update('ru', e.target.value)} /></label>
            <label className="field"><span>English</span><input value={term.en} onChange={(e) => update('en', e.target.value)} /></label>
            <label className="field"><span>{t(lang, 'category')}</span><input value={term.category} onChange={(e) => update('category', e.target.value)} /></label>
            <label className="field md:col-span-2"><span>{isKz ? 'Балама атаулар (; арқылы)' : 'Алиасы через ;'}</span><input value={term.aliases} onChange={(e) => update('aliases', e.target.value)} /></label>
            <label className="field md:col-span-2"><span>{isKz ? 'Ескірген нұсқалар (; арқылы)' : 'Устаревшие варианты через ;'}</span><input value={term.deprecated} onChange={(e) => update('deprecated', e.target.value)} /></label>
            <label className="field md:col-span-2"><span>{isKz ? 'Ескерту' : 'Примечание'}</span><textarea rows="3" value={term.notes} onChange={(e) => update('notes', e.target.value)} /></label>
            <button className="btn btn-primary md:col-span-2" disabled={loading}>{loading ? '...' : t(lang, 'save')}</button>
          </form>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-black"><UploadCloud size={20} /> {t(lang, 'importTerms')}</h2>
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-slate-500">
            <UploadCloud className="mb-3 text-slate-400" size={34} />
            <span className="font-semibold">{file?.name || 'CSV / JSON / XLSX'}</span>
            <span className="mt-1 text-sm text-slate-500">{isKz ? 'Файл таңдаңыз' : 'Выберите файл'}</span>
            <input className="hidden" type="file" accept=".csv,.json,.xlsx" onChange={(event) => setFile(event.target.files?.[0])} />
          </label>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} />
            {isKz ? 'Алдымен базаны тазалау' : 'Сначала очистить базу'}
          </label>
          <button className="btn btn-ghost mt-4 w-full" disabled={!file || loading} onClick={handleImport}>
            {isKz ? 'Импорттау' : 'Импортировать'}
          </button>
        </aside>
      </div>
    </div>
  );
}

function splitList(value) {
  return value.split(';').map((item) => item.trim()).filter(Boolean);
}
