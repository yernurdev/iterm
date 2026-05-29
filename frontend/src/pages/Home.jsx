import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Database, FileText, Languages, ShieldCheck } from 'lucide-react';
import { t } from '../i18n';

export default function Home({ lang }) {
  const metrics = [
    ['3', lang === 'kz' ? 'тіл' : 'языка'],
    ['PDF/DOCX/TXT', lang === 'kz' ? 'форматтар' : 'форматы'],
    ['MongoDB', lang === 'kz' ? 'термин базасы' : 'база терминов'],
  ];

  return (
    <div>
      <section className="border-b border-slate-200 bg-white">
        <div className="page-shell grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <ShieldCheck size={16} /> {lang === 'kz' ? 'Ғылыми мәтіндерге арналған' : 'Для научных и редакторских текстов'}
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-normal text-slate-950 md:text-6xl">
              {t(lang, 'heroTitle')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{t(lang, 'heroText')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/checker" className="btn btn-primary">
                <FileText size={19} /> {t(lang, 'start')} <ArrowRight size={18} />
              </Link>
              <Link to="/dictionary" className="btn btn-ghost">
                <Database size={19} /> {t(lang, 'openBase')}
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {metrics.map(([value, label]) => (
                <div key={value} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xl font-black">{value}</div>
                  <div className="text-sm text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{lang === 'kz' ? 'Талдау үлгісі' : 'Пример анализа'}</p>
                  <h2 className="text-xl font-black">{lang === 'kz' ? 'Терминологиялық карта' : 'Терминологическая карта'}</h2>
                </div>
                <Activity className="text-emerald-600" />
              </div>
              <div className="space-y-3 text-sm leading-7">
                <p>
                  <mark className="status-green">абсорбция</mark> және <mark className="status-yellow">биодоступность</mark> терминдері
                  <mark className="status-blue"> қазақша мәтінде</mark> салыстырылады.
                </p>
                <p>
                  <mark className="status-red">ескірген атау</mark> табылса, жүйе эталон нұсқасын ұсынады.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat label={t(lang, 'quality')} value="88%" tone="emerald" />
                <MiniStat label={t(lang, 'warnings')} value="4" tone="amber" />
                <MiniStat label={t(lang, 'errors')} value="2" tone="red" />
                <MiniStat label={t(lang, 'mixed')} value="1" tone="blue" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-4 py-10 md:grid-cols-3">
        <Feature icon={<Languages />} title={lang === 'kz' ? 'Екі тілді интерфейс' : 'Двуязычный интерфейс'} text={lang === 'kz' ? 'Қазақша негізгі режим және орысша толық локализация.' : 'Казахский как основной режим и полноценная русская локализация.'} />
        <Feature icon={<Database />} title={lang === 'kz' ? 'Икемді база' : 'Гибкая база'} text={lang === 'kz' ? 'Категория, балама атау, ескірген сөз және ағылшын аналогы сақталады.' : 'Хранятся категории, алиасы, устаревшие варианты и английские аналоги.'} />
        <Feature icon={<FileText />} title={lang === 'kz' ? 'Құжаттармен жұмыс' : 'Работа с документами'} text={lang === 'kz' ? 'Мәтін қою және файл жүктеу сценарийлері бір жерде.' : 'Вставка текста и загрузка файлов собраны в одном рабочем экране.'} />
      </section>
    </div>
  );
}

const miniStatTone = {
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
  red: 'border-red-100 bg-red-50 text-red-700',
  blue: 'border-blue-100 bg-blue-50 text-blue-700',
};

function MiniStat({ label, value, tone }) {
  return (
    <div className={`rounded-lg border p-3 ${miniStatTone[tone]}`}>
      <div className="text-lg font-black">{value}</div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">{icon}</div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 leading-7 text-slate-600">{text}</p>
    </article>
  );
}
