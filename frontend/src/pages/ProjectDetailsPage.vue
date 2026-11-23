<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import ProjectMembers from "../components/projects/ProjectMembers.vue";
import ProjectHeader from "../components/projects/ProjectHeader.vue";
import ProjectTasks from "../components/projects/ProjectTasks.vue";
import TaskComments from "../components/projects/TaskComments.vue";
import type { AuthUser } from "../../api/auth";
import {
  getProjectById,
  getProjectMembers,
  addProjectMember,
  type Project,
  type ProjectMember,
  removeProjectMember,
  updateProject,
} from "../../api/projects";

import { getUsers, type User } from "../../api/users";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  type Task,
  type CreateTaskData,
  type UpdateTaskData,
} from "../../api/tasks";

import {
  getComments,
  updateComment,
  createComment,
  type Comment,
  deleteComment,
} from "../../api/comments";

const props = defineProps<{
  projectId: string;
}>();

const currentUser = ref<AuthUser | null>(
  JSON.parse(sessionStorage.getItem("taskflow_user") || "null"),
);

const project = ref<Project | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");
const members = ref<ProjectMember[]>([]);
const isLoadingMembers = ref(true);
const membersError = ref("");
const users = ref<User[]>([]);
const isLoadingUsers = ref(false);
const usersError = ref("");

const showAddMember = ref(false);
const selectedUserId = ref("");
const isAddingMember = ref(false);
const addMemberError = ref("");
const addMemberSuccess = ref("");

const removingUserId = ref("");
const removeMemberError = ref("");

const isEditing = ref(false);
const isSavingProject = ref(false);
const editProjectError = ref("");
const editProjectSuccess = ref("");

const editName = ref("");
const editDescription = ref("");
const editStatus = ref("active");
const editDueDate = ref("");

const tasks = ref<Task[]>([]);
const isLoadingTasks = ref(true);
const tasksError = ref("");

const showCreateTaskForm = ref(false);
const isCreatingTask = ref(false);
const createTaskError = ref("");
const createTaskSuccess = ref("");

const newTaskTitle = ref("");
const newTaskDescription = ref("");
const newTaskAssigneeId = ref("");
const newTaskStatus = ref<CreateTaskData["status"]>("todo");
const newTaskPriority = ref<CreateTaskData["priority"]>("medium");
const newTaskDueDate = ref("");

const editingTaskId = ref<string | null>(null);
const isUpdatingTask = ref(false);
const updateTaskError = ref("");
const updateTaskSuccess = ref("");

const editTaskTitle = ref("");
const editTaskDescription = ref("");
const editTaskAssigneeId = ref("");
const editTaskStatus = ref<NonNullable<UpdateTaskData["status"]>>("todo");
const editTaskPriority = ref<NonNullable<UpdateTaskData["priority"]>>("medium");
const editTaskDueDate = ref("");

const deletingTaskId = ref<string | null>(null);
const deleteTaskError = ref("");
const deleteTaskSuccess = ref("");

const selectedTaskId = ref<string | null>(null);
const comments = ref<Comment[]>([]);
const isLoadingComments = ref(false);
const commentsError = ref("");

const newCommentContent = ref("");
const isCreatingComment = ref(false);
const createCommentError = ref("");
const createCommentSuccess = ref("");

const editingCommentId = ref<string | null>(null);
const editCommentContent = ref("");
const isUpdatingComment = ref(false);
const updateCommentError = ref("");
const updateCommentSuccess = ref("");

const deletingCommentId = ref<string | null>(null);
const deleteCommentError = ref("");
const deleteCommentSuccess = ref("");

const availableUsers = computed(() => {
  const existingMemberIds = new Set(
    members.value.map((member) => member.user_id),
  );

  return users.value.filter((user) => !existingMemberIds.has(user.id));
});

function openEditForm() {
  if (!project.value) return;

  editName.value = project.value.name;
  editDescription.value = project.value.description ?? "";
  editStatus.value = project.value.status;
  editDueDate.value = project.value.due_date ?? "";

  editProjectError.value = "";
  editProjectSuccess.value = "";
  isEditing.value = true;
}

function openCreateTaskForm() {
  newTaskTitle.value = "";
  newTaskDescription.value = "";
  newTaskAssigneeId.value = "";
  newTaskStatus.value = "todo";
  newTaskPriority.value = "medium";
  newTaskDueDate.value = "";

  createTaskError.value = "";
  createTaskSuccess.value = "";

  showCreateTaskForm.value = true;
}

function openEditTaskForm(task: Task) {
  editingTaskId.value = task.id;

  editTaskTitle.value = task.title;
  editTaskDescription.value = task.description ?? "";
  editTaskAssigneeId.value = task.assignee_id ?? "";
  editTaskStatus.value = task.status;
  editTaskPriority.value = task.priority;
  editTaskDueDate.value = task.due_date ?? "";

  updateTaskError.value = "";
  updateTaskSuccess.value = "";
}

