import { defineContentScript } from 'wxt/utils/define-content-script';
import type { Config } from '~/types';

interface LongPressOptions {
  onStart?: (event: Event) => void;
  onHold?:
    | ((event: Event, state: { duration: number; triggered: boolean }) => void)
    | null;
  onLongPress?: (event: Event) => void;
  onClick?: (event: Event) => void;
  onRelease?: (event: Event) => void;
  onReleaseAfterLong?: (event: Event) => void;
  duration?: number;
  holdInterval?: number;
  preventDefault?: boolean;
  capture?: boolean;
  disabled?: (event: Event) => boolean;
}

type SpaceAction = 'start' | 'longpress' | 'release' | 'click';

interface SpaceSyncMessage {
  type: 'speedup-space-sync';
  messageId: string;
  sourceFrameId: string;
  action: SpaceAction;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  main() {
    let policy: any;

    function getPolicy() {
      if (policy === undefined) {
        const trustedTypes = (window as any).trustedTypes;
        policy = null;

        if (trustedTypes) {
          try {
            policy = trustedTypes.createPolicy('escape', {
              createHTML: (s: string) => s,
            });
          } catch {}
        }
      }
      return policy;
    }

    function trustedHTMLFromString(html: string) {
      return getPolicy()?.createHTML(html) || html;
    }

    function useLongPress(
      target: Element | string,
      options: LongPressOptions = {},
    ): () => void {
      const {
        onStart = () => {},
        onHold = null,
        onLongPress = () => {},
        onClick = () => {},
        onRelease = () => {},
        onReleaseAfterLong = () => {},

        duration = 800,
        holdInterval = 100,
        preventDefault = false,
        capture = false,

        disabled = () => false,
      } = options;

      let isPressed = false;
      let longPressTriggered = false;
      let longPressTimer: ReturnType<typeof setTimeout> | null = null;
      let holdIntervalTimer: ReturnType<typeof setInterval> | null = null;
      let totalHoldTime = 0;

      const clear = (event: Event) => {
        if (disabled(event)) return;

        if (!isPressed) return;
        isPressed = false;

        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (holdIntervalTimer) {
          clearInterval(holdIntervalTimer);
          holdIntervalTimer = null;
        }

        onRelease(event);

        if (longPressTriggered) {
          onReleaseAfterLong(event);
        } else {
          onClick(event);
        }

        longPressTriggered = false;
      };

      const start = (event: Event) => {
        if (disabled(event)) return;

        if (preventDefault) event.preventDefault();

        if (isPressed) return;
        isPressed = true;
        longPressTriggered = false;
        totalHoldTime = 0;

        onStart(event);

        longPressTimer = setTimeout(() => {
          if (isPressed && !longPressTriggered) {
            longPressTriggered = true;
            onLongPress(event);
          }
        }, duration);

        if (onHold) {
          holdIntervalTimer = setInterval(() => {
            if (isPressed) {
              totalHoldTime += holdInterval;
              onHold(event, {
                duration: totalHoldTime,
                triggered: longPressTriggered,
              });
            }
          }, holdInterval);
        }
      };

      const addEvent = (
        target: EventTarget,
        type: string,
        handler: (e: Event) => void,
      ) => {
        target.addEventListener(type, handler, { capture });
        return () => target.removeEventListener(type, handler, { capture });
      };

      if (target instanceof Element) {
        const cleanupFns: Array<() => void> = [];

        cleanupFns.push(addEvent(target, 'mousedown', start));
        cleanupFns.push(addEvent(target, 'touchstart', start));

        cleanupFns.push(addEvent(document, 'mouseup', clear));
        cleanupFns.push(addEvent(document, 'touchend', clear));
        cleanupFns.push(addEvent(document, 'touchcancel', clear));

        return () => {
          cleanupFns.forEach((fn) => fn());
        };
      } else if (typeof target === 'string') {
        const keyDownHandler = (e: Event) => {
          if (disabled(e)) return;

          const keyEvent = e as KeyboardEvent;
          if (keyEvent.code === target) {
            if (!isPressed) {
              start(e);
            }
            if (isPressed && keyEvent.repeat) {
              e.stopPropagation();
              e.preventDefault();
              return;
            }
          }
        };

        const keyUpHandler = (e: Event) => {
          if (disabled(e)) return;

          const keyEvent = e as KeyboardEvent;
          if (keyEvent.code === target && isPressed) {
            clear(e);
          }
        };

        const cleanupKeydown = addEvent(document, 'keydown', keyDownHandler);
        const cleanupKeyup = addEvent(document, 'keyup', keyUpHandler);

        return () => {
          cleanupKeydown();
          cleanupKeyup();
        };
      }

      console.warn('useLongPress: Unsupported target type');
      return () => {};
    }

    let video: HTMLVideoElement | null = null;
    let isSpeedUp = false;
    let speedIndicator: HTMLElement | null = null;
    let shadowHost: HTMLElement | null = null;
    let config: Config = {
      enabled: true,
      longPressDuration: 500,
      defaultSpeed: 1.0,
      fastSpeed: 2.0,
    };
    let longPressCleanup: (() => void) | null = null;
    const frameId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const MESSAGE_TYPE: SpaceSyncMessage['type'] = 'speedup-space-sync';
    const handledMessageIds = new Set<string>();

    function createSpeedIndicator() {
      if (speedIndicator) return;

      shadowHost = document.createElement('div');
      shadowHost.id = 'speedup-indicator-host';
      shadowHost.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: calc(infinity);
        pointer-events: none;
        display: none;
        transform: translateX(-50%);
      `;

      const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

      speedIndicator = document.createElement('div');
      speedIndicator.innerHTML = trustedHTMLFromString(`
        <span id="speed-text">2x</span>
        <div id="triangle-container">
          <div id="triangle1"></div>
          <div id="triangle2" style="margin-left: 2px;"></div>
        </div>
      `);

      speedIndicator.style.cssText = `
        color: #fffe;
        height: 40px;
        box-sizing: border-box;
        padding: 10px 20px;
        border-radius: 25px;
        font-size: 18px;
        font-weight: bold;
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0.4; }
          50% { opacity: 0.9; }
          100% { opacity: 0.4; }
        }
        #triangle-container {
          display: flex;
        }
        #triangle1, #triangle2 {
          width: 0;
          height: 0;
          border-left: 8px solid #fff;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
        }
        #triangle1 {
          animation: fadeInOut 1s ease-in-out infinite;
          animation-delay: -0.25s;
        }
        #triangle2 {
          animation: fadeInOut 1s ease-in-out infinite;
        }
      `;

      shadowRoot.appendChild(style);
      shadowRoot.appendChild(speedIndicator);
    }

    function showSpeedIndicator() {
      if (!video) return;

      if (!speedIndicator) {
        createSpeedIndicator();
      }

      if (shadowHost && !shadowHost.parentNode) {
        video.parentNode?.appendChild(shadowHost);
      }

      updateIndicatorText();
      updateIndicatorPosition();
      if (shadowHost) {
        shadowHost.style.display = 'block';
      }
    }

    function updateIndicatorText() {
      if (!speedIndicator) return;
      const speedText = speedIndicator.querySelector('#speed-text');
      if (speedText) {
        speedText.textContent = `${config.fastSpeed}x`;
      }
    }

    function updateIndicatorPosition() {
      if (!shadowHost || !video) return;

      const videoRect = video.getBoundingClientRect();

      const leftOffset = videoRect.left + videoRect.width / 2;
      shadowHost.style.left = `${leftOffset}px`;
      shadowHost.style.top = `${videoRect.top + 20}px`;
    }

    function hideSpeedIndicator() {
      if (shadowHost) {
        shadowHost.style.display = 'none';
      }
    }

    function findVideo(root: Document | ShadowRoot = document): HTMLVideoElement | null {
      const video = root.querySelector('video')
      if (video) return video

      const allElements = root.querySelectorAll('*')
      for (const el of allElements) {
        if (el.shadowRoot) {
          const videoInShadow = findVideo(el.shadowRoot)
          if (videoInShadow) return videoInShadow
        }
      }

      if (root === document) {
        for (const frame of document.querySelectorAll('iframe')) {
          try {
            const frameDoc = frame.contentDocument
            if (frameDoc) {
              const videoInFrame = findVideo(frameDoc)
              if (videoInFrame) return videoInFrame
            }
          } catch (e) {
          }
        }
      }

      return null
    }

    function restoreNormalSpeed() {
      if (!video) return;

      isSpeedUp = false;
      video.playbackRate = config.defaultSpeed;
      hideSpeedIndicator();
    }

    function speedUp() {
      if (!video) return;

      isSpeedUp = true;
      video.playbackRate = config.fastSpeed;
      showSpeedIndicator();
    }

    window.addEventListener('scroll', () => {
      if (isSpeedUp && video) {
        updateIndicatorPosition();
      }
    });

    window.addEventListener('resize', () => {
      if (isSpeedUp && video) {
        updateIndicatorPosition();
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      const observer = new MutationObserver(() => {
        if (!video) {
          video = findVideo();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });

    const positionObserver = new MutationObserver(() => {
      if (isSpeedUp && video) {
        updateIndicatorPosition();
      }
    });

    positionObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    function togglePlayPause() {
      if (!video) return;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }

    function isSpaceSyncMessage(data: unknown): data is SpaceSyncMessage {
      if (!data || typeof data !== 'object') return false;
      const message = data as Partial<SpaceSyncMessage>;
      return (
        message.type === MESSAGE_TYPE &&
        typeof message.messageId === 'string' &&
        typeof message.sourceFrameId === 'string' &&
        (message.action === 'start' ||
          message.action === 'longpress' ||
          message.action === 'release' ||
          message.action === 'click')
      );
    }

    function markMessageHandled(messageId: string) {
      handledMessageIds.add(messageId);
      if (handledMessageIds.size > 200) {
        const first = handledMessageIds.values().next().value as
          | string
          | undefined;
        if (first) {
          handledMessageIds.delete(first);
        }
      }
    }

    function postToChildFrames(message: SpaceSyncMessage) {
      const frames = document.querySelectorAll('iframe');
      for (const frame of frames) {
        frame.contentWindow?.postMessage(message, '*');
      }
    }

    function applySpaceAction(action: SpaceAction) {
      if (!config.enabled) return;

      if (action === 'start') {
        video = findVideo();
        return;
      }

      if (action === 'longpress') {
        speedUp();
        return;
      }

      if (action === 'release') {
        restoreNormalSpeed();
        return;
      }

      togglePlayPause();
    }

    function broadcastSpaceAction(action: SpaceAction) {
      const message: SpaceSyncMessage = {
        type: MESSAGE_TYPE,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sourceFrameId: frameId,
        action,
      };

      markMessageHandled(message.messageId);

      if (window === window.top) {
        postToChildFrames(message);
        return;
      }

      window.top?.postMessage(message, '*');
    }

    window.addEventListener('message', (event) => {
      if (!isSpaceSyncMessage(event.data)) return;

      const message = event.data;
      if (message.sourceFrameId === frameId) return;
      if (handledMessageIds.has(message.messageId)) return;

      markMessageHandled(message.messageId);
      applySpaceAction(message.action);

      if (window === window.top) {
        postToChildFrames(message);
        return;
      }

      if (event.source === window.top) {
        postToChildFrames(message);
      }
    });

    const isInputArea = (e: Event) => {
      const target = e.target as HTMLElement;
      return (
        /input|textarea/i.test(target.tagName) ||
        target.contentEditable === 'true' ||
        target.isContentEditable
      );
    };

    function setupLongPress() {
      if (longPressCleanup) {
        longPressCleanup();
      }

      longPressCleanup = useLongPress('Space', {
        onStart: (e) => {
          e.preventDefault();
          e.stopPropagation();
          applySpaceAction('start');
          broadcastSpaceAction('start');
        },
        onLongPress: () => {
          applySpaceAction('longpress');
          broadcastSpaceAction('longpress');
        },
        onRelease: (e) => {
          e.preventDefault();
          e.stopPropagation();
          applySpaceAction('release');
          broadcastSpaceAction('release');
        },
        onClick: () => {
          applySpaceAction('click');
          broadcastSpaceAction('click');
        },
        disabled: (e) => {
          return !config.enabled || isInputArea(e);
        },
        preventDefault: true,
        capture: true,
        duration: config.longPressDuration,
      });
    }

    async function loadConfig() {
      try {
        const result = await browser.storage.local.get(Object.keys(config));
        config = { ...config, ...result } as Config;
        setupLongPress();
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        for (const [key, { newValue }] of Object.entries(changes)) {
          (config as any)[key] = newValue;
        }
        setupLongPress();

        if (isSpeedUp) {
          if (video) {
            video.playbackRate = config.fastSpeed;
          }
          updateIndicatorText();
        }
      }
    });

    loadConfig();
  },
});
