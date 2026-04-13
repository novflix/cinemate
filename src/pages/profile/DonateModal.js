import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseCircleLinear } from 'solar-icon-set';
import './DonateModal.css';

/* ─── Crypto wallet definitions ─────────────────────────────────────────────── */
const WALLETS = [
  {
    label: 'USDC',
    network: 'Polygon',
    address: '0x9e9C10d3A526cb39B62b88DecC55f04F8f63fdE3',
    color: '#2775CA',
    gradient: 'linear-gradient(135deg, rgba(39,117,202,0.18) 0%, rgba(39,117,202,0.05) 100%)',
    border: 'rgba(39,117,202,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#2775CA"/>
        <path d="M20.022 18.124c0-2.124-1.277-2.852-3.831-3.155-1.832-.243-2.193-.728-2.193-1.578s.603-1.396 1.832-1.396c1.107 0 1.71.364 2.013 1.275a.27.27 0 00.255.182h1.155a.247.247 0 00.247-.254v-.061a3.076 3.076 0 00-2.75-2.51V9.382a.274.274 0 00-.272-.272H15.3a.274.274 0 00-.272.272v1.214c-1.71.243-2.813 1.396-2.813 2.852 0 2.002 1.217 2.791 3.77 3.094 1.71.303 2.254.667 2.254 1.638s-.845 1.638-2.013 1.638c-1.578 0-2.133-.667-2.315-1.578a.267.267 0 00-.255-.212h-1.217a.247.247 0 00-.248.254v.061c.243 1.578 1.277 2.73 3.034 3.034v1.214c0 .151.12.272.272.272h1.155c.151 0 .272-.12.272-.272v-1.214c1.71-.272 2.874-1.517 2.874-3.033z" fill="white"/>
        <path d="M13.16 23.542c-4.125-1.457-6.278-6.036-4.76-10.1a7.76 7.76 0 014.76-4.76.272.272 0 00.181-.255V7.25a.255.255 0 00-.333-.242c-5.006 1.578-7.764 6.917-6.157 11.923a9.388 9.388 0 006.157 6.157.255.255 0 00.333-.243v-1.096a.303.303 0 00-.181-.247zM19.172 7.008a.255.255 0 00-.333.243v1.126c0 .12.061.22.181.247 4.125 1.457 6.278 6.036 4.76 10.1a7.76 7.76 0 01-4.76 4.76.272.272 0 00-.181.255v1.126c0 .151.182.242.333.181 5.006-1.578 7.764-6.917 6.157-11.923a9.422 9.422 0 00-6.157-6.115z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'USDT',
    network: 'TRC-20',
    address: 'TVMMVRhbTJutmjkwFC6x5g4cm2S4P5nbqy',
    color: '#26A17B',
    gradient: 'linear-gradient(135deg, rgba(38,161,123,0.18) 0%, rgba(38,161,123,0.05) 100%)',
    border: 'rgba(38,161,123,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
        <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.661v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.175 6.775.852 6.775 1.66 0 .807-2.895 1.484-6.775 1.656zm0-3.59v-2.366h5.414V8H8.595v3.427h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.128 0 1.053 3.309 1.924 7.709 2.127v7.632h3.913v-7.635c4.393-.202 7.694-1.073 7.694-2.124 0-1.052-3.301-1.923-7.694-2.127z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'TON',
    network: 'TON',
    address: 'UQAdiUvmlLJ088bQkbv6AGs_sp7rO0jHcmdzR6oWglq5Isk2',
    color: '#0098EA',
    gradient: 'linear-gradient(135deg, rgba(0,152,234,0.18) 0%, rgba(0,152,234,0.05) 100%)',
    border: 'rgba(0,152,234,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#0098EA"/>
        <path d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm4.93 6.5h-2.645l-2.287 7.04-2.285-7.04H11.07l3.864 9.0a1.13 1.13 0 001.065.75 1.13 1.13 0 001.064-.75L20.93 12.5z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'SOL',
    network: 'Solana',
    address: 'Wv29H2iUF4vQLfqgGjvbSiobThxJAfSpeFNBanoWvKw',
    color: '#9945FF',
    gradient: 'linear-gradient(135deg, rgba(153,69,255,0.18) 0%, rgba(153,69,255,0.05) 100%)',
    border: 'rgba(153,69,255,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#9945FF"/>
        <path d="M10.03 19.782a.53.53 0 01.373-.154h13.075c.235 0 .353.284.187.45l-2.588 2.588a.53.53 0 01-.373.154H7.629c-.235 0-.353-.284-.187-.45l2.588-2.588zM10.03 9.334A.53.53 0 0110.403 9.18h13.075c.235 0 .353.284.187.45l-2.588 2.588a.53.53 0 01-.373.154H7.629c-.235 0-.353-.284-.187-.45L10.03 9.334zM21.077 14.558a.53.53 0 00-.373-.154H7.629c-.235 0-.353.284-.187.45l2.588 2.588a.53.53 0 00.373.154h13.075c.235 0 .353-.284.187-.45l-2.588-2.588z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'LTC',
    network: 'Litecoin',
    address: 'ltc1qff5xug04kp4tm03zrx9n9tah6zhtf3kzk5cp30',
    color: '#A0A0A0',
    gradient: 'linear-gradient(135deg, rgba(160,160,160,0.18) 0%, rgba(160,160,160,0.05) 100%)',
    border: 'rgba(160,160,160,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#A0A0A0"/>
        <path d="M16 5C9.925 5 5 9.925 5 16s4.925 11 11 11 11-4.925 11-11S22.075 5 16 5zm-1.14 14.696l.465-1.741-1.07.393.318-1.187 1.074-.393 1.626-6.067H19l-1.625 6.067 1.07-.393-.317 1.187-1.073.393-.465 1.741H13.86z" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'ARB',
    network: 'Arbitrum',
    address: '0x9e9C10d3A526cb39B62b88DecC55f04F8f63fdE3',
    color: '#2D374B',
    gradient: 'linear-gradient(135deg, rgba(100,140,255,0.18) 0%, rgba(100,140,255,0.05) 100%)',
    border: 'rgba(100,140,255,0.35)',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#2D374B"/>
        <path d="M16 5.5L7 10.75v10.5L16 26.5l9-5.25V10.75L16 5.5z" fill="#2D374B" stroke="#648CFF" strokeWidth="0.5"/>
        <path d="M13.06 20.5l-1.56-.9 4.3-7.44.78 2.33-3.52 6.01zM15.6 14.56l-.78-2.34h2.35l3.83 8.28-1.56.9-3.84-6.84z" fill="#648CFF"/>
        <path d="M11 19.82v1.68l5 2.92 5-2.92v-1.68l-4.22 7.3-.78-.45V25.3l3.44-5.95 1.56-.9-5-2.9-5 2.9 1.56.9 3.44 5.95v1.37l-.78.45L11 19.82z" fill="white" opacity="0.7"/>
      </svg>
    ),
  },
];

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

