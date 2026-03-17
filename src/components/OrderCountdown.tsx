import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import ScrollReveal from "@/components/ScrollReveal";

type DaySchedule = {
  enabled: boolean;
  always_open: boolean;
  start: string;
  end: string;
};

type WeeklySchedule = Record<string, DaySchedule>;

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const parseTime = (timeStr: string, baseDate: Date): Date => {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
};

const OrderCountdown = () => {
  const { data: settings } = useSettings();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const schedule = settings?.weekly_ordering_schedule as WeeklySchedule | undefined;
  if (!schedule) return null;

  const dayIndex = now.getDay();
  const todayKey = String(dayIndex);
  const today = schedule[todayKey];

  let status: "open" | "closed" | "always_open" = "closed";
  let nextOpenInfo = "";

  if (today?.enabled) {
    if (today.always_open) {
      status = "always_open";
    } else {
      const openTime  = parseTime(today.start, now);
      const closeTime = parseTime(today.end, now);
      if (now >= openTime && now < closeTime) {
        status = "open";
      } else if (now < openTime) {
        status = "closed";
        nextOpenInfo = `נפתח היום ב-${today.start}`;
      }
    }
  }

  if (status === "closed" && !nextOpenInfo) {
    for (let i = 1; i <= 7; i++) {
      const nextKey = String((dayIndex + i) % 7);
      const nextDay = schedule[nextKey];
      if (nextDay?.enabled) {
        const dayName = DAY_NAMES[(dayIndex + i) % 7];
        nextOpenInfo = nextDay.always_open
          ? `נפתח ביום ${dayName}`
          : `נפתח ביום ${dayName} ב-${nextDay.start}`;
        break;
      }
    }
  }

  const isOpen = status !== "closed";

  return (
    <ScrollReveal direction="up" delay={0.1}>
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground py-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500" : "bg-red-400"}`} />
          <span className={`font-medium ${isOpen ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
            {status === "always_open" ? "פתוח כל היום" : isOpen ? "פתוח עכשיו" : "סגור עכשיו"}
          </span>
        </div>
        {today?.enabled && !today.always_open && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {isOpen ? `עד ${today.end}` : nextOpenInfo}
          </span>
        )}
        {!isOpen && nextOpenInfo && today?.always_open === false && !today?.enabled && (
          <span>{nextOpenInfo}</span>
        )}
      </div>
    </ScrollReveal>
  );
};

export default OrderCountdown;
