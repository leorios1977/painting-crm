import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SocialMediaBar } from "@/components/SocialMediaBar";

export default function BlogList() {
  const { data: posts, isLoading } = trpc.blog.listPublished.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container max-w-6xl">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Our Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore our latest painting projects, tips, and industry insights. See the transformations we deliver for our customers.
          </p>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="container max-w-6xl py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-muted animate-pulse" />
                <CardContent className="pt-4 space-y-2">
                  <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (posts ?? []).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No articles published yet</p>
            <p className="text-sm mt-1">Check back soon for project updates and painting tips.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(posts ?? []).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col">
                  {post.featuredImageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.featuredImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted" />
                  )}
                  <CardContent className="pt-4 flex flex-col flex-1">
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Recently"}
                    </div>
                    <h2 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-sm font-medium text-primary mt-3 group-hover:gap-2 transition-all">
                      Read More <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Social media bar */}
      <div className="border-t border-border">
        <div className="container max-w-6xl py-8">
          <SocialMediaBar />
        </div>
      </div>
    </div>
  );
}
