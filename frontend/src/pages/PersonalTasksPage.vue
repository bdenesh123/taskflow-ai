<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  getPersonalTasks,
  type PersonalTask,
  createPersonalTask,
  type CreatePersonalTaskDto,
  updatePersonalTask,
  deletePersonalTask,
  deleteCompletedPersonalTasks,
} from "../../api/personalTasks";
import { formatDate } from "../utils/date";
import DatePicker from "../components/projects/DatePicker.vue";

const tasks = ref<PersonalTask[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");
const showCreateModal = ref(false);
const isCreating = ref(false);
const createError = ref("");
const editingTaskId = ref<string | null>(null);
const priorityFilter = ref("all");
const sortBy = ref("due_date");

const newTask = ref<CreatePersonalTaskDto>({
  title: "",
  description: "",
  priority: "medium",
  due_date: null,
});

function openEditModal(task: PersonalTask) {
  editingTaskId.value = task.id;

  newTask.value = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    due_date: task.due_date,
  };

  createError.value = "";
  showCreateModal.value = true;
}

function resetTaskForm() {
  newTask.value = {
    title: "",
    description: "",
    priority: "medium",
    due_date: null,
  };

  editingTaskId.value = null;
  createError.value = "";
  showCreateModal.value = false;
}

const filteredTasks = computed(() => {
  let result = tasks.value.filter((task) => !task.is_completed);

  // Priority filtering
  if (priorityFilter.value !== "all") {
    result = result.filter((task) => task.priority === priorityFilter.value);
  }

  // Sorting
  return [...result].sort((a, b) => {
    if (sortBy.value === "due_date") {
      // Tasks without due dates appear last
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;

      return a.due_date.localeCompare(b.due_date);
    }

    if (sortBy.value === "priority") {
      const priorityOrder = {
        high: 3,
        medium: 2,
        low: 1,
      };

      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }

    if (sortBy.value === "created_at") {
      return b.created_at.localeCompare(a.created_at);
    }

    return 0;
  });
});

async function fetchTasks() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    tasks.value = await getPersonalTasks();
  } catch (error) {
    console.error("Failed to fetch personal tasks:", error);
    errorMessage.value =
      "Failed to load your personal tasks. Please try again.";
  } finally {
    isLoading.value = false;
  }
}

async function handleToggleComplete(task: PersonalTask) {
  const previousValue = task.is_completed;

  // Optimistically update the UI
  task.is_completed = !previousValue;

  try {
    const updatedTask = await updatePersonalTask(task.id, {
      is_completed: task.is_completed,
    });

    const index = tasks.value.findIndex((item) => item.id === task.id);

    if (index !== -1) {
      tasks.value[index] = updatedTask;
    }
  } catch (error) {
    console.error("Failed to update task:", error);

    // Revert the UI if the request fails
    task.is_completed = previousValue;
  }
}

async function handleDeleteTask(taskId: string) {
  const confirmed = window.confirm(
    "Are you sure you want to permanently delete this task?",
  );

  if (!confirmed) return;

  try {
    await deletePersonalTask(taskId);

    tasks.value = tasks.value.filter((task) => task.id !== taskId);
  } catch (error) {
    console.error("Failed to delete personal task:", error);
    errorMessage.value = "Failed to delete your task. Please try again.";
  }
}

async function handleClearCompleted() {
  const completedCount = tasks.value.filter((task) => task.is_completed).length;

  if (completedCount === 0) return;

  const confirmed = window.confirm(
    `Are you sure you want to permanently delete all ${completedCount} completed tasks?`,
  );

  if (!confirmed) return;

  try {
    await deleteCompletedPersonalTasks();

    tasks.value = tasks.value.filter((task) => !task.is_completed);
  } catch (error) {
    console.error("Failed to clear completed tasks:", error);
    errorMessage.value = "Failed to clear completed tasks. Please try again.";
  }
}

