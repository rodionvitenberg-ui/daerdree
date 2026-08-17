"use client";

import {
  forwardRef,
  useState,
  type SyntheticEvent,
} from "react";
import NextImage, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import Loader from "@/components/Loader";

/** Дефолтный css-класс для div-обёртки, зависит от fill/fixed. */
const containerClass = (fill: boolean) =>
  fill
    ? "relative h-full w-full overflow-hidden"
    : "relative inline-block overflow-hidden";

type AppImageProps = Omit<ImageProps, "onLoad" | "onError"> & {
  /** Показывать ли лоадер-спиннер поверх картинки до её полной загрузки. */
  showLoader?: boolean;
  /** Размер спиннера в px. По умолчанию 28. */
  loaderSize?: number;
  /** Accessible label для лоадера. */
  loaderLabel?: string;
  /** Доп. класс для слоя-лоадера. */
  loaderClassName?: string;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
};

/**
 * Обёртка над next/image с аккуратным спиннером.
 *
 * Пока картинка грузится (onLoad не сработал), поверх отображается
 * крутящийся кружок акцентного цвета, после загрузки — плавный fade-in
 * самой картинки. Спиннер живёт внутри контейнера картинки, поэтому
 * не создаёт layout shift (CLS остаётся 0).
 */
const AppImage = forwardRef<HTMLImageElement, AppImageProps>(function AppImage(
  {
    showLoader = true,
    loaderSize = 28,
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

  const showSpinner = showLoader && !loaded && !failed;
  const isFill = props.fill === true;

  // Внешние картинки (Django /media/, полные URL) отдаём напрямую браузеру
  // без _next/image: встроенный оптимизатор ходит за ними сам и на проде
  // получает 400 (не проходит remotePatterns/не может достучаться до медиа-сервера).
  // Раньше кастомный loader делал то же самое — обложки работали.
  const isRemote =
    typeof props.src === "string" &&
    (props.src.startsWith("http") || props.src.startsWith("//") || props.src.includes("/media/"));
  const isUnoptimized = props.unoptimized === true || isRemote;

  return (
    <div
      className={containerClass(isFill)}
      style={style}
    >
      {showSpinner && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center bg-neutral-900",
            loaderClassName
          )}
          aria-hidden="true"
        >
          <Loader size={loaderSize} label={loaderLabel} />
        </div>
      )}

      <NextImage
        ref={ref}
        {...props}
        unoptimized={isUnoptimized}
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