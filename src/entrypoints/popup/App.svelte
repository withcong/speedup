<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import type { Config } from '~/types';

  let config = $state<Config>({
    enabled: true,
    longPressDuration: 500,
    defaultSpeed: 1.0,
    fastSpeed: 2.0,
  });

  let mounted = $state(false);

  onMount(async () => {
    try {
      const result = await browser.storage.local.get(Object.keys(config));
      config = { ...config, ...result } as Config;
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      mounted = true;
    }
  });

  async function updateConfig(updates: Partial<Config>) {
    Object.assign(config, updates);
    try {
      await browser.storage.local.set($state.snapshot(config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  const defaultSpeedOptions = [0.75, 1.0, 1.25, 1.5];
  const fastSpeedOptions = [1.5, 2.0, 2.5, 3.0];
</script>

<main>
  {#if mounted}
    <div class="content" in:fly={{ y: 20, duration: 600, easing: backOut }}>
      <header>
        <div
          class="logo-area"
          in:scale={{ duration: 600, delay: 200, start: 0.8, easing: backOut }}
        >
          <div class="logo">
            <img src="/icon.svg" alt="SpeedUp" />
          </div>
          <div class="title-group">
            <h1>SpeedUp</h1>
            <span class="status-tag" class:active={config.enabled}>
              {config.enabled ? 'Running' : 'Paused'}
            </span>
          </div>
        </div>

        <label class="switch-container">
          <input
            type="checkbox"
            bind:checked={config.enabled}
            onchange={() => updateConfig({ enabled: config.enabled })}
          />
          <span class="switch"></span>
        </label>
      </header>

      <div
        class="sections"
        class:disabled={!config.enabled}
        in:fade={{ delay: 300, duration: 500 }}
      >
        <div class="card">
          <section>
            <div class="section-header">
              <span class="label">Long Press Delay</span>
              <span class="value"
                >{config.longPressDuration}<small>ms</small></span
              >
            </div>
            <div class="slider-wrapper">
              <input
                type="range"
                min="200"
                max="1000"
                step="50"
                bind:value={config.longPressDuration}
                onchange={() =>
                  updateConfig({ longPressDuration: config.longPressDuration })}
              />
            </div>
          </section>
        </div>

        <div class="card">
          <section>
            <div class="section-header">
              <span class="label">Normal Speed</span>
              <span class="value">{config.defaultSpeed}x</span>
            </div>
            <div class="presets">
              <div
                class="pill"
                style:width="calc(100% / {defaultSpeedOptions.length})"
                style:transform="translateX({defaultSpeedOptions.indexOf(
                  config.defaultSpeed
                ) * 100}%)"
              ></div>
              {#each defaultSpeedOptions as speed}
                <button
                  class:active={config.defaultSpeed === speed}
                  onclick={() => updateConfig({ defaultSpeed: speed })}
                >
                  {speed}
                </button>
              {/each}
            </div>
          </section>
        </div>

        <div class="card">
          <section>
            <div class="section-header">
              <span class="label">Turbo Speed</span>
              <span class="value">{config.fastSpeed}x</span>
            </div>
            <div class="presets">
              <div
                class="pill"
                style:width="calc(100% / {fastSpeedOptions.length})"
                style:transform="translateX({fastSpeedOptions.indexOf(
                  config.fastSpeed
                ) * 100}%)"
              ></div>
              {#each fastSpeedOptions as speed}
                <button
                  class:active={config.fastSpeed === speed}
                  onclick={() => updateConfig({ fastSpeed: speed })}
                >
                  {speed}
                </button>
              {/each}
            </div>
          </section>
        </div>
      </div>

      <footer in:fade={{ delay: 600 }}>
        <div class="hint">
          Long press <kbd>Space</kbd> to Turbo
        </div>
      </footer>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #f9fafb;
    color: #111827;
  }

  main {
    width: 290px;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto,
      sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(235, 80, 39, 0.2);
  }

  .logo img {
    width: 20px;
    height: 20px;
  }

  .title-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  h1 {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .status-tag {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #9ca3af;
    transition: color 0.3s;
  }

  .status-tag.active {
    color: #eb5027;
  }

  .sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sections.disabled {
    opacity: 0.6;
    filter: grayscale(0.8) blur(0.5px);
    pointer-events: none;
    transform: scale(0.98);
  }

  .card {
    background: white;
    border-radius: 16px;
    padding: 14px;
    border: 1px solid rgba(0, 0, 0, 0.03);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.01),
      0 10px 20px -10px rgba(0, 0, 0, 0.04);
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .label {
    font-size: 12px;
    font-weight: 600;
    color: #4b5563;
  }

  .value {
    font-size: 14px;
    font-weight: 700;
    color: #eb5027;
  }

  .value small {
    font-size: 10px;
    font-weight: 500;
    color: #9ca3af;
    margin-left: 1px;
  }

  /* Custom Switch */
  .switch-container {
    position: relative;
    width: 44px;
    height: 24px;
    cursor: pointer;
  }

  .switch-container input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .switch {
    position: absolute;
    inset: 0;
    background-color: #e5e7eb;
    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
  }

  .switch:before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 9px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  input:checked + .switch {
    background: #eb5027;
  }

  input:checked + .switch:before {
    transform: translateX(20px);
  }

  /* Presets */
  .presets {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    background: #f3f4f6;
    padding: 3px;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
  }

  .presets .pill {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 0;
  }

  .presets button {
    position: relative;
    z-index: 1;
    border: none;
    background: transparent;
    padding: 7px 0;
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    border-radius: 8px;
    cursor: pointer;
    transition: color 0.2s;
  }

  .presets button:hover {
    color: #111827;
  }

  .presets button.active {
    color: #eb5027;
  }

  /* Slider */
  .slider-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  input[type='range'] {
    -webkit-appearance: none;
    width: 100%;
    height: 5px;
    background: #f3f4f6;
    border-radius: 10px;
    outline: none;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: white;
    border: 2px solid #eb5027;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(235, 80, 39, 0.15);
    transition: all 0.2s;
  }

  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    border-width: 3px;
  }

  footer {
    padding-top: 4px;
    text-align: center;
  }

  .hint {
    background: #f3f4f6;
    display: inline-block;
    padding: 6px 12px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
  }

  kbd {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 1px 4px;
    font-family: inherit;
    color: #4b5563;
    font-size: 9px;
  }
</style>