async function handleSubmitTask() {
  if (!newTask.value.title.trim()) {
    createError.value = "Task title is required.";
    return;
  }

  isCreating.value = true;
  createError.value = "";

  try {
    const taskData = {
      ...newTask.value,
      title: newTask.value.title.trim(),
      description: newTask.value.description?.trim() || null,
    };

    if (editingTaskId.value) {
      const updatedTask = await updatePersonalTask(
        editingTaskId.value,
        taskData,
      );

      const index = tasks.value.findIndex(
        (task) => task.id === editingTaskId.value,
      );

      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
    } else {
      const createdTask = await createPersonalTask(taskData);
      tasks.value.unshift(createdTask);
    }

    resetTaskForm();
  } catch (error) {
    console.error("Failed to save personal task:", error);
    createError.value = editingTaskId.value
      ? "Failed to update your task. Please try again."
      : "Failed to create your task. Please try again.";
  } finally {
    isCreating.value = false;
  }
}

onMounted(() => {
  fetchTasks();
});
</script>

<template>
  <section class="p-6 md:p-8">
    <!-- Page heading -->
    <div class="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Personal Tasks</h1>
        <p class="mt-1 text-sm text-muted">
          Organise your everyday tasks and stay on top of your priorities.
        </p>
      </div>

      <button
        type="button"
        class="cursor-pointer shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
        @click="showCreateModal = true"
      >
        + Add task
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="py-16 text-center text-sm text-muted">
      Loading personal tasks...
    </div>

    <!-- Error state -->
    <div
      v-else-if="errorMessage"
      class="rounded-xl border border-border p-8 text-center"
    >
      <p class="text-sm text-muted">{{ errorMessage }}</p>
      <button
        class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        @click="fetchTasks"
      >
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="tasks.length === 0"
      class="rounded-xl border border-dashed border-border px-6 py-16 text-center"
    >
      <div class="text-3xl" aria-hidden="true">✓</div>
      <h2 class="mt-4 text-lg font-medium">No personal tasks yet</h2>
      <p class="mx-auto mt-2 max-w-sm text-sm text-muted">
        Add your first personal task to start organising your day.
      </p>
    </div>

    <!-- Task list placeholder -->

    <div v-else class="space-y-8">
      <!-- Active tasks -->
      <section>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold">
            To do
            <span class="ml-1 text-sm font-normal text-muted">
              ({{ filteredTasks.length }})
            </span>
          </h2>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Priority filter -->
            <div class="flex items-center gap-2">
              <label for="priority-filter" class="text-sm text-muted">
                Priority
              </label>

              <select
                id="priority-filter"
                v-model="priorityFilter"
                class="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <!-- Sorting -->
            <div class="flex items-center gap-2">
              <label for="sort-by" class="text-sm text-muted"> Sort by </label>

              <select
                id="sort-by"
                v-model="sortBy"
                class="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
              >
                <option value="due_date">Due date</option>
                <option value="priority">Priority</option>
                <option value="created_at">Recently created</option>
              </select>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="task in filteredTasks"
            :key="task.id"
            class="flex min-h-48 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted"
          >
            <!-- Card header -->
            <div class="flex items-start justify-between gap-3">
              <span
                class="rounded-md bg-background px-2.5 py-1 text-xs font-medium capitalize text-muted"
              >
                {{ task.priority }} priority
              </span>

              <input
                type="checkbox"
                :checked="task.is_completed"
                class="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                :aria-label="`Mark ${task.title} as completed`"
                @change="handleToggleComplete(task)"
              />
            </div>

            <!-- Task content -->
            <div class="mt-4 flex-1">
              <h3 class="font-semibold break-words">{{ task.title }}</h3>

              <p
                v-if="task.description"
                class="mt-2 whitespace-pre-line break-words text-sm text-muted"
              >
                {{ task.description }}
              </p>
            </div>

            <!-- Due date -->
            <div class="mt-4 border-t border-border pt-3">
              <p class="text-xs text-muted">
                {{
                  task.due_date
                    ? `Due ${formatDate(task.due_date)}`
                    : "No due date"
                }}
              </p>

              <!-- Actions -->
              <div class="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                  @click="openEditModal(task)"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-red-500"
                  @click="handleDeleteTask(task.id)"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>

          <div
            v-if="tasks.every((task) => task.is_completed)"
            class="col-span-full rounded-xl border border-dashed border-border px-6 py-12 text-center"
          >
            <h3 class="font-medium">You're all caught up!</h3>
            <p class="mt-2 text-sm text-muted">
              No active tasks at the moment.
            </p>
          </div>
        </div>
      </section>

      <!-- Completed tasks -->
      <section v-if="tasks.some((task) => task.is_completed)">
        <div class="mb-4 flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold">
            Completed
            <span class="ml-1 text-sm font-normal text-muted">
              ({{ tasks.filter((task) => task.is_completed).length }})
            </span>
          </h2>

          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-red-500"
            @click="handleClearCompleted"
          >
            Clear completed
          </button>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="task in tasks.filter((task) => task.is_completed)"
            :key="task.id"
            class="flex min-h-48 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted"
          >
            <!-- Card header -->
            <div class="flex items-start justify-between gap-3">
              <span
                class="rounded-md bg-background px-2.5 py-1 text-xs font-medium text-muted"
              >
                Completed
              </span>

              <input
                type="checkbox"
                :checked="task.is_completed"
                class="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                :aria-label="`Mark ${task.title} as incomplete`"
                @change="handleToggleComplete(task)"
              />
            </div>

            <!-- Task content -->
            <div class="mt-4 flex-1">
              <h3 class="break-words font-semibold text-muted line-through">
                {{ task.title }}
              </h3>

              <p
                v-if="task.description"
                class="mt-2 whitespace-pre-line break-words text-sm text-muted"
              >
                {{ task.description }}
              </p>
            </div>

            <!-- Due date and actions -->
            <div class="mt-4 border-t border-border pt-3">
              <p class="text-xs text-muted">
                {{
                  task.due_date
                    ? `Due ${formatDate(task.due_date)}`
                    : "No due date"
                }}
              </p>

              <div class="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                  @click="openEditModal(task)"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-red-500"
                  @click="handleDeleteTask(task.id)"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showCreateModal = false"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-personal-task-title"
        class="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl"
      >
        <!-- Modal heading -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-personal-task-title" class="text-lg font-semibold">
              {{ editingTaskId ? "Edit personal task" : "Add personal task" }}
            </h2>
            <p class="mt-1 text-sm text-muted">
              Add something you need to get done.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            class="rounded-lg px-2 py-1 text-muted hover:bg-background hover:text-foreground"
            @click="showCreateModal = false"
          >
            ✕
          </button>
        </div>

        <!-- Creation form -->
        <form class="mt-6 space-y-5" @submit.prevent="handleSubmitTask">
          <div>
            <label for="task-title" class="mb-2 block text-sm font-medium">
              Task title <span class="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              v-model="newTask.title"
              type="text"
              required
              maxlength="200"
              placeholder="e.g. Buy groceries"
              class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
            />
          </div>

          <div>
            <label
              for="task-description"
              class="mb-2 block text-sm font-medium"
            >
              Description <span class="text-muted">(optional)</span>
            </label>
            <textarea
              id="task-description"
              v-model="newTask.description"
              rows="8"
              maxlength="5000"
              placeholder="Add more details..."
              class="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
            />
          </div>

          <div>
            <label for="task-priority" class="mb-2 block text-sm font-medium">
              Priority
            </label>
            <select
              id="task-priority"
              v-model="newTask.priority"
              class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label for="task-due-date" class="mb-2 block text-sm font-medium">
              Due date <span class="text-muted">(optional)</span>
            </label>
            <DatePicker id="task-due-date" v-model="newTask.due_date" />
          </div>

          <p v-if="createError" role="alert" class="text-sm text-red-500">
            {{ createError }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-background"
              @click="showCreateModal = false"
            >
              Cancel
            </button>

            <button
              type="submit"
              :disabled="isCreating"
              class="cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{
                isCreating
                  ? editingTaskId
                    ? "Saving..."
                    : "Creating..."
                  : editingTaskId
                    ? "Save changes"
                    : "Add task"
              }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>
