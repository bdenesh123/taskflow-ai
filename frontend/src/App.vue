<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { Analytics } from "@vercel/analytics/vue";

const router = useRouter();

let expiryTimeout: ReturnType<typeof setTimeout> | undefined;

function clearExpiryTimer() {
  if (expiryTimeout) {
    clearTimeout(expiryTimeout);
    expiryTimeout = undefined;
  }
}

function logout() {
  clearExpiryTimer();

  sessionStorage.removeItem("taskflow_access_token");
  sessionStorage.removeItem("taskflow_user");

  router.replace("/login");
}

function scheduleSessionExpiry() {
  clearExpiryTimer();

  const token = sessionStorage.getItem("taskflow_access_token");

  if (!token) return;

  try {
    const payloadSegment = token.split(".")[1];

    if (!payloadSegment) {
      throw new Error("Invalid access token");
    }

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");

    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    const payload = JSON.parse(atob(paddedBase64));

    if (typeof payload.exp !== "number") {
      throw new Error("Invalid token expiration");
    }

    const remainingTime = payload.exp * 1000 - Date.now();

    if (remainingTime <= 0) {
      logout();
      return;
    }

    expiryTimeout = setTimeout(logout, remainingTime);
  } catch {
    logout();
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    scheduleSessionExpiry();
  }
}

let removeAfterEach: (() => void) | undefined;

onMounted(() => {
  scheduleSessionExpiry();

  removeAfterEach = router.afterEach(() => {
    scheduleSessionExpiry();
  });

  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  clearExpiryTimer();
  removeAfterEach?.();

  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  clearExpiryTimer();
});
</script>

<template>
  <Analytics />
  <RouterView />
</template>
