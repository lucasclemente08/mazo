import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;
function Symbol({ children, ...props }: Props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}
export const CardsIcon = (props: Props) => <Symbol {...props}><path d="m5 6-2 1 4 14 7-2"/><rect x="8" y="2" width="13" height="18" rx="3"/><path d="m14.5 7 3 4-3 4-3-4Z"/><path d="M11 5h1M17 17h1"/></Symbol>;
export const PlayersIcon = (props: Props) => <Symbol {...props}><circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v2"/></Symbol>;
export const JoinIcon = (props: Props) => <Symbol {...props}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h4v4h-7M21 14v1"/></Symbol>;
export const GuideIcon = (props: Props) => <Symbol {...props}><path d="M12 5v16M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z"/><path d="M6 8h3M15 8h3M6 12h3M15 12h3"/></Symbol>;
