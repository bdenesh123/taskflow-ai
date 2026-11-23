<script setup lang="ts">
import { getTasks, type Task } from "../../api/tasks";
import { computed, onMounted, ref } from "vue";
import { FolderKanban } from "lucide-vue-next";

import { getProjects, type Project } from "../../api/projects";
import type { AuthUser } from "../../api/auth";
import { formatDate } from "../utils/date";

// Current authenticated user
const currentUser = ref<AuthUser | null>(
  JSON.parse(sessionStorage.getItem("taskflow_user") || "null"),
);

// Dashboard data
const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);

// Loading and error states
const isLoading = ref(true);
const projectsError = ref("");
const tasksError = ref("");

// Fetch projects and their tasks
async function loadDashboard() {
  isLoading.value = true;
  projectsError.value = "";
  tasksError.value = "";
  projects.value = [];
  tasks.value = [];

  try {
    projects.value = await getProjects();

    const taskResults = await Promise.allSettled(
      projects.value.map((project) => getTasks(project.id)),
    );

    tasks.value = taskResults
      .filter(
        (result): result is PromiseFulfilledResult<Task[]> =>
          result.status === "fulfilled",
      )
      .flatMap((result) => result.value);

    const hasFailedRequest = taskResults.some(
      (result) => result.status === "rejected",
    );

    if (hasFailedRequest) {
      tasksError.value = "Some project tasks could not be loaded.";
    }
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    projectsError.value = "Unable to load projects.";
  } finally {
    isLoading.value = false;
  }
}

// Dashboard statistics
const activeProjectsCount = computed(
  () => projects.value.filter((project) => project.status === "active").length,
);

const myTasks = computed(() =>
  tasks.value.filter(
    (task) => task.assignee_id === currentUser.value?.id && !task.deleted_at,
  ),
);

const myTasksCount = computed(() => myTasks.value.length);

const completedTasksCount = computed(
  () => myTasks.value.filter((task) => task.status === "done").length,
);

const todoTasks = computed(() =>
  myTasks.value.filter((task) => task.status === "todo"),
);

const inProgressTasks = computed(() =>
  myTasks.value.filter((task) => task.status === "in_progress"),
);

const overdueTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return myTasks.value.filter((task) => {
    if (!task.due_date || task.status === "done") {
      return false;
    }

    const dueDate = new Date(`${task.due_date}T00:00:00`);

    return dueDate < today;
  });
});

