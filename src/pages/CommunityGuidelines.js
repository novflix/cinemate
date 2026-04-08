import { useNavigate } from 'react-router-dom';
import './LegalPage.css';

export default function CommunityGuidelines() {
  const navigate = useNavigate();
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <button className="legal-page__back" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="legal-page__title">Community Guidelines</h1>
        <p className="legal-page__date">Last updated: April 2025</p>

        <section className="legal-page__section">
          <h2>Our Philosophy</h2>
          <p>CINIMATE is built for film and TV lovers. Our goal is to help you discover great content, track what you watch, and get recommendations that actually reflect your taste. These guidelines exist to keep the experience enjoyable for everyone.</p>
        </section>

        <section className="legal-page__section">
          <h2>Ratings and Reviews</h2>
          <p>When you rate a film or series, you're shaping your own recommendations. Rate honestly based on your genuine reaction — not to game the algorithm or to brigade a title. Your ratings are personal and are used solely to improve your own experience.</p>
          <ul>
            <li>Rate based on your actual opinion, not external pressure or trends</li>
            <li>A 9–10 signals "find me more like this" — use it when you mean it</li>
            <li>A 1–3 penalises only that specific title, not the whole genre</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>Watchlists and Collections</h2>
          <p>Your watchlist is yours. Add whatever you genuinely intend to watch. The algorithm uses your watchlist to boost similar genres — keeping it accurate helps you get better recommendations.</p>
        </section>

        <section className="legal-page__section">
          <h2>"Not Interested" Feature</h2>
          <p>Tapping ✕ on a card permanently removes that title from your feed. Use this feature for content you genuinely have no interest in — it trains the algorithm to understand your preferences better over time.</p>
        </section>

        <section className="legal-page__section">
          <h2>Respect for Other Users</h2>
          <p>While CINIMATE is primarily a personal tool, any future community features should be used respectfully. We have zero tolerance for:</p>
          <ul>
            <li>Harassment, threats, or abusive behaviour toward other users</li>
            <li>Hate speech based on race, ethnicity, religion, gender, sexuality, disability, or any other characteristic</li>
            <li>Sharing or soliciting private information about other individuals</li>
            <li>Impersonating other users, public figures, or the CINIMATE team</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>Content Standards</h2>
          <p>Do not attempt to submit or display content that:</p>
          <ul>
            <li>Violates any applicable law or regulation</li>
            <li>Infringes on the intellectual property rights of others</li>
            <li>Contains malware, spam, or attempts to compromise the Service</li>
            <li>Is sexually explicit, violent, or otherwise harmful</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>Data Integrity</h2>
          <p>Do not attempt to manipulate, scrape, or interfere with the Service's data or infrastructure. The recommendation algorithm depends on authentic user behaviour — artificial manipulation degrades the experience for everyone.</p>
        </section>

        <section className="legal-page__section">
          <h2>Enforcement</h2>
          <p>Violations of these guidelines may result in account suspension or permanent termination. We reserve the right to take action at our discretion to protect the integrity of the Service and its users.</p>
        </section>

        <section className="legal-page__section">
          <h2>Questions</h2>
          <p>If you have questions about these guidelines or wish to report a concern, please reach out via the About page of the application.</p>
        </section>
      </div>
    </div>
  );
}