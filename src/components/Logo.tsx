import Image from 'next/image';

export default function Logo({ width = 40, height = 40, ...props }) {
  const mergedStyle = {
    width: 'auto',
    height: 'auto',
    ...(props?.style || {}),
  }

  return (
    <Image
      src="/logo.png"
      alt="ABI Planer Logo"
      width={width}
      height={height}
      priority
      style={mergedStyle}
      {...props}
    />
  );
}
