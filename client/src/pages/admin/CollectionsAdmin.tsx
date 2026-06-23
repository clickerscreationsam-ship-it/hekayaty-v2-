import { useState } from "react";
import { useAdminCollections, useUpdateCollection, useDeleteCollection } from "@/hooks/use-collections";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Library, Settings, ExternalLink, Calendar, Eye, EyeOff, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import CreateCollectionDialog from "@/components/admin/CreateCollectionDialog";
import EditCollectionDialog from "@/components/admin/EditCollectionDialog";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

export default function CollectionsAdmin() {
  const { data: collections, isLoading } = useAdminCollections();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [, setLocation] = useLocation();

  const handleTogglePublish = async (col: any) => {
    try {
      await updateCollection.mutateAsync({
        id: col.id,
        data: { isPublished: !col.is_published }
      });
      toast({
        title: col.is_published ? "تم إخفاء المجموعة" : "تم نشر المجموعة",
        description: col.title,
      });
    } catch (e: any) {
      toast({ title: "حدث خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (col: any) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف المجموعة "${col.title}" نهائياً؟`)) {
      return;
    }
    try {
      await deleteCollection.mutateAsync(col.id);
      toast({
        title: "تم الحذف",
        description: `تم حذف المجموعة "${col.title}" بنجاح.`,
      });
    } catch (e: any) {
      toast({ title: "حدث خطأ أثناء الحذف", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="glass-card border-primary/20 bg-black/60 shadow-2xl mt-6">
      <CardHeader className="bg-white/5 border-b border-white/5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl text-gradient flex items-center gap-2">
            <Library className="w-6 h-6" /> المجموعات (Collections)
          </CardTitle>
          <CardDescription>إدارة باقات المنتجات وتوزيع الأرباح</CardDescription>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> مجموعة جديدة
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {!collections || collections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Library className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>لا توجد مجموعات حتى الآن.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="py-4">المجموعة</TableHead>
                <TableHead className="py-4">النوع</TableHead>
                <TableHead className="py-4">السعر</TableHead>
                <TableHead className="py-4">العناصر</TableHead>
                <TableHead className="py-4">الحالة</TableHead>
                <TableHead className="py-4">تاريخ الإنشاء</TableHead>
                <TableHead className="py-4 text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((col: any) => (
                <TableRow key={col.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="py-4 font-bold text-foreground">
                    <div className="flex items-center gap-3">
                      {col.cover_image_url ? (
                        <img src={col.cover_image_url} alt={col.title} className="w-10 h-10 rounded-md object-cover border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                          <Library className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          {col.title}
                          {col.label && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black border border-amber-500/30">
                              {col.label}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5 opacity-50">{col.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="capitalize text-xs font-bold border-white/20">
                      {col.collection_type?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">{col.price} ج.م</span>
                      {col.discount_percentage > 0 && (
                        <span className="text-xs text-muted-foreground line-through opacity-70">
                          {col.original_total_price} ج.م
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 font-mono">
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1.5 font-bold">
                      {col.items?.[0]?.count || col.estimated_total_parts || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={col.is_published ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}>
                      {col.is_published ? "منشور" : "مخفي"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-xs font-medium opacity-80">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(col.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTogglePublish(col)}
                        disabled={updateCollection.isPending}
                        title={col.is_published ? "إخفاء المجموعة" : "نشر المجموعة"}
                        className={`h-8 ${col.is_published ? "text-green-500 hover:text-red-400" : "text-zinc-500 hover:text-green-400"}`}
                      >
                        {updateCollection.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : col.is_published ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setLocation(`/collections/${col.slug}`)} className="h-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCollection(col)}
                        className="h-8 text-primary hover:text-primary/80"
                        title="تعديل المجموعة"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(col)}
                        disabled={deleteCollection.isPending}
                        className="h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        title="حذف المجموعة"
                      >
                        {deleteCollection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      <CreateCollectionDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditCollectionDialog 
        open={!!editingCollection} 
        onOpenChange={(open) => !open && setEditingCollection(null)}
        collection={editingCollection}
      />
    </Card>
  );
}
