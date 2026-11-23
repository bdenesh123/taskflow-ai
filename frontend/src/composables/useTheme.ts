import { computed, onMounted, onUnmounted, ref, watch } from "vue";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "taskflow-theme";
const preference = ref<ThemePreference>("system");
const systemIsDark = ref(false);

let mediaQuery: MediaQueryList | undefined;

const isDark = computed(() => {
  if (preference.value === "system") {
    return systemIsDark.value;
  }

  return preference.value === "dark";
});

function applyTheme() {
  document.documentElement.classList.toggle("dark", isDark.value);
  document.documentElement.style.colorScheme = isDark.value ? "dark" : "light";
}

function handleSystemChange(event: MediaQueryListEvent) {
  systemIsDark.value = event.matches;
}

export function useTheme() {
  onMounted(() => {
    const savedPreference = localStorage.getItem(STORAGE_KEY);

    if (
      savedPreference === "system" ||
      savedPreference === "light" ||
      savedPreference === "dark"
    ) {
      preference.value = savedPreference;
    }

    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemIsDark.value = mediaQuery.matches;
    mediaQuery.addEventListener("change", handleSystemChange);

    applyTheme();
  });

  watch([preference, systemIsDark], applyTheme);

  onUnmounted(() => {
    mediaQuery?.removeEventListener("change", handleSystemChange);
  });

  function setPreference(value: ThemePreference) {
    preference.value = value;
    localStorage.setItem(STORAGE_KEY, value);
  }

  return {
    preference,
    isDark,
    setPreference,
  };
}
