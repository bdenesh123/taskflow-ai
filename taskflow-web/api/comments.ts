import apiClient from "./client.js";

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getComments(
  projectId: string,
  taskId: string,
): Promise<Comment[]> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.get<Comment[]>(
    `/projects/${projectId}/tasks/${taskId}/comments`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

export async function createComment(
  projectId: string,
  taskId: string,
  content: string,
): Promise<Comment> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.post<Comment>(
    `/projects/${projectId}/tasks/${taskId}/comments`,
    { content },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

export async function updateComment(
  projectId: string,
  taskId: string,
  commentId: string,
  content: string,
): Promise<Comment> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.patch<Comment>(
    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    { content },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

export async function deleteComment(
  projectId: string,
  taskId: string,
  commentId: string,
): Promise<void> {
  const token = sessionStorage.getItem("taskflow_access_token");

  await apiClient.delete(
    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}