onMounted(loadDashboard);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <!-- Page heading -->
    <div
      class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
    >
      <div>
        <p class="mb-2 text-sm text-muted">
          {{
            currentUser?.name
              ? `${currentUser.name}'s workspace`
              : "YOUR WORKSPACE"
          }}
        </p>

        <h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p class="mt-2 text-sm text-muted">
          A clear view of your projects and work,
          <span class="font-medium text-foreground">
            {{ currentUser?.name || "there" }} </span
          >.
        </p>
      </div>

      <RouterLink
        to="/projects"
        class="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-80"
      >
        + New project
      </RouterLink>
    </div>

    <!-- Summary cards -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <article class="rounded-2xl border border-border bg-surface p-5">
        <p class="text-sm text-muted">Active projects</p>
        <p class="mt-4 text-3xl font-semibold">
          {{ isLoading ? "—" : activeProjectsCount }}
        </p>
        <p class="mt-2 text-xs text-muted">Your ongoing work</p>
      </article>

      <article class="rounded-2xl border border-border bg-surface p-5">
        <p class="text-sm text-muted">Tasks assigned to me</p>
        <p class="mt-4 text-3xl font-semibold">
          {{ isLoading ? "—" : myTasksCount }}
        </p>
        <p class="mt-2 text-xs text-muted">Work requiring your attention</p>
      </article>

      <article class="rounded-2xl border border-border bg-surface p-5">
        <p class="text-sm text-muted">Tasks completed</p>
        <p class="mt-4 text-3xl font-semibold">
          {{ isLoading ? "—" : completedTasksCount }}
        </p>
        <p class="mt-2 text-xs text-muted">Your completed work</p>
      </article>
    </section>

    <!-- Empty project state -->
    <!-- My Projects -->
    <section class="mt-8">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">My Projects</h2>
          <p class="mt-1 text-sm text-muted">Projects you're working on.</p>
        </div>

        <RouterLink
          to="/projects"
          class="text-sm font-medium text-primary transition hover:opacity-80"
        >
          View all projects
        </RouterLink>
      </div>

      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted"
      >
        Loading projects...
      </div>

      <!-- Error state -->
      <div
        v-else-if="projectsError"
        class="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-red-500"
      >
        {{ projectsError }}
      </div>

      <!-- Empty state -->
      <div
        v-else-if="projects.length === 0"
        class="rounded-2xl border border-border bg-surface px-6 py-16 text-center"
      >
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-muted"
        >
          <FolderKanban :size="24" :stroke-width="1.5" />
        </div>

        <h3 class="mt-4 text-lg font-semibold">No projects yet</h3>

        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Create a project to organise tasks, collaborate with your team, and
          keep track of progress in one place.
        </p>

        <RouterLink
          to="/projects"
          class="mt-6 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-80"
        >
          Create your first project
        </RouterLink>
      </div>

      <!-- Project cards -->
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RouterLink
          v-for="project in projects"
          :key="project.id"
          :to="`/projects/${project.id}`"
          class="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/40"
        >
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-semibold">
              {{ project.name }}
            </h3>

            <span
              class="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium capitalize text-muted"
            >
              {{ project.status.replace("_", " ") }}
            </span>
          </div>

          <p class="mt-2 line-clamp-2 text-sm text-muted">
            {{ project.description || "No description provided." }}
          </p>

          <div class="mt-5 border-t border-border pt-4">
            <p class="text-xs text-muted">
              {{
                project.due_date
                  ? `Due ${new Date(`${project.due_date}T00:00:00`).toLocaleDateString()}`
                  : "No due date"
              }}
            </p>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- My Tasks -->
    <section class="mt-10">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">My Tasks</h2>
          <p class="mt-1 text-sm text-muted">
            Tasks assigned to you across all projects.
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted"
      >
        Loading tasks...
      </div>

      <!-- Error state -->
      <div
        v-else-if="tasksError"
        class="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-red-500"
      >
        {{ tasksError }}
      </div>

      <!-- Empty state -->
      <div
        v-else-if="myTasks.length === 0"
        class="rounded-2xl border border-border bg-surface p-8 text-center"
      >
        <h3 class="font-semibold">No tasks assigned to you</h3>
        <p class="mt-2 text-sm text-muted">
          Tasks assigned to you will appear here.
        </p>
      </div>

      <!-- Task groups -->
      <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- To Do -->
        <div class="rounded-2xl border border-border bg-surface p-5">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold">To Do</h3>
            <span class="text-sm text-muted">{{ todoTasks.length }}</span>
          </div>

          <div v-if="todoTasks.length === 0" class="text-sm text-muted">
            No tasks to do.
          </div>

          <div v-else class="space-y-3">
            <RouterLink
              v-for="task in todoTasks"
              :key="task.id"
              :to="`/projects/${task.project_id}`"
              class="block rounded-xl border border-border p-3 transition hover:border-primary/40"
            >
              <p class="text-sm font-medium">{{ task.title }}</p>
              <p class="mt-1 text-xs text-muted">
                {{
                  projects.find((project) => project.id === task.project_id)
                    ?.name
                }}
              </p>
              <span
                class="mt-2 inline-flex rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium capitalize text-muted"
              >
                {{ task.priority }} priority
              </span>
              <p class="mt-1 text-xs text-muted">
                {{
                  task.due_date
                    ? `Due ${formatDate(task.due_date)}`
                    : "No due date"
                }}
              </p>
            </RouterLink>
          </div>
        </div>

        <!-- In Progress -->
        <div class="rounded-2xl border border-border bg-surface p-5">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold">In Progress</h3>
            <span class="text-sm text-muted">{{ inProgressTasks.length }}</span>
          </div>

          <div v-if="inProgressTasks.length === 0" class="text-sm text-muted">
            No tasks in progress.
          </div>

          <div v-else class="space-y-3">
            <RouterLink
              v-for="task in inProgressTasks"
              :key="task.id"
              :to="`/projects/${task.project_id}`"
              class="block rounded-xl border border-border p-3 transition hover:border-primary/40"
            >
              <p class="text-sm font-medium">{{ task.title }}</p>

              <p class="mt-1 text-xs text-muted">
                {{
                  projects.find((project) => project.id === task.project_id)
                    ?.name
                }}
              </p>

              <span
                class="mt-2 inline-flex rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium capitalize text-muted"
              >
                {{ task.priority }} priority
              </span>

              <p class="mt-1 text-xs text-muted">
                {{
                  task.due_date
                    ? `Due ${formatDate(task.due_date)}`
                    : "No due date"
                }}
              </p>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
    <!-- Overdue Tasks -->
    <section class="mt-10">
      <div class="mb-4">
        <h2 class="text-lg font-semibold">Overdue Tasks</h2>
        <p class="mt-1 text-sm text-muted">
          Tasks that have passed their due dates and are not yet completed.
        </p>
      </div>

      <!-- Empty state -->
      <div
        v-if="overdueTasks.length === 0"
        class="rounded-2xl border border-border bg-surface p-6 text-center"
      >
        <p class="text-sm font-medium">No overdue tasks</p>
        <p class="mt-1 text-xs text-muted">
          You're all caught up! There are no overdue tasks assigned to you.
        </p>
      </div>

      <!-- Overdue task list -->
      <div v-else class="space-y-3">
        <RouterLink
          v-for="task in overdueTasks"
          :key="task.id"
          :to="`/projects/${task.project_id}`"
          class="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted"
        >
          <div
            class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
          >
            <div>
              <p class="text-sm font-medium">{{ task.title }}</p>

              <p class="mt-1 text-xs text-muted">
                {{
                  projects.find((project) => project.id === task.project_id)
                    ?.name
                }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500"
              >
                Due
                {{ new Date(`${task.due_date}T00:00:00`).toLocaleDateString() }}
              </span>

              <span
                class="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium capitalize text-muted"
              >
                {{ task.priority }} priority
              </span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
