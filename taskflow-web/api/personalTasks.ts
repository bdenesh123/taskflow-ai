import apiClient from "./client.js";

export interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonalTaskDto {
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  due_date?: string | null;
}

export interface UpdatePersonalTaskDto {
  title?: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  due_date?: string | null;
  is_completed?: boolean;
}

export async function getPersonalTasks(): Promise<PersonalTask[]> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.get<PersonalTask[]>("/personal-tasks", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}

export async function createPersonalTask(
  data: CreatePersonalTaskDto,
): Promise<PersonalTask> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.post<PersonalTask>("/personal-tasks", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}

export async function updatePersonalTask(
  taskId: string,
  data: UpdatePersonalTaskDto,
): Promise<PersonalTask> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.patch<PersonalTask>(
    `/personal-tasks/${taskId}`,
    data,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

export async function deletePersonalTask(taskId: string): Promise<void> {
  const token = sessionStorage.getItem("taskflow_access_token");

  await apiClient.delete(`/personal-tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteCompletedPersonalTasks(): Promise<{
  message: string;
  deletedCount: number;
}> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.delete("/personal-tasks/completed", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
}
