<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTheme } from "../composables/useTheme";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  LogOut,
  ListTodo,
  Menu,
  Settings,
} from "lucide-vue-next";
import { onBeforeUnmount, ref, watch } from "vue";

const { preference, setPreference } = useTheme();
const isMobileMenuOpen = ref(false);
let previousBodyOverflow = "";

watch(isMobileMenuOpen, (isOpen) => {
  if (isOpen) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = previousBodyOverflow;
  }
});

// Ensure scrolling is restored if the layout is unmounted
onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow;
});
const router = useRouter();

function logout() {
  sessionStorage.removeItem("taskflow_access_token");
  sessionStorage.removeItem("taskflow_user");

  router.push("/login");
}

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Projects", icon: FolderKanban, to: "/projects" },
  { label: "My tasks", icon: CheckSquare, to: "/my-tasks" },
  { label: "Team members", icon: Users, to: "/team-members" },
  { label: "Personal tasks", icon: ListTodo, to: "/personal-tasks" },
  { label: "Account Settings", icon: Settings, to: "/account-settings" },
];

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground">
    <!-- Sidebar -->
    <aside
      class="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex"
    >
      <RouterLink to="/" class="mb-8 flex items-center gap-3 px-2">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
        >
          T
        </div>
        <span class="text-lg font-semibold tracking-tight">TaskFlow</span>
      </RouterLink>

      <RouterLink
        to="/projects"
        class="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium transition hover:bg-background"
      >
        <span class="text-lg">+</span>
        Create project
      </RouterLink>

      <p
        class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted"
      >
        Workspace
      </p>

      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in navigation"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
          exact-active-class="bg-background font-medium shadow-sm"
        >
          <component :is="item.icon" :size="18" :stroke-width="1.75" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Theme selector and account area -->
      <div class="mt-auto border-t border-border pt-4">
        <label for="theme" class="mb-2 block px-2 text-xs text-muted">
          Appearance
        </label>

        <select
          id="theme"
          :value="preference"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
          @change="
            setPreference(
              ($event.target as HTMLSelectElement).value as
                | 'system'
                | 'light'
                | 'dark',
            )
          "
        >
          <option value="system">System theme</option>
          <option value="light">Light mode</option>
          <option value="dark">Dark mode</option>
        </select>

        <div class="mt-4 flex items-center gap-3 rounded-lg px-2 py-2">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
          >
            U
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">Your workspace</p>
            <p class="text-xs text-muted">TaskFlow account</p>
          </div>
        </div>
        <button
          type="button"
          @click="logout"
          class="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-background hover:text-foreground"
        >
          <LogOut :size="18" :stroke-width="1.75" />
          Sign Out
        </button>
      </div>
    </aside>

    <!-- Mobile navigation drawer -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isMobileMenuOpen" class="fixed inset-0 z-50 md:hidden">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50" @click="closeMobileMenu" />

          <!-- Drawer -->
          <Transition
            enter-active-class="transition-transform duration-200 ease-out"
            enter-from-class="-translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transition-transform duration-200 ease-in"
            leave-from-class="translate-x-0"
            leave-to-class="-translate-x-full"
          >
            <aside
              class="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain touch-pan-y border-r border-border bg-sidebar p-4 shadow-xl"
            >
              <!-- Drawer heading -->
              <div class="mb-8 flex items-center justify-between">
                <RouterLink
                  to="/"
                  class="flex items-center gap-3"
                  @click="closeMobileMenu"
                >
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
                  >
                    T
                  </div>
                  <span class="text-lg font-semibold tracking-tight"
                    >TaskFlow</span
                  >
                </RouterLink>

                <button
                  type="button"
                  aria-label="Close navigation menu"
                  class="rounded-lg px-2 py-1 text-muted hover:bg-background hover:text-foreground"
                  @click="closeMobileMenu"
                >
                  ✕
                </button>
              </div>

              <!-- Create project -->
              <RouterLink
                to="/projects"
                class="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium transition hover:bg-background"
                @click="closeMobileMenu"
              >
                <span class="text-lg">+</span>
                Create project
              </RouterLink>

              <!-- Navigation links -->
              <p
                class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Workspace
              </p>

              <nav class="flex flex-col gap-1">
                <RouterLink
                  v-for="item in navigation"
                  :key="item.label"
                  :to="item.to"
                  class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
                  exact-active-class="bg-background font-medium shadow-sm"
                  @click="closeMobileMenu"
                >
                  <component :is="item.icon" :size="18" :stroke-width="1.75" />
                  {{ item.label }}
                </RouterLink>
              </nav>

              <!-- Theme selector and account area -->
              <div class="mt-auto border-t border-border pt-4">
                <label
                  for="mobile-theme"
                  class="mb-2 block px-2 text-xs text-muted"
                >
                  Appearance
                </label>

                <select
                  id="mobile-theme"
                  :value="preference"
                  class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
                  @change="
                    setPreference(
                      ($event.target as HTMLSelectElement).value as
                        | 'system'
                        | 'light'
                        | 'dark',
                    )
                  "
                >
                  <option value="system">System theme</option>
                  <option value="light">Light mode</option>
                  <option value="dark">Dark mode</option>
                </select>

                <div class="mt-4 flex items-center gap-3 rounded-lg px-2 py-2">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
                  >
                    U
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">Your workspace</p>
                    <p class="text-xs text-muted">TaskFlow account</p>
                  </div>
                </div>

                <button
                  type="button"
                  class="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-background hover:text-foreground"
                  @click="logout"
                >
                  <LogOut :size="18" :stroke-width="1.75" />
                  Sign Out
                </button>
              </div>
            </aside>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Main content -->
    <main class="min-w-0 flex-1">
      <!-- Mobile header -->
      <header
        class="flex h-16 items-center justify-between border-b border-border px-4 md:hidden"
      >
        <RouterLink to="/" class="flex items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
          >
            T
          </div>

          <span class="text-lg font-semibold tracking-tight">TaskFlow</span>
        </RouterLink>

        <button
          type="button"
          class="rounded-lg border border-border p-2 transition hover:bg-sidebar"
          aria-label="Open navigation menu"
          :aria-expanded="isMobileMenuOpen"
          @click="isMobileMenuOpen = true"
        >
          <Menu :size="20" :stroke-width="1.75" />
        </button>
      </header>
      <header
        class="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6 lg:px-8"
      >
        <p class="text-sm text-muted">Workspace / TaskFlow</p>
      </header>

      <!-- Vue Router renders the selected child page here -->
      <RouterView />
    </main>
  </div>
</template>
