import React from "react";
import { useSettings, SkillTreeFormat, ColorTheme, COLOR_THEMES } from "@/context/SettingsContext";
import { Settings as SettingsIcon, LayoutList, GitFork, Volume2, VolumeX, Moon, Sun, Palette, Image, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FORMAT_OPTIONS: { value: SkillTreeFormat; label: string; description: string; icon: typeof LayoutList }[] = [
  { value: "linear", label: "Linear", description: "All skill categories in a flat list with horizontal progression nodes", icon: LayoutList },
  { value: "tree", label: "Tree", description: "Interactive draggable tree view — swipe between categories with arrows", icon: GitFork },
];

const THEME_KEYS = Object.keys(COLOR_THEMES) as ColorTheme[];

export default function SettingsPage() {
  const {
    soundEnabled,
    soundVolume,
    darkMode,
    colorTheme,
    customBackground,
    backgroundEnabled,
    backgroundHistory,
    skillTreeFormat,
    setSkillTreeFormat,
    setSoundEnabled,
    setSoundVolume,
    setDarkMode,
    setColorTheme,
    setCustomBackground,
    setBackgroundEnabled,
    addBackgroundToHistory,
    setBackgroundHistory,
  } = useSettings();

  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [backgroundUrl, setBackgroundUrl] = React.useState<string>("");
  const [applyEnabled, setApplyEnabled] = React.useState<boolean>(false);

  // Cleanup blob URLs on unmount
  React.useEffect(() => {
    return () => {
      // Clean up any blob URLs
      if (backgroundUrl.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundUrl);
      }
      if (previewUrl.startsWith('blob:') && previewUrl !== backgroundUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [backgroundUrl, previewUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Reset state
    setUploadedFile(null);
    setApplyEnabled(false);
    
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size, 'Max size:', maxSize);
      alert('File size must be less than 10MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      console.error('Invalid file type:', file.type);
      alert('Please select an image or video file');
      return;
    }
    
    setUploadedFile(file);
    
    if (file.type.startsWith('video/')) {
      // Handle video files
      try {
        const videoUrl = URL.createObjectURL(file);
        setBackgroundUrl(videoUrl);
        setPreviewUrl(videoUrl);
        setApplyEnabled(true);
        console.log('Video file loaded:', file.name);
      } catch (error) {
        console.error('Failed to create video URL:', error);
        alert('Failed to process video file');
      }
    } else {
      // Handle image files
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result && typeof result === 'string') {
          setBackgroundUrl(result);
          setPreviewUrl(result);
          setApplyEnabled(true);
          console.log('Image file loaded:', file.name);
        } else {
          console.error('Invalid file result:', result);
          alert('Failed to process image file');
        }
      };
      reader.onerror = (error) => {
        console.error('Failed to read file:', error);
        alert('Failed to read file');
        setUploadedFile(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundSelect = (url: string) => {
    if (url && typeof url === 'string') {
      setPreviewUrl(url);
      setBackgroundUrl(url);
      setApplyEnabled(true);
    }
  };

  const isValidBackground = backgroundEnabled && customBackground && 
    customBackground.length > 0 && 
    (customBackground.startsWith('data:image') || 
     customBackground.startsWith('data:video') ||
     customBackground.startsWith('blob:') ||
     customBackground.startsWith('http://') || 
     customBackground.startsWith('https://') ||
     customBackground.startsWith('/'));

  const handleApplyBackground = () => {
    const trimmedUrl = backgroundUrl.trim();
    
    if (!trimmedUrl) {
      console.error('No background URL provided');
      alert('Please select a background first');
      return;
    }
    
    // Validate URL format
    const isValidUrl = trimmedUrl.startsWith('data:image') || 
                     trimmedUrl.startsWith('data:video') || 
                     trimmedUrl.startsWith('blob:') || 
                     trimmedUrl.startsWith('http://') || 
                     trimmedUrl.startsWith('https://') ||
                     trimmedUrl.startsWith('/');
    
    if (!isValidUrl) {
      console.error('Invalid background URL:', trimmedUrl);
      alert('Invalid background URL');
      setApplyEnabled(false);
      return;
    }
    
    try {
      console.log('Applying background:', trimmedUrl.substring(0, 50) + '...');
      setCustomBackground(trimmedUrl);
      addBackgroundToHistory(trimmedUrl);
      setApplyEnabled(false);
      setUploadedFile(null);
      console.log('Background applied successfully');
    } catch (error) {
      console.error('Failed to apply background:', error);
      alert('Failed to apply background');
      setApplyEnabled(false);
    }
  };

  const handleRemoveBackground = (url: string) => {
    try {
      // Clean up blob URLs
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      
      const newHistory = backgroundHistory.filter(b => b !== url);
      setBackgroundHistory(newHistory);
      
      if (customBackground === url) {
        // Clean up current blob URL
        if (customBackground.startsWith('blob:')) {
          URL.revokeObjectURL(customBackground);
        }
        
        setCustomBackground(null);
        setPreviewUrl("");
        setBackgroundUrl("");
        setApplyEnabled(false);
      }
      
      console.log('Background removed:', url.substring(0, 50) + '...');
    } catch (error) {
      console.error('Failed to remove background:', error);
      alert('Failed to remove background');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight font-display">Settings</h1>
      </div>

      {/* Sound & Music */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sound & Music</h2>
        <div className="border border-border rounded-lg p-4 bg-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center ${soundEnabled ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-semibold text-sm">Sound Effects & Music</p>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle all game audio on or off</p>
              </div>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Volume</p>
              <span className="text-xs font-mono text-muted-foreground">{Math.round(soundVolume * 100)}%</span>
            </div>
            <Slider
              value={[soundVolume * 100]}
              onValueChange={([v]) => setSoundVolume(v / 100)}
              max={100}
              step={1}
              disabled={!soundEnabled}
              className={!soundEnabled ? "opacity-40" : ""}
            />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h2>
        <div className="border border-border rounded-lg p-4 bg-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center ${darkMode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-semibold text-sm">Dark Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark theme</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </div>
      </section>

      {/* Color Theme */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Color Theme</h2>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-md flex items-center justify-center bg-primary text-primary-foreground">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Accent Color</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose a color scheme for the UI</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {THEME_KEYS.map(key => {
              const theme = COLOR_THEMES[key];
              const active = colorTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => setColorTheme(key)}
                  className={`flex items-center gap-3 border rounded-lg p-3 transition-all ${
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${theme.preview} shrink-0`} />
                  <span className="text-sm font-medium">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Background Customization */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Background</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={backgroundEnabled}
              onCheckedChange={setBackgroundEnabled}
            />
            <span className="text-sm font-medium">Enable Custom Background</span>
          </div>
        </div>

        {backgroundEnabled && (
          <div className="space-y-3">
            {/* Background Preview */}
            {previewUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview</label>
                <div className="relative h-32 rounded-md overflow-hidden border border-border">
                  <img 
                    src={previewUrl} 
                    alt="Background preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Background History */}
            {backgroundHistory.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Recent Backgrounds</label>
                <div className="grid grid-cols-4 gap-2">
                  {backgroundHistory.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Background ${index + 1}`}
                        className="w-full h-16 object-cover rounded border border-border cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleBackgroundSelect(url)}
                      />
                      <button
                        onClick={() => handleRemoveBackground(url)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Image/GIF</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-accent"
                />
                <button
                  onClick={handleApplyBackground}
                  disabled={!applyEnabled}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Or Enter Image URL</label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={backgroundUrl}
                  onChange={(e) => {
                    setBackgroundUrl(e.target.value);
                    setPreviewUrl(e.target.value);
                    setApplyEnabled(e.target.value.trim() !== "");
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleApplyBackground}
                  disabled={!applyEnabled}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Skill Tree Format */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Skill Tree Format</h2>
        <div className="grid gap-3">
          {FORMAT_OPTIONS.map(opt => {
            const active = skillTreeFormat === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setSkillTreeFormat(opt.value)}
                className={`text-left border rounded-lg p-4 transition-all ${
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                  <div className="ml-auto">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? "border-primary" : "border-muted"}`}>
                      {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
