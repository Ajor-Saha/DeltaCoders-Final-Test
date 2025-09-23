"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Axios } from "@/config/axios";
import { ExternalLink, Globe, Newspaper, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ResourceItem {
  resourceId: string;
  subjectId: string;
  topicName: string;
  description: string | null;
  resourceTitle: string;
  url: string;
  createdAt: string;
}

export default function StarterFeedPage() {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await Axios.get("/api/topic/starter-feed");
        setItems(res.data.data || []);
      } catch (e) {
        console.error("Failed to load starter feed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">StarterFeed</h1>
            <p className="text-sm text-muted-foreground">Curated learning resources from your topics</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <article key={item.resourceId} className="py-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 hidden sm:block w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold leading-snug">
                      <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                        {item.resourceTitle}
                      </a>
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="gap-1">
                        <Tag className="w-3 h-3" />
                        {item.topicName}
                      </Badge>
                      <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-blue-600">
                        <ExternalLink className="w-3 h-3" />
                        Visit
                      </a>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {new URL(item.url).hostname}
                      </span>
                      <span className="ml-auto text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <button
            onClick={() => router.push("/sign-in")}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            More
          </button>
        </div>
      </div>
    </div>
  );
}
