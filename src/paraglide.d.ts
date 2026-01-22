declare module '~/paraglide/messages.js' {
  export const m: {
    app_name: () => string;
    status_running: () => string;
    status_paused: () => string;
    turbo_speed: () => string;
    normal_speed: () => string;
    long_press_delay: () => string;
    hint_long_press: () => string;
  };
}

declare module '~/paraglide/runtime.js' {
  export function setLocale(locale: string): void;
  export function getLocale(): string;
}
