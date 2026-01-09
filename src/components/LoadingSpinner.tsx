import Image from 'next/image';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({
  text = 'Loading...',
  size = 'medium'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  const imageSizes = {
    small: 96,
    medium: 128,
    large: 192
  };

  return (
    <div className="text-center">
      <div className={`${sizeClasses[size]} mx-auto mb-4 animate-bounce`}>
        <Image
          src="/skate.png"
          alt="Loading"
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="w-full h-full object-contain"
        />
      </div>
      <p className="text-black font-bold">{text}</p>
    </div>
  );
}
