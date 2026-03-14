import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type AppRole = 'admin' | 'user' | 'employee';

const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userId = data.user.id;

      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin' as AppRole
      });

      if (isAdmin) {
        toast.success("התחברת בהצלחה!");
        navigate("/admin");
        return;
      }

      const { data: isEmployee } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'employee' as AppRole
      });

      if (isEmployee) {
        toast.success("התחברת בהצלחה!");
        navigate("/orders-management");
        return;
      }

      toast.success("התחברת בהצלחה!");
      navigate("/");
      
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    if (password.length < 6) {
      toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            phone: phone
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("כתובת האימייל כבר רשומה במערכת");
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        // Update profile with name and phone
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name, phone })
          .eq('user_id', data.user.id);

        if (profileError) {
          if (import.meta.env.DEV) console.error('Error updating profile:', profileError);
        }

        toast.success("נרשמת בהצלחה! מתחבר...");
        navigate("/");
      }
      
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהרשמה");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setPhone("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="סבתא יואל" className="w-20 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl">{isSignUp ? "הרשמה" : "התחברות"}</CardTitle>
          <CardDescription>
            {isSignUp ? "צור חשבון חדש" : "היכנס לחשבון שלך"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ישראל ישראלי"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-1234567"
                    dir="ltr"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
              />
            </div>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (isSignUp ? "נרשם..." : "מתחבר...") 
                : (isSignUp ? "הרשמה" : "התחבר")
              }
            </Button>

            {!isSignUp && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast.error("הזן כתובת אימייל קודם");
                    return;
                  }
                  setIsLoading(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast.success("נשלח אימייל לאיפוס סיסמה");
                  } catch (error: any) {
                    toast.error(error.message || "שגיאה בשליחת אימייל");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="text-sm text-primary hover:underline w-full text-center"
              >
                שכחת סיסמה?
              </button>
            )}
          </form>

          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                resetForm();
              }}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp 
                ? "כבר יש לך חשבון? התחבר" 
                : "אין לך חשבון? הירשם"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
