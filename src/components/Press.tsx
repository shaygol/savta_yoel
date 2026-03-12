import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Article {
  id: string;
  title: string;
  source: string;
  publication_date: string | null;
  snippet: string | null;
  image_url: string | null;
  url: string | null;
}

const Press = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Article[];
    }
  });

  if (isLoading) {
    return (
      <section id="press" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="section-title">דיברו עלינו</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="press" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="section-title">דיברו עלינו</h2>
        <p className="section-subtitle">מה אומרים על סבתא יואל בעיתונות</p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {articles?.map((article, index) => (
            <article 
              key={article.id}
              className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in flex flex-col"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {article.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span className="font-medium text-accent">{article.source}</span>
                  <span>•</span>
                  <span>
                    {article.publication_date 
                      ? new Date(article.publication_date).toLocaleDateString('he-IL')
                      : ''}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-foreground mb-3 leading-tight">
                  {article.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  {article.snippet}
                </p>
                {article.url && (
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary font-medium text-sm mt-4 hover:underline"
                  >
                    קרא עוד
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Press;
