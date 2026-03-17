import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Save } from "lucide-react";
import ImageUpload from "./ImageUpload";

const DAYS = [
  { key: "0", label: "ראשון" },
  { key: "1", label: "שני" },
  { key: "2", label: "שלישי" },
  { key: "3", label: "רביעי" },
  { key: "4", label: "חמישי" },
  { key: "5", label: "שישי" },
  { key: "6", label: "שבת" },
];

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  always_open: boolean;
}

const SettingsTab = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, any>>({});

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("key, value");
      if (error) throw error;
      const result: Record<string, any> = {};
      data?.forEach((row) => {
        result[row.key] = typeof row.value === "string" ? row.value.replace(/^"|"$/g, "") : row.value;
      });
      return result;
    },
  });

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      for (const [key, value] of Object.entries(updates)) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key, value: typeof value === "object" ? value : value }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("ההגדרות נשמרו");
    },
    onError: () => {
      toast.error("שגיאה בשמירת ההגדרות");
    },
  });

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateScheduleDay = (day: string, field: keyof DaySchedule, value: any) => {
    const schedule = settings.weekly_ordering_schedule || {};
    const daySchedule = schedule[day] || { enabled: false, start: "08:00", end: "18:00", always_open: false };
    setSettings((prev) => ({
      ...prev,
      weekly_ordering_schedule: {
        ...schedule,
        [day]: { ...daySchedule, [field]: value },
      },
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>הגדרות האתר</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Business Info */}
            <AccordionItem value="business">
              <AccordionTrigger>פרטי העסק</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>שם העסק</Label>
                    <Input
                      value={settings.business_name || ""}
                      onChange={(e) => updateSetting("business_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>סלוגן</Label>
                    <Input
                      value={settings.business_slogan || ""}
                      onChange={(e) => updateSetting("business_slogan", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>שם איש קשר</Label>
                    <Input
                      value={settings.contact_person_name || ""}
                      onChange={(e) => updateSetting("contact_person_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>טלפון</Label>
                    <Input
                      value={settings.contact_phone || ""}
                      onChange={(e) => updateSetting("contact_phone", e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>כתובת</Label>
                    <Input
                      value={settings.business_address || ""}
                      onChange={(e) => updateSetting("business_address", e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Site Content */}
            <AccordionItem value="content">
              <AccordionTrigger>תוכן האתר</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>טקסט Hero</Label>
                  <Textarea
                    value={settings.hero_section_text || ""}
                    onChange={(e) => updateSetting("hero_section_text", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>תיאור התפריט</Label>
                  <Textarea
                    value={settings.menu_description || ""}
                    onChange={(e) => updateSetting("menu_description", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>טקסט הפוטר</Label>
                  <Textarea
                    value={settings.footer_section_text || ""}
                    onChange={(e) => updateSetting("footer_section_text", e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Images */}
            <AccordionItem value="images">
              <AccordionTrigger>תמונות</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <ImageUpload
                  label="לוגו"
                  value={settings.logo_url || ""}
                  onChange={(url) => updateSetting("logo_url", url)}
                  folder="branding"
                  previewClass="h-20 w-full object-contain rounded-lg border bg-muted/30"
                />
                <div className="space-y-3">
                  <Label className="text-base font-medium">תמונות Hero (מתחלפות אוטומטית)</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(() => {
                      const heroImages: string[] = settings.hero_images?.length
                        ? settings.hero_images
                        : settings.hero_image_url
                        ? [settings.hero_image_url]
                        : [];
                      return heroImages.map((url: string, index: number) => (
                        <div key={index} className="relative group">
                          {url ? (
                            <>
                              <img
                                src={url}
                                alt={`תמונה ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <button
                                type="button"
                                className="absolute top-1 left-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const updated = heroImages.filter((_: string, i: number) => i !== index);
                                  updateSetting("hero_images", updated);
                                }}
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <ImageUpload
                              label={`תמונה ${index + 1}`}
                              value={url}
                              onChange={(newUrl) => {
                                const updated = [...heroImages];
                                updated[index] = newUrl;
                                updateSetting("hero_images", updated);
                              }}
                              folder="branding"
                              previewClass="w-full h-24 object-cover rounded-lg border"
                            />
                          )}
                        </div>
                      ));
                    })()}
                    <button
                      type="button"
                      className="h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm"
                      onClick={() => {
                        const current: string[] = settings.hero_images?.length
                          ? settings.hero_images
                          : settings.hero_image_url
                          ? [settings.hero_image_url]
                          : [];
                        updateSetting("hero_images", [...current, ""]);
                      }}
                    >
                      <span className="text-xl leading-none">+</span>
                      <span>הוסף תמונה</span>
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Payment */}
            <AccordionItem value="payment">
              <AccordionTrigger>תשלומים</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>קישור PayBox</Label>
                  <Input
                    value={settings.paybox_url || ""}
                    onChange={(e) => updateSetting("paybox_url", e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.paybox_enabled || false}
                    onCheckedChange={(checked) => updateSetting("paybox_enabled", checked)}
                  />
                  <Label>אפשר תשלום ב-PayBox</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.bit_enabled || false}
                    onCheckedChange={(checked) => updateSetting("bit_enabled", checked)}
                  />
                  <Label>אפשר תשלום ב-Bit</Label>
                </div>
                <div className="space-y-2">
                  <Label>קישור תשלום Bit</Label>
                  <Input
                    value={settings.bit_payment_url || ""}
                    onChange={(e) => updateSetting("bit_payment_url", e.target.value)}
                    dir="ltr"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Schedule */}
            <AccordionItem value="schedule">
              <AccordionTrigger>שעות פעילות</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {DAYS.map((day) => {
                  const schedule = settings.weekly_ordering_schedule?.[day.key] || {
                    enabled: false,
                    start: "08:00",
                    end: "18:00",
                    always_open: false,
                  };
                  return (
                    <div key={day.key} className="flex items-center gap-4 flex-wrap">
                      <div className="w-16 font-medium">{day.label}</div>
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => updateScheduleDay(day.key, "enabled", checked)}
                      />
                      {schedule.enabled && (
                        <>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={schedule.start}
                              onChange={(e) => updateScheduleDay(day.key, "start", e.target.value)}
                              className="w-28"
                              disabled={schedule.always_open}
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={schedule.end}
                              onChange={(e) => updateScheduleDay(day.key, "end", e.target.value)}
                              className="w-28"
                              disabled={schedule.always_open}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={schedule.always_open}
                              onCheckedChange={(checked) =>
                                updateScheduleDay(day.key, "always_open", checked)
                              }
                            />
                            <Label className="text-sm">פתוח כל היום</Label>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>

            {/* Tray Discounts */}
            <AccordionItem value="tray-discounts">
              <AccordionTrigger>הנחות מגש אירוח</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {[
                  { key: "small", label: "מגש קטן" },
                  { key: "medium", label: "מגש בינוני" },
                  { key: "large", label: "מגש גדול" },
                ].map((tray) => {
                  const config = settings.tray_discount_config?.[tray.key] || {};
                  const updateTrayConfig = (field: string, value: number) => {
                    const current = settings.tray_discount_config || {};
                    updateSetting("tray_discount_config", {
                      ...current,
                      [tray.key]: { ...current[tray.key], [field]: value },
                    });
                  };
                  return (
                    <div key={tray.key} className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-medium">{tray.label}</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">קיבולת מקסימלית</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.capacity ?? ""}
                            onChange={(e) => updateTrayConfig("capacity", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">מינימום להנחה</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.minItems ?? ""}
                            onChange={(e) => updateTrayConfig("minItems", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">אחוז הנחה %</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={config.discountPercent ?? ""}
                            onChange={(e) => updateTrayConfig("discountPercent", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>

            {/* Site Status */}
            <AccordionItem value="status">
              <AccordionTrigger>סטטוס האתר</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.site_enabled !== false}
                    onCheckedChange={(checked) => updateSetting("site_enabled", checked)}
                  />
                  <Label>האתר פעיל</Label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button onClick={handleSave} className="mt-6 w-full" disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 ml-2" />
            {saveMutation.isPending ? "שומר..." : "שמור הגדרות"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
