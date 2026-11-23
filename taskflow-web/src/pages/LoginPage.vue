<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { login } from "../../api/auth";

const router = useRouter();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const errorMessage = ref("");
const isLoading = ref(false);

async function handleSubmit() {
  errorMessage.value = "";

  if (!email.value.trim() || !password.value) {
    errorMessage.value = "Please enter your email and password.";
    return;
  }

  isLoading.value = true;

  try {
    const response = await login({
      email: email.value.trim(),
      password: password.value,
    });

    sessionStorage.setItem("taskflow_access_token", response.access_token);
    sessionStorage.setItem("taskflow_user", JSON.stringify(response.user));

    await router.push("/");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage.value = "Invalid email or password.";
      } else if (!error.response) {
        errorMessage.value =
          "Unable to connect to the server. Please try again.";
      } else {
        errorMessage.value = "Something went wrong. Please try again.";
      }
    } else {
      errorMessage.value = "Something went wrong. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground"
  >
    <div class="w-full max-w-sm">
      <RouterLink to="/" class="mb-10 flex items-center justify-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
        >
          T
        </div>
        <span class="text-xl font-semibold tracking-tight">TaskFlow</span>
      </RouterLink>

      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p class="mt-2 text-sm text-muted">
          Sign in to continue to your workspace.
        </p>
      </div>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div>
          <label for="email" class="mb-2 block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            required
            class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-foreground"
          />
        </div>

        <div>
          <label for="password" class="mb-2 block text-sm font-medium">
            Password
          </label>

          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Enter your password"
              required
              class="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-muted focus:border-foreground"
            />

            <button
              type="button"
              class="absolute inset-y-0 right-3 text-sm text-muted hover:text-foreground"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "Hide" : "Show" }}
            </button>
          </div>
        </div>

        <p
          v-if="errorMessage"
          role="alert"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ isLoading ? "Signing in..." : "Sign in" }}
        </button>
      </form>

      <!-- Sign-up link -->
      <p class="mt-8 text-center text-sm text-muted">
        Don't have an account?

        <RouterLink
          to="/register"
          class="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </RouterLink>
      </p>

      <p class="mt-4 text-center text-xs leading-5 text-muted">
        Securely manage your projects, tasks, and team in one place.
      </p>
    </div>
  </main>
</template>
