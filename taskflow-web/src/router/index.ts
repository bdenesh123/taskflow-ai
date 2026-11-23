import { createRouter, createWebHistory } from "vue-router";

import AppLayout from "../layouts/AppLayout.vue";
import LoginPage from "../pages/LoginPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import ProjectsPage from "../pages/ProjectsPage.vue";
import ProjectDetailsPage from "../pages/ProjectDetailsPage.vue";
import MyTasksPage from "../pages/MyTasksPage.vue";
import TeamMembersPage from "../pages/TeamMembersPage.vue";
import PersonalTasksPage from "../pages/PersonalTasksPage.vue";
import RegisterPage from "../pages/RegisterPage.vue";
import AccountSettingsPage from "../pages/AccountSettingsPage.vue";

function isTokenExpired(token: string): boolean {
  try {
    const payloadSegment = token.split(".")[1];

    if (!payloadSegment) return true;

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");

    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    const payload = JSON.parse(atob(paddedBase64));

    if (typeof payload.exp !== "number") return true;

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterPage,
      meta: { guestOnly: true },
    },
    {
      path: "/",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: DashboardPage,
        },
        {
          path: "/account-settings",
          component: AccountSettingsPage,
        },
        {
          path: "my-tasks",
          name: "my-tasks",
          component: MyTasksPage,
        },
        {
          path: "team-members",
          name: "team-members",
          component: TeamMembersPage,
        },
        {
          path: "projects",
          name: "projects",
          component: ProjectsPage,
        },
        {
          path: "personal-tasks",
          name: "personal-tasks",
          component: PersonalTasksPage,
        },
        {
          path: "projects/:projectId",
          name: "project-details",
          component: ProjectDetailsPage,
          props: true,
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const token = sessionStorage.getItem("taskflow_access_token");

  const isAuthenticated = token !== null && !isTokenExpired(token);

  // Clear expired or invalid sessions.
  if (token && !isAuthenticated) {
    sessionStorage.removeItem("taskflow_access_token");
    sessionStorage.removeItem("taskflow_user");
  }

  // Prevent unauthenticated users from accessing protected pages.
  if (
    to.matched.some((record) => record.meta.requiresAuth) &&
    !isAuthenticated
  ) {
    return { name: "login" };
  }

  // Prevent authenticated users from accessing guest-only pages.
  if (to.meta.guestOnly && isAuthenticated) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;
