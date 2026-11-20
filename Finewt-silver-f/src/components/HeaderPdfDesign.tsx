import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/Forms/Common/PageHeader';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';
import { Save, RotateCcw, Printer, Edit2 } from 'lucide-react';
import {
  useSaveHeader,
  useGetHeader,
  HeaderConfig,
  HeaderConfigSchema,
} from '@/lib/api/headerapi';

const DEFAULT_PDF_HEADER_CONFIG: HeaderConfig = {
  leftInvocation: '॥ श्री गणेश प्रसन्न ॥',
  rightInvocation: '॥ श्री साई प्रसन्न ॥',
  factoryName: 'मातोश्री चेन फॅक्टरी, मिरज',
  Description: 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.',
  proprietorName: 'प्रो. नितीन खरात',
  phoneNumbers: 'मो. ९३७०२४७०३५ / ७३८७२३५१८४',
  invocationColor: '#a84b20',
  factoryNameColor: '#c43d5c',
  DescriptionColor: '#8b451f',
  proprietorColor: '#a84b20',
  phoneColor: '#a84b20',
  factoryFontSize: 24,
  DescriptionFontSize: 13,
  proprietorFontSize: 12,
  phoneFontSize: 12,
};

const HeaderPdfDesign: React.FC = () => {
  const saveHeader = useSaveHeader();
  const { data: headerApiRes } = useGetHeader();
  const [config, setConfig] = useState<HeaderConfig>(DEFAULT_PDF_HEADER_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const raw =
      headerApiRes?.data || (headerApiRes?.factoryName ? headerApiRes : null);
    if (raw) {
      setConfig({
        leftInvocation:
          raw.leftInvocation ||
          raw.leftInovation ||
          DEFAULT_PDF_HEADER_CONFIG.leftInvocation,
        rightInvocation:
          raw.rightInvocation ||
          raw.rightInovation ||
          DEFAULT_PDF_HEADER_CONFIG.rightInvocation,
        factoryName: raw.factoryName || DEFAULT_PDF_HEADER_CONFIG.factoryName,
        Description: raw.Description|| DEFAULT_PDF_HEADER_CONFIG.Description,
        proprietorName:
        raw.proprietorName || DEFAULT_PDF_HEADER_CONFIG.proprietorName,
        phoneNumbers:
        raw.phoneNumbers || DEFAULT_PDF_HEADER_CONFIG.phoneNumbers,
        invocationColor:
        raw.invocationColor || DEFAULT_PDF_HEADER_CONFIG.invocationColor,
        factoryNameColor:
        raw.factoryNameColor || DEFAULT_PDF_HEADER_CONFIG.factoryNameColor,
        DescriptionColor:
        raw.DescriptionColor || DEFAULT_PDF_HEADER_CONFIG.DescriptionColor,
        proprietorColor:
        raw.proprietorColor || DEFAULT_PDF_HEADER_CONFIG.proprietorColor,
        phoneColor: raw.phoneColor || DEFAULT_PDF_HEADER_CONFIG.phoneColor,
        factoryFontSize: Number(
          raw.factoryFontSize || DEFAULT_PDF_HEADER_CONFIG.factoryFontSize,
        ),
        DescriptionFontSize: Number(
          raw.DescriptionFontSize ||
        DEFAULT_PDF_HEADER_CONFIG.DescriptionFontSize,
        ),
        proprietorFontSize: Number(
          raw.proprietorFontSize ||
          DEFAULT_PDF_HEADER_CONFIG.proprietorFontSize,
        ),
        phoneFontSize: Number(
          raw.phoneFontSize || DEFAULT_PDF_HEADER_CONFIG.phoneFontSize,
        ),
      });
} else {
  try {
    const saved = localStorage.getItem('pdf_header_config');
if (saved) {
  setConfig({ ...DEFAULT_PDF_HEADER_CONFIG, ...JSON.parse(saved) });
}
      } catch (e) {
  console.error('Failed to parse pdf_header_config:', e);
}
    }
  }, [headerApiRes]);

const handleSave = async () => {
  // Validate config with Zod schema
  const validation = HeaderConfigSchema.safeParse(config);
  if (!validation.success) {
    const firstError =
      validation.error.errors[0]?.message || 'Invalid header configuration';
    toast.error(firstError);
    return;
  }

  setIsSaving(true);
  try {
    // Save to API
    await saveHeader.mutateAsync(validation.data);

    // Save to localStorage as backup
    localStorage.setItem(
      'pdf_header_config',
      JSON.stringify(validation.data),
    );
  } catch (error: any) {
    console.error('Save error:', error);
    toast.error(error?.message || 'Failed to save header design');
  } finally {
    setIsSaving(false);
  }
};

