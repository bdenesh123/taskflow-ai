<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { register } from "../../api/auth";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const errorMessage = ref("");
const isLoading = ref(false);

async function handleSubmit() {
  errorMessage.value = "";

  if (
    !name.value.trim() ||
    !email.value.trim() ||
    !password.value ||
    !confirmPassword.value
  ) {
    errorMessage.value = "Please complete all fields.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = "Password must be at least 8 characters.";
    return;
  }

  isLoading.value = true;

  try {
    const response = await register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });

    sessionStorage.setItem("taskflow_access_token", response.access_token);

    sessionStorage.setItem("taskflow_user", JSON.stringify(response.user));

    await router.push("/");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409) {
        errorMessage.value = "This email address is already registered.";
      } else if (error.response?.status === 400) {
        errorMessage.value =
          "Please check your registration details and try again.";
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
      <!-- TaskFlow branding -->
      <RouterLink to="/" class="mb-10 flex items-center justify-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
        >
          T
        </div>

        <span class="text-xl font-semibold tracking-tight"> TaskFlow </span>
      </RouterLink>

      <!-- Page heading -->
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>

        <p class="mt-2 text-sm text-muted">
          Get started with your own TaskFlow workspace.
        </p>
      </div>

      <!-- Registration form -->
      <form class="space-y-5" @submit.prevent="handleSubmit">
        <!-- Name -->
        <div>
          <label for="name" class="mb-2 block text-sm font-medium">
            Full name
          </label>

          <input
            id="name"
            v-model="name"
            type="text"
            autocomplete="name"
            placeholder="Your name"
            maxlength="100"
            required
            class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-foreground"
          />
        </div>

        <!-- Email -->
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
            maxlength="254"
            required
            class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-foreground"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="mb-2 block text-sm font-medium">
            Password
          </label>

          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Create a password"
              required
              class="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-muted focus:border-foreground"
            />

            <button
              type="button"
              class="absolute inset-y-0 right-3 cursor-pointer text-sm text-muted hover:text-foreground"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "Hide" : "Show" }}
            </button>
          </div>

          <p class="mt-2 text-xs text-muted">Must be at least 8 characters.</p>
        </div>

        <!-- Confirm password -->
        <div>
          <label for="confirm-password" class="mb-2 block text-sm font-medium">
            Confirm password
          </label>

          <div class="relative">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Re-enter your password"
              required
              class="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-muted focus:border-foreground"
            />

            <button
              type="button"
              class="absolute inset-y-0 right-3 cursor-pointer text-sm text-muted hover:text-foreground"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? "Hide" : "Show" }}
            </button>
          </div>
        </div>

        <!-- Error message -->
        <p
          v-if="errorMessage"
          role="alert"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ errorMessage }}
        </p>

        <!-- Submit button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full cursor-pointer rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ isLoading ? "Creating account..." : "Create account" }}
        </button>
      </form>

      <!-- Login link -->
      <p class="mt-8 text-center text-sm text-muted">
        Already have an account?

        <RouterLink
          to="/login"
          class="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </RouterLink>
      </p>
    </div>
  </main>
</template>
