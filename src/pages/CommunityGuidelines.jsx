import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LegalPage.css';

export default function CommunityGuidelines() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const s = (key) => t(`legal.community.${key}`);

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
          <ul>
            <li>{s('s2l1')}</li>
            <li>{s('s2l2')}</li>
            <li>{s('s2l3')}</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>{s('s3h')}</h2>
          <p>{s('s3p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s4h')}</h2>
          <p>{s('s4p')}</p>
        </section>

        <section className="legal-page__section">
          <h2>{s('s5h')}</h2>
          <p>{s('s5p')}</p>
          <ul>
            <li>{s('s5l1')}</li>
            <li>{s('s5l2')}</li>
            <li>{s('s5l3')}</li>
            <li>{s('s5l4')}</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>{s('s6h')}</h2>
          <p>{s('s6p')}</p>
          <ul>
            <li>{s('s6l1')}</li>
            <li>{s('s6l2')}</li>
            <li>{s('s6l3')}</li>
            <li>{s('s6l4')}</li>
          </ul>
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

        <p className="legal-page__english-priority">{t('legal.englishPriority')}</p>
      </div>
    </div>
  );
}