import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LegalPage.css';

export default function TermsOfService() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const s = (key) => t(`legal.terms.${key}`);

  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <button className="legal-page__back" onClick={() => navigate(-1)}>{t('legal.back')}</button>
        <h1 className="legal-page__title">{s('title')}</h1>
        <p className="legal-page__date">{t('legal.lastUpdated')}</p>

        <section className="legal-page__section">
          <h2>{s('s1h')}</h2>
          <p>{s('s1p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s2h')}</h2>
          <p>{s('s2p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s3h')}</h2>
          <p>{s('s3p1')}</p>
          <p>{s('s3p2')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s4h')}</h2>
          <p>{s('s4p')}</p>
          <ul>
            <li>{s('s4l1')}</li>
            <li>{s('s4l2')}</li>
            <li>{s('s4l3')}</li>
            <li>{s('s4l4')}</li>
            <li>{s('s4l5')}</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>{s('s5h')}</h2>
          <p>{s('s5p1')}</p>
          <p>{s('s5p2')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s6h')}</h2>
          <p>{s('s6p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s7h')}</h2>
          <p>{s('s7p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s8h')}</h2>
          <p>{s('s8p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s9h')}</h2>
          <p>{s('s9p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s10h')}</h2>
          <p>{s('s10p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s11h')}</h2>
          <p>{s('s11p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s12h')}</h2>
          <p>{s('s12p')}</p>
        </section>

        <p className="legal-page__english-priority">{t('legal.englishPriority')}</p>
      </div>
    </div>
  );
}