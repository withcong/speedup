# AGENTS.md

This is a browser extension built with WXT and Svelte 5 (runes).

## Commands

### Development
```bash
npm run dev              # Start dev server (Chrome)
npm run dev:firefox      # Start dev server (Firefox)
```

### Build
```bash
npm run build            # Build for Chrome
npm run build:firefox    # Build for Firefox
npm run zip              # Create zip for distribution
```

### Type Checking
```bash
npm run check            # Run svelte-check for type errors
```

Note: No test framework or linter is currently configured.

## Code Style Guidelines

### Svelte 5 Runes
- Use `let` for reactive state: `let count = 0;`
- Use `let` with `$derived` for computed values when needed
- Import from `svelte` package: `import { onMount } from 'svelte';`

### TypeScript
- Strict mode enabled
- Types defined in `src/types.ts`
- Use `interface` for object shapes
- Use `type` for unions/aliases
- Cast types with `as`: `e as KeyboardEvent`
- Use browser API: `browser.storage.sync.get()`

### Imports
- Path aliases: `~/` maps to `src/`
  - `import type { Config } from '~/types';`
  - WXT utilities: `import { defineContentScript } from 'wxt/utils/define-content-script';`
- Group imports: external packages first, then local modules

### Naming Conventions
- Variables/functions: camelCase: `let config = {};`, `function speedUp() {}`
- Components: PascalCase: `App.svelte`
- Types/interfaces: PascalCase: `interface Config {}`
- Constants: UPPER_SNAKE_CASE for global constants
- File names: PascalCase for components, camelCase for utilities

### Formatting
- Use 2 spaces for indentation
- Single quotes for strings
- No semicolons (optional)
- Omit trailing commas in object/array literals
- One blank line between functions, no more

### Svelte Components
- Use `<script lang="ts">` for TypeScript
- Define reactive state with `let` at script top
- Use `onMount` for initialization
- Use `bind:value`, `bind:checked` for two-way binding
- Use `class:name={condition}` for conditional classes
- Inline styles with `style:property={value}` or style blocks

### Error Handling
- Use try/catch for async operations
- Log errors: `console.error('Failed to load config:', error);`
- Handle errors gracefully with fallback values
- Type `any` only when necessary for browser APIs

### Content Scripts
- Use `defineContentScript` wrapper
- Define `matches` for URL patterns
- Use event listeners on `document` or `window`
- Clean up listeners: return cleanup function from useLongPress
- Prevent default on key events when needed

### Background Scripts
- Use `defineBackground` wrapper
- Listen to `browser.runtime.onInstalled` for setup
- Set default config with `browser.storage.sync.set`

### DOM Manipulation
- Use `document.querySelector()` sparingly
- Create elements with `document.createElement()`
- Set styles with `element.style.cssText` for multiple properties
- Use `MutationObserver` for DOM changes
- Clean up observers when component unmounts

### Browser Extension APIs
- Use `browser` namespace (not `chrome`)
- Storage: `browser.storage.sync.get()`, `browser.storage.sync.set()`
- Listen to changes: `browser.storage.onChanged.addListener()`
- Runtime events: `browser.runtime.onInstalled`

### Functions
- Keep functions focused and small
- Use early returns
- Destructure function parameters: `const { x, y } = options;`
- Provide default values in destructuring: `duration = 500`

### Event Handlers
- Use arrow functions for inline handlers
- Name descriptively: `onSave`, `onToggle`, `handleKeyPress`
- Use `e.preventDefault()` and `e.stopPropagation()` as needed

### Comments
- No comments unless necessary for clarity
- Remove todo comments
- Self-documenting code preferred
