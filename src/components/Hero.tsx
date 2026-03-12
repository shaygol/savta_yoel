import { useState, useEffect, useCallback } from "react";
import { MapPin } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import heroImageDefault from "@/assets/hero-cafe.jpg";

const Hero = () => {
  const { data: settings, isLoading } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);

  const businessName = settings?.business_name || "קונדטוריית סבתא יואל";
  const slogan = settings?.business_slogan || "מקום קטן עם טעמים גדולים - קפה שמרגיש בית";
  const heroText = settings?.hero_section_text || 
    "בית קפה כפרי בלב הנוף של הרי הגלבוע ועמק המעיינות, המשלב אווירה חמה עם חומרי גלם מקומיים ותפריט עונתי. המקום מציע קפה איכותי, מאפים טריים וחוויית אירוח שמרגישה כמו בית מול הנוף הכי יפה בארץ!";
  const address = settings?.business_address || "עמק חרוד, הגלבוע";
  const showSkeleton = isLoading && !settings;

  // Build images array: use hero_images if available, otherwise combine default + DB image
  const images: string[] = (() => {
    if (settings?.hero_images && settings.hero_images.length > 0) {
      return settings.hero_images;
    }
    const combined: string[] = [heroImageDefault];
    if (settings?.hero_image_url) {
      combined.push(settings.hero_image_url);
    }
    return combined;
  })();

  const rotateImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(rotateImage, 5000);
    return () => clearInterval(interval);
  }, [images.length, rotateImage]);

  // Reset index if images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [images.length]);

  return (
    <section className="relative py-12 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Hero Image */}
          <div className="relative order-1 md:order-2 animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {showSkeleton ? (
                <div className="w-full h-64 md:h-96 bg-muted animate-pulse" />
              ) : (
                <div className="relative w-full h-64 md:h-96">
                  {images.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt={`${businessName} - תמונה ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                      style={{ opacity: i === currentIndex ? 1 : 0 }}
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                    />
                  ))}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            {/* Dots indicator */}
            {images.length > 1 && !showSkeleton && (
              <div className="flex justify-center gap-2 mt-3">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? "bg-primary w-4"
                        : "bg-muted-foreground/30"
                    }`}
                    aria-label={`תמונה ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Hero Content */}
          <div className="order-2 md:order-1 text-center md:text-right">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4 animate-slide-in-right">
              {businessName}
            </h1>
            <p className="text-xl md:text-2xl text-accent font-medium mb-6 animate-slide-in-right" style={{ animationDelay: "0.1s" }}>
              {slogan}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8 animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
              {heroText}
            </p>
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 text-accent hover:text-primary transition-colors font-medium animate-slide-in-right"
              style={{ animationDelay: "0.3s" }}
            >
              <MapPin className="w-5 h-5" />
              <span className="underline underline-offset-4">{address}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
