declare module 'custom-cursor-react' {
  import { FC } from 'react';

  interface CustomCursorProps {
    targets?: string[];
    customClass?: string;
    dimensions?: number;
    fill?: string;
    smoothness?: {
      movement?: number;
      scale?: number;
      opacity?: number;
    };
    targetOpacity?: number;
    targetScale?: number;
  }

  const CustomCursor: FC<CustomCursorProps>;
  export default CustomCursor;
}
