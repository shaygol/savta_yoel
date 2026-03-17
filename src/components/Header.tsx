import { useState, useEffect } from "react";
import { Phone, MapPin, Calendar, Menu, Shield, LogIn, LogOut, ClipboardList, UtensilsCrossed, ShoppingBag, Accessibility } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logoDefault from "@/assets/logo.png";
import Cart from "./Cart";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useSettings } from "@/hooks/useSettings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AppRole = 'admin' | 'user' | 'employee';

const Header = () => {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  const businessName = settings?.business_name || "קונדטוריית סבתא יואל";
  const contactPhone = settings?.contact_phone || "0508272844";
  const address = settings?.business_address || "עמק חרוד, הגלבוע";
  const logo = settings?.logo_url || logoDefault;

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const checkUserAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check roles in order of priority
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin' as AppRole
        });
        
        if (isAdmin) {
          setUserRole('admin');
          return;
        }

        const { data: isEmployee } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'employee' as AppRole
        });
        
        if (isEmployee) {
          setUserRole('employee');
          return;
        }

        setUserRole('user');
      } else {
        setUserRole(null);
      }
    };
    
    checkUserAndRole();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserAndRole();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    toast.success("התנתקת בהצלחה");
    closeMenu();
    navigate("/");
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          {/* Logo and Name */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt={businessName} className="w-14 h-14 object-contain" />
            <span className="text-xl font-rubik font-bold text-primary hidden sm:block">
              {businessName}
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/#menu" className="nav-link">
              <Calendar className="w-4 h-4" />
              <span>הזמנה</span>
            </Link>
            <Link to="/press" className="nav-link">
              <span>דיברו עלינו</span>
            </Link>
            <Link to="/tray-builder" className="nav-link">
              <UtensilsCrossed className="w-4 h-4" />
              <span>בנה מגש</span>
            </Link>
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-link"
            >
              <MapPin className="w-4 h-4" />
              <span>{address}</span>
            </a>
            {user && userRole === 'user' && (
              <Link to="/my-orders" className="nav-link">
                <ShoppingBag className="w-4 h-4" />
                <span>ההזמנות שלי</span>
              </Link>
            )}
            {userRole === 'admin' && (
              <Link to="/admin" className="nav-link text-accent">
                <Shield className="w-4 h-4" />
                <span>ניהול</span>
              </Link>
            )}
            {(userRole === 'admin' || userRole === 'employee') && (
              <Link to="/orders-management" className="nav-link text-accent">
                <ClipboardList className="w-4 h-4" />
                <span>הזמנות</span>
              </Link>
            )}
          </div>

          {/* Cart, CTA and Mobile Menu */}
          <div className="flex items-center gap-2">
            <Cart />
            {!user ? (
              <Link to="/auth" className="hidden md:flex items-center gap-1 nav-link text-sm">
                <LogIn className="w-4 h-4" />
                <span>התחברות</span>
              </Link>
            ) : (
              <button onClick={handleLogout} className="hidden md:flex items-center gap-1 nav-link text-sm">
                <LogOut className="w-4 h-4" />
                <span>התנתק</span>
              </button>
            )}
            <a href={`tel:${contactPhone}`} className="btn-cta flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">צור קשר</span>
            </a>
            
            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">פתח תפריט</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background">
                <SheetHeader>
                  <SheetTitle className="text-right font-rubik">תפריט</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link 
                    to="/#menu" 
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-medium">הזמנה</span>
                  </Link>
                  <Link 
                    to="/press" 
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">דיברו עלינו</span>
                  </Link>
                  <Link 
                    to="/tray-builder" 
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                    <span className="font-medium">בנה מגש אירוח</span>
                  </Link>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">{address}</span>
                  </a>
                  <a 
                    href={`tel:${contactPhone}`}
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-4"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="font-medium">צור קשר</span>
                  </a>
                  
                  {/* Role-based navigation */}
                  {userRole === 'admin' && (
                    <Link 
                      to="/admin" 
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">ניהול</span>
                    </Link>
                  )}
                  
                  {(userRole === 'admin' || userRole === 'employee') && (
                    <Link 
                      to="/orders-management" 
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent/80 text-accent-foreground hover:bg-accent/70 transition-colors"
                    >
                      <ClipboardList className="w-5 h-5" />
                      <span className="font-medium">ניהול הזמנות</span>
                    </Link>
                  )}

                  {user && userRole === 'user' && (
                    <Link 
                      to="/my-orders" 
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <span className="font-medium">ההזמנות שלי</span>
                    </Link>
                  )}

                  <Link 
                    to="/accessibility" 
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Accessibility className="w-5 h-5 text-primary" />
                    <span className="font-medium">הצהרת נגישות</span>
                  </Link>

                  {/* Login/Logout */}
                  {user ? (
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-destructive"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">התנתק</span>
                    </button>
                  ) : (
                    <Link 
                      to="/auth" 
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <LogIn className="w-5 h-5 text-primary" />
                      <span className="font-medium">התחברות</span>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
