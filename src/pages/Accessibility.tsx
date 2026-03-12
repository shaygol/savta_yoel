import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSettings } from "@/hooks/useSettings";
import { Accessibility as AccessibilityIcon, MessageCircle } from "lucide-react";


const Accessibility = () => {
  const { data: settings } = useSettings();
  const businessName = settings?.business_name || "קונדטוריית סבתא יואל";
  const contactPhone = settings?.contact_phone || "0508272844";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <AccessibilityIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground font-rubik">הצהרת נגישות</h1>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">כללי</h2>
            <p className="leading-relaxed">
              {businessName} מחויבת להנגשת האתר לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, 
              התשנ&quot;ח-1998, ולתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013.
            </p>
            <p className="leading-relaxed">
              האתר עומד בדרישות התקן הישראלי ת&quot;י 5568, המבוסס על הנחיות WCAG 2.1 ברמת AA של ארגון W3C העולמי.
            </p>
          </section>

          {/* What we do */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">פעולות שנעשו להנגשת האתר</h2>
            <ul className="list-disc list-inside space-y-2 text-foreground/80">
              <li>התאמת האתר לגלישה באמצעות טכנולוגיות מסייעות וקוראי מסך (Screen Readers)</li>
              <li>ניווט באמצעות מקלדת בלבד – כל פונקציות האתר זמינות ללא שימוש בעכבר</li>
              <li>שימוש בתגיות סמנטיות (HTML5 Semantic Elements) לסדר תוכן לוגי ונגיש</li>
              <li>מבנה כותרות (Headings) היררכי ומסודר לניווט קל</li>
              <li>טקסט חלופי (alt text) לתמונות ותוכן גרפי</li>
              <li>ניגודיות צבעים מספקת בין טקסט לרקע בהתאם לדרישות WCAG 2.1 AA</li>
              <li>אפשרות הגדלת טקסט עד 200% ללא אובדן תוכן או פונקציונליות</li>
              <li>תמיכה בשינוי גודל הגופן דרך הגדרות הדפדפן</li>
              <li>טפסים עם תוויות (labels) ברורות והנחיות להזנת נתונים</li>
              <li>הודעות שגיאה ברורות ומנחות בתהליכי ההזמנה</li>
              <li>תמיכה מלאה בממשק RTL (ימין לשמאל) בשפה העברית</li>
            </ul>
          </section>

          {/* Technologies */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">טכנולוגיות בהן נעשה שימוש</h2>
            <p className="leading-relaxed">
              האתר פותח תוך הקפדה על שימוש בטכנולוגיות מודרניות התומכות בנגישות, כולל HTML5 סמנטי, 
              CSS3 עם תמיכה ב-prefers-reduced-motion ו-prefers-color-scheme, ו-ARIA attributes במקומות הנדרשים.
            </p>
          </section>

          {/* Browsing recommendations */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">דפדפנים מומלצים</h2>
            <p className="leading-relaxed">
              לחוויית גלישה מיטבית ונגישה, מומלץ להשתמש בגרסאות העדכניות של הדפדפנים הבאים:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Apple Safari</li>
              <li>Microsoft Edge</li>
            </ul>
          </section>

          {/* Known limitations */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">מגבלות ידועות</h2>
            <p className="leading-relaxed">
              למרות מאמצינו להנגיש את כל הדפים והתכנים באתר, ייתכן שחלקים מסוימים טרם הונגשו באופן מלא. 
              אנו ממשיכים לעבוד על שיפור הנגישות ומזמינים אתכם ליצור איתנו קשר במקרה של קושי.
            </p>
          </section>

          {/* Legal basis */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">הבסיס החוקי</h2>
            <p className="leading-relaxed">
              הצהרת נגישות זו מבוססת על הדרישות הבאות:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/80">
              <li>
                <strong>חוק שוויון זכויות לאנשים עם מוגבלות, התשנ&quot;ח-1998</strong> – 
                המחייב הנגשת שירותים לציבור, כולל שירותים דיגיטליים
              </li>
              <li>
                <strong>תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013</strong> – 
                המפרטות את החובות להנגשת אתרי אינטרנט
              </li>
              <li>
                <strong>התקן הישראלי ת&quot;י 5568</strong> – 
                המבוסס על תקן WCAG 2.1 ברמה AA של ארגון W3C
              </li>
            </ul>
          </section>

          {/* Contact for accessibility */}
          <section className="bg-muted rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-3">יצירת קשר בנושא נגישות</h2>
            <p className="leading-relaxed mb-4">
              אם נתקלתם בבעיית נגישות באתר, או שיש לכם הצעות לשיפור, נשמח לשמוע מכם. 
              אנו מתחייבים לטפל בכל פנייה בנושא נגישות תוך 14 ימי עסקים.
            </p>
            <div className="space-y-3">
              <a 
                href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                <span>שלח הודעה בוואטסאפ</span>
              </a>
            </div>
          </section>

          {/* Last updated */}
          <section className="text-sm text-muted-foreground border-t border-border pt-4">
            <p>הצהרת נגישות זו עודכנה לאחרונה בתאריך: מרץ 2026</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Accessibility;
