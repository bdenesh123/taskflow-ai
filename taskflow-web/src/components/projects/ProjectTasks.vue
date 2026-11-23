<script setup lang="ts">
import type { Task } from "../../../api/tasks";
import type { ProjectMember } from "../../../api/projects";
import { formatDate } from "../../utils/date";
import DatePicker from "../projects/DatePicker.vue";

defineProps<{
  // Task data
  tasks: Task[];
  members: ProjectMember[];

  // Task loading and error states
  isLoadingTasks: boolean;
  tasksError: string;

  // Create task form
  showCreateTaskForm: boolean;
  isCreatingTask: boolean;
  createTaskError: string;
  createTaskSuccess: string;

  newTaskTitle: string;
  newTaskDescription: string;
  newTaskAssigneeId: string;
  newTaskStatus: "todo" | "in_progress" | "done";
  newTaskPriority: "low" | "medium" | "high";
  newTaskDueDate: string;

  // Edit task form
  editingTaskId: string | null;
  isUpdatingTask: boolean;
  updateTaskError: string;
  updateTaskSuccess: string;

  // Delete task form
  deletingTaskId: string | null;
  deleteTaskError: string;
  deleteTaskSuccess: string;

  editTaskTitle: string;
  editTaskDescription: string;
  editTaskAssigneeId: string;
  editTaskStatus: "todo" | "in_progress" | "done";
  editTaskPriority: "low" | "medium" | "high";
  editTaskDueDate: string;
}>();

defineEmits<{
  // Create task actions
  openCreateTaskForm: [];
  submitCreateTask: [];
  cancelCreateTask: [];

  // Edit task actions
  openEditTaskForm: [task: Task];
  submitUpdateTask: [];
  cancelEditTask: [];

  // Delete task action
  deleteTask: [taskId: string];

  // Task comments action
  viewTaskComments: [taskId: string];

  // Retry action
  loadTasks: [];

  // Create form field updates
  "update:newTaskTitle": [value: string];
  "update:newTaskDescription": [value: string];
  "update:newTaskAssigneeId": [value: string];
  "update:newTaskStatus": [value: "todo" | "in_progress" | "done"];
  "update:newTaskPriority": [value: "low" | "medium" | "high"];
  "update:newTaskDueDate": [value: string];

  // Edit form field updates
  "update:editTaskTitle": [value: string];
  "update:editTaskDescription": [value: string];
  "update:editTaskAssigneeId": [value: string];
  "update:editTaskStatus": [value: "todo" | "in_progress" | "done"];
  "update:editTaskPriority": [value: "low" | "medium" | "high"];
  "update:editTaskDueDate": [value: string];
}>();
</script>

