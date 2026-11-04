import { Link } from 'react-router-dom';

export function LogoMark({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 75 72" className={className} aria-hidden="true">
      <path d="M42 9 L66 22.5 L55 29 L31 16 Z" fill="#101010" />
      <path d="M55 29 L66 23 V50 L42 62 L55 43 Z" fill="#1B3A6B" />
      <path d="M31 29 L43 36 V62 L34 57 Z" fill="#101010" />
      <g fill="#1B3A6B">
        <rect x="20" y="18" width="6" height="6" /><rect x="27" y="23" width="5" height="5" />
        <rect x="20" y="26" width="5" height="4" /><rect x="13" y="32" width="6" height="7" />
        <rect x="25" y="32" width="4" height="4" /><rect x="26" y="38" width="4" height="4" />
      </g>
      <g fill="#101010">
        <rect x="7" y="23" width="6" height="6" /><rect x="15" y="25" width="2" height="2" />
        <rect x="19" y="43" width="9" height="8" /><rect x="21" y="38" width="3" height="3" />
      </g>
    </svg>
  );
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight">
        Dynamix<span className="text-brandLight">.</span>
        <span className="font-medium text-gray-400">CMS</span>
      </span>
    </Link>
  );
}

export const GITHUB = 'https://github.com/delciomanico/Dynamix-CMS';

export function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.95 46.98 31.85 46.98 24.55z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
