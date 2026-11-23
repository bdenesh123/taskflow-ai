<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getProjects, createProject, type Project } from "../../api/projects";
import DatePicker from "../components/projects/DatePicker.vue";

const projects = ref<Project[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");
const showCreateModal = ref(false);
const projectName = ref("");
const projectDescription = ref("");
const projectStatus = ref("active");
const projectDueDate = ref("");
const isCreating = ref(false);
const createError = ref("");

async function loadProjects() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    projects.value = await getProjects();
  } catch (error) {
    console.error("Failed to load projects:", error);
    errorMessage.value = "Unable to load projects. Please try again.";
  } finally {
    isLoading.value = false;
  }
}

async function handleCreateProject() {
  createError.value = "";

  const name = projectName.value.trim();

  if (!name) {
    createError.value = "Project name is required.";
    return;
  }

  isCreating.value = true;

  try {
    await createProject({
      name,
      description: projectDescription.value.trim() || null,
      status: projectStatus.value,
      due_date: projectDueDate.value || null,
    });

    showCreateModal.value = false;

    projectName.value = "";
    projectDescription.value = "";
    projectStatus.value = "active";
    projectDueDate.value = "";

    await loadProjects();
  } catch (error) {
    console.error("Failed to create project:", error);

    createError.value = "Unable to create project. Please try again.";
  } finally {
    isCreating.value = false;
  }
}

onMounted(loadProjects);
</script>

<template>
  <section class="p-6 md:p-8">
    <div class="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Projects</h1>
        <p class="mt-1 text-sm text-muted">
          Manage your projects and keep track of progress.
        </p>
      </div>

      <button
        type="button"
        class="cursor-pointer shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
        @click="showCreateModal = true"
      >
        + Create project
      </button>
    </div>

    <div v-if="isLoading" class="py-16 text-center text-sm text-muted">
      Loading projects...
    </div>

    <div
      v-else-if="errorMessage"
      class="rounded-xl border border-border p-8 text-center"
    >
      <p class="text-sm text-muted">{{ errorMessage }}</p>
      <button
        class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        @click="loadProjects"
      >
        Try again
      </button>
    </div>

    <div
      v-else-if="projects.length === 0"
      class="rounded-xl border border-dashed border-border px-6 py-16 text-center"
    >
      <div class="text-3xl" aria-hidden="true">▤</div>
      <h2 class="mt-4 text-lg font-medium">No projects yet</h2>
      <p class="mx-auto mt-2 max-w-sm text-sm text-muted">
        Projects you create or join will appear here.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="project in projects"
        :key="project.id"
        class="cursor-pointer rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted hover:bg-background"
        @click="$router.push(`/projects/${project.id}`)"
      >
        <h2 class="font-semibold">{{ project.name }}</h2>

        <p class="mt-2 line-clamp-2 min-h-10 text-sm text-muted">
          {{ project.description || "No description provided." }}
        </p>

        <div class="mt-5 flex items-center justify-between gap-3">
          <span class="rounded-md bg-background px-2.5 py-1 text-xs text-muted">
            {{ project.status }}
          </span>

          <span class="text-xs text-muted">
            {{ project.due_date ? `Due ${project.due_date}` : "No due date" }}
          </span>
        </div>
      </article>
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
        aria-labelledby="create-project-title"
        class="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-project-title" class="text-lg font-semibold">
              Create project
            </h2>
            <p class="mt-1 text-sm text-muted">
              Set up a new project for your team.
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

        <form class="mt-6 space-y-5" @submit.prevent="handleCreateProject">
          <div>
            <label for="project-name" class="mb-2 block text-sm font-medium">
              Project name <span class="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              v-model="projectName"
              type="text"
              required
              maxlength="150"
              placeholder="e.g. Website redesign"
              class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
            />
          </div>

          <div>
            <label
              for="project-description"
              class="mb-2 block text-sm font-medium"
            >
              Description <span class="text-muted">(optional)</span>
            </label>
            <textarea
              id="project-description"
              v-model="projectDescription"
              rows="8"
              placeholder="What is this project about?"
              class="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
            />
          </div>

          <div>
            <label for="project-status" class="mb-2 block text-sm font-medium">
              Status
            </label>
            <select
              id="project-status"
              v-model="projectStatus"
              class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label
              for="project-due-date"
              class="mb-2 block text-sm font-medium"
            >
              Due date <span class="text-muted">(optional)</span>
            </label>
            <DatePicker id="project-due-date" v-model="projectDueDate" />
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
              {{ isCreating ? "Creating..." : "Create project" }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>
