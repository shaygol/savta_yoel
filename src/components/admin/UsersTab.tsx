import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Shield, Loader2, UserCog, Briefcase, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface UserWithRoles {
  user_id: string;
  roles: UserRole[];
  profile?: {
    name: string | null;
    phone: string | null;
  };
}

const emailSchema = z.string().email({ message: "כתובת אימייל לא תקינה" });

const roleLabels: Record<AppRole, string> = {
  admin: "מנהל",
  employee: "עובד",
  user: "משתמש",
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  employee: <Briefcase className="w-3 h-3" />,
  user: <User className="w-3 h-3" />,
};

const roleColors: Record<AppRole, string> = {
  admin: "bg-accent text-accent-foreground",
  employee: "bg-primary/20 text-primary",
  user: "bg-muted text-muted-foreground",
};

const UsersTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [error, setError] = useState("");

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, phone");

      if (profilesError) throw profilesError;

      // Group roles by user_id
      const userMap = new Map<string, UserWithRoles>();

      roles?.forEach((role) => {
        const existing = userMap.get(role.user_id);
        if (existing) {
          existing.roles.push(role as UserRole);
        } else {
          const profile = profiles?.find((p) => p.user_id === role.user_id);
          userMap.set(role.user_id, {
            user_id: role.user_id,
            roles: [role as UserRole],
            profile: profile ? { name: profile.name, phone: profile.phone } : undefined,
          });
        }
      });

      return Array.from(userMap.values());
    },
  });

  // Add new user with role
  const addUserMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      role,
    }: {
      email: string;
      password: string;
      role: AppRole;
    }) => {
      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          throw new Error("משתמש עם אימייל זה כבר קיים במערכת");
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("שגיאה ביצירת המשתמש");
      }

      // Add role to the new user
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: signUpData.user.id,
        role,
      });

      if (roleError) throw roleError;

      return signUpData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("משתמש חדש נוסף בהצלחה");
      setIsDialogOpen(false);
      setEmail("");
      setPassword("");
      setSelectedRole("user");
      setError("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "שגיאה בהוספת משתמש");
    },
  });

  // Add role to existing user
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("תפקיד נוסף בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בהוספת תפקיד");
    },
  });

  // Remove role
  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast.success("תפקיד הוסר בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בהסרת תפקיד");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    if (password.length < 6) {
      setError("סיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    addUserMutation.mutate({ email, password, role: selectedRole });
  };

  const getAvailableRoles = (currentRoles: UserRole[]): AppRole[] => {
    const assignedRoles = currentRoles.map((r) => r.role);
    return (["admin", "employee", "user"] as AppRole[]).filter(
      (role) => !assignedRoles.includes(role)
    );
  };

  const countAdmins = () => {
    return users?.filter((u) => u.roles.some((r) => r.role === "admin")).length || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          ניהול משתמשים ותפקידים
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              הוסף משתמש
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת משתמש חדש</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">תפקיד</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">מנהל</SelectItem>
                    <SelectItem value="employee">עובד</SelectItem>
                    <SelectItem value="user">משתמש</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={addUserMutation.isPending}>
                {addUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    יוצר משתמש...
                  </>
                ) : (
                  "הוסף משתמש"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {users && users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">משתמש</TableHead>
                <TableHead className="text-right">תפקידים</TableHead>
                <TableHead className="text-right">הוסף תפקיד</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="space-y-1">
                      {user.profile?.name ? (
                        <p className="font-medium">{user.profile.name}</p>
                      ) : (
                        <p className="font-mono text-xs text-muted-foreground">
                          {user.user_id.slice(0, 8)}...
                        </p>
                      )}
                      {user.profile?.phone && (
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {user.profile.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${roleColors[role.role]}`}
                        >
                          {roleIcons[role.role]}
                          {roleLabels[role.role]}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getAvailableRoles(user.roles).length > 0 && (
                      <Select
                        onValueChange={(role) =>
                          addRoleMutation.mutate({ userId: user.user_id, role: role as AppRole })
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="בחר..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles(user.roles).map((role) => (
                            <SelectItem key={role} value={role}>
                              {roleLabels[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.roles.map((role) => {
                        const isLastAdmin = role.role === "admin" && countAdmins() <= 1;
                        return (
                          <AlertDialog key={role.id}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive h-8 px-2"
                                disabled={isLastAdmin}
                                title={isLastAdmin ? "לא ניתן להסיר את המנהל האחרון" : `הסר ${roleLabels[role.role]}`}
                              >
                                <Trash2 className="w-3 h-3 ml-1" />
                                <span className="text-xs">{roleLabels[role.role]}</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>הסרת תפקיד</AlertDialogTitle>
                                <AlertDialogDescription>
                                  האם אתה בטוח שברצונך להסיר את תפקיד ה{roleLabels[role.role]} ממשתמש
                                  זה?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row-reverse gap-2">
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeRoleMutation.mutate(role.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  הסר תפקיד
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">אין משתמשים במערכת</p>
        )}
        <p className="text-sm text-muted-foreground mt-4">
          💡 לא ניתן להסיר את המנהל האחרון במערכת
        </p>
      </CardContent>
    </Card>
  );
};

export default UsersTab;
