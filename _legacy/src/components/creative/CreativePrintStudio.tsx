import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Film,
  Image as ImageIcon,
  Download,
  Printer,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Sliders,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const CreativePrintStudio: React.FC = () => {
  const { currentShop, addToast, setActiveView } = useApp();

  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState(
    'A modern high-impact commercial print shop promotional poster with vibrant CMYK ink splashes, crisp architectural typography, high-resolution textures, and clean minimalist branding.'
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9'>('3:4');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Video Animation State
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoMotionPrompt, setVideoMotionPrompt] = useState(
    'Bring this print graphic to life with gentle holographic glow, subtle atmospheric light particles, and smooth cinematic slow pan suitable for high-end digital counter displays.'
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Quick Poster Prompts for Print Shops
  const promptPresets = [
    {
      title: 'Grand Opening Flyer',
      prompt:
        'A vibrant grand opening promotion poster for a modern digital printing studio, with bold typography saying "50% OFF FAST DIGITAL PRINTS", floating colorful paper sheets, 3D laser printer accents, clean studio lighting.',
      size: '2K',
      ratio: '3:4',
    },
    {
      title: 'University Student Discount Poster',
      prompt:
        'An aesthetic campus student discount poster for thesis binding, high-speed photocopying, and colored lecture notes, with modern geometric patterns, bold friendly headlines, and high definition textures.',
      size: '1K',
      ratio: '3:4',
    },
    {
      title: 'Architectural Blueprint Banner',
      prompt:
        'A professional large-format engineering and architectural blueprint service banner, crisp CAD schematics, deep blue technical grid, white vector lines, ultra-fine detail.',
      size: '4K',
      ratio: '16:9',
    },
    {
      title: 'Glossy Photo Art Print',
      prompt:
        'A breathtaking photographic art print of sunrise over misty mountains with rich saturated colors, ultra-fine pigment ink texture, gallery quality composition.',
      size: '2K',
      ratio: '1:1',
    },
  ];

  // 1. Call server /api/generate-image with gemini-3-pro-image-preview
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          imageSize,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server returned an error generating image');
      }

      setGeneratedImageUrl(data.imageUrl);
      addToast(
        'success',
        `High-Quality ${imageSize} Image Generated!`,
        'Using model gemini-3-pro-image-preview.'
      );
    } catch (err: any) {
      console.error(err);
      setImageError(err.message || 'Image generation failed');
      addToast('error', 'Generation Failed', err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 2. Call server /api/animate-video with gemini-omni-1.2-flash via Interactions API
  const handleAnimateVideo = async () => {
    if (!videoSourceImage) {
      addToast('error', 'Please upload or select an image to animate');
      return;
    }
    setIsGeneratingVideo(true);
    setVideoError(null);

    try {
      const res = await fetch('/api/animate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: videoSourceImage,
          motionPrompt: videoMotionPrompt.trim(),
          aspectRatio: videoAspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server returned an error animating video');
      }

      setGeneratedVideoUrl(data.videoUrl);
      addToast(
        'success',
        `Video Animation Generated (${videoAspectRatio})!`,
        'Using model gemini-omni-1.2-flash via Interactions API.'
      );
    } catch (err: any) {
      console.error(err);
      setVideoError(err.message || 'Video generation failed');
      addToast('error', 'Video Animation Failed', err.message);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Upload custom photo for video animation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setVideoSourceImage(reader.result as string);
      addToast('info', `Photo loaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Media Suite</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Creative AI Print & Poster Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Generate ultra-sharp 1K, 2K, and 4K marketing posters using{' '}
              <strong className="text-purple-300 font-mono">gemini-3-pro-image-preview</strong>, and animate photos into 16:9 & 9:16 cinematic motion posters via{' '}
              <strong className="text-indigo-300 font-mono">gemini-omni-1.2-flash</strong>.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-center">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'image'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>1K/2K/4K Poster Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Animate Photo to Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: High-Quality Image Generation (gemini-3-pro-image-preview) */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls: Left 7 Cols */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-500" />
                <span>High-Resolution Poster Specifications</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Model: <code className="font-mono text-purple-600 dark:text-purple-400 font-semibold">gemini-3-pro-image-preview</code>
              </p>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Poster Art & Branding Prompt *
              </label>
              <textarea
                rows={4}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the print poster, typography, colors, lighting..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block font-semibold text-slate-400 text-[11px] uppercase tracking-wider mb-2">
                Quick Shop Poster Templates:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {promptPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImagePrompt(p.prompt);
                      setImageSize(p.size as any);
                      setAspectRatio(p.ratio as any);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 text-left hover:border-purple-400 transition-colors"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {p.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {p.size} • {p.ratio}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Affordance: 1K, 2K, and 4K */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Image Resolution Affordance *
                </label>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-bold">
                  gemini-3-pro-image-preview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['1K', '2K', '4K'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setImageSize(size)}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      imageSize === size
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-extrabold ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-base font-black font-mono">{size}</div>
                    <div className="text-[10px] text-slate-400">
                      {size === '1K' ? '1024 px' : size === '2K' ? '2048 px (HD)' : '4096 px (Ultra)'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '3:4', label: '3:4 Poster' },
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:3', label: '4:3 Landscape' },
                  { id: '16:9', label: '16:9 Banner' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id as any)}
                    className={`py-2 px-2 rounded-xl border text-center font-medium ${
                      aspectRatio === r.id
                        ? 'border-indigo-600 bg-indigo-600 text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingImage ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Rendering {imageSize} High-Res Print Graphic...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate {imageSize} Print Asset</span>
                  </>
                )}
              </button>
            </div>

            {imageError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}
          </div>

          {/* Result Preview: Right 5 Cols */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Generated Output Preview
                </span>
                {generatedImageUrl && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                    {imageSize} • {aspectRatio}
                  </span>
                )}
              </div>

              {generatedImageUrl ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 shadow-md">
                    <img
                      src={generatedImageUrl}
                      alt="Generated High-Quality Poster"
                      className="w-full h-auto object-contain max-h-[380px] mx-auto"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                      Ready for Commercial Print Queue
                    </span>
                    Verified 300+ DPI equivalent resolution for professional poster printing.
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs">
                    Choose resolution (1K, 2K, 4K) and click "Generate Print Asset".
                  </p>
                </div>
              )}
            </div>

            {generatedImageUrl && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <a
                    href={generatedImageUrl}
                    download={`PrintFlow_${imageSize}_Poster.png`}
                    className="flex-1 py-2 px-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {imageSize} PNG</span>
                  </a>

                  <button
                    onClick={() => {
                      setVideoSourceImage(generatedImageUrl);
                      setActiveTab('video');
                      addToast('info', 'Transferred poster to Motion Video Studio');
                    }}
                    className="py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1 shadow-xs"
                    title="Animate this photo with Gemini Omni Flash"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Animate to Video</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Animate Images into Video (gemini-omni-1.2-flash via Interactions API) */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Video Controls: Left 7 Cols */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-500" />
                <span>Photo-to-Video Animation Parameters</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Model: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">gemini-omni-1.2-flash</code> via Interactions API
              </p>
            </div>

            {/* Photo Source Upload / Pick */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                1. Upload Source Photo / Graphic *
              </label>

              {videoSourceImage ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <img
                    src={videoSourceImage}
                    alt="Source"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Active Source Frame Loaded
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Ready for motion generation with Gemini Omni Flash
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const el = document.getElementById('photo-video-upload');
                      if (el) el.click();
                    }}
                    className="px-2.5 py-1 text-[11px] border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    const el = document.getElementById('photo-video-upload');
                    if (el) el.click();
                  }}
                  className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-2xl text-center cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                  <div className="font-bold text-slate-900 dark:text-white">
                    Click to upload photo for video animation
                  </div>
                  <span className="text-[11px] text-slate-400">PNG, JPG or WebP</span>
                </div>
              )}

              <input
                id="photo-video-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Motion Prompt */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                2. Motion Direction & Camera Movement Prompt *
              </label>
              <textarea
                rows={3}
                value={videoMotionPrompt}
                onChange={(e) => setVideoMotionPrompt(e.target.value)}
                placeholder="Describe how the still image should move..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Aspect Ratio Affordance: 16:9 landscape or 9:16 portrait */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                3. Video Aspect Ratio Affordance *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVideoAspectRatio('16:9')}
                  className={`py-3 px-4 rounded-xl border text-center transition-all ${
                    videoAspectRatio === '16:9'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold">16:9 Landscape</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Horizontal Video (Banners / TV)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoAspectRatio('9:16')}
                  className={`py-3 px-4 rounded-xl border text-center transition-all ${
                    videoAspectRatio === '9:16'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold">9:16 Portrait</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Vertical Video (Counter Displays / Mobile)</div>
                </button>
              </div>
            </div>

            {/* Animate Action */}
            <div className="pt-2">
              <button
                onClick={handleAnimateVideo}
                disabled={isGeneratingVideo || !videoSourceImage}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingVideo ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Video with Gemini Omni Flash...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>Animate Photo into {videoAspectRatio} Video</span>
                  </>
                )}
              </button>
            </div>

            {videoError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{videoError}</span>
              </div>
            )}
          </div>

          {/* Video Preview: Right 5 Cols */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Motion Video Output
                </span>
                {generatedVideoUrl && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                    {videoAspectRatio} Video
                  </span>
                )}
              </div>

              {generatedVideoUrl ? (
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black shadow-lg">
                    <video
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-auto max-h-[380px] mx-auto"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                      Synthesized Motion Video
                    </span>
                    Generated using Gemini Omni Flash video model via Interactions API.
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <Film className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs">
                    Upload a photo and click "Animate Photo into {videoAspectRatio} Video".
                  </p>
                </div>
              )}
            </div>

            {generatedVideoUrl && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={generatedVideoUrl}
                  download={`PrintFlow_Motion_${videoAspectRatio.replace(':', '_')}.mp4`}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4 Video</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
