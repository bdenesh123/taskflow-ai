import apiClient from "./client.js";

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getProjects(): Promise<Project[]> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.get<Project[]>("/projects", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export interface CreateProjectData {
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
}

export async function createProject(
  projectData: CreateProjectData,
): Promise<Project> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.post<Project>("/projects", projectData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getProjectById(projectId: string): Promise<Project> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.get<Project>(`/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export async function getProjectMembers(
  projectId: string,
): Promise<ProjectMember[]> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.get<ProjectMember[]>(
    `/projects/${projectId}/members`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function addProjectMember(
  projectId: string,
  userId: string,
): Promise<ProjectMember> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.post<ProjectMember>(
    `/projects/${projectId}/members`,
    { user_id: userId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  const token = sessionStorage.getItem("taskflow_access_token");

  await apiClient.delete(`/projects/${projectId}/members/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface UpdateProjectData {
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
}

export async function updateProject(
  projectId: string,
  projectData: UpdateProjectData,
): Promise<Project> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.patch<Project>(
    `/projects/${projectId}`,
    projectData,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}
