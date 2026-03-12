import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import ImageUpload from "./ImageUpload";

interface Article {
  id: string;
  title: string;
  source: string;
  snippet: string | null;
  url: string | null;
  image_url: string | null;
  publication_date: string | null;
  display_order: number;
}

const ArticlesTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    source: "",
    snippet: "",
    url: "",
    image_url: "",
    publication_date: "",
    display_order: 0,
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Article[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        ...data,
        publication_date: data.publication_date || null,
      };
      if (data.id) {
        const { error } = await supabase.from("articles").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success(editingArticle ? "הכתבה עודכנה" : "הכתבה נוספה");
      resetForm();
    },
    onError: () => {
      toast.error("שגיאה בשמירת הכתבה");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("הכתבה נמחקה");
    },
    onError: () => {
      toast.error("שגיאה במחיקת הכתבה");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      source: "",
      snippet: "",
      url: "",
      image_url: "",
      publication_date: "",
      display_order: 0,
    });
    setEditingArticle(null);
    setIsDialogOpen(false);
  };

  const openEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      source: article.source,
      snippet: article.snippet || "",
      url: article.url || "",
      image_url: article.image_url || "",
      publication_date: article.publication_date || "",
      display_order: article.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingArticle ? { ...formData, id: editingArticle.id } : formData);
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>כתבות ואזכורים</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף כתבה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingArticle ? "ערוך כתבה" : "הוסף כתבה חדשה"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>כותרת</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>מקור</Label>
                  <Input
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>תקציר</Label>
                  <Textarea
                    value={formData.snippet}
                    onChange={(e) => setFormData({ ...formData, snippet: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>קישור לכתבה</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <ImageUpload
                  label="תמונת הכתבה"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  folder="articles"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>תאריך פרסום</Label>
                    <Input
                      type="date"
                      value={formData.publication_date}
                      onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>סדר תצוגה</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "שומר..." : "שמור"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>כותרת</TableHead>
                <TableHead>מקור</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>קישור</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles?.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>{article.title}</TableCell>
                  <TableCell>{article.source}</TableCell>
                  <TableCell>
                    {article.publication_date
                      ? format(new Date(article.publication_date), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {article.url && (
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(article)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(article.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {(!articles || articles.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">אין כתבות</div>
        )}
      </CardContent>
    </Card>
  );
};

export default ArticlesTab;