export default function DonateModal({ onClose }) {
  const { t } = useTranslation();
  const [copiedAddr, setCopiedAddr] = useState(null);

  const handleCopy = async (address) => {
    await copyToClipboard(address);
    setCopiedAddr(address);
    setTimeout(() => setCopiedAddr(null), 2500);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal donate-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('profile.donateTitle')}</h2>
          <button className="settings-close" onClick={onClose}><CloseCircleLinear size={18}/></button>
        </div>
        <div className="settings-body">
          <p className="donate-desc">{t('profile.donateDesc')}</p>
          <div className="donate-wallets">
            {WALLETS.map(({ label, network, address, color, gradient, border, icon }) => {
              const copied = copiedAddr === address;
              return (
                <div
                  key={label + network}
                  className={`donate-wallet${copied ? ' donate-wallet--copied' : ''}`}
                  onClick={() => handleCopy(address)}
                  style={{
                    background: copied ? 'rgba(34,197,94,0.07)' : gradient,
                    borderColor: copied ? '#22c55e' : border,
                  }}
                >
                  <div className="donate-wallet__icon">{icon}</div>
                  <div className="donate-wallet__info">
                    <div className="donate-wallet__top">
                      <div className="donate-wallet__name">
                        <span className="donate-wallet__label" style={{ color: copied ? '#22c55e' : color }}>{label}</span>
                        <span
                          className="donate-wallet__network"
                          style={{ borderColor: copied ? 'rgba(34,197,94,0.4)' : `${color}55`, color: copied ? '#22c55e' : color }}
                        >
                          {network}
                        </span>
                      </div>
                      <span className="donate-wallet__action">
                        {copied ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle', marginRight: 3 }}>
                              <path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('profile.donateCopied')}
                          </>
                        ) : t('profile.donateTap')}
                      </span>
                    </div>
                    <span className="donate-wallet__addr">{address}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}