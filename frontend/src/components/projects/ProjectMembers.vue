<script setup lang="ts">
import type { ProjectMember } from "../../../api/projects";
import type { User } from "../../../api/users";

defineProps<{
  members: ProjectMember[];
  isLoadingMembers: boolean;
  membersError: string;

  showAddMember: boolean;
  users: User[];
  isLoadingUsers: boolean;
  usersError: string;
  availableUsers: User[];
  selectedUserId: string;
  isAddingMember: boolean;
  addMemberError: string;
  addMemberSuccess: string;

  removingUserId: string;
  removeMemberError: string;
}>();

defineEmits<{
  addMember: [];
  removeMember: [userId: string];
  loadMembers: [];
  loadUsers: [];
  submitAddMember: [];
  cancelAddMember: [];
  updateSelectedUserId: [userId: string];
}>();
</script>

<template>
  <section class="mt-10">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">Project members</h2>
        <p class="mt-1 text-sm text-muted">
          People who have access to this project.
        </p>
      </div>

      <button
        type="button"
        class="cursor-pointer shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
        @click="$emit('addMember')"
      >
        + Add member
      </button>
    </div>

    <!-- Add member form -->
    <div
      v-if="showAddMember"
      class="mb-5 rounded-xl border border-border bg-surface p-5"
    >
      <h3 class="font-medium">Add a team member</h3>
      <p class="mt-1 text-sm text-muted">
        Select a user to give them access to this project.
      </p>

      <form class="mt-4 space-y-4" @submit.prevent="$emit('submitAddMember')">
        <div>
          <label for="member-user" class="mb-2 block text-sm font-medium">
            User
          </label>

          <div v-if="isLoadingUsers" class="text-sm text-muted">
            Loading users...
          </div>

          <p v-else-if="usersError" class="text-sm text-red-500">
            {{ usersError }}
            <button
              type="button"
              class="ml-1 underline"
              @click="$emit('loadUsers')"
            >
              Try again
            </button>
          </p>

          <select
            v-else
            id="member-user"
            :value="selectedUserId"
            class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            :disabled="availableUsers.length === 0 || isAddingMember"
            @change="
              $emit(
                'updateSelectedUserId',
                ($event.target as HTMLSelectElement).value,
              )
            "
          >
            <option value="" disabled>
              {{
                availableUsers.length ? "Select a user" : "No available users"
              }}
            </option>

            <option
              v-for="user in availableUsers"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }} — {{ user.email }}
            </option>
          </select>

          <p
            v-if="!isLoadingUsers && !usersError && availableUsers.length === 0"
            class="mt-2 text-sm text-muted"
          >
            All existing users are already members of this project.
          </p>
        </div>

        <p v-if="addMemberError" role="alert" class="text-sm text-red-500">
          {{ addMemberError }}
        </p>

        <p v-if="addMemberSuccess" role="status" class="text-sm text-green-600">
          {{ addMemberSuccess }}
        </p>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-background"
            :disabled="isAddingMember"
            @click="$emit('cancelAddMember')"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="
              isAddingMember ||
              isLoadingUsers ||
              !!usersError ||
              !selectedUserId
            "
          >
            {{ isAddingMember ? "Adding..." : "Add member" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Members loading state -->
    <div
      v-if="isLoadingMembers"
      class="rounded-xl border border-border p-6 text-sm text-muted"
    >
      Loading members...
    </div>

    <!-- Members error state -->
    <div v-else-if="membersError" class="rounded-xl border border-border p-6">
      <p class="text-sm text-muted">{{ membersError }}</p>

      <button
        class="mt-3 text-sm font-medium underline"
        @click="$emit('loadMembers')"
      >
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="members.length === 0"
      class="rounded-xl border border-border p-6 text-sm text-muted"
    >
      No members found.
    </div>

    <!-- Members list -->
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="member in members"
        :key="member.user_id"
        class="flex min-h-36 flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted"
      >
        <!-- Member information -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">
              {{ member.name }}
            </p>

            <p class="mt-1 break-all text-sm text-muted">
              {{ member.email }}
            </p>
          </div>

          <!-- Role badge -->
          <span
            class="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs capitalize"
          >
            {{ member.role }}
          </span>
        </div>

        <!-- Actions -->
        <div
          v-if="member.role !== 'owner'"
          class="mt-4 flex justify-end border-t border-border pt-4"
        >
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-sidebar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="removingUserId !== ''"
            @click="$emit('removeMember', member.user_id)"
          >
            {{ removingUserId === member.user_id ? "Removing..." : "Remove" }}
          </button>
        </div>

        <div v-else class="mt-4 border-t border-border pt-4">
          <p class="text-xs text-muted">Project owner</p>
        </div>
      </div>
    </div>

    <p v-if="removeMemberError" role="alert" class="mt-3 text-sm text-red-500">
      {{ removeMemberError }}
    </p>
  </section>
</template>
