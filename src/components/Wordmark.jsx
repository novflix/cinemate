import './Wordmark.css';

/**
 * CINIMATE logotype with gradient styling matching the About page hero.
 *
 * Props:
 *   size   — 'xs' | 'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *   className — extra class for the root element
 */
export default function Wordmark({ size = 'md', className = '' }) {
  return (
    <span className={`wordmark wordmark--${size} ${className}`.trim()}>
      CINI<em>MATE</em>
    </span>
  );
}