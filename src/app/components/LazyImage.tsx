/**
 * LazyImage - Componente de imagem com lazy loading
 * Carrega imagens apenas quando visíveis no viewport
 */

import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3C/svg%3E',
  threshold = 0.1,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Criar IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Imagem está visível, carregar
            const imageToLoad = new Image();
            imageToLoad.src = src;

            imageToLoad.onload = () => {
              setImageSrc(src);
              setImageLoaded(true);
              onLoad?.();
            };

            imageToLoad.onerror = () => {
              setImageError(true);
              onError?.();
            };

            // Parar de observar após carregar
            observer.unobserve(img);
          }
        });
      },
      { threshold }
    );

    observer.observe(img);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [src, threshold, onLoad, onError]);

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`}
        {...props}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        imageLoaded ? 'opacity-100' : 'opacity-50'
      } ${className}`}
      loading="lazy"
      {...props}
    />
  );
};

/**
 * LazyBackgroundImage - Componente com background image lazy loading
 */

interface LazyBackgroundImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  placeholder?: string;
  threshold?: number;
  className?: string;
  children?: React.ReactNode;
}

export const LazyBackgroundImage: React.FC<LazyBackgroundImageProps> = ({
  src,
  placeholder = 'linear-gradient(to bottom, #e5e7eb, #d1d5db)',
  threshold = 0.1,
  className = '',
  children,
  style,
  ...props
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string>(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Preload da imagem
            const img = new Image();
            img.src = src;

            img.onload = () => {
              setBackgroundImage(`url(${src})`);
              setImageLoaded(true);
            };

            observer.unobserve(div);
          }
        });
      },
      { threshold }
    );

    observer.observe(div);

    return () => {
      observer.disconnect();
    };
  }, [src, threshold]);

  return (
    <div
      ref={divRef}
      className={`transition-all duration-300 ${className}`}
      style={{
        ...style,
        backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: imageLoaded ? 1 : 0.7,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default LazyImage;
