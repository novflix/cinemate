import { useNavigate } from 'react-router-dom';
import './LegalPage.css';

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <button className="legal-page__back" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="legal-page__title">Terms of Service</h1>
        <p className="legal-page__date">Last updated: April 2025</p>

        <section className="legal-page__section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using CINIMATE ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
        </section>

        <section className="legal-page__section">
          <h2>2. Description of Service</h2>
          <p>CINIMATE is a personal film and TV tracking application that allows users to discover content, maintain watchlists, rate films and series, and receive personalised recommendations based on their viewing preferences. The Service is provided free of charge and without advertisements.</p>
        </section>

        <section className="legal-page__section">
          <h2>3. User Accounts</h2>
          <p>You may use certain features of the Service without creating an account. However, to access cloud sync, personalised recommendations, and cross-device functionality, you must register with a valid email address and password.</p>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account.</p>
        </section>

        <section className="legal-page__section">
          <h2>4. Acceptable Use</h2>
          <p>You agree not to misuse the Service. Prohibited activities include, but are not limited to:</p>
          <ul>
            <li>Attempting to access other users' accounts or data without authorisation</li>
            <li>Using automated scripts or bots to scrape or access the Service at scale</li>
            <li>Circumventing any technical measures used to protect the Service</li>
            <li>Using the Service for any unlawful purpose or in violation of any applicable laws</li>
            <li>Transmitting any content that is harmful, abusive, or violates the rights of others</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>5. Third-Party Content</h2>
          <p>CINIMATE uses data from The Movie Database (TMDB) to provide film and TV information including posters, descriptions, cast information, and ratings. This data is provided under the TMDB API terms and conditions. CINIMATE is not endorsed or certified by TMDB.</p>
          <p>We are not responsible for the accuracy or completeness of third-party data displayed within the Service.</p>
        </section>

        <section className="legal-page__section">
          <h2>6. Intellectual Property</h2>
          <p>The CINIMATE name, logo, and application interface design are the intellectual property of the Service's creators. Film and TV data, posters, and related media are the property of their respective owners and are used under licence from TMDB. You may not copy, reproduce, or distribute any part of the Service without prior written permission.</p>
        </section>

        <section className="legal-page__section">
          <h2>7. Disclaimer of Warranties</h2>
          <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee that the Service will be error-free, uninterrupted, or continuously available. Film and TV data is sourced from third parties and may not always be accurate, complete, or up to date.</p>
        </section>

        <section className="legal-page__section">
          <h2>8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by applicable law, CINIMATE and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Service. This includes but is not limited to loss of data, loss of profits, or any other intangible losses.</p>
        </section>

        <section className="legal-page__section">
          <h2>9. Termination</h2>
          <p>We reserve the right to suspend or terminate your access to the Service at our discretion, without notice, if we believe you have violated these Terms. You may delete your account at any time through the Profile settings.</p>
        </section>

        <section className="legal-page__section">
          <h2>10. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. We will make reasonable efforts to notify users of significant changes. Continued use of the Service after changes constitutes acceptance of the revised Terms.</p>
        </section>

        <section className="legal-page__section">
          <h2>11. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the relevant courts.</p>
        </section>

        <section className="legal-page__section">
          <h2>12. Contact</h2>
          <p>If you have any questions about these Terms of Service, please contact us via the About page of the application.</p>
        </section>
      </div>
    </div>
  );
}