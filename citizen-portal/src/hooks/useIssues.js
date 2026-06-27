import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// 1. Hook to fetch issues list
export function useIssues(params = {}) {
  return useQuery({
    queryKey: ['issues', params],
    queryFn: () => api.get('/issues', { params })
  });
}

// 2. Hook to fetch single issue details
export function useIssueDetails(id) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.get(`/issues/${id}`),
    enabled: !!id
  });
}

// 3. Hook to create a new issue (Multipart form data)
export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.post('/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }
  });
}

// 4. Hook to verify or upvote issue
export function useVerifyIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId, voteType }) => api.patch(`/issues/${id}/verify`, { userId, voteType }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', variables.id] });
    }
  });
}

// 5. Hook to fetch comments
export function useComments(issueId) {
  return useQuery({
    queryKey: ['comments', issueId],
    queryFn: () => api.get(`/comments/${issueId}`),
    enabled: !!issueId
  });
}

// 6. Hook to add comment
export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentData) => api.post('/comments', commentData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.issueId] });
    }
  });
}
