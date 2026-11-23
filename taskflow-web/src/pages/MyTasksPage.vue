<script setup lang="ts">
import { onMounted, ref, computed } from "vue";

import { getProjects, type Project } from "../../api/projects";
import { getTasks, type Task } from "../../api/tasks";
import type { AuthUser } from "../../api/auth";
import { formatDate } from "../utils/date";

const currentUser = ref<AuthUser | null>(
  JSON.parse(sessionStorage.getItem("taskflow_user") || "null"),
);

const projects = ref<Project[]>([]);
const tasks = ref<Task[]>([]);

const isLoading = ref(true);
const pageError = ref("");

const selectedStatus = ref("all");
const selectedPriority = ref("all");
const selectedProject = ref("all");
const selectedSort = ref("due_date_asc");

async function loadMyTasks() {
  isLoading.value = true;
  pageError.value = "";
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

    if (taskResults.some((result) => result.status === "rejected")) {
      pageError.value = "Some project tasks could not be loaded.";
    }
  } catch (error) {
    console.error("Failed to load tasks:", error);
    pageError.value = "Unable to load your tasks.";
  } finally {
    isLoading.value = false;
  }
}

const myTasks = computed(() =>
  tasks.value.filter(
    (task) => task.assignee_id === currentUser.value?.id && !task.deleted_at,
  ),
);

const totalTasks = computed(() => myTasks.value.length);

const todoTasks = computed(() =>
  myTasks.value.filter((task) => task.status === "todo"),
);

const inProgressTasks = computed(() =>
  myTasks.value.filter((task) => task.status === "in_progress"),
);

const completedTasks = computed(() =>
  myTasks.value.filter((task) => task.status === "done"),
);

const filteredTasks = computed(() => {
  return myTasks.value.filter((task) => {
    const matchesStatus =
      selectedStatus.value === "all" || task.status === selectedStatus.value;

    const matchesPriority =
      selectedPriority.value === "all" ||
      task.priority === selectedPriority.value;

    const matchesProject =
      selectedProject.value === "all" ||
      task.project_id === selectedProject.value;

    return matchesStatus && matchesPriority && matchesProject;
  });
});

