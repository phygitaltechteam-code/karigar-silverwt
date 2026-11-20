import {useNavigate} from '@tanstack/react-router';
import React, {useState, useRef} from 'react';
import {
  MdChevronLeft,
  MdLock,
  MdHelpOutline,
  MdVerifiedUser,
  MdCameraAlt,
  MdUpload,
  MdRefresh,
} from 'react-icons/md';

const Reg4: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-[#000000]">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden border-2 border-zinc-900 bg-[#000000] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2">
          <button
            onClick={() => navigate({to: '/reg3'})}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#39ff14] transition-colors hover:bg-[#39ff14]/10"
          >
            <MdChevronLeft className="text-2xl" />
          </button>

          <div className="flex items-center gap-2 rounded-full border border-[#39ff14]/20 bg-[#39ff14]/10 px-3 py-1.5 backdrop-blur-sm">
            <MdLock className="text-sm text-[#39ff14]" />
            <span className="text-xs font-medium tracking-wide text-[#39ff14]">
              Bank-grade Security
            </span>
          </div>

          <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-[#39ff14]/10 hover:text-[#39ff14]">
            <MdHelpOutline className="text-xl" />
          </button>
        </div>

        {/* Main */}
        <div className="relative flex w-full flex-1 flex-col items-center justify-center px-6">
          <div className="mb-6 text-center">
            <h1 className="mb-3 text-2xl font-bold tracking-tight">
              Face Verification
            </h1>
            <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-zinc-400">
              {selectedImage
                ? 'Image ready for verification. Please ensure your face is clearly visible.'
                : 'Upload a clear photo of your face. Please remove glasses or masks.'}
            </p>
          </div>

          {/* Upload Area / Scan Frame */}
          <div className="relative mb-10 h-72 w-72">
            <div className="absolute -inset-4 rounded-full border border-zinc-800"></div>

            {!selectedImage ? (
              // Upload UI
              <div
                onClick={triggerFileInput}
                className="relative h-full w-full cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-[#39ff14]/30 bg-zinc-900/50 transition-all hover:border-[#39ff14] hover:bg-zinc-900/80"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="rounded-full bg-[#39ff14]/10 p-4">
                    <MdCameraAlt className="text-4xl text-[#39ff14]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#39ff14]">
                      Click to upload
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      or drag and drop
                    </p>
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    PNG, JPG up to 10MB
                  </p>
                </div>

                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#39ff14] border-t-transparent"></div>
                  </div>
                )}
              </div>
            ) : (
              // Scan Frame with uploaded image
              <>
                <svg
                  className="absolute -inset-4 h-[304px] w-[304px] -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="49"
                    fill="none"
                    stroke="#39ff14"
                    strokeWidth="1.5"
                    strokeDasharray="308"
                    strokeDashoffset="75"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="relative h-full w-full overflow-hidden rounded-full shadow-2xl ring-4 ring-black">
                  <img
                    src={selectedImage}
                    alt="Face preview"
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-transparent via-[#39ff14]/10 to-transparent"></div>

                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20 mix-blend-overlay"></div>

                  {/* Scan Line */}
                  <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 bg-gradient-to-b from-transparent via-[#39ff14]/50 to-transparent shadow-[0_0_15px_rgba(57,255,20,0.6)]"></div>

                  <div className="top-1/6 absolute left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-[#39ff14]/30"></div>
                  <div className="bottom-1/6 absolute left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-[#39ff14]/30"></div>
                </div>

                {/* Scanning Label */}
                <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#39ff14]/30 bg-black px-5 py-2 text-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.8)]"></div>
                  <span className="text-sm font-medium tracking-wide">
                    Scanning...
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4 text-center">
            {selectedImage ? (
              <>
                <p className="inline-block rounded-lg bg-[#39ff14] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black shadow-[0_0_15px_rgba(57,255,20,0.4)]">
                  Face detected
                </p>

                {/* Upload Another Button */}
                <button
                  onClick={resetImage}
                  className="flex items-center justify-center gap-2 text-sm text-[#39ff14] transition-colors hover:text-[#39ff14]/80"
                >
                  <MdRefresh className="text-lg" />
                  <span>Upload another image</span>
                </button>
              </>
            ) : (
              <p className="inline-block rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-zinc-400">
                Please upload a photo to continue
              </p>
            )}

            <div className="h-12"></div>
          </div>
        </div>

        {/* Bottom */}
        <div className="w-full px-6 pb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <MdVerifiedUser className="text-[16px] text-zinc-600" />
              <span>Your biometric data is encrypted end-to-end.</span>
            </div>

            {/* Continue Button - Only enabled when image is uploaded */}
            <button
              onClick={() => navigate({to: '/market'})}
              disabled={!selectedImage}
              className={`mt-2 w-full rounded-md border-t border-zinc-900 py-4 text-center text-sm font-medium transition-colors ${
                selectedImage
                  ? 'bg-[#39ff14] text-black hover:text-white'
                  : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reg4;
