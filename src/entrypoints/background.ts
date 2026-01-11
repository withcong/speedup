import { defineBackground } from 'wxt/utils/define-background';
import type { Config } from '~/types';

const defaultConfig: Config = {
  enabled: true,
  longPressDuration: 500,
  defaultSpeed: 1.0,
  fastSpeed: 2.0,
};

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      await browser.storage.local.set(defaultConfig);
    }
  });

  console.log('SpeedUp background script initialized');
});
