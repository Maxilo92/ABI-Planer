import Image from 'next/image';

export default function Logo({ width = 40, height = 40, ...props }) {
  return (
    <Image
      src="/logo.svg"
      alt="ABI Planer Logo"
      width={width}
      height={height}
      priority
      {...props}
    />
  );
}
