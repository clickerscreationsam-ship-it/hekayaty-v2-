import React, { useState } from "react";
import { useMediaVideos, useAdminMedia } from "@/hooks/use-media";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, Trash2, Edit, Star, Youtube, Loader2, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";

export function MediaAdmin() {
  const { data: videos, isLoading } = useMediaVideos();
  const { createVideo, updateVideo, deleteVideo, isPending } = useAdminMedia();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);

  // Fetch products for relatedStoryId selection
  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    category: "trailer",
    relatedStoryId: "",
    isFeatured: false
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      youtubeUrl: "",
      category: "trailer",
      relatedStoryId: "",
      isFeatured: false
    });
    setEditingVideo(null);
  };

  const handleEdit = (video: any) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      youtubeUrl: video.youtubeUrl,
      category: video.category,
      relatedStoryId: video.relatedStoryId?.toString() || "",
      isFeatured: video.isFeatured
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      relatedStoryId: formData.relatedStoryId ? Number(formData.relatedStoryId) : null
    };

    try {
      if (editingVideo) {
        await updateVideo({ id: editingVideo.id, updates: payload });
      } else {
        await createVideo(payload as any);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <Card className="glass-card border-primary/20 bg-black/60 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5">
          <div>
            <CardTitle className="text-2xl text-gradient">Media Hub Management</CardTitle>
            <CardDescription>Add and manage cinematic trailers, songs, and lore videos.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-black font-bold">
                <Plus size={18} />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingVideo ? "Edit Video" : "Add New Cinematic Content"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <div className="relative">
                    <Input 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      className="bg-white/5 border-white/10 pl-10"
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                      required
                    />
                    <Youtube className="absolute left-3 top-3 w-4 h-4 text-red-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="Epic Trailer Name" 
                    className="bg-white/5 border-white/10"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Briefly describe the content..." 
                    className="bg-white/5 border-white/10 min-h-[100px]"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({...formData, category: v})}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="trailer">Trailer</SelectItem>
                        <SelectItem value="song">Original Song</SelectItem>
                        <SelectItem value="universe">Universe Lore</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Related Story (Optional)</Label>
                    <Select 
                      value={formData.relatedStoryId} 
                      onValueChange={(v) => setFormData({...formData, relatedStoryId: v})}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select story" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white max-h-[200px]">
                        <SelectItem value="none">None</SelectItem>
                        {products?.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="featured" 
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({...formData, isFeatured: checked as boolean})}
                  />
                  <Label htmlFor="featured" className="cursor-pointer">Set as Featured Hero Content</Label>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary text-black font-bold mt-6" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingVideo ? "Update Video" : "Publish to Media Hub"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading videos...</div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10">
                  <TableHead className="w-[100px]">Thumbnail</TableHead>
                  <TableHead>Video Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Story Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No videos found. Start by adding your first trailer!
                    </TableCell>
                  </TableRow>
                ) : (
                  videos?.map((video) => (
                    <TableRow key={video.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="py-4">
                        <div className="relative w-24 aspect-video rounded overflow-hidden border border-white/10 group">
                          <img src={video.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                          {video.isFeatured && (
                            <div className="absolute top-1 left-1 p-0.5 bg-primary rounded-sm">
                              <Star size={10} className="text-black" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white flex items-center gap-2">
                            {video.title}
                            {video.isFeatured && <Badge variant="secondary" className="bg-primary/20 text-primary text-[8px] h-4">FEATURED</Badge>}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{video.description || "No description"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="capitalize border-white/20 text-white/70">
                          {video.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        {video.relatedStoryId ? (
                          <div className="flex items-center gap-1 text-xs text-primary font-medium">
                            <LinkIcon size={12} />
                            Linked
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-white/10 text-white/70"
                            onClick={() => handleEdit(video)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                            onClick={() => {
                              if (confirm("Permanently delete this video from Media Hub?")) deleteVideo(video.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
