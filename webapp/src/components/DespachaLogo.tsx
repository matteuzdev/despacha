interface DespachaLogoProps {
  compact?: boolean;
  className?: string;
}

const DespachaLogo = ({ compact = false, className = '' }: DespachaLogoProps) => (
  <span className={`despacha-logo ${className}`}>
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path className="logo-blue-line" d="M7 14h18" />
      <path className="logo-orange-line" d="M12 32h25" />
      <path className="logo-orange-line" d="M28 22l11 10-11 10" />
      <path className="logo-blue-line dark" d="M9 50h22" />
      <path className="logo-d" d="M29 14h11a18 18 0 0 1 0 36H29" />
    </svg>
    {!compact && <strong>Despacha</strong>}
  </span>
);

export default DespachaLogo;
