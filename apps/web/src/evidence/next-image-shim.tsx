import * as React from 'react';

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  unoptimized?: boolean;
};

const Image = React.forwardRef<HTMLImageElement, ImgProps>(function Image(
  { src, alt, fill, style, ...props },
  ref
) {
  return (
    <img
      ref={ref}
      src={typeof src === 'string' ? src : undefined}
      alt={alt ?? ''}
      style={fill ? { ...style, width: '100%', height: '100%' } : style}
      {...props}
    />
  );
});

export default Image;
