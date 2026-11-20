// components/PDF/PDFHeader.tsx
import React from 'react';
import {useGetHeader} from '@/lib/api/headerapi';

export interface PDFHeaderConfig {
  leftInvocation?: string | null;
  leftInovation?: string | null;
  rightInvocation?: string | null;
  rightInovation?: string | null;
  factoryName?: string;
  description?: string;
  proprietorName?: string;
  phoneNumbers?: string;
  invocationColor?: string;
  factoryNameColor?: string;
  descriptionColor?: string;
  proprietorColor?: string;
  phoneColor?: string;
  factoryFontSize?: number | string;
  descriptionFontSize?: number | string;
  proprietorFontSize?: number | string;
  phoneFontSize?: number | string;
}

export interface PDFHeaderProps {
  style?: React.CSSProperties;
  className?: string;
  config?: PDFHeaderConfig;
}

const DEFAULT_HEADER_CONFIG = {
  leftInvocation: '॥ श्री गणेश प्रसन्न ॥',
  rightInvocation: '॥ श्री साई प्रसन्न ॥',
  factoryName: 'मातोश्री चेन फॅक्टरी, मिरज',
  description: 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.',
  proprietorName: 'प्रो. नितीन खरात',
  phoneNumbers: 'मो. ९३७०२४७०३५ / ७३८७२३५१८४',
  invocationColor: '#a84b20',
  factoryNameColor: '#c43d5c',
  descriptionColor: '#8b451f',
  proprietorColor: '#a84b20',
  phoneColor: '#a84b20',
  factoryFontSize: 28,
  descriptionFontSize: 13,
  proprietorFontSize: 12,
  phoneFontSize: 12,
};

const PDFHeader: React.FC<PDFHeaderProps> = ({
  style,
  className = '',
  config: propConfig,
}) => {
  const {data: headerApiRes} = useGetHeader();

  // Extract inner data if response matches API structure { statusCode, status, data: { ... } }
  const fetchedData =
    headerApiRes?.data || (headerApiRes?.factoryName ? headerApiRes : null);

  const leftInvocation =
    propConfig?.leftInvocation ??
    propConfig?.leftInovation ??
    fetchedData?.leftInvocation ??
    fetchedData?.leftInovation ??
    DEFAULT_HEADER_CONFIG.leftInvocation;
  const rightInvocation =
    propConfig?.rightInvocation ??
    propConfig?.rightInovation ??
    fetchedData?.rightInvocation ??
    fetchedData?.rightInovation ??
    DEFAULT_HEADER_CONFIG.rightInvocation;
  const factoryName =
    propConfig?.factoryName ??
    fetchedData?.factoryName ??
    DEFAULT_HEADER_CONFIG.factoryName;
  const description =
    propConfig?.description ??
    fetchedData?.description ??
    DEFAULT_HEADER_CONFIG.description;
  const proprietorName =
    propConfig?.proprietorName ??
    fetchedData?.proprietorName ??
    DEFAULT_HEADER_CONFIG.proprietorName;
  const phoneNumbers =
    propConfig?.phoneNumbers ??
    fetchedData?.phoneNumbers ??
    DEFAULT_HEADER_CONFIG.phoneNumbers;
  const invocationColor =
    propConfig?.invocationColor ??
    fetchedData?.invocationColor ??
    DEFAULT_HEADER_CONFIG.invocationColor;
  const factoryNameColor =
    propConfig?.factoryNameColor ??
    fetchedData?.factoryNameColor ??
    DEFAULT_HEADER_CONFIG.factoryNameColor;
  const descriptionColor =
    propConfig?.descriptionColor ??
    fetchedData?.descriptionColor ??
    DEFAULT_HEADER_CONFIG.descriptionColor;
  const proprietorColor =
    propConfig?.proprietorColor ??
    fetchedData?.proprietorColor ??
    DEFAULT_HEADER_CONFIG.proprietorColor;
  const phoneColor =
    propConfig?.phoneColor ??
    fetchedData?.phoneColor ??
    DEFAULT_HEADER_CONFIG.phoneColor;
  const factoryFontSize = Number(
    propConfig?.factoryFontSize ??
      fetchedData?.factoryFontSize ??
      DEFAULT_HEADER_CONFIG.factoryFontSize,
  );
  const descriptionFontSize = Number(
    propConfig?.descriptionFontSize ??
      fetchedData?.descriptionFontSize ??
      DEFAULT_HEADER_CONFIG.descriptionFontSize,
  );
  const proprietorFontSize = Number(
    propConfig?.proprietorFontSize ??
      fetchedData?.proprietorFontSize ??
      DEFAULT_HEADER_CONFIG.proprietorFontSize,
  );
  const phoneFontSize = Number(
    propConfig?.phoneFontSize ??
      fetchedData?.phoneFontSize ??
      DEFAULT_HEADER_CONFIG.phoneFontSize,
  );

  return (
    <div
      className={className}
      style={{
        width: '100%',
        textAlign: 'center',
        margin: 0,
        padding: 0,
        ...style,
      }}
    >
      {/* Top Row - Left Invocation, Factory Name, Right Invocation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: 0,
          padding: 0,
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: invocationColor,
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          {leftInvocation}
        </span>
        <span
          style={{
            fontSize: `${factoryFontSize}px`,
            fontWeight: 'bold',
            color: factoryNameColor,
            whiteSpace: 'nowrap',
            flex: '1 1 auto',
            textAlign: 'center',
            padding: '0 10px',
          }}
        >
          {factoryName}
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: invocationColor,
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          {rightInvocation}
        </span>
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            margin: '2px 0 0 0',
            padding: 1,
            fontSize: `${descriptionFontSize}px`,
            fontWeight: 'bold',
            color: descriptionColor,
            lineHeight: 1.2,
            textAlign: 'center',
          }}
        >
          {description}
        </div>
      )}

      {/* Proprietor & Phone */}
      {(proprietorName || phoneNumbers) && (
        <div
          style={{
            margin: '2px 0 0 0',
            padding: 0,
            fontSize: `${proprietorFontSize}px`,
            fontWeight: 'bold',
            color: proprietorColor,
            lineHeight: 1.2,
            textAlign: 'center',
          }}
        >
          {proprietorName}&nbsp;&nbsp;
          <span style={{color: phoneColor, fontSize: `${phoneFontSize}px`}}>
            {phoneNumbers}
          </span>
        </div>
      )}
    </div>
  );
};

export default PDFHeader;
