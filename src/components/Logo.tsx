import Image from 'next/image';
import logoSmall from '@/assets/logos/logo-small.png';
import logoMedium from '@/assets/logos/logo-medium.png';
import logoLarge from '@/assets/logos/logo-large.png';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  [key: string]: any;
}

export default function Logo({ width = 40, height = 40, ...props }: LogoProps) {
  // Wähle das passende Logo basierend auf der Breite
  let logoSrc = logoSmall;
  if (width > 120) {
    logoSrc = logoLarge;
  } else if (width > 60) {
    logoSrc = logoMedium;
  }

  return (
    <Image
      src={logoSrc}
      alt="ABI Planer Logo"
      width={width}
      height={height}
      priority
      {...props}
    />
  );
}
