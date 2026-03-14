import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import ScrollReveal from "@/components/ScrollReveal";

const Hero = () => {
  const { data: settings, isLoading } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const textY  = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  const businessName = settings?.business_name || "קונדטוריית סבתא יואל";
  const slogan       = settings?.business_slogan || "מקום קטן עם טעמים גדולים - קפה שמרגיש בית";
  const heroText     = settings?.hero_section_text ||
    "בית קפה כפרי בלב הנוף של ההרים התנ״כיים ועמק המעיינות, המשלב אווירה חמה עם חומרי גלם מקומיים ותפריט עונתי. המקום מציע קפה איכותי, מאפים טריים וחוויית אירוח שמרגישה כמו בית מול הנוף הכי יפה בארץ!";
  const address      = settings?.business_address || "עמק חרוד, הגלבוע";
  const showSkeleton = isLoading && !settings;

  const images: string[] = (() => {
    if (settings?.hero_images && settings.hero_images.length > 0) return settings.hero_images;
    const combined: string[] = [];
    if (settings?.hero_image_url) combined.push(settings.hero_image_url);
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

  useEffect(() => { setCurrentIndex(0); }, [images.length]);

  return (
    <section ref={sectionRef} className="relative py-12 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">

          {/* Hero Image with parallax */}
          <motion.div
            style={{ y: imageY }}
            className="relative order-1 md:order-2"
          >
            <ScrollReveal direction="left" delay={0.1}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                {showSkeleton ? (
                  <div className="w-full h-64 md:h-96 bg-muted animate-pulse" />
                ) : (
                  <div className="relative w-full h-64 md:h-96">
                    {images.length > 0 ? images.map((src, i) => (
                      <img
                        key={src}
                        src={src}
                        alt={`${businessName} - תמונה ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                        style={{ opacity: i === currentIndex ? 1 : 0 }}
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                    )) : (
                      <div className="w-full h-64 md:h-96 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">אין תמונה</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>

              {images.length > 1 && !showSkeleton && (
                <div className="flex justify-center gap-2 mt-3">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === currentIndex ? "bg-primary w-4" : "bg-muted-foreground/30 w-2"
                      }`}
                      aria-label={`תמונה ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </ScrollReveal>
          </motion.div>

          {/* Hero Content with parallax */}
          <motion.div
            style={{ y: textY }}
            className="order-2 md:order-1 text-center md:text-right"
          >
            <ScrollReveal direction="right" delay={0}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4">
                {businessName}
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.15}>
              <p className="text-xl md:text-2xl text-accent font-medium mb-6">
                {slogan}
              </p>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.25}>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {heroText}
              </p>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.35}>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:text-primary transition-colors font-medium"
              >
                <MapPin className="w-5 h-5" />
                <span className="underline underline-offset-4">{address}</span>
              </a>
            </ScrollReveal>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
