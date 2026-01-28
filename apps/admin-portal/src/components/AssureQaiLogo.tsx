import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AssureQaiLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showIcon?: boolean;
  showLogo?: boolean;
  forceDark?: boolean;
}

export function AssureQaiLogo({
  className = '',
  width = 110,
  height = 32,
  showIcon = true,
  showLogo = true,
  forceDark = false,
}: AssureQaiLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <Image
          src="/icon.png"
          alt="AssureQai Icon"
          width={48}
          height={48}
          className="h-10 w-10 object-contain shrink-0"
          priority
        />
      )}
      {showLogo && (
        <div className="relative">
          {forceDark ? (
            <Image
              src="/logo-dark.png"
              alt="AssureQai Logo"
              width={width}
              height={height}
              className="h-auto w-auto transition-opacity duration-200"
              priority
            />
          ) : (
            <>
              {/* Light Mode Logo */}
              <Image
                src="/logo.png"
                alt="AssureQai Logo"
                width={width}
                height={height}
                className="h-auto w-auto dark:hidden transition-opacity duration-200"
                priority
              />
              {/* Dark Mode Logo */}
              <Image
                src="/logo-dark.png"
                alt="AssureQai Logo"
                width={width}
                height={height}
                className="h-auto w-auto hidden dark:block transition-opacity duration-200"
                priority
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
