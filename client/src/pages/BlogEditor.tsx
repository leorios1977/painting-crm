import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  MapPin,
  Search as SearchIcon,
  Globe,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function BlogEditor() {
  const params = useParams<{ id: string }>();
  const editId = params.id ? parseInt(params.id) : null;
  const isEdit = editId !== null;
  const [, navigate] = useLocation();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [projectLatitude, setProjectLatitude] = useState("");
  const [projectLongitude, setProjectLongitude] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [saving, setSaving] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Load existing post
  const { data: existingPost } = trpc.blog.getById.useQuery(
    { id: editId! },
    { enabled: isEdit }
  );
  const { data: postImages, refetch: refetchImages } = trpc.blog.getImages.useQuery(
    { postId: editId! },
    { enabled: isEdit }
  );

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content ?? "");
      setExcerpt(existingPost.excerpt ?? "");
      setSeoTitle(existingPost.seoTitle ?? "");
      setSeoKeywords(existingPost.seoKeywords ?? "");
      setSeoDescription(existingPost.seoDescription ?? "");
      setFeaturedImageUrl(existingPost.featuredImageUrl ?? "");
      setProjectAddress(existingPost.projectAddress ?? "");
      setProjectLatitude(existingPost.projectLatitude ?? "");
      setProjectLongitude(existingPost.projectLongitude ?? "");
      setStatus(existingPost.status);
    }
  }, [existingPost]);

  const createMutation = trpc.blog.create.useMutation({
    onSuccess: (data) => {
      toast.success("Article created");
      navigate(`/blog-manage/edit/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => toast.success("Article saved"),
    onError: (err) => toast.error(err.message),
  });

  const uploadFeaturedMutation = trpc.blog.uploadFeaturedImage.useMutation({
    onSuccess: (data) => {
      setFeaturedImageUrl(data.url);
      setUploadingFeatured(false);
      toast.success("Featured image uploaded");
    },
    onError: (err) => {
      setUploadingFeatured(false);
      toast.error(err.message);
    },
  });

  const uploadImageMutation = trpc.blog.uploadImage.useMutation({
    onSuccess: () => {
      setUploadingGallery(false);
      refetchImages();
      toast.success("Image uploaded");
    },
    onError: (err) => {
      setUploadingGallery(false);
      toast.error(err.message);
    },
  });

  const deleteImageMutation = trpc.blog.deleteImage.useMutation({
    onSuccess: () => {
      refetchImages();
      toast.success("Image removed");
    },
  });

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        content,
        excerpt,
        seoTitle,
        seoKeywords,
        seoDescription,
        featuredImageUrl,
        projectAddress,
        projectLatitude,
        projectLongitude,
        status,
      };
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editId!, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleFeaturedUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFeatured(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFeaturedMutation.mutate({
        imageBase64: base64,
        filename: file.name,
        mimeType: file.type || "image/jpeg",
      });
    };
    reader.readAsDataURL(file);
  }

  function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editId) return;
    setUploadingGallery(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadImageMutation.mutate({
        postId: editId,
        imageBase64: base64,
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        displayOrder: (postImages?.length ?? 0) + 1,
      });
    };
    reader.readAsDataURL(file);
  }

  function addKeyword() {
    const kw = keywordInput.trim();
    if (!kw) return;
    const existing = seoKeywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!existing.includes(kw)) {
      setSeoKeywords([...existing, kw].join(", "));
    }
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    const existing = seoKeywords
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== kw);
    setSeoKeywords(existing.join(", "));
  }

  const keywords = seoKeywords
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/blog-manage")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? "Edit Article" : "New Article"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEdit ? "Update your article content and settings" : "Create a new blog post or project article"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : status === "published" ? "Publish" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title..."
                className="mt-1.5 text-lg font-medium"
              />
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here... (HTML supported)"
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                HTML formatting is supported. Use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;img&gt; tags for rich content.
              </p>
            </CardContent>
          </Card>

          {/* Project Photos Gallery */}
          {isEdit && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Project Photos
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingGallery}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploadingGallery ? "Uploading..." : "Add Photo"}
                  </Button>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryUpload}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {(postImages ?? []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No project photos yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {(postImages ?? []).map((img) => (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden border">
                        <img
                          src={img.imageUrl}
                          alt={img.caption ?? "Project photo"}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          onClick={() => deleteImageMutation.mutate({ imageId: img.id })}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — right col */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              {featuredImageUrl ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={featuredImageUrl}
                    alt="Featured"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    onClick={() => setFeaturedImageUrl("")}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => featuredInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadingFeatured ? "Uploading..." : "Click to upload"}
                  </p>
                </div>
              )}
              <input
                ref={featuredInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFeaturedUpload}
              />
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short summary for cards and previews..."
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                SEO Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">SEO Title</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Custom page title for search engines..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">SEO Description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value.slice(0, 160))}
                  placeholder="Meta description for search results..."
                  className="mt-1 min-h-[60px]"
                />
                <p className={`text-xs mt-1 ${seoDescription.length > 150 ? "text-orange-500" : "text-muted-foreground"}`}>
                  {seoDescription.length}/160 characters
                </p>
              </div>
              <div>
                <Label className="text-sm">SEO Keywords</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={addKeyword}>
                    Add
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {keywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/10"
                        onClick={() => removeKeyword(kw)}
                      >
                        {kw}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Project Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm">Address</Label>
                <Input
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">Latitude</Label>
                  <Input
                    value={projectLatitude}
                    onChange={(e) => setProjectLatitude(e.target.value)}
                    placeholder="e.g. 30.2672"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Longitude</Label>
                  <Input
                    value={projectLongitude}
                    onChange={(e) => setProjectLongitude(e.target.value)}
                    placeholder="e.g. -97.7431"
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Coordinates will show a Google Maps embed on the public article page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
