// components/Favicon.tsx
import React, {useEffect} from 'react';

interface FaviconProps {
  emoji?: string;
  bgColor?: string;
  textColor?: string;
}

const Favicon: React.FC<FaviconProps> = ({
  emoji = '💎',
  bgColor = '#996515',
  textColor = 'white',
}) => {
  useEffect(() => {
    const createFavicon = () => {
      // Create SVG
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <rect width="100" height="100" rx="20" fill="${bgColor}"/>
          <text x="50" y="68" font-size="45" text-anchor="middle" fill="${textColor}" font-family="serif" font-weight="bold">
            ${emoji}
          </text>
        </svg>
      `;

      // Convert SVG to base64
      const encodedSvg = encodeURIComponent(svg);
      const faviconUrl = `data:image/svg+xml,${encodedSvg}`;

      // Update or create favicon link
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;

      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }

      link.href = faviconUrl;
      link.type = 'image/svg+xml';
    };

    createFavicon();
  }, [emoji, bgColor, textColor]);

  return null;
};

export default Favicon;