function openEditCommentForm(comment: Comment) {
  editingCommentId.value = comment.id;
  editCommentContent.value = comment.content;
  updateCommentError.value = "";
  updateCommentSuccess.value = "";
}

async function loadProject() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    project.value = await getProjectById(props.projectId);
  } catch (error) {
    console.error("Failed to load project:", error);
    errorMessage.value =
      "Unable to load this project. It may not exist or you may not have access.";
  } finally {
    isLoading.value = false;
  }
}

async function loadMembers() {
  isLoadingMembers.value = true;
  membersError.value = "";

  try {
    members.value = await getProjectMembers(props.projectId);
  } catch (error) {
    console.error("Failed to load project members:", error);
    membersError.value = "Unable to load project members.";
  } finally {
    isLoadingMembers.value = false;
  }
}

async function loadTasks() {
  isLoadingTasks.value = true;
  tasksError.value = "";

  try {
    tasks.value = await getTasks(props.projectId);
  } catch (error) {
    console.error("Failed to load project tasks:", error);
    tasksError.value = "Unable to load project tasks.";
  } finally {
    isLoadingTasks.value = false;
  }
}

async function loadUsers() {
  isLoadingUsers.value = true;
  usersError.value = "";

  try {
    users.value = await getUsers();
  } catch (error) {
    console.error("Failed to load users:", error);
    usersError.value = "Unable to load users.";
  } finally {
    isLoadingUsers.value = false;
  }
}

async function openAddMemberForm() {
  showAddMember.value = true;
  addMemberError.value = "";
  addMemberSuccess.value = "";
  selectedUserId.value = "";

  await loadUsers();
}

async function handleAddMember() {
  if (!selectedUserId.value) {
    addMemberError.value = "Please select a user.";
    return;
  }

  isAddingMember.value = true;
  addMemberError.value = "";
  addMemberSuccess.value = "";

  try {
    await addProjectMember(props.projectId, selectedUserId.value);
    await loadMembers();
    showAddMember.value = false;
    selectedUserId.value = "";
    addMemberSuccess.value = "Member added successfully.";
  } catch (error) {
    console.error("Failed to add project member:", error);
    addMemberError.value =
      "Unable to add member. They may already belong to this project, or you may not have permission.";
  } finally {
    isAddingMember.value = false;
  }
}

async function handleRemoveMember(userId: string) {
  const member = members.value.find((item) => item.user_id === userId);

  if (!member) return;

  const confirmed = window.confirm(
    `Are you sure you want to remove ${member.name} from this project?`,
  );

  if (!confirmed) return;

  removingUserId.value = userId;
  removeMemberError.value = "";

  try {
    await removeProjectMember(props.projectId, userId);
    await loadMembers();
  } catch (error) {
    console.error("Failed to remove project member:", error);
    removeMemberError.value = "Unable to remove this member. Please try again.";
  } finally {
    removingUserId.value = "";
  }
}

async function handleUpdateProject() {
  if (!editName.value.trim()) {
    editProjectError.value = "Project name is required.";
    return;
  }

  isSavingProject.value = true;
  editProjectError.value = "";
  editProjectSuccess.value = "";

  try {
    const updatedProject = await updateProject(props.projectId, {
      name: editName.value.trim(),
      description: editDescription.value.trim() || null,
      status: editStatus.value,
      due_date: editDueDate.value || null,
    });

    project.value = updatedProject;
    editProjectSuccess.value = "Project updated successfully.";
    isEditing.value = false;
  } catch (error) {
    console.error("Failed to update project:", error);
    editProjectError.value =
      "Unable to update this project. Please check your changes and try again.";
  } finally {
    isSavingProject.value = false;
  }
}

async function handleCreateTask() {
  if (!newTaskTitle.value.trim()) {
    createTaskError.value = "Task title is required.";
    return;
  }

  isCreatingTask.value = true;
  createTaskError.value = "";
  createTaskSuccess.value = "";

  const taskData: CreateTaskData = {
    title: newTaskTitle.value.trim(),
    description: newTaskDescription.value.trim() || null,
    assignee_id: newTaskAssigneeId.value || null,
    status: newTaskStatus.value,
    priority: newTaskPriority.value,
    due_date: newTaskDueDate.value || null,
  };

  try {
    await createTask(props.projectId, taskData);

    await loadTasks();

    showCreateTaskForm.value = false;

    createTaskSuccess.value = "Task created successfully.";
  } catch (error) {
    console.error("Failed to create task:", error);
    createTaskError.value =
      "Unable to create this task. Please check your information and try again.";
  } finally {
    isCreatingTask.value = false;
  }
}

