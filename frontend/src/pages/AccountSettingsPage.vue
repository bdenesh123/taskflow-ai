<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { deactivateAccount } from "../../api/auth";
import { AlertTriangle } from "lucide-vue-next";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

const currentUser = ref<AuthUser | null>(null);
const router = useRouter();

const isDeactivateModalOpen = ref(false);
const password = ref("");
const showPassword = ref(false);
const errorMessage = ref("");
const isLoading = ref(false);

const storedUser = sessionStorage.getItem("taskflow_user");

if (storedUser) {
  currentUser.value = JSON.parse(storedUser) as AuthUser;
}

function closeDeactivateModal() {
  if (isLoading.value) return;

  isDeactivateModalOpen.value = false;
  password.value = "";
  showPassword.value = false;
  errorMessage.value = "";
}

async function handleDeactivateAccount() {
  errorMessage.value = "";

  if (!password.value) {
    errorMessage.value = "Please enter your current password.";
    return;
  }

  isLoading.value = true;

  try {
    await deactivateAccount(password.value);

    // Clear the authenticated session.
    sessionStorage.removeItem("taskflow_access_token");
    sessionStorage.removeItem("taskflow_user");

    // Redirect to login.
    await router.replace("/login");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage.value = "Incorrect password. Please try again.";
      } else if (error.response?.status === 400) {
        const message = error.response.data?.message;

        errorMessage.value = Array.isArray(message)
          ? message.join(", ")
          : typeof message === "string"
            ? message
            : "You must resolve your active projects before deactivating your account.";
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
  <section class="space-y-8 p-6 md:p-8">
    <div>
      <p class="mb-2 text-sm text-muted">YOUR WORKSPACE</p>
      <h1 class="text-3xl font-semibold tracking-tight">Account Settings</h1>
      <p class="mt-2 text-sm text-muted">
        Manage your account information and preferences.
      </p>
    </div>

    <!-- Account information -->
    <section class="mt-8 rounded-xl border border-border bg-surface p-6">
      <div class="mb-6">
        <h2 class="text-lg font-semibold">Personal Information</h2>
        <p class="mt-1 text-sm text-muted">
          Your registered TaskFlow account details.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p class="text-xs font-medium text-muted">Full name</p>
          <p class="mt-1 text-sm font-medium text-foreground">
            {{ currentUser?.name || "Not available" }}
          </p>
        </div>

        <div>
          <p class="text-xs font-medium text-muted">Email address</p>
          <p class="mt-1 text-sm font-medium text-foreground">
            {{ currentUser?.email || "Not available" }}
          </p>
        </div>

        <div>
          <p class="text-xs font-medium text-muted">Account ID</p>
          <p class="mt-1 text-sm font-medium text-foreground">
            {{ currentUser?.id || "Not available" }}
          </p>
        </div>
      </div>
    </section>

    <!-- Account deactivation -->
    <section class="rounded-xl border border-red-500/30 bg-surface p-6">
      <!-- Section heading -->
      <div class="flex items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10"
        >
          <AlertTriangle class="h-5 w-5 text-red-500" />
        </div>

        <div>
          <h2 class="text-lg font-semibold">Deactivate Account</h2>
          <p class="mt-1 text-sm leading-6 text-muted">
            Deactivating your account will prevent you from logging in. This
            action also removes your project memberships and permanently deletes
            your personal tasks.
          </p>
        </div>
      </div>

      <!-- Deactivation warnings -->
      <div class="mt-5 rounded-lg bg-background/60 p-4">
        <p class="text-sm font-medium text-foreground">
          Before you deactivate your account
        </p>

        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>You will no longer be able to log in.</li>
          <li>You must transfer ownership of all active projects first.</li>
          <li>You will be removed from projects you belong to.</li>
          <li>Your personal tasks will be permanently deleted.</li>
          <li>Your historical project tasks and comments will be preserved.</li>
        </ul>
      </div>

      <!-- Deactivation action -->
      <div
        class="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="text-sm font-medium text-foreground">
            Deactivate your account
          </p>
          <p class="mt-1 text-sm text-muted">
            This action will sign you out and disable your account.
          </p>
        </div>

        <button
          type="button"
          class="shrink-0 cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          @click="isDeactivateModalOpen = true"
        >
          Deactivate Account
        </button>
      </div>
    </section>

    <!-- Deactivation confirmation modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isDeactivateModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="closeDeactivateModal"
        >
          <div
            class="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-title"
          >
            <h2
              id="deactivate-title"
              class="text-lg font-semibold text-foreground"
            >
              Confirm Account Deactivation
            </h2>

            <p class="mt-2 text-sm leading-6 text-muted">
              Enter your current password to confirm that you want to deactivate
              your TaskFlow account. This action will sign you out.
            </p>

            <form
              class="mt-6 space-y-4"
              @submit.prevent="handleDeactivateAccount"
            >
              <div>
                <label
                  for="deactivation-password"
                  class="mb-2 block text-sm font-medium text-foreground"
                >
                  Current password
                </label>

                <div class="relative">
                  <input
                    id="deactivation-password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    placeholder="Enter your current password"
                    class="w-full rounded-xl border border-border bg-background px-4 py-3 pr-20 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:ring-2 focus:ring-muted"
                  />

                  <button
                    type="button"
                    class="absolute inset-y-0 right-3 cursor-pointer text-xs font-medium text-muted hover:text-foreground"
                    @click="showPassword = !showPassword"
                  >
                    {{ showPassword ? "Hide" : "Show" }}
                  </button>
                </div>
              </div>

              <p
                v-if="errorMessage"
                class="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500"
              >
                {{ errorMessage }}
              </p>

              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  :disabled="isLoading"
                  class="cursor-pointer rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-sidebar disabled:cursor-not-allowed disabled:opacity-50"
                  @click="closeDeactivateModal"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  :disabled="isLoading"
                  class="cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ isLoading ? "Deactivating..." : "Confirm Deactivation" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
