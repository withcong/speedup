import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'SpeedUp – 长按空格倍速播放视频',
    description: 'Speed up video playback with long press on space / 快速视频播放脚本，支持长按空格键加速视频播放',
    version: '0.0.5',
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png',
    },
  },
});
