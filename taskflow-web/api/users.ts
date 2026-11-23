import apiClient from "./client.js";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUsers(): Promise<User[]> {
  const token = sessionStorage.getItem("taskflow_access_token");

  const response = await apiClient.get<User[]>("/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
