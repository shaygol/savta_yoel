import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const formatCountdown = (ms: number) => {
  if (ms <= 0) return { h: "00", m: "00", s: "00" };
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
};

const FlipDigit = ({ value }: { value: string }) => (
  <AnimatePresence mode="popLayout">
    <motion.span
      key={value}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="inline-block tabular-nums"
    >
      {value}
    </motion.span>
  </AnimatePresence>
);

const OrderCountdown = () => {
  const { data: settings } = useSettings();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const schedule = settings?.weekly_ordering_schedule as WeeklySchedule | undefined;
  if (!schedule) return null;

  const dayIndex = now.getDay();
  const todayKey = String(dayIndex);
  const today = schedule[todayKey];

  let status: "open" | "closed" | "always_open" = "closed";
  let countdownMs = 0;
  let label = "";
  let nextOpenDay = "";

  if (today?.enabled) {
    if (today.always_open) {
      status = "always_open";
    } else {
      const openTime  = parseTime(today.start, now);
      const closeTime = parseTime(today.end, now);
      if (now >= openTime && now < closeTime) {
        status = "open";
        countdownMs = closeTime.getTime() - now.getTime();
        label = "סוגר בעוד";
      } else if (now < openTime) {
        status = "closed";
        countdownMs = openTime.getTime() - now.getTime();
        label = "נפתח בעוד";
      }
    }
  }

  if (status === "closed" && countdownMs === 0) {
    for (let i = 1; i <= 7; i++) {
      const nextKey = String((dayIndex + i) % 7);
      const nextDay = schedule[nextKey];
      if (nextDay?.enabled) {
        nextOpenDay = DAY_NAMES[(dayIndex + i) % 7];
        if (!nextDay.always_open) {
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + i);
          const openTime = parseTime(nextDay.start, nextDate);
          countdownMs = openTime.getTime() - now.getTime();
          label = `נפתח ביום ${nextOpenDay} בעוד`;
        }
        break;
      }
    }
  }

  const { h, m, s } = formatCountdown(countdownMs);

  return (
    <ScrollReveal direction="up" delay={0.1}>
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6 flex flex-col items-center gap-3 shadow-sm max-w-sm mx-auto">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground text-sm">
            {status === "always_open" ? "פתוח כל היום" : status === "open" ? "אנחנו פתוחים עכשיו" : "אנחנו סגורים עכשיו"}
          </span>
          <span className={`w-2.5 h-2.5 rounded-full ${status === "closed" ? "bg-red-400" : "bg-green-400"} animate-pulse`} />
        </div>

        {status !== "always_open" && countdownMs > 0 && (
          <>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-center gap-1 text-3xl font-bold text-primary tabular-nums" dir="ltr">
              <FlipDigit value={h} />
              <span className="opacity-60">:</span>
              <FlipDigit value={m} />
              <span className="opacity-60">:</span>
              <FlipDigit value={s} />
            </div>
            <p className="text-xs text-muted-foreground">שעות : דקות : שניות</p>
          </>
        )}

        {today?.enabled && !today.always_open && (
          <p className="text-xs text-muted-foreground">
            שעות היום: {today.start} – {today.end}
          </p>
        )}
      </div>
    </ScrollReveal>
  );
};

export default OrderCountdown;
