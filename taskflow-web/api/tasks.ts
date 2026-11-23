import apiClient from "./client.js";

export interface Task {
  id: string;
  project_id: string;
  creator_id: string;
  assignee_id: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getTasks(projectId: string): Promise<Task[]> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}

export interface CreateTaskData {
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
}

export async function createTask(
  projectId: string,
  taskData: CreateTaskData,
): Promise<Task> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.post<Task>(
    `/projects/${projectId}/tasks`,
    taskData,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  assignee_id?: string | null;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  due_date?: string | null;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  taskData: UpdateTaskData,
): Promise<Task> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.patch<Task>(
    `/projects/${projectId}/tasks/${taskId}`,
    taskData,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

export async function deleteTask(
  projectId: string,
  taskId: string,
): Promise<void> {
  const token = sessionStorage.getItem("taskflow_access_token");

  await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
