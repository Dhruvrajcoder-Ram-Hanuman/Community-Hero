import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Fetch paginated and filtered issues
export function useIssues(params = {}) {
  return useQuery({
    queryKey: ['official-issues', params],
    queryFn: () => api.get('/issues', { params })
  });
}

// Fetch single issue details
export function useIssueDetails(id) {
  return useQuery({
    queryKey: ['official-issue', id],
    queryFn: () => api.get(`/issues/${id}`),
    enabled: !!id
  });
}

// Update status (Multer afterImage upload option)
export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => api.patch(`/issues/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['official-issues'] });
      queryClient.invalidateQueries({ queryKey: ['official-issue', variables.id] });
    }
  });
}

// Route to department
export function useAssignDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedDepartment, assignedOfficer }) => 
      api.patch(`/issues/${id}/assign`, { assignedDepartment, assignedOfficer }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['official-issues'] });
      queryClient.invalidateQueries({ queryKey: ['official-issue', variables.id] });
    }
  });
}

// Delete issue
export function useDeleteIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/issues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['official-issues'] });
    }
  });
}

// Add comment
export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentData) => api.post('/comments', commentData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['official-comments', variables.issueId] });
    }
  });
}

// Fetch comments
export function useComments(issueId) {
  return useQuery({
    queryKey: ['official-comments', issueId],
    queryFn: () => api.get(`/comments/${issueId}`),
    enabled: !!issueId
  });
}
