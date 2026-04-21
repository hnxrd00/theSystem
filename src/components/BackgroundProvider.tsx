import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const { customBackground, backgroundEnabled } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Set CSS variables for dynamic styling
    const root = document.documentElement;
    if (backgroundEnabled && customBackground) {
      root.style.setProperty('--sidebar-bg', 'transparent');
      root.style.setProperty('--topbar-bg', 'transparent');
      root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.2)');
      root.style.setProperty('--backdrop-blur', 'blur(8px)');
    } else {
      root.style.setProperty('--sidebar-bg', '');
      root.style.setProperty('--topbar-bg', '');
      root.style.setProperty('--card-bg', '');
      root.style.setProperty('--card-border', '');
      root.style.setProperty('--backdrop-blur', '');
    }
  }, [backgroundEnabled, customBackground]);

  // Validate background URL
  const isValidBackground = backgroundEnabled && customBackground && 
    customBackground.length > 0 && 
    (customBackground.startsWith('data:image') || 
     customBackground.startsWith('data:video') ||
     customBackground.startsWith('blob:') ||
     customBackground.startsWith('http://') || 
     customBackground.startsWith('https://') ||
     customBackground.startsWith('/'));

  const isVideo = isValidBackground && (
    customBackground.startsWith('data:video') ||
    customBackground.startsWith('blob:') ||
    customBackground.includes('.mp4') ||
    customBackground.includes('.webm') ||
    customBackground.includes('.mov')
  );

  return (
    <div className="relative min-h-screen">
      {/* Background layer */}
      <AnimatePresence mode="wait">
        {isValidBackground ? (
          isVideo ? (
            <motion.video
              key="custom-background-video"
              ref={videoRef}
              className="fixed inset-0 z-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              autoPlay
              loop
              muted
              playsInline
              src={customBackground}
              onLoadedData={() => console.log('Video background loaded')}
              onError={(e) => console.error('Video background error:', e)}
            />
          ) : (
            <motion.div
              key="custom-background"
              className="fixed inset-0 z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundImage: `url(${customBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                animation: customBackground.endsWith('.gif') ? 'none' : undefined,
              }}
            />
          )
        ) : (
          // Fallback background when invalid
          <motion.div
            key="fallback-background"
            className="fixed inset-0 z-0 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
      
      {/* Default background overlay when disabled */}
      <AnimatePresence mode="wait">
        {!backgroundEnabled && (
          <motion.div
            key="default-background"
            className="fixed inset-0 z-0 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Semi-transparent overlay for better UI visibility */}
      {isValidBackground && (
        <div className="fixed inset-0 z-0 bg-black/20" />
      )}

      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