const handleReset = () => {
  setConfig(DEFAULT_PDF_HEADER_CONFIG);
  localStorage.removeItem('pdf_header_config');
  toast.success('Reset to default header design');
};

// Handle inline edit
const handleInlineEdit = (field: keyof HeaderConfig, value: string) => {
  setConfig((prev) => ({
    ...prev,
    [field]: value,
  }));
};

// Editable Text Component
const EditableText = ({
  value,
  onChange,
  style,
  className = '',
  placeholder = 'Click to edit...',
}: {
  value: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue.trim() !== value) {
      onChange(localValue.trim() || value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`min-w-[50px] border-b-2 border-[#785600] bg-transparent px-1 outline-none ${className}`}
        style={{
          ...style,
          background: 'rgba(120, 86, 0, 0.05)',
          borderRadius: '4px',
          padding: '2px 4px',
        }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`group relative cursor-pointer rounded px-1 transition-colors hover:bg-[#785600]/10 ${className}`}
      style={style}
      title="Click to edit"
    >
      {value || placeholder}
      <Edit2 className="ml-1 inline-block h-3 w-3 text-[#785600] opacity-0 transition-opacity group-hover:opacity-100" />
    </span>
  );
};

return (
  <div className="min-h-screen bg-[#f9f9f7] px-4 py-6 dark:bg-slate-950 sm:px-6">
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <PageHeader title="PDF Header Designer" />
          <p className="mt-1 text-sm text-[#4f4535] dark:text-slate-400">
            Click on any text to edit directly
          </p>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <GenericButton
            type="button"
            onClick={handleReset}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </GenericButton>
          <GenericButton
            type="button"
            onClick={handleSave}
            variant="primary"
            className="flex-1 sm:flex-none"
            disabled={isSaving || saveHeader.isPending}
          >
            <Save className="h-4 w-4" />
            <span>
              {isSaving || saveHeader.isPending ? 'Saving...' : 'Save'}
            </span>
          </GenericButton>
        </div>
      </div>

      {/* Preview with Editable Header */}
      <div className="rounded-xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-gray-100 mb-4 flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-[#785600] dark:text-amber-400" />
            <h2 className="text-base font-bold text-[#1a1c1b] dark:text-white">
              Header Preview (Click to Edit)
            </h2>
          </div>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/40 dark:text-green-400">
            Click to Edit
          </span>
        </div>

        {/* Editable Header - Exact Layout */}
        <div className="rounded-lg border-2 border-dashed border-[#785600]/30 bg-white p-6">
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              padding: '8px 0',
              borderBottom: '2px solid #c43d5c',
              marginBottom: '12px',
            }}
          >
            {/* Top Row - Ganesh, Factory Name, Sai */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                marginBottom: '4px',
              }}
            >
              <EditableText
                value={config.leftInvocation}
                onChange={(val) => handleInlineEdit('leftInvocation', val)}
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: config.invocationColor,
                  whiteSpace: 'nowrap',
                }}
              />
              <EditableText
                value={config.factoryName}
                onChange={(val) => handleInlineEdit('factoryName', val)}
                style={{
                  fontSize: `${config.factoryFontSize}px`,
                  fontWeight: 'bold',
                  color: config.factoryNameColor,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  padding: '0 10px',
                }}
                className="text-center"
              />
              <EditableText
                value={config.rightInvocation}
                onChange={(val) => handleInlineEdit('rightInvocation', val)}
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: config.invocationColor,
                  whiteSpace: 'nowrap',
                }}
              />
            </div>

            {/* Description (तपशील) */}
            <EditableText
              value={config.Description}
              onChange={(val) => handleInlineEdit('Description', val)}
              style={{
                fontSize: `${config.DescriptionFontSize
              }px`,
                  fontWeight: 'bold',
                  color: config.DescriptionColor,
                  margin: '4px 0',
                  display: 'block',
                }}
                className="w-full text-center"
              />

              {/* Proprietor & Phone - Same Line */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: `${config.proprietorFontSize}px`,
                fontWeight: 'bold',
                color: config.proprietorColor,
                marginTop: '2px',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <EditableText
                value={config.proprietorName}
                onChange={(val) => handleInlineEdit('proprietorName', val)}
                style={{
                  fontSize: `${config.proprietorFontSize}px`,
                  fontWeight: 'bold',
                  color: config.proprietorColor,
                }}
              />
              <span
                style={{
                  color: config.phoneColor,
                  fontSize: `${config.phoneFontSize}px`,
                  fontWeight: 'bold',
                }}
              >
                <EditableText
                  value={config.phoneNumbers}
                  onChange={(val) => handleInlineEdit('phoneNumbers', val)}
                  style={{
                    fontSize: `${config.phoneFontSize}px`,
                    fontWeight: 'bold',
                    color: config.phoneColor,
                  }}
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default HeaderPdfDesign;
