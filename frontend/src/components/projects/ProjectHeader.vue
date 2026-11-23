<script setup lang="ts">
import type { Project } from "../../../api/projects";
import { formatDate } from "../../utils/date";
import DatePicker from "./DatePicker.vue";

defineProps<{
  project: Project;

  isEditing: boolean;
  isSavingProject: boolean;

  editName: string;
  editDescription: string;
  editStatus: string;
  editDueDate: string;

  editProjectError: string;
  editProjectSuccess: string;
}>();

defineEmits<{
  openEditForm: [];
  submitUpdate: [];
  cancelEdit: [];

  "update:editName": [value: string];
  "update:editDescription": [value: string];
  "update:editStatus": [value: string];
  "update:editDueDate": [value: string];
}>();
</script>

<template>
  <section>
    <p class="text-sm text-muted">Project details</p>

    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-3xl font-semibold tracking-tight">
        {{ project.name }}
      </h1>

      <button
        type="button"
        class="cursor-pointer shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
        @click="$emit('openEditForm')"
      >
        Edit project
      </button>
    </div>

    <p class="mt-2 text-sm text-muted">
      {{ project.description || "No description provided." }}
    </p>

    <!-- Edit project form -->
    <div
      v-if="isEditing"
      class="mt-6 rounded-xl border border-border bg-surface p-6"
    >
      <h2 class="text-lg font-semibold">Edit project details</h2>

      <p class="mt-1 text-sm text-muted">
        Update the information for this project.
      </p>

      <form class="mt-5 space-y-5" @submit.prevent="$emit('submitUpdate')">
        <div>
          <label for="edit-project-name" class="mb-2 block text-sm font-medium">
            Project name
          </label>

          <input
            id="edit-project-name"
            :value="editName"
            @input="
              $emit(
                'update:editName',
                ($event.target as HTMLInputElement).value,
              )
            "
            type="text"
            maxlength="200"
            required
            class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            :disabled="isSavingProject"
          />
        </div>

        <div>
          <label
            for="edit-project-description"
            class="mb-2 block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="edit-project-description"
            :value="editDescription"
            @input="
              $emit(
                'update:editDescription',
                ($event.target as HTMLTextAreaElement).value,
              )
            "
            rows="8"
            class="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            :disabled="isSavingProject"
          />
        </div>

        <div>
          <label
            for="edit-project-status"
            class="mb-2 block text-sm font-medium"
          >
            Status
          </label>

          <select
            id="edit-project-status"
            :value="editStatus"
            @change="
              $emit(
                'update:editStatus',
                ($event.target as HTMLSelectElement).value,
              )
            "
            class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            :disabled="isSavingProject"
          >
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label
            for="edit-project-due-date"
            class="mb-2 block text-sm font-medium"
          >
            Due date
          </label>

          <DatePicker
            id="edit-project-due-date"
            :model-value="editDueDate"
            :disabled="isSavingProject"
            @update:model-value="$emit('update:editDueDate', $event ?? '')"
          />
        </div>

        <p v-if="editProjectError" role="alert" class="text-sm text-red-500">
          {{ editProjectError }}
        </p>

        <p
          v-if="editProjectSuccess"
          role="status"
          class="text-sm text-green-600"
        >
          {{ editProjectSuccess }}
        </p>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-background disabled:opacity-50"
            :disabled="isSavingProject"
            @click="$emit('cancelEdit')"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSavingProject || !editName.trim()"
          >
            {{ isSavingProject ? "Saving..." : "Save changes" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Project metadata -->
    <div class="mt-6 flex flex-wrap gap-3">
      <span
        class="rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
      >
        Status: {{ project.status }}
      </span>

      <span
        class="rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
      >
        {{
          project.due_date
            ? `Due ${formatDate(project.due_date)}`
            : "No due date"
        }}
      </span>
    </div>
  </section>
</template>
