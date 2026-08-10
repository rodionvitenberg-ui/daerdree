"use client";

import {
  forwardRef,
  useState,
  type SyntheticEvent,
} from "react";
import NextImage, { type ImageProps } from "next/image";
import { ImageLoader } from "generative-loaders";
import "generative-loaders/styles.css";
import { cn } from "@/lib/utils";

/** Дефолтный css-класс для div-обёртки, зависит от fill/fixed. */
const containerClass = (fill: boolean) =>
  fill
    ? "relative h-full w-full overflow-hidden"
    : "relative inline-block overflow-hidden";

type AppImageProps = Omit<ImageProps, "onLoad" | "onError"> & {
  /** Показывать ли генеративный лоадер (skeleton) поверх картинки до её полной загрузки. */
  showLoader?: boolean;
  /** Размер скелетона в px. По умолчанию 192 как в примере generative-loaders. */
  loaderSize?: number | string;
  /** Цвет скелетона (hex). По умолчанию дефолтный из пакета. */
  loaderColor?: string;
  /** Радиус скругления скелетона. */
  loaderRadius?: number | string;
  /** Accessible label для лоадера. */
  loaderLabel?: string;
  /** Доп. класс для слоя-скелетона. */
  loaderClassName?: string;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

/**
 * Обёртка над next/image с генеративным лоадером (skeleton).
 *
 * Пока картинка грузится (onLoad не сработал), поверх отображается
 * `<ImageLoader variant="skeleton" />` из generative-loaders, после загрузки —
 * плавный fade-in самой картинки. Скелетон живёт внутри контейнера картинки,
 * поэтому не создаёт layout shift (CLS остаётся 0).
 */
const AppImage = forwardRef<HTMLImageElement, AppImageProps>(function AppImage(
  {
    showLoader = true,
    loaderSize = 192,
    loaderColor,
    loaderRadius = 12,
    loaderLabel = "Loading image",
    loaderClassName,
    onLoad,
    onError,
    className,
    style,
    ...props
  },
  ref
) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const showSkeleton = showLoader && !loaded && !failed;
  const isFill = props.fill === true;

  return (
    <div
      className={containerClass(isFill)}
      style={style}
    >
      {showSkeleton && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center bg-neutral-900",
            loaderClassName
          )}
          aria-hidden="true"
        >
          <ImageLoader
            variant="skeleton"
            size={loaderSize}
            color={loaderColor}
            radius={loaderRadius}
            label={loaderLabel}
          />
        </div>
      )}

      <NextImage
        ref={ref}
        {...props}
        className={cn(
          "transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
      />
    </div>
  );
});

export default AppImage;