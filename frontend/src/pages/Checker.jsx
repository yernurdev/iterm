import { useMemo, useState } from 'react';
import axios from 'axios';
import { AlertCircle, AlertTriangle, CheckCircle2, Download, FileUp, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';
import { t } from '../i18n';

const sample = 'Абсорбция және абсолютная биологическая доступность мәтінде бірге қолданылды.';

export default function Checker({ lang }) {
  const [text, setText] = useState(sample);
  const [language, setLanguage] = useState('kz');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const stats = useMemo(() => results?.stats || {}, [results]);
  const quality = stats.quality ?? 0;

  const counters = useMemo(() => [
    [t(lang, 'correct'), stats.correct || 0, 'text-emerald-700', <CheckCircle2 size={17} />],
    [t(lang, 'warnings'), stats.warnings || 0, 'text-amber-700', <AlertTriangle size={17} />],
    [t(lang, 'errors'), stats.errors || 0, 'text-red-700', <AlertCircle size={17} />],
    [t(lang, 'mixed'), stats.mixed_lang || 0, 'text-blue-700', <AlertCircle size={17} />],
  ], [lang, stats]);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/check/text`, { text, language });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || (lang === 'kz' ? 'Талдау қатесі' : 'Ошибка анализа'));
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('language', language);
    try {
      const res = await axios.post(`${API_URL}/check/file`, form);
      setResults(res.data);
      setText(`${file.name}\n\n${lang === 'kz' ? 'Файл серверде талданды.' : 'Файл проанализирован на сервере.'}`);
    } catch (err) {
      setError(err.response?.data?.detail || (lang === 'kz' ? 'Файл оқылмады' : 'Файл не прочитан'));
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format) => {
    const res = await axios.post(`${API_URL}/check/report/${format}`, { text, language }, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iterm-report.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-shell py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-600">Iterm Analyze</p>
          <h1 className="text-3xl font-black">{t(lang, 'checkerTitle')}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={language} onChange={(event) => setLanguage(event.target.value)} className="control">
            <option value="kz">Қазақша</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="mix">Mixed</option>
          </select>
          <button className="btn btn-primary" onClick={handleCheck} disabled={loading || !text.trim()}>
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {loading ? t(lang, 'analyzing') : t(lang, 'analyze')}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-h-[460px] w-full resize-y rounded-t-lg p-5 text-base leading-8 outline-none"
            placeholder={t(lang, 'pasteText')}
          />
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-slate-500">
              <FileUp size={18} /> {t(lang, 'drag')}
              <input className="hidden" type="file" accept=".txt,.docx,.pdf" onChange={handleFile} />
            </label>
            <span className="text-sm text-slate-500">{stats.words ? `${stats.words} ${lang === 'kz' ? 'сөз' : 'слов'}` : 'TXT / DOCX / PDF'}</span>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">{t(lang, 'result')}</h2>
              <div className="text-right">
                <div className="text-3xl font-black text-emerald-700">{quality}%</div>
                <div className="text-xs font-semibold text-slate-500">{t(lang, 'quality')}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {counters.map(([label, value, color, icon]) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={label}>
                  <div className={`flex items-center gap-2 text-xl font-black ${color}`}>{icon}{value}</div>
                  <div className="text-xs font-semibold text-slate-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-ghost flex-1" disabled={!results} onClick={() => downloadReport('pdf')}>
                <Download size={17} /> {t(lang, 'downloadPdf')}
              </button>
              <button className="btn btn-ghost flex-1" disabled={!results} onClick={() => downloadReport('docx')}>
                <Download size={17} /> {t(lang, 'downloadDocx')}
              </button>
            </div>
          </section>

          <section className="max-h-[510px] overflow-auto rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-lg leading-8">
              {results ? results.results.map((item, index) => (
                <ResultToken item={item} key={`${item.original}-${index}`} />
              )) : (
                <p className="text-slate-500">{lang === 'kz' ? 'Нәтиже осы жерде түспен көрсетіледі.' : 'Цветовая разметка результата появится здесь.'}</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ResultToken({ item }) {
  if (item.status === 'neutral') return <span>{item.original} </span>;
  return (
    <span className={`result-token status-${item.status}`}>
      {item.original}
      <span className="tooltip">
        <b>{item.reason}</b>
        {item.suggestion && <small>Рекомендация: {item.suggestion}</small>}
      </span>
    </span>
  );
}
