import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ArrowLeft, ArrowRight, Phone } from "lucide-react";
import { Link, useParams } from "wouter";

function SEOHead({
  title,
  description,
  keywords,
}: {
  title: string;
  description?: string;
  keywords?: string;
}) {
  useEffect(() => {
    // Set document title
    const prevTitle = document.title;
    document.title = title;

    // Set/update meta tags
    function setMeta(name: string, content: string) {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    }

    if (description) setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);

    // OG tags
    function setOG(property: string, content: string) {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    }
    setOG("og:title", title);
    if (description) setOG("og:description", description);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, keywords]);

  return null;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const { data: images } = trpc.blog.getImages.useQuery(
    { postId: post?.id ?? 0 },
    { enabled: !!post?.id }
  );

  const { data: relatedPosts } = trpc.blog.getRelated.useQuery(
    { postId: post?.id ?? 0 },
    { enabled: !!post?.id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-12 space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-64 bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasLocation =
    post.projectLatitude &&
    post.projectLongitude &&
    parseFloat(post.projectLatitude) !== 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt || undefined}
        keywords={post.seoKeywords || undefined}
      />

      {/* Back nav */}
      <div className="border-b">
        <div className="container max-w-4xl py-3">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="container max-w-4xl py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recently published"}
            </div>
            {post.projectAddress && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {post.projectAddress}
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Featured Image */}
        {post.featuredImageUrl && (
          <div className="rounded-xl overflow-hidden mb-8 border">
            <img
              src={post.featuredImageUrl}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Content */}
        {post.content && (
          <div
            className="prose prose-lg max-w-none mb-12
              prose-headings:font-bold prose-headings:tracking-tight
              prose-p:leading-relaxed prose-p:text-foreground/80
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:border"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}

        {/* Project Photos Gallery */}
        {(images ?? []).length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Project Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(images ?? []).map((img) => (
                <div key={img.id} className="rounded-lg overflow-hidden border">
                  <img
                    src={img.imageUrl}
                    alt={img.caption ?? "Project photo"}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {img.caption && (
                    <p className="text-xs text-muted-foreground p-2">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Google Maps Embed */}
        {hasLocation && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Project Location</h2>
            <div className="rounded-xl overflow-hidden border h-[350px]">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${post.projectLatitude},${post.projectLongitude}&zoom=15`}
                allowFullScreen
              />
            </div>
            {post.projectAddress && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {post.projectAddress}
              </p>
            )}
          </section>
        )}

        {/* SEO Keywords */}
        {post.seoKeywords && (
          <div className="flex flex-wrap gap-2 mb-12">
            {post.seoKeywords.split(",").filter(Boolean).map((kw, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {kw.trim()}
              </Badge>
            ))}
          </div>
        )}
      </article>

      {/* Related Posts */}
      {(relatedPosts ?? []).length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(relatedPosts ?? []).map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`}>
                  <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow h-full">
                    {rp.featuredImageUrl ? (
                      <div className="h-36 overflow-hidden">
                        <img
                          src={rp.featuredImageUrl}
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary/20">
                          {rp.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <CardContent className="pt-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        {rp.publishedAt
                          ? new Date(rp.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "Recent"}
                      </p>
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Working on a similar project?
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Get a free estimate for your painting project. Our team delivers quality results every time.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button size="lg">
                <Phone className="h-4 w-4 mr-2" />
                Get a Free Estimate
              </Button>
            </Link>
            <Link href="/blog">
              <Button variant="outline" size="lg">
                View More Projects
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
