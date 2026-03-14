import { MessageCircle, MapPin, Clock, Accessibility } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import logoDefault from "@/assets/logo.png";

const DAYS_MAP: Record<string, string> = {
  "0": "ראשון",
  "1": "שני",
  "2": "שלישי",
  "3": "רביעי",
  "4": "חמישי",
  "5": "שישי",
  "6": "שבת",
};

const Footer = () => {
  const { data: settings } = useSettings();

  const businessName = settings?.business_name || "קונדטוריית סבתא יואל";
  const slogan = settings?.business_slogan || "מקום קטן עם טעמים גדולים";
  const footerText = settings?.footer_section_text || "בית קפה כפרי בלב הנוף של ההרים התנ״כיים";
  const contactPhone = settings?.contact_phone || "0508272844";
  const address = settings?.business_address || "עמק חרוד, הגלבוע";
  const logo = settings?.logo_url || logoDefault;
  const schedule = settings?.weekly_ordering_schedule;

  const getOpeningHours = (): Array<{ key: string; day: string; hours: string }> => {
    if (!schedule) {
      return [
        { key: "0", day: "ראשון", hours: "6:00 - 10:00" },
        { key: "1", day: "שני", hours: "10:00 - 15:00" },
        { key: "2", day: "שלישי", hours: "10:00 - 15:00" },
        { key: "3", day: "רביעי", hours: "כל היום" },
        { key: "4", day: "חמישי", hours: "כל היום" },
        { key: "5", day: "שישי", hours: "6:00 - 10:00" },
        { key: "6", day: "שבת", hours: "סגור" },
      ];
    }

    const orderedDayKeys = ["0", "1", "2", "3", "4", "5", "6"] as const;
    const seen = new Set<string>();

    return orderedDayKeys
      .filter((k) => {
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map((key) => {
        const dayName = DAYS_MAP[key];
        const daySchedule = schedule[key];

        if (!daySchedule?.enabled) {
          return { key, day: dayName, hours: "סגור" };
        }
        if (daySchedule.always_open) {
          return { key, day: dayName, hours: "כל היום" };
        }
        return { key, day: dayName, hours: `${daySchedule.start} - ${daySchedule.end}` };
      });
  };

  const openingHours = getOpeningHours();

  return (
    <footer id="contact" className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Logo & Info */}
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <img src={logo} alt={businessName} className="w-16 h-16 object-contain bg-primary-foreground rounded-full p-1" />
              <div>
                <h3 className="font-bold text-xl">{businessName}</h3>
                <p className="text-primary-foreground/80 text-sm">{slogan}</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              {footerText}
            </p>
          </div>

          {/* Opening Hours */}
          <div className="text-right">
            <h4 className="font-bold text-lg mb-4 flex items-center justify-end gap-2">
              <Clock className="w-5 h-5" />
              שעות פתיחה
            </h4>
            <ul className="space-y-1 text-sm text-primary-foreground/80">
              {openingHours.map(({ key, day, hours }) => (
                <li key={key} className="flex justify-end gap-3">
                  <span className="font-medium">{day}:</span>
                  <span className={`w-24 text-right ${hours === "סגור" ? "text-primary-foreground/50" : ""}`}>{hours}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <div className="space-y-3">
              <a 
                href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 hover:text-primary-foreground/80 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>שלח הודעה בוואטסאפ</span>
              </a>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 hover:text-primary-foreground/80 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                <span>{address}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-10 pt-6 text-center text-sm text-primary-foreground/60 flex flex-col sm:flex-row items-center justify-center gap-3">
          <p>© {new Date().getFullYear()} {businessName}. כל הזכויות שמורות.</p>
          <Link to="/accessibility" className="flex items-center gap-1 hover:text-primary-foreground/80 transition-colors">
            <Accessibility className="w-4 h-4" />
            <span>הצהרת נגישות</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;