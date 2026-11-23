<script setup lang="ts">
import type { Comment } from "../../../api/comments";
import type { ProjectMember } from "../../../api/projects";

defineProps<{
  comments: Comment[];
  members: ProjectMember[];
  isLoadingComments: boolean;
  commentsError: string;
  newCommentContent: string;
  isCreatingComment: boolean;
  createCommentError: string;
  createCommentSuccess: string;
  currentUserId: string;
  editingCommentId: string | null;
  editCommentContent: string;
  isUpdatingComment: boolean;
  updateCommentError: string;
  updateCommentSuccess: string;
  deletingCommentId: string | null;
  deleteCommentError: string;
  deleteCommentSuccess: string;
}>();

defineEmits<{
  submitComment: [];
  "update:newCommentContent": [value: string];
  editComment: [comment: Comment];
  submitUpdateComment: [];
  cancelEditComment: [];
  "update:editCommentContent": [value: string];
  deleteComment: [commentId: string];
}>();
</script>

<template>
  <section class="mt-8">
    <!-- Section heading -->
    <div class="mb-4">
      <h3 class="text-lg font-semibold">Comments</h3>
      <p class="mt-1 text-sm text-muted">
        Discussion and updates about this task.
      </p>
    </div>

    <p
      v-if="deleteCommentSuccess"
      role="status"
      class="mb-3 text-sm text-green-600"
    >
      {{ deleteCommentSuccess }}
    </p>

    <p v-if="deleteCommentError" role="alert" class="mb-3 text-sm text-red-600">
      {{ deleteCommentError }}
    </p>

    <!-- Loading state -->
    <div v-if="isLoadingComments" class="py-8 text-center text-sm text-muted">
      Loading comments...
    </div>

    <!-- Error state -->
    <div
      v-else-if="commentsError"
      class="rounded-xl border border-border p-6 text-center"
    >
      <p class="text-sm text-red-600">
        {{ commentsError }}
      </p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="comments.length === 0"
      class="rounded-xl border border-border p-6 text-center"
    >
      <p class="text-sm text-muted">No comments yet. Start the conversation.</p>
    </div>

    <!-- Comments list -->
    <div v-else class="space-y-4">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="rounded-xl border border-border p-4"
      >
        <!-- Comment header -->
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-sm font-medium"
            >
              {{
                members
                  .find((member) => member.user_id === comment.author_id)
                  ?.name?.charAt(0)
                  .toUpperCase() ?? "?"
              }}
            </div>

            <div>
              <p class="text-sm font-medium">
                {{
                  members.find((member) => member.user_id === comment.author_id)
                    ?.name ?? "Unknown user"
                }}
              </p>

              <p class="text-xs text-muted">
                {{ new Date(comment.created_at).toLocaleString() }}
              </p>
            </div>
          </div>

          <!-- Edit button: Only visible to the comment author -->

          <!-- Comment actions: Only visible to the comment author -->
          <div
            v-if="comment.author_id === currentUserId"
            class="flex items-center gap-2"
          >
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-sidebar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              @click="$emit('editComment', comment)"
            >
              Edit
            </button>

            <button
              type="button"
              :disabled="deletingCommentId === comment.id"
              class="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-sidebar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
              @click="$emit('deleteComment', comment.id)"
            >
              {{ deletingCommentId === comment.id ? "Deleting..." : "Delete" }}
            </button>
          </div>
        </div>

        <!-- Comment content -->

        <!-- Comment content or edit form -->
        <div v-if="editingCommentId === comment.id" class="space-y-3">
          <textarea
            :value="editCommentContent"
            rows="8"
            maxlength="5000"
            placeholder="Edit your comment..."
            class="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-foreground"
            :disabled="isUpdatingComment"
            @input="
              $emit(
                'update:editCommentContent',
                ($event.target as HTMLTextAreaElement).value,
              )
            "
          />

          <!-- Update error -->
          <p
            v-if="updateCommentError"
            role="alert"
            class="text-sm text-red-600"
          >
            {{ updateCommentError }}
          </p>

          <!-- Update success -->
          <p
            v-if="updateCommentSuccess"
            role="status"
            class="text-sm text-green-600"
          >
            {{ updateCommentSuccess }}
          </p>

          <!-- Edit actions -->
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
              :disabled="isUpdatingComment"
              @click="$emit('cancelEditComment')"
            >
              Cancel
            </button>

            <button
              type="button"
              class="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isUpdatingComment || !editCommentContent.trim()"
              @click="$emit('submitUpdateComment')"
            >
              {{ isUpdatingComment ? "Saving..." : "Save changes" }}
            </button>
          </div>
        </div>

        <!-- Normal comment display -->
        <p
          v-else
          class="border-t border-border pt-3 whitespace-pre-wrap text-sm leading-6"
        >
          {{ comment.content }}
        </p>
      </div>
    </div>

    <!-- Add comment form -->
    <div class="mt-6 rounded-xl border border-border bg-surface p-5">
      <h4 class="mb-3 text-sm font-semibold">Add a comment</h4>

      <form @submit.prevent="$emit('submitComment')" class="space-y-3">
        <textarea
          :value="newCommentContent"
          rows="8"
          maxlength="5000"
          placeholder="Write your comment..."
          class="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-foreground"
          :disabled="isCreatingComment"
          @input="
            $emit(
              'update:newCommentContent',
              ($event.target as HTMLTextAreaElement).value,
            )
          "
        />

        <!-- Validation/API error -->
        <p v-if="createCommentError" role="alert" class="text-sm text-red-600">
          {{ createCommentError }}
        </p>

        <!-- Success feedback -->
        <p
          v-if="createCommentSuccess"
          role="status"
          class="text-sm text-green-600"
        >
          {{ createCommentSuccess }}
        </p>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="isCreatingComment || !newCommentContent.trim()"
            class="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isCreatingComment ? "Posting..." : "Post comment" }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
