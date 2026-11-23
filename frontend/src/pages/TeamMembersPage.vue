<script setup lang="ts">
import { onMounted, ref, computed } from "vue";

import {
  getProjects,
  getProjectMembers,
  type Project,
} from "../../api/projects";

import type { ProjectMember } from "../../api/projects";

// Team member data structure
interface TeamMemberSummary {
  user_id: string;
  name: string;
  email: string;
  projects: {
    id: string;
    name: string;
    role: string;
    joined_at: string;
  }[];
}

// Page data
const projects = ref<Project[]>([]);
const teamMembers = ref<TeamMemberSummary[]>([]);

// Loading and error states
const isLoading = ref(true);
const pageError = ref("");

// Fetch team members across all projects
async function loadTeamMembers() {
  isLoading.value = true;
  pageError.value = "";
  projects.value = [];
  teamMembers.value = [];

  try {
    projects.value = await getProjects();

    const memberResults = await Promise.allSettled(
      projects.value.map((project) => getProjectMembers(project.id)),
    );

    const membersMap = new Map<string, TeamMemberSummary>();

    memberResults.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        return;
      }

      const project = projects.value[index];

      result.value.forEach((member: ProjectMember) => {
        if (!membersMap.has(member.user_id)) {
          membersMap.set(member.user_id, {
            user_id: member.user_id,
            name: member.name,
            email: member.email,
            projects: [],
          });
        }

        membersMap.get(member.user_id)!.projects.push({
          id: project.id,
          name: project.name,
          role: member.role,
          joined_at: member.joined_at,
        });
      });
    });

    teamMembers.value = Array.from(membersMap.values());

    if (memberResults.some((result) => result.status === "rejected")) {
      pageError.value = "Some project members could not be loaded.";
    }
  } catch (error) {
    console.error("Failed to load team members:", error);
    pageError.value = "Unable to load team members.";
  } finally {
    isLoading.value = false;
  }
}

// Summary statistics
const totalMembers = computed(() => teamMembers.value.length);
const searchQuery = ref("");
const selectedProject = ref("all");

const filteredMembers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return teamMembers.value.filter((member) => {
    // Search by name or email
    const matchesSearch =
      !query ||
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query);

    // Filter by project
    const matchesProject =
      selectedProject.value === "all" ||
      member.projects.some((project) => project.id === selectedProject.value);

    return matchesSearch && matchesProject;
  });
});

onMounted(loadTeamMembers);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <!-- Team Summary -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <article class="rounded-2xl border border-border bg-surface p-5">
        <p class="text-sm text-muted">Total team members</p>

        <p class="mt-4 text-3xl font-semibold">
          {{ isLoading ? "—" : totalMembers }}
        </p>

        <p class="mt-2 text-xs text-muted">
          Unique members across your projects
        </p>
      </article>
    </section>
    <!-- Team Members Directory -->
    <section class="mt-8">
      <div
        class="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h2 class="text-lg font-semibold">All Members</h2>
          <p class="mt-1 text-sm text-muted">
            People you're collaborating with across your projects.
          </p>
        </div>

        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <!-- Search -->
          <div class="relative w-full sm:max-w-xs">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name or email..."
              class="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-16 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:ring-2 focus:ring-muted"
            />

            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-medium text-muted transition hover:text-foreground"
            >
              Clear
            </button>
          </div>

          <!-- Project filter -->
          <select
            v-model="selectedProject"
            class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-muted sm:w-48"
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
      </div>

      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted"
      >
        Loading team members...
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
        v-else-if="teamMembers.length === 0"
        class="rounded-2xl border border-border bg-surface p-10 text-center"
      >
        <h3 class="font-semibold">No team members found</h3>
        <p class="mt-2 text-sm text-muted">
          Members from your projects will appear here.
        </p>
      </div>

      <div
        v-else-if="filteredMembers.length === 0"
        class="rounded-2xl border border-border bg-surface p-10 text-center"
      >
        <h3 class="font-semibold">No members found</h3>
        <p class="mt-2 text-sm text-muted">
          Try searching with a different name or email address.
        </p>
      </div>

      <!-- Member cards -->
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article
          v-for="member in filteredMembers"
          :key="member.user_id"
          class="flex min-h-48 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-sm font-semibold"
            >
              {{ member.name.charAt(0).toUpperCase() }}
            </div>

            <div class="min-w-0">
              <h3 class="truncate font-semibold">
                {{ member.name }}
              </h3>
              <p class="truncate text-sm text-muted">
                {{ member.email }}
              </p>
            </div>
          </div>

          <div class="mt-5 border-t border-border pt-4">
            <p class="text-xs text-muted">
              {{ member.projects.length }}
              {{ member.projects.length === 1 ? "project" : "projects" }}
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="project in member.projects"
                :key="project.id"
                class="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
              >
                {{ project.name }}

                <span class="ml-1 text-muted">
                  · {{ project.role === "owner" ? "Owner" : "Member" }}
                </span>
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
