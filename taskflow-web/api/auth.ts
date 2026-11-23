import apiClient from "./client.js";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    credentials,
  );

  return response.data;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export async function register(
  credentials: RegisterCredentials,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/register",
    credentials,
  );

  return response.data;
}

export async function deactivateAccount(
  password: string,
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    "/auth/account",
    {
      data: { password },
    },
  );

  return response.data;
}