async function handleUpdateTask() {
  if (!editingTaskId.value) return;

  if (!editTaskTitle.value.trim()) {
    updateTaskError.value = "Task title is required.";
    return;
  }

  isUpdatingTask.value = true;
  updateTaskError.value = "";

  const taskData: UpdateTaskData = {
    title: editTaskTitle.value.trim(),
    description: editTaskDescription.value.trim() || null,
    assignee_id: editTaskAssigneeId.value || null,
    status: editTaskStatus.value,
    priority: editTaskPriority.value,
    due_date: editTaskDueDate.value || null,
  };

  try {
    await updateTask(props.projectId, editingTaskId.value, taskData);

    await loadTasks();

    editingTaskId.value = null;
    updateTaskSuccess.value = "Task updated successfully.";
  } catch (error) {
    console.error("Failed to update task:", error);
    updateTaskError.value =
      "Unable to update this task. Please check your changes and try again.";
  } finally {
    isUpdatingTask.value = false;
  }
}

async function loadComments(taskId: string) {
  selectedTaskId.value = taskId;
  isLoadingComments.value = true;
  commentsError.value = "";
  comments.value = [];

  try {
    comments.value = await getComments(props.projectId, taskId);
  } catch (error) {
    console.error("Failed to load task comments:", error);
    commentsError.value = "Unable to load comments.";
  } finally {
    isLoadingComments.value = false;
  }
}

async function handleDeleteTask(taskId: string) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this task?",
  );

  if (!confirmed) return;

  deletingTaskId.value = taskId;
  deleteTaskError.value = "";
  deleteTaskSuccess.value = "";

  try {
    await deleteTask(props.projectId, taskId);

    await loadTasks();

    deleteTaskSuccess.value = "Task deleted successfully.";
  } catch (error) {
    console.error("Failed to delete task:", error);
    deleteTaskError.value = "Unable to delete this task. Please try again.";
  } finally {
    deletingTaskId.value = null;
  }
}

async function handleCreateComment() {
  if (!selectedTaskId.value) return;

  const content = newCommentContent.value.trim();

  if (!content) {
    createCommentError.value = "Comment cannot be empty.";
    return;
  }

  if (content.length > 5000) {
    createCommentError.value = "Comment cannot exceed 5000 characters.";
    return;
  }

  isCreatingComment.value = true;
  createCommentError.value = "";
  createCommentSuccess.value = "";

  try {
    await createComment(props.projectId, selectedTaskId.value, content);

    await loadComments(selectedTaskId.value);

    newCommentContent.value = "";
    createCommentSuccess.value = "Comment added successfully.";
  } catch (error) {
    console.error("Failed to create comment:", error);
    createCommentError.value = "Unable to add comment. Please try again.";
  } finally {
    isCreatingComment.value = false;
  }
}

async function handleUpdateComment() {
  if (!selectedTaskId.value || !editingCommentId.value) return;

  const content = editCommentContent.value.trim();

  if (!content) {
    updateCommentError.value = "Comment cannot be empty.";
    return;
  }

  if (content.length > 5000) {
    updateCommentError.value = "Comment cannot exceed 5000 characters.";
    return;
  }

  isUpdatingComment.value = true;
  updateCommentError.value = "";
  updateCommentSuccess.value = "";

  try {
    await updateComment(
      props.projectId,
      selectedTaskId.value,
      editingCommentId.value,
      content,
    );

    await loadComments(selectedTaskId.value);

    editingCommentId.value = null;
    editCommentContent.value = "";
    updateCommentSuccess.value = "Comment updated successfully.";
  } catch (error) {
    console.error("Failed to update comment:", error);
    updateCommentError.value = "Unable to update comment. Please try again.";
  } finally {
    isUpdatingComment.value = false;
  }
}

async function handleDeleteComment(commentId: string) {
  if (!selectedTaskId.value) return;

  const confirmed = window.confirm(
    "Are you sure you want to delete this comment?",
  );

  if (!confirmed) return;

  deletingCommentId.value = commentId;
  deleteCommentError.value = "";
  deleteCommentSuccess.value = "";

  try {
    await deleteComment(props.projectId, selectedTaskId.value, commentId);

    await loadComments(selectedTaskId.value);

    deleteCommentSuccess.value = "Comment deleted successfully.";
  } catch (error) {
    console.error("Failed to delete comment:", error);
    deleteCommentError.value = "Unable to delete comment. Please try again.";
  } finally {
    deletingCommentId.value = null;
  }
}

onMounted(() => {
  loadProject();
  loadMembers();
  loadTasks();
});
</script>