const sortedTasks = computed(() => {
  const result = [...filteredTasks.value];

  return result.sort((a, b) => {
    switch (selectedSort.value) {
      case "due_date_asc": {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;

        return a.due_date.localeCompare(b.due_date);
      }

      case "due_date_desc": {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;

        return b.due_date.localeCompare(a.due_date);
      }

      case "priority_desc": {
        const priorityOrder = {
          high: 3,
          medium: 2,
          low: 1,
        };

        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      case "updated_desc":
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

      default:
        return 0;
    }
  });
});

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === "done") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${task.due_date}T00:00:00`);

  return dueDate < today;
}

onMounted(loadMyTasks);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div class="mb-8">
      <p class="mb-2 text-sm text-muted">YOUR WORKSPACE</p>
      <h1 class="text-3xl font-semibold tracking-tight">My Tasks</h1>
      <p class="mt-2 text-sm text-muted">
        View and manage all tasks assigned to you.
      </p>
    </div>
    <!-- Task Summary -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-border bg-surface p-5">
        <p class="text-sm text-muted">Total tasks</p>
        <p class="mt-4 text-3xl font-semibold">
          {{ isLoading ? "—" : totalTasks }}
        </p>
        <p class="mt-2 text-xs text-muted">All your assigned tasks</p>
      </article>

      <article class="rounded-2xl border border-border bg-surface p-5">
        <p class="text-sm text-muted">To Do</p>
        <p class="mt-4 text-3xl font-semibold">
          {{ isLoading ? "—" : todoTasks.length }}
        </p>
        <p class="mt-2 text-xs text-muted">Tasks waiting to be started</p>
      </article>

      <article class="rounded-2xl border border-border bg-surface p-5">
        <p class="text-sm text-muted">In Progress</p>
        <p class="mt-4 text-3xl font-semibold">
          {{ isLoading ? "—" : inProgressTasks.length }}
        </p>
        <p class="mt-2 text-xs text-muted">Tasks currently in progress</p>
      </article>

      <article class="rounded-2xl border border-border bg-surface p-5">
        <p class="text-sm text-muted">Completed</p>
        <p class="mt-4 text-3xl font-semibold">
          {{ isLoading ? "—" : completedTasks.length }}
        </p>
        <p class="mt-2 text-xs text-muted">Tasks you've completed</p>
      </article>
    </section>
    <!-- Status Filters -->
    <section class="mt-8">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="filter in [
            { label: 'All tasks', value: 'all' },
            { label: 'To Do', value: 'todo' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'done' },
          ]"
          :key="filter.value"
          type="button"
          class="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            selectedStatus === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-surface text-muted hover:text-foreground'
          "
          @click="selectedStatus = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Priority Filters -->
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <span class="mr-1 text-sm text-muted">Priority:</span>

        <button
          v-for="filter in [
            { label: 'All', value: 'all' },
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
          ]"
          :key="filter.value"
          type="button"
          class="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="
            selectedPriority === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-surface text-muted hover:text-foreground'
          "
          @click="selectedPriority = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Project Filter -->
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <label for="project-filter" class="text-sm text-muted">
          Project:
        </label>

        <select
          id="project-filter"
          v-model="selectedProject"
          class="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
        >
          <option value="all">All projects</option>

          <option
            v-for="project in projects"
            :key="project.id"
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
      </div>
      <!-- Sorting -->
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <label for="task-sort" class="text-sm text-muted"> Sort by: </label>

        <select
          id="task-sort"
          v-model="selectedSort"
          class="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
        >
          <option value="due_date_asc">Due date (earliest first)</option>
          <option value="due_date_desc">Due date (latest first)</option>
          <option value="priority_desc">Priority (highest first)</option>
          <option value="updated_desc">Recently updated</option>
        </select>
      </div>

      <!-- Reset Filters -->
      <div class="mt-4">
        <button
          type="button"
          class="text-sm font-medium text-muted transition hover:text-foreground"
          @click="
            selectedStatus = 'all';
            selectedPriority = 'all';
            selectedProject = 'all';
            selectedSort = 'due_date_asc';
          "
        >
          Reset filters
        </button>
      </div>
    </section>
    <!-- Task List -->
    <section class="mt-6">
      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted"
      >
        Loading your tasks...
      </div>

      <!-- Error state -->
      <div
        v-else-if="pageError"
        class="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-red-500"
      >
        {{ pageError }}
      </div>

      <!-- Empty state -->
      <div
        v-else-if="myTasks.length === 0"
        class="rounded-2xl border border-border bg-surface p-10 text-center"
      >
        <h3 class="font-semibold">No tasks assigned to you</h3>
        <p class="mt-2 text-sm text-muted">
          Tasks assigned to you across your projects will appear here.
        </p>
      </div>

      <!-- No matching tasks -->
      <div
        v-else-if="filteredTasks.length === 0"
        class="rounded-2xl border border-border bg-surface p-10 text-center"
      >
        <h3 class="font-semibold">No tasks found</h3>
        <p class="mt-2 text-sm text-muted">
          There are no tasks matching the selected status.
        </p>
      </div>

      <!-- Task cards -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RouterLink
          v-for="task in sortedTasks"
          :key="task.id"
          :to="`/projects/${task.project_id}`"
          class="flex min-h-44 flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted"
        >
          <div class="flex h-full flex-col justify-between gap-4">
            <!-- Task information -->
            <div class="min-w-0">
              <h3 class="font-semibold">
                {{ task.title }}
              </h3>

              <p class="mt-1 text-sm text-muted">
                {{
                  projects.find((project) => project.id === task.project_id)
                    ?.name
                }}
              </p>
            </div>

            <!-- Task data -->
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium capitalize text-muted"
              >
                {{ task.status.replace("_", " ") }}
              </span>

              <span
                class="rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium capitalize text-muted"
              >
                {{ task.priority }} priority
              </span>

              <div class="flex items-center gap-2">
                <span
                  v-if="isOverdue(task)"
                  class="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500"
                >
                  Overdue
                </span>

                <span class="text-xs text-muted">
                  {{
                    task.due_date
                      ? `Due ${formatDate(task.due_date)}`
                      : "No due date"
                  }}
                </span>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
