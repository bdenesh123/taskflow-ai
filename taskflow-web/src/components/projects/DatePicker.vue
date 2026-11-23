<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { CalendarDays } from "lucide-vue-next";
import { formatDate, parseDisplayDate } from "../../utils/date";

const props = defineProps<{
  modelValue: string | null | undefined;
  id?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string | null): void;
}>();

const displayValue = ref(formatDate(props.modelValue));
const calendarInput = ref<HTMLInputElement | null>(null);

const calendarValue = computed(() => props.modelValue ?? "");

watch(
  () => props.modelValue,
  (value) => {
    displayValue.value = formatDate(value);
  },
);

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;

  displayValue.value = value;

  if (!value.trim()) {
    emit("update:modelValue", null);
    return;
  }

  const parsedDate = parseDisplayDate(value);

  if (parsedDate) {
    emit("update:modelValue", parsedDate);
  }
}

function handleCalendarChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;

  if (!value) return;

  displayValue.value = formatDate(value);
  emit("update:modelValue", value);
}

function openCalendar() {
  calendarInput.value?.showPicker();
}
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      type="text"
      :value="displayValue === '—' ? '' : displayValue"
      placeholder="DD/MM/YYYY"
      :disabled="disabled"
      maxlength="10"
      @input="handleInput"
      class="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-muted disabled:cursor-not-allowed disabled:opacity-50"
    />

    <button
      type="button"
      :disabled="disabled"
      @click="openCalendar"
      class="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-foreground disabled:cursor-not-allowed"
      aria-label="Open calendar"
    >
      <CalendarDays :size="18" />
    </button>

    <input
      ref="calendarInput"
      type="date"
      :value="calendarValue"
      @change="handleCalendarChange"
      class="pointer-events-none absolute right-0 top-0 h-0 w-0 opacity-0"
      tabindex="-1"
      aria-hidden="true"
    />
  </div>
</template>