<template>
  <main class="p-8">
    <div v-if="isLoading" class="py-16 text-center text-sm text-muted">
      Loading project...
    </div>

    <div
      v-else-if="errorMessage"
      class="rounded-xl border border-border p-8 text-center"
    >
      <p class="text-sm text-muted">{{ errorMessage }}</p>

      <button
        class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        @click="loadProject"
      >
        Try again
      </button>
    </div>

    <div v-else-if="project">
      <RouterLink
        to="/projects"
        class="mb-6 inline-flex items-center text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Back to projects
      </RouterLink>

      <ProjectHeader
        :project="project"
        :is-editing="isEditing"
        :is-saving-project="isSavingProject"
        :edit-project-error="editProjectError"
        :edit-project-success="editProjectSuccess"
        v-model:edit-name="editName"
        v-model:edit-description="editDescription"
        v-model:edit-status="editStatus"
        v-model:edit-due-date="editDueDate"
        @open-edit-form="openEditForm"
        @submit-update="handleUpdateProject"
        @cancel-edit="isEditing = false"
      />

      <ProjectMembers
        :members="members"
        :is-loading-members="isLoadingMembers"
        :members-error="membersError"
        :show-add-member="showAddMember"
        :users="users"
        :is-loading-users="isLoadingUsers"
        :users-error="usersError"
        :available-users="availableUsers"
        :selected-user-id="selectedUserId"
        :is-adding-member="isAddingMember"
        :add-member-error="addMemberError"
        :add-member-success="addMemberSuccess"
        :removing-user-id="removingUserId"
        :remove-member-error="removeMemberError"
        @add-member="openAddMemberForm"
        @remove-member="handleRemoveMember"
        @load-members="loadMembers"
        @load-users="loadUsers"
        @submit-add-member="handleAddMember"
        @cancel-add-member="showAddMember = false"
        @update-selected-user-id="selectedUserId = $event"
      />

      <ProjectTasks
        :tasks="tasks"
        :members="members"
        :is-loading-tasks="isLoadingTasks"
        :tasks-error="tasksError"
        :show-create-task-form="showCreateTaskForm"
        :is-creating-task="isCreatingTask"
        :create-task-error="createTaskError"
        :create-task-success="createTaskSuccess"
        v-model:new-task-title="newTaskTitle"
        v-model:new-task-description="newTaskDescription"
        v-model:new-task-assignee-id="newTaskAssigneeId"
        v-model:new-task-status="newTaskStatus"
        v-model:new-task-priority="newTaskPriority"
        v-model:new-task-due-date="newTaskDueDate"
        :editing-task-id="editingTaskId"
        :is-updating-task="isUpdatingTask"
        :update-task-error="updateTaskError"
        :update-task-success="updateTaskSuccess"
        :deleting-task-id="deletingTaskId"
        :delete-task-error="deleteTaskError"
        :delete-task-success="deleteTaskSuccess"
        v-model:edit-task-title="editTaskTitle"
        v-model:edit-task-description="editTaskDescription"
        v-model:edit-task-assignee-id="editTaskAssigneeId"
        v-model:edit-task-status="editTaskStatus"
        v-model:edit-task-priority="editTaskPriority"
        v-model:edit-task-due-date="editTaskDueDate"
        @open-create-task-form="openCreateTaskForm"
        @submit-create-task="handleCreateTask"
        @cancel-create-task="showCreateTaskForm = false"
        @open-edit-task-form="openEditTaskForm"
        @submit-update-task="handleUpdateTask"
        @cancel-edit-task="editingTaskId = null"
        @delete-task="handleDeleteTask"
        @view-task-comments="loadComments"
        @load-tasks="loadTasks"
      />

      <TaskComments
        v-if="selectedTaskId"
        :comments="comments"
        :members="members"
        :is-loading-comments="isLoadingComments"
        :comments-error="commentsError"
        :new-comment-content="newCommentContent"
        :is-creating-comment="isCreatingComment"
        :create-comment-error="createCommentError"
        :create-comment-success="createCommentSuccess"
        @submit-comment="handleCreateComment"
        @update:new-comment-content="newCommentContent = $event"
        :current-user-id="currentUser?.id ?? ''"
        @edit-comment="openEditCommentForm"
        :editing-comment-id="editingCommentId"
        :edit-comment-content="editCommentContent"
        :is-updating-comment="isUpdatingComment"
        :update-comment-error="updateCommentError"
        :update-comment-success="updateCommentSuccess"
        @submit-update-comment="handleUpdateComment"
        @cancel-edit-comment="editingCommentId = null"
        @update:edit-comment-content="editCommentContent = $event"
        :deleting-comment-id="deletingCommentId"
        :delete-comment-error="deleteCommentError"
        :delete-comment-success="deleteCommentSuccess"
        @delete-comment="handleDeleteComment"
      />
    </div>
  </main>
</template>
