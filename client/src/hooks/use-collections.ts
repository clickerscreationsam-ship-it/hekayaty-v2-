import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.user?.id) {
    headers['x-user-id'] = session.user.id;
  }
  return headers;
}

export function useAdminCollections() {
  return useQuery({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/collections', { headers });
      if (!res.ok) throw new Error('Failed to fetch collections');
      return res.json();
    }
  });
}

export function useCollections(filters?: { isPublished?: boolean; writerId?: string; type?: string }) {
  return useQuery({
    queryKey: ['collections', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters?.isPublished !== undefined) searchParams.append('isPublished', String(filters.isPublished));
      if (filters?.writerId) searchParams.append('writerId', filters.writerId);
      if (filters?.type) searchParams.append('type', filters.type);
      
      const res = await fetch(`/api/collections?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch collections');
      return res.json();
    }
  });
}

export function usePublicCollections() {
  return useCollections({ isPublished: true });
}

export function useCollection(slug: string) {
  return useQuery({
    queryKey: ['collection', slug],
    queryFn: async () => {
      const res = await fetch(`/api/collections/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch collection');
      return res.json();
    },
    enabled: !!slug
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['public-collections'] });
    }
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update collection');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['public-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    }
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete collection');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      queryClient.invalidateQueries({ queryKey: ['public-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    }
  });
}