<template>
  <section class="mt-10">
    <!-- Section heading -->
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">Project tasks</h2>

        <p class="mt-1 text-sm text-muted">
          Tasks associated with this project.
        </p>
      </div>

      <button
        type="button"
        class="cursor-pointer shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
        @click="$emit('openCreateTaskForm')"
      >
        + Create task
      </button>
    </div>
    <p
      v-if="updateTaskSuccess"
      role="status"
      class="mb-3 text-sm text-green-600"
    >
      {{ updateTaskSuccess }}
    </p>
    <p
      v-if="deleteTaskSuccess"
      role="status"
      class="mb-3 text-sm text-green-600"
    >
      {{ deleteTaskSuccess }}
    </p>
    <p v-if="deleteTaskError" role="alert" class="mb-3 text-sm text-red-600">
      {{ deleteTaskError }}
    </p>

    <!-- Create task form -->
    <div
      v-if="showCreateTaskForm"
      class="mb-5 rounded-xl border border-border bg-surface p-6"
    >
      <h3 class="text-lg font-semibold">Create a new task</h3>
      <p class="mt-1 text-sm text-muted">Add a task to this project.</p>

      <form class="mt-5 space-y-5" @submit.prevent="$emit('submitCreateTask')">
        <!-- Task title -->
        <div>
          <label for="task-title" class="mb-2 block text-sm font-medium">
            Task title
          </label>

          <input
            id="task-title"
            :value="newTaskTitle"
            type="text"
            maxlength="200"
            required
            placeholder="Enter task title"
            class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            :disabled="isCreatingTask"
            @input="
              $emit(
                'update:newTaskTitle',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>

        <!-- Description -->
        <div>
          <label for="task-description" class="mb-2 block text-sm font-medium">
            Description
          </label>

          <textarea
            id="task-description"
            :value="newTaskDescription"
            rows="8"
            maxlength="5000"
            placeholder="Describe what needs to be done..."
            class="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            :disabled="isCreatingTask"
            @input="
              $emit(
                'update:newTaskDescription',
                ($event.target as HTMLTextAreaElement).value,
              )
            "
          />
        </div>

        <!-- Assignee -->
        <div>
          <label for="task-assignee" class="mb-2 block text-sm font-medium">
            Assignee
          </label>

          <select
            id="task-assignee"
            :value="newTaskAssigneeId"
            class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            :disabled="isCreatingTask"
            @change="
              $emit(
                'update:newTaskAssigneeId',
                ($event.target as HTMLSelectElement).value,
              )
            "
          >
            <option value="">Unassigned</option>

            <option
              v-for="member in members"
              :key="member.user_id"
              :value="member.user_id"
            >
              {{ member.name }} — {{ member.email }}
            </option>
          </select>
        </div>

        <!-- Status and priority -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="task-status" class="mb-2 block text-sm font-medium">
              Status
            </label>

            <select
              id="task-status"
              :value="newTaskStatus"
              class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              :disabled="isCreatingTask"
              @change="
                $emit(
                  'update:newTaskStatus',
                  ($event.target as HTMLSelectElement).value as
                    | 'todo'
                    | 'in_progress'
                    | 'done',
                )
              "
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label for="task-priority" class="mb-2 block text-sm font-medium">
              Priority
            </label>

            <select
              id="task-priority"
              :value="newTaskPriority"
              class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              :disabled="isCreatingTask"
              @change="
                $emit(
                  'update:newTaskPriority',
                  ($event.target as HTMLSelectElement).value as
                    | 'low'
                    | 'medium'
                    | 'high',
                )
              "
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <!-- Due date -->
        <div>
          <label for="task-due-date" class="mb-2 block text-sm font-medium">
            Due date
          </label>

          <DatePicker
            id="task-due-date"
            :model-value="newTaskDueDate"
            :disabled="isCreatingTask"
            @update:model-value="$emit('update:newTaskDueDate', $event ?? '')"
          />
        </div>

        <!-- Feedback -->
        <p v-if="createTaskError" role="alert" class="text-sm text-red-500">
          {{ createTaskError }}
        </p>

        <p
          v-if="createTaskSuccess"
          role="status"
          class="text-sm text-green-600"
        >
          {{ createTaskSuccess }}
        </p>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-background disabled:opacity-50"
            :disabled="isCreatingTask"
            @click="$emit('cancelCreateTask')"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isCreatingTask || !newTaskTitle.trim()"
          >
            {{ isCreatingTask ? "Creating..." : "Create task" }}
          </button>
        </div>
      </form>
    </div>
    <!-- Loading state -->
    <div
      v-if="isLoadingTasks"
      class="rounded-xl border border-border p-6 text-sm text-muted"
    >
      Loading tasks...
    </div>

    <!-- Error state -->
    <div v-else-if="tasksError" class="rounded-xl border border-border p-6">
      <p class="text-sm text-muted">{{ tasksError }}</p>

      <button
        type="button"
        class="mt-3 text-sm font-medium underline"
        @click="$emit('loadTasks')"
      >
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="tasks.length === 0"
      class="rounded-xl border border-border p-8 text-center"
    >
      <h3 class="font-medium">No tasks yet</h3>
      <p class="mt-2 text-sm text-muted">
        Tasks created for this project will appear here.
      </p>
    </div>

    <!-- Task list -->
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex min-h-52 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted"
      >
        <!-- Status and priority -->
        <div class="flex items-center justify-between gap-2">
          <span
            class="rounded-md px-2.5 py-1 text-xs font-medium capitalize"
            :class="{
              'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300':
                task.status === 'todo',
              'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300':
                task.status === 'in_progress',
              'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300':
                task.status === 'done',
            }"
          >
            {{ task.status.replace("_", " ") }}
          </span>

          <span
            class="rounded-md px-2.5 py-1 text-xs font-medium capitalize"
            :class="{
              'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300':
                task.priority === 'low',
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300':
                task.priority === 'medium',
              'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300':
                task.priority === 'high',
            }"
          >
            {{ task.priority }}
          </span>
        </div>

        <!-- Task information -->
        <div class="mt-4 flex-1">
          <h3 class="text-sm font-semibold">
            {{ task.title }}
          </h3>

          <p class="mt-2 whitespace-pre-line break-words text-sm text-muted">
            {{ task.description || "No description provided." }}
          </p>
        </div>

        <!-- Assignee and due date -->
        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted"
        >
          <span>
            {{
              task.assignee ? `Assigned to ${task.assignee.name}` : "Unassigned"
            }}
          </span>

          <span>
            {{
              task.due_date ? `Due ${formatDate(task.due_date)}` : "No due date"
            }}
          </span>
        </div>

        <!-- Actions -->
        <div class="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
          <!-- Edit -->
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-border bg-background px-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-sidebar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="$emit('openEditTaskForm', task)"
          >
            Edit
          </button>

          <!-- View comments -->
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-border bg-background px-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-sidebar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="$emit('viewTaskComments', task.id)"
          >
            View comments
          </button>

          <!-- Delete -->
          <button
            type="button"
            :disabled="deletingTaskId === task.id"
            class="cursor-pointer rounded-lg border border-border bg-background px-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-sidebar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            @click="$emit('deleteTask', task.id)"
          >
            {{ deletingTaskId === task.id ? "Deleting..." : "Delete" }}
          </button>
        </div>

        <!-- Edit task form -->
        <div
          v-if="editingTaskId === task.id"
          class="-mx-5 -mb-5 mt-4 rounded-b-xl border-t border-border bg-background px-5 py-4"
        >
          <h3 class="font-semibold">Edit task</h3>

          <p class="mt-1 text-sm text-muted">
            Update the details of this task.
          </p>

          <form
            class="mt-4 space-y-4"
            @submit.prevent="$emit('submitUpdateTask')"
          >
            <!-- Title -->
            <div>
              <label
                :for="`edit-task-title-${task.id}`"
                class="mb-2 block text-sm font-medium"
              >
                Task title
              </label>

              <input
                :id="`edit-task-title-${task.id}`"
                :value="editTaskTitle"
                type="text"
                maxlength="200"
                required
                class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                :disabled="isUpdatingTask"
                @input="
                  $emit(
                    'update:editTaskTitle',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>

            <!-- Description -->
            <div>
              <label
                :for="`edit-task-description-${task.id}`"
                class="mb-2 block text-sm font-medium"
              >
                Description
              </label>

              <textarea
                :id="`edit-task-description-${task.id}`"
                :value="editTaskDescription"
                rows="8"
                maxlength="5000"
                class="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                :disabled="isUpdatingTask"
                @input="
                  $emit(
                    'update:editTaskDescription',
                    ($event.target as HTMLTextAreaElement).value,
                  )
                "
              />
            </div>

            <!-- Assignee -->
            <div>
              <label
                :for="`edit-task-assignee-${task.id}`"
                class="mb-2 block text-sm font-medium"
              >
                Assignee
              </label>

              <select
                :id="`edit-task-assignee-${task.id}`"
                :value="editTaskAssigneeId"
                class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                :disabled="isUpdatingTask"
                @change="
                  $emit(
                    'update:editTaskAssigneeId',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option value="">Unassigned</option>

                <option
                  v-for="member in members"
                  :key="member.user_id"
                  :value="member.user_id"
                >
                  {{ member.name }} — {{ member.email }}
                </option>
              </select>
            </div>

            <!-- Status and priority -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  :for="`edit-task-status-${task.id}`"
                  class="mb-2 block text-sm font-medium"
                >
                  Status
                </label>

                <select
                  :id="`edit-task-status-${task.id}`"
                  :value="editTaskStatus"
                  class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                  :disabled="isUpdatingTask"
                  @change="
                    $emit(
                      'update:editTaskStatus',
                      ($event.target as HTMLSelectElement).value as
                        | 'todo'
                        | 'in_progress'
                        | 'done',
                    )
                  "
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label
                  :for="`edit-task-priority-${task.id}`"
                  class="mb-2 block text-sm font-medium"
                >
                  Priority
                </label>

                <select
                  :id="`edit-task-priority-${task.id}`"
                  :value="editTaskPriority"
                  class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                  :disabled="isUpdatingTask"
                  @change="
                    $emit(
                      'update:editTaskPriority',
                      ($event.target as HTMLSelectElement).value as
                        | 'low'
                        | 'medium'
                        | 'high',
                    )
                  "
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <!-- Due date -->
            <div>
              <label
                :for="`edit-task-due-date-${task.id}`"
                class="mb-2 block text-sm font-medium"
              >
                Due date
              </label>

              <DatePicker
                id="edit-task-due-date"
                :model-value="editTaskDueDate"
                :disabled="isUpdatingTask"
                @update:model-value="
                  $emit('update:editTaskDueDate', $event ?? '')
                "
              />
            </div>

            <!-- Error feedback -->
            <p v-if="updateTaskError" role="alert" class="text-sm text-red-500">
              {{ updateTaskError }}
            </p>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-surface disabled:opacity-50"
                :disabled="isUpdatingTask"
                @click="$emit('cancelEditTask')"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isUpdatingTask || !editTaskTitle.trim()"
              >
                {{ isUpdatingTask ? "Saving..." : "Save changes" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
