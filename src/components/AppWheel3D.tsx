import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  EyeOff,
  GripVertical,
  Home,
  Info,
  Move,
  Pin,
  Play,
  Trash2,
} from 'lucide-react';
import {
  AnimationPreset,
  AppItem,
  IconShape,
  IconSize,
  NotificationSummary,
  WheelRotationDirection,
  WheelSize,
  WheelStyle,
} from '../types/launcher';
import { AppIconGlyph } from './AppIconGlyph';

interface AppWheel3DProps {
  apps: AppItem[];
  selectedIndex: number;
  onSelectIndexChange: (index: number) => void;
  onLaunchApp: (app: AppItem) => void;
  onOpenOptions: (app: AppItem) => void;
  onToggleFavorite: (appId: string) => void;
  onToggleHideApp?: (appId: string) => void;
  onDeleteApp?: (app: AppItem) => void;
  onRemoveCustomApp?: (appId: string) => void;
  onReturnHome?: () => void;
  isNativeAndroid?: boolean;
  onMoveWheelApp: (appId: string, direction: 'prev' | 'next') => void;
  onReorderWheelApp: (fromIndex: number, toIndex: number) => void;
  onOpenWheelSettings: () => void;
  onOpenHiddenManager?: () => void;
  onUpdateWheelSize?: (size: WheelSize) => void;
  favoritesSet: Set<string>;
  notifications: Map<string, NotificationSummary>;
  showNotificationBadges: boolean;
  wheelStyle: WheelStyle;
  wheelSize: WheelSize;
  wheelSpeed: number;
  wheelPerspective: number;
  wheelRotationDirection: WheelRotationDirection;
  wheelReflections: boolean;
  wheelInertia: number;
  wheelTiltDegrees: number;
  showWheelLabels: boolean;
  showAppIcons?: boolean;
  textOnlySet?: Set<string>;
  disabledSet?: Set<string>;
  iconSize: IconSize;
  iconShape: IconShape;
  iconMonochrome: boolean;
  iconUniformMask?: boolean;
  animationPreset: AnimationPreset;
  enableHorizontalSwipe: boolean;
  wheelSoundHaptics: boolean;
  categories?: string[];
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onStartDrag?: (app: AppItem, startX: number, startY: number) => void;
  onDragMove?: (x: number, y: number) => void;
  onEndDrag?: () => void;
  isLight?: boolean;
  trackRgb?: string;
  accentHex?: string;
  accentFgHex?: string;
}

function positiveMod(n: number, m: number): number {
  if (m <= 0) return 0;
  return ((n % m) + m) % m;
}

function describeArcSector(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const a1 = toRad(startDeg);
  const a2 = toRad(endDeg);
  const x1 = cx + Math.cos(a1) * rOuter;
  const y1 = cy + Math.sin(a1) * rOuter;
  const x2 = cx + Math.cos(a2) * rOuter;
  const y2 = cy + Math.sin(a2) * rOuter;
  const x3 = cx + Math.cos(a2) * rInner;
  const y3 = cy + Math.sin(a2) * rInner;
  const x4 = cx + Math.cos(a1) * rInner;
  const y4 = cy + Math.sin(a1) * rInner;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rOuter} ${rOuter} 0 0 1 ${x2.toFixed(
    2
  )} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(
    2
  )} A ${rInner} ${rInner} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
}

function describeArcLine(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const a1 = toRad(startDeg);
  const a2 = toRad(endDeg);
  const x1 = cx + Math.cos(a1) * r;
  const y1 = cy + Math.sin(a1) * r;
  const x2 = cx + Math.cos(a2) * r;
  const y2 = cy + Math.sin(a2) * r;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const TRACK_TICK_COUNT = 36;
const INNER_HUD_TICK_COUNT = 24;

function normalizeAngleDiff(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const AppWheel3D: React.FC<AppWheel3DProps> = ({
  apps,
  selectedIndex,
  onSelectIndexChange,
  onLaunchApp,
  onOpenOptions,
  onToggleHideApp,
  onDeleteApp,
  onRemoveCustomApp,
  onReturnHome,
  isNativeAndroid = false,
  onMoveWheelApp,
  onReorderWheelApp,
  onOpenHiddenManager,
  onUpdateWheelSize,
  favoritesSet,
  notifications,
  showNotificationBadges,
  wheelStyle,
  wheelSize,
  wheelSpeed,
  wheelPerspective,
  wheelRotationDirection,
  wheelReflections,
  wheelInertia,
  wheelTiltDegrees,
  showWheelLabels,
  showAppIcons = true,
  textOnlySet,
  disabledSet,
  iconSize,
  iconShape,
  iconMonochrome,
  iconUniformMask = false,
  animationPreset,
  enableHorizontalSwipe,
  wheelSoundHaptics,
  onStartDrag,
  onDragMove,
  onEndDrag,
  isLight = false,
  trackRgb = '255, 255, 255',
  accentHex = '#ffffff',
  accentFgHex = '#000000',
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 340, height: 380 });
  const [dragReorderIdx, setDragReorderIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);

  // Continuous floating-point wheel index for 60 FPS infinite carousel physics
  const [renderPosition, setRenderPosition] = useState<number>(selectedIndex);
  const positionRef = useRef<number>(selectedIndex);
  const velocityRef = useRef<number>(0);
  const targetSnapRef = useRef<number | null>(null);

  // Audio & haptic rotary detent feedback (unlocked strictly on user gesture)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const userInteractedRef = useRef<boolean>(false);
  const lastDetentTimeRef = useRef<number>(0);

  // Multitouch-safe pointer tracking
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const primaryPointerIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isPinchingRef = useRef<boolean>(false);
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartSizeRef = useRef<WheelSize>(wheelSize);

  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerRef = useRef<{ x: number; y: number; time: number }>({
    x: 0,
    y: 0,
    time: 0,
  });
  const totalDragDistanceRef = useRef<number>(0);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef<boolean>(false);
  const isPodDraggingRef = useRef<boolean>(false);
  const activeDragAppRef = useRef<AppItem | null>(null);
  const [localDraggingApp, setLocalDraggingApp] = useState<AppItem | null>(null);
  const [isOverWheelDelete, setIsOverWheelDelete] = useState<boolean>(false);
  const isOverWheelDeleteRef = useRef<boolean>(false);
  const wheelDeleteBtnRef = useRef<HTMLButtonElement | null>(null);
  const [isOverWheelHide, setIsOverWheelHide] = useState<boolean>(false);
  const isOverWheelHideRef = useRef<boolean>(false);
  const wheelHideBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastReportedIndexRef = useRef<number>(selectedIndex);

  const count = apps.length;
  const dirSign = wheelRotationDirection === 'inverted' ? -1 : 1;

  const unlockAudio = useCallback(() => {
    userInteractedRef.current = true;
    if (!wheelSoundHaptics) return;
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtor && !audioCtxRef.current) {
        audioCtxRef.current = new AudioCtor();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
    } catch {
      // Ignore if AudioContext is blocked
    }
  }, [wheelSoundHaptics]);

  const triggerRotaryDetent = useCallback(() => {
    if (!wheelSoundHaptics || !userInteractedRef.current) return;
    const now = performance.now();
    if (now - lastDetentTimeRef.current < 28) return;
    lastDetentTimeRef.current = now;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(4);
      } catch {
        // Ignore vibrate failures
      }
    }

    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.014);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.016);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.018);
    } catch {
      // Ignore synth errors
    }
  }, [wheelSoundHaptics]);

  // Measure orbital stage dynamically across compact phones, tablets, and desktops
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Synchronize external selectedIndex changes (A-Z rail, keyboard, or reorder follow)
  useEffect(() => {
    if (count === 0) return;
    if (isDraggingRef.current) return;
    if (selectedIndex === lastReportedIndexRef.current) return;

    lastReportedIndexRef.current = selectedIndex;
    const currentWrapped = positiveMod(positionRef.current, count);
    let delta = selectedIndex - currentWrapped;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;

    if (animationPreset === 'reduced') {
      positionRef.current = positionRef.current + delta;
      velocityRef.current = 0;
      targetSnapRef.current = null;
      setRenderPosition(positionRef.current);
    } else {
      targetSnapRef.current = Math.round(positionRef.current + delta);
      velocityRef.current = 0;
    }
  }, [selectedIndex, count, animationPreset]);

  // 60 FPS physical infinite rotational inertia + magnetic detent snap loop
  useEffect(() => {
    if (count === 0) return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      let needsUpdate = false;

      if (!isDraggingRef.current && !isPinchingRef.current) {
        if (targetSnapRef.current !== null) {
          const diff = targetSnapRef.current - positionRef.current;
          const stiffness = animationPreset === 'crisp' ? 18 : 11;
          if (Math.abs(diff) < 0.002) {
            positionRef.current = targetSnapRef.current;
            targetSnapRef.current = null;
            needsUpdate = true;
          } else {
            positionRef.current += diff * Math.min(1, dt * stiffness);
            needsUpdate = true;
          }
        } else if (Math.abs(velocityRef.current) > 0.015) {
          positionRef.current += velocityRef.current * dt;
          const clampedInertia = Math.max(0.84, Math.min(0.968, wheelInertia));
          const friction =
            animationPreset === 'crisp' ? Math.min(0.885, clampedInertia) : clampedInertia;
          velocityRef.current *= Math.pow(friction, dt * 60);
          needsUpdate = true;

          if (Math.abs(velocityRef.current) <= 0.34) {
            targetSnapRef.current = Math.round(positionRef.current);
            velocityRef.current = 0;
          }
        }
      }

      if (needsUpdate) {
        setRenderPosition(positionRef.current);
        const snapped = positiveMod(Math.round(positionRef.current), count);
        if (snapped !== lastReportedIndexRef.current) {
          lastReportedIndexRef.current = snapped;
          triggerRotaryDetent();
          onSelectIndexChange(snapped);
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [count, animationPreset, wheelInertia, onSelectIndexChange, triggerRotaryDetent]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const startPodLongPress = useCallback(
    (app: AppItem, clientX: number, clientY: number) => {
      longPressFiredRef.current = false;
      cancelLongPress();

      longPressTimerRef.current = window.setTimeout(() => {
        longPressFiredRef.current = true;
        isPodDraggingRef.current = true;
        activeDragAppRef.current = app;
        isDraggingRef.current = false;
        velocityRef.current = 0;
        targetSnapRef.current = Math.round(positionRef.current);

        try {
          navigator.vibrate?.(60);
        } catch {
          // Ignore vibration error
        }

        onStartDrag?.(app, clientX, clientY);
        setLocalDraggingApp(app);
        setIsOverWheelDelete(false);
        isOverWheelDeleteRef.current = false;
        setIsOverWheelHide(false);
        isOverWheelHideRef.current = false;

        const checkIsOverBtn = (btnRef: React.RefObject<HTMLButtonElement | null>, x: number, y: number) => {
          if (!btnRef.current) return false;
          const rect = btnRef.current.getBoundingClientRect();
          const btnCenterX = rect.left + rect.width / 2;
          const btnCenterY = rect.top + rect.height / 2;
          const dist = Math.hypot(x - btnCenterX, y - btnCenterY);
          return dist <= Math.max(rect.width * 1.25, 56);
        };

        const handleWindowPointerMove = (ev: PointerEvent) => {
          onDragMove?.(ev.clientX, ev.clientY);
          const isOverDel = checkIsOverBtn(wheelDeleteBtnRef, ev.clientX, ev.clientY);
          const isOverH = checkIsOverBtn(wheelHideBtnRef, ev.clientX, ev.clientY);

          if (isOverDel !== isOverWheelDeleteRef.current) {
            isOverWheelDeleteRef.current = isOverDel;
            setIsOverWheelDelete(isOverDel);
            if (isOverDel) {
              try { navigator.vibrate?.(35); } catch {}
            }
          }
          if (isOverH !== isOverWheelHideRef.current) {
            isOverWheelHideRef.current = isOverH;
            setIsOverWheelHide(isOverH);
            if (isOverH) {
              try { navigator.vibrate?.(35); } catch {}
            }
          }
        };

        const handleWindowPointerUp = (ev: PointerEvent) => {
          const wasOverDel = isOverWheelDeleteRef.current || checkIsOverBtn(wheelDeleteBtnRef, ev.clientX, ev.clientY);
          const wasOverH = isOverWheelHideRef.current || checkIsOverBtn(wheelHideBtnRef, ev.clientX, ev.clientY);
          const appTarget = activeDragAppRef.current;

          if (appTarget) {
            if (wasOverDel) {
              try { navigator.vibrate?.(80); } catch {}
              if (onDeleteApp) {
                onDeleteApp(appTarget);
              } else if (appTarget.isCustom && onRemoveCustomApp) {
                onRemoveCustomApp(appTarget.id);
              } else if (isNativeAndroid && window.SkyAndroid?.uninstallApp) {
                window.SkyAndroid.uninstallApp(appTarget.packageName);
              }
            } else if (wasOverH) {
              try { navigator.vibrate?.(80); } catch {}
              onToggleHideApp?.(appTarget.id);
            }
          }

          isPodDraggingRef.current = false;
          activeDragAppRef.current = null;
          isOverWheelDeleteRef.current = false;
          setIsOverWheelDelete(false);
          isOverWheelHideRef.current = false;
          setIsOverWheelHide(false);
          setLocalDraggingApp(null);

          window.removeEventListener('pointermove', handleWindowPointerMove);
          window.removeEventListener('pointerup', handleWindowPointerUp);
          window.removeEventListener('pointercancel', handleWindowPointerUp);
          onEndDrag?.();
        };

        window.addEventListener('pointermove', handleWindowPointerMove);
        window.addEventListener('pointerup', handleWindowPointerUp);
        window.addEventListener('pointercancel', handleWindowPointerUp);
      }, 320);
    },
    [cancelLongPress, onStartDrag, onDragMove, onEndDrag, onDeleteApp, onRemoveCustomApp, isNativeAndroid, onToggleHideApp]
  );

  const getPinchDistance = (map: Map<number, { x: number; y: number }>) => {
    const pts = Array.from(map.values());
    if (pts.length < 2) return 0;
    return Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  };

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (count === 0) return;
    unlockAudio();

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multitouch pinch detection (2+ simultaneous pointers): suspend rotational drag cleanly
    if (activePointersRef.current.size >= 2) {
      cancelLongPress();
      isDraggingRef.current = false;
      isPinchingRef.current = true;
      velocityRef.current = 0;
      targetSnapRef.current = Math.round(positionRef.current);
      pinchStartDistRef.current = getPinchDistance(activePointersRef.current);
      pinchStartSizeRef.current = wheelSize;
      return;
    }

    // Single primary pointer start
    isPinchingRef.current = false;
    isDraggingRef.current = true;
    primaryPointerIdRef.current = e.pointerId;
    targetSnapRef.current = null;
    velocityRef.current = 0;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    totalDragDistanceRef.current = 0;
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (count === 0) return;

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Smooth pinch-to-resize wheel size (no rotational jump)
    if (isPinchingRef.current && activePointersRef.current.size >= 2) {
      const dist = getPinchDistance(activePointersRef.current);
      if (pinchStartDistRef.current > 10 && onUpdateWheelSize) {
        const ratio = dist / pinchStartDistRef.current;
        if (ratio > 1.24) {
          const nextSize: WheelSize =
            pinchStartSizeRef.current === 'compact' ? 'standard' : 'expanded';
          if (nextSize !== wheelSize) onUpdateWheelSize(nextSize);
        } else if (ratio < 0.78) {
          const nextSize: WheelSize =
            pinchStartSizeRef.current === 'expanded' ? 'standard' : 'compact';
          if (nextSize !== wheelSize) onUpdateWheelSize(nextSize);
        }
      }
      return;
    }

    if (isPodDraggingRef.current) return;

    if (
      !isDraggingRef.current ||
      !enableHorizontalSwipe ||
      e.pointerId !== primaryPointerIdRef.current
    ) {
      return;
    }

    const now = performance.now();
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    const dt = Math.max((now - lastPointerRef.current.time) / 1000, 0.004);

    totalDragDistanceRef.current = Math.max(
      totalDragDistanceRef.current,
      Math.hypot(e.clientX - startPointerRef.current.x, e.clientY - startPointerRef.current.y)
    );

    if (totalDragDistanceRef.current > 8 && !longPressFiredRef.current) {
      cancelLongPress();
      if (
        primaryPointerIdRef.current !== null &&
        stageRef.current &&
        !stageRef.current.hasPointerCapture(primaryPointerIdRef.current)
      ) {
        try {
          stageRef.current.setPointerCapture(primaryPointerIdRef.current);
        } catch {
          // Ignore synthetic pointer capture issues
        }
      }
    }

    let indexDelta = 0;
    const rect = stageRef.current?.getBoundingClientRect();

    if (wheelStyle === 'vertical') {
      const effectiveDelta = -dy + dx * 0.25;
      const sensitivity = (0.0175 * wheelSpeed * 350) / Math.max(stageSize.height, 260);
      indexDelta = -effectiveDelta * sensitivity * dirSign;
    } else if (wheelStyle === 'horizontal') {
      const sensitivity = (0.0175 * wheelSpeed * 350) / Math.max(stageSize.width, 240);
      indexDelta = -dx * sensitivity * dirSign;
    } else if (wheelStyle === 'carousel' && rect) {
      // Alpha Hybrid Launcher left-anchored right-sweeping semi-circular 3D arc tracking
      const cx = rect.left + arcOriginPxX;
      const cy = rect.top + stageCenterY;
      const safeRX = Math.max(arcRadiusX, 90);
      const safeRY = Math.max(arcRadiusY, 100);

      const prevNX = (lastPointerRef.current.x - cx) / safeRX;
      const prevNY = (lastPointerRef.current.y - cy) / safeRY;
      const currNX = (e.clientX - cx) / safeRX;
      const currNY = (e.clientY - cy) / safeRY;

      const rNorm = Math.hypot(currNX, currNY);
      const radialWeight = Math.min(1, Math.max(0, (rNorm - 0.14) / 0.28));

      const prevAngle = Math.atan2(prevNY, prevNX);
      const currAngle = Math.atan2(currNY, currNX);
      const dAngle = normalizeAngleDiff(currAngle - prevAngle);

      const polarDelta = (-dAngle / Math.max(angleStep, 0.22)) * wheelSpeed;
      const linearDelta = (-dy * 0.0175 * wheelSpeed * 350) / Math.max(stageSize.height, 260);

      indexDelta = (polarDelta * radialWeight + linearDelta * (1 - radialWeight)) * dirSign;
    } else if (rect) {
      // 3D Sphere polar elliptical tracking
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2 - (isCompactPhone ? 8 : 12);
      const safeRX = Math.max(radiusX, 64);
      const safeRY = Math.max(radiusY, 56);

      const prevNX = (lastPointerRef.current.x - cx) / safeRX;
      const prevNY = (lastPointerRef.current.y - cy) / safeRY;
      const currNX = (e.clientX - cx) / safeRX;
      const currNY = (e.clientY - cy) / safeRY;

      const rNorm = Math.hypot(currNX, currNY);
      const radialWeight = Math.min(1, Math.max(0, (rNorm - 0.14) / 0.28));

      const prevAngle = Math.atan2(prevNX, prevNY);
      const currAngle = Math.atan2(currNX, currNY);
      const dAngle = normalizeAngleDiff(currAngle - prevAngle);

      const polarDelta = (-dAngle / Math.max(angleStep, 0.25)) * wheelSpeed;
      const linearDelta = (-dx * 0.0165 * wheelSpeed * 340) / Math.max(stageSize.width, 240);

      indexDelta = (polarDelta * radialWeight + linearDelta * (1 - radialWeight)) * dirSign;
    } else {
      const sensitivity = (0.0175 * wheelSpeed * 350) / Math.max(stageSize.width, 240);
      indexDelta = -dx * sensitivity * dirSign;
    }

    positionRef.current += indexDelta;
    const instantVelocity = Math.max(-38, Math.min(38, indexDelta / dt));
    velocityRef.current = velocityRef.current * 0.32 + instantVelocity * 0.68;

    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    setRenderPosition(positionRef.current);

    const snapped = positiveMod(Math.round(positionRef.current), count);
    if (snapped !== lastReportedIndexRef.current) {
      lastReportedIndexRef.current = snapped;
      triggerRotaryDetent();
      onSelectIndexChange(snapped);
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelLongPress();
    activePointersRef.current.delete(e.pointerId);

    if (
      stageRef.current &&
      stageRef.current.hasPointerCapture(e.pointerId)
    ) {
      try {
        stageRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    // If transitioning out of a multi-finger pinch while 1 finger remains, re-anchor smoothly with zero jump
    if (isPinchingRef.current) {
      if (activePointersRef.current.size === 1) {
        const entry = Array.from(activePointersRef.current.entries())[0];
        primaryPointerIdRef.current = entry[0];
        lastPointerRef.current = { x: entry[1].x, y: entry[1].y, time: performance.now() };
        startPointerRef.current = { x: entry[1].x, y: entry[1].y };
        isPinchingRef.current = false;
        isDraggingRef.current = true;
      } else if (activePointersRef.current.size === 0) {
        isPinchingRef.current = false;
        isDraggingRef.current = false;
        primaryPointerIdRef.current = null;
      }
      return;
    }

    if (e.pointerId !== primaryPointerIdRef.current) return;
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    primaryPointerIdRef.current = null;

    if (count === 0) return;
    if (Math.abs(velocityRef.current) < 0.72) {
      targetSnapRef.current = Math.round(positionRef.current);
      velocityRef.current = 0;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (count === 0) return;
    unlockAudio();
    const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const step = (rawDelta / 105) * wheelSpeed * dirSign;
    targetSnapRef.current = Math.round(positionRef.current + step);
    velocityRef.current = 0;
  };

  // Responsive 3D geometry calibrated for compact phones (320px+) through desktops
  const isCompactPhone = stageSize.width < 360 || stageSize.height < 420;
  const isMediumStage = !isCompactPhone && stageSize.width < 580;

  const visibleSlots =
    wheelStyle === 'carousel'
      ? 7
      : wheelStyle === 'sphere'
      ? isCompactPhone ? 11 : isMediumStage ? 13 : 15
      : isCompactPhone
      ? 9
      : isMediumStage
      ? 11
      : 13;

  const isSparseRing = count > 0 && count <= visibleSlots;
  const effectiveSlots = isSparseRing ? count : visibleSlots;

  // Alpha Hybrid Arc spans ~154deg right-facing semicircle; Sphere/Horizontal/Vertical span 360deg
  const arcHalfSpanRad = Math.PI * 0.43;
  const angleStep =
    wheelStyle === 'carousel'
      ? isSparseRing
        ? (arcHalfSpanRad * 2) / Math.max(count, 2)
        : (arcHalfSpanRad * 2) / Math.max(visibleSlots - 1, 4)
      : (Math.PI * 2) / Math.max(effectiveSlots, 1);

  const radiusScale =
    wheelSize === 'compact' ? 0.84 : wheelSize === 'expanded' ? 1.1 : 0.98;

  const iconBasePx =
    iconSize === 'small'
      ? isCompactPhone ? 34 : 40
      : iconSize === 'large'
      ? isCompactPhone ? 44 : 52
      : isCompactPhone ? 38 : 46;

  // Stage center & Alpha Left-Dial coordinates
  const stageCenterX = stageSize.width / 2;
  const stageCenterY =
    wheelStyle === 'carousel'
      ? stageSize.height / 2
      : stageSize.height / 2 - (isCompactPhone ? 8 : 12);

  // Horizontal & vertical radii for Sphere / Horizontal / Vertical modes
  const maxSafeRadiusX = Math.max(92, stageSize.width * 0.5 - iconBasePx * 0.95);
  const radiusX = Math.min(maxSafeRadiusX, Math.min(stageSize.width * 0.42, 280) * radiusScale);

  const tiltFactor = Math.max(0.55, Math.min(1.24, 0.82 + (wheelTiltDegrees / 30) * 0.35));
  const maxSafeRadiusY = Math.max(70, stageSize.height * 0.35);
  const radiusY = Math.min(
    maxSafeRadiusY,
    Math.max(74, stageSize.height * 0.295 * radiusScale * tiltFactor)
  );

  // Alpha Hybrid Left-Anchored Semicircular Control Hub + Sweeping Right 3D App Arc geometry
  const dialCenterX =
    stageSize.width >= 680
      ? Math.max(28, stageSize.width * 0.22)
      : isCompactPhone
      ? 6
      : 12;
  const innerSectorInnerR = isCompactPhone ? 62 : stageSize.width >= 680 ? 86 : 74;
  const innerSectorOuterR = isCompactPhone ? 102 : stageSize.width >= 680 ? 136 : 118;
  const innerRimR = innerSectorOuterR + 8;

  const arcOriginPxX = dialCenterX + (isCompactPhone ? 8 : 18);
  const arcOriginRelX = arcOriginPxX - stageCenterX;
  const safeRightPeakPxX = stageSize.width - (isCompactPhone ? 44 : stageSize.width >= 680 ? 140 : 54);
  const maxArcReachX = Math.max(120, safeRightPeakPxX - arcOriginPxX);
  const arcRadiusX = Math.min(
    maxArcReachX,
    Math.max(118, maxArcReachX * (wheelSize === 'compact' ? 0.82 : wheelSize === 'expanded' ? 1.0 : 0.92))
  );
  const arcRadiusY = Math.min(
    stageSize.height * 0.43,
    Math.max(132, stageSize.height * 0.39 * radiusScale)
  );

  // True 3D perspective depth driven by user Depth slider (0.5x to 1.6x)
  const depthFactor = Math.max(0.5, Math.min(1.6, wheelPerspective));
  const focalLength = 540 / Math.max(0.55, Math.pow(depthFactor, 0.65));
  const depthRadius = radiusX * (0.72 + depthFactor * 0.24);

  const centeredIndex = count > 0 ? positiveMod(Math.round(renderPosition), count) : 0;
  const centeredApp = count > 0 ? apps[centeredIndex] : null;

  // Rotating outer track phase & counter-rotating inner Alpha HUD dial phase
  const trackPhaseRad = -renderPosition * angleStep;
  const counterHudPhaseRad = renderPosition * angleStep * 0.55;

  // Compute rotating 3D precision ticks along the active wheel geometry
  const trackTicks = useMemo(() => {
    const ticks = [];
    if (wheelStyle === 'carousel') {
      // Precision ticks rotating smoothly along the outer Alpha arc
      for (let i = 0; i < TRACK_TICK_COUNT; i++) {
        const a = normalizeAngleDiff((i / TRACK_TICK_COUNT) * Math.PI * 2 + trackPhaseRad);
        if (Math.abs(a) > Math.PI * 0.48) continue;
        const sinA = Math.sin(a);
        const cosA = Math.cos(a);
        const isMajor = i % 3 === 0;
        const rBase = innerRimR + 4;
        const rEnd = rBase + (isMajor ? 7 : 3.5);
        const alpha = Math.max(0.06, Math.min(0.62, cosA * (isMajor ? 0.55 : 0.24)));

        ticks.push({
          key: i,
          x1: dialCenterX + cosA * rBase,
          y1: stageCenterY + sinA * rBase,
          x2: dialCenterX + cosA * rEnd,
          y2: stageCenterY + sinA * rEnd,
          alpha,
          strokeWidth: isMajor ? 1.4 : 0.85,
        });
      }
      return ticks;
    }

    for (let i = 0; i < TRACK_TICK_COUNT; i++) {
      const a = (i / TRACK_TICK_COUNT) * Math.PI * 2 + trackPhaseRad;
      const sinA = Math.sin(a);
      const cosA = Math.cos(a);
      const worldZ = cosA * depthRadius;
      const persp = focalLength / Math.max(120, focalLength - worldZ * 0.48);

      let innerX = stageCenterX;
      let innerY = stageCenterY;
      let outerX = stageCenterX;
      let outerY = stageCenterY;

      if (wheelStyle === 'vertical') {
        const vertR = radiusY * 1.15;
        innerX = stageCenterX + (1 - cosA) * radiusX * 0.14 * persp - 4;
        outerX = stageCenterX + (1 - cosA) * radiusX * 0.14 * persp + 6;
        innerY = stageCenterY + sinA * vertR * 0.94 * persp;
        outerY = stageCenterY + sinA * vertR * 1.03 * persp;
      } else if (wheelStyle === 'horizontal') {
        innerX = stageCenterX + sinA * radiusX * 1.06 * persp;
        outerX = innerX;
        innerY = stageCenterY + radiusY * 0.56 + cosA * 12;
        outerY = innerY + (i % 3 === 0 ? 9 : 5);
      } else {
        innerX = stageCenterX + sinA * radiusX * 0.94 * persp;
        innerY = stageCenterY + cosA * radiusY * 0.92 * 0.94 * persp;
        outerX = stageCenterX + sinA * radiusX * 1.04 * persp;
        outerY = stageCenterY + cosA * radiusY * 0.92 * 1.04 * persp;
      }

      const isMajor = i % 3 === 0;
      const alpha = Math.max(0.06, Math.min(0.58, 0.1 + ((cosA + 1) / 2) * (isMajor ? 0.44 : 0.2)));

      ticks.push({
        key: i,
        x1: innerX,
        y1: innerY,
        x2: outerX,
        y2: outerY,
        alpha,
        strokeWidth: isMajor ? 1.5 : 0.9,
      });
    }
    return ticks;
  }, [
    trackPhaseRad,
    stageCenterX,
    stageCenterY,
    dialCenterX,
    innerRimR,
    radiusX,
    radiusY,
    depthRadius,
    focalLength,
    wheelStyle,
  ]);

  // Counter-rotating inner Alpha dial HUD ticks for Sphere mode only
  const innerHudTicks = useMemo(() => {
    if (wheelStyle !== 'sphere') return [];
    const ticks = [];
    for (let i = 0; i < INNER_HUD_TICK_COUNT; i++) {
      const a = (i / INNER_HUD_TICK_COUNT) * Math.PI * 2 + counterHudPhaseRad;
      const sinA = Math.sin(a);
      const cosA = Math.cos(a);
      const worldZ = cosA * depthRadius;
      const persp = focalLength / Math.max(120, focalLength - worldZ * 0.42);
      const isQuadrant = i % 6 === 0;

      const x1 = stageCenterX + sinA * radiusX * 0.67 * persp;
      const y1 = stageCenterY + cosA * radiusY * 0.67 * persp;
      const x2 = stageCenterX + sinA * radiusX * (isQuadrant ? 0.78 : 0.73) * persp;
      const y2 = stageCenterY + cosA * radiusY * (isQuadrant ? 0.78 : 0.73) * persp;
      const alpha = isQuadrant ? 0.36 : 0.14;

      ticks.push({ key: i, x1, y1, x2, y2, alpha, strokeWidth: isQuadrant ? 1.4 : 0.85 });
    }
    return ticks;
  }, [
    wheelStyle,
    counterHudPhaseRad,
    stageCenterX,
    stageCenterY,
    radiusX,
    radiusY,
    depthRadius,
    focalLength,
  ]);

  // Compute 3D pods for all 4 wheel styles (Alpha Arc Carousel, Sphere, Horizontal, Vertical)
  const slots = useMemo(() => {
    if (count === 0) return [];
    const centerSlot = Math.round(renderPosition);
    const half = wheelStyle === 'carousel' ? Math.floor(visibleSlots / 2) + 1 : Math.floor(visibleSlots / 2);
    const result = [];

    const iterCount = isSparseRing ? count : half * 2 + 1;
    for (let idx = 0; idx < iterCount; idx++) {
      let slotFloatIndex = 0;
      let appIdx = 0;
      let theta = 0;
      let isCenter = false;
      let slotKey = '';

      if (isSparseRing) {
        appIdx = idx;
        const wrappedOffset = positiveMod(idx - renderPosition + count / 2, count) - count / 2;
        slotFloatIndex = Math.round(renderPosition + wrappedOffset);
        theta = wrappedOffset * angleStep;
        isCenter = Math.abs(wrappedOffset) < 0.34;
        slotKey = apps[appIdx].id;
      } else {
        const offset = idx - half;
        slotFloatIndex = centerSlot + offset;
        appIdx = positiveMod(slotFloatIndex, count);
        theta = (slotFloatIndex - renderPosition) * angleStep;
        isCenter = Math.abs(slotFloatIndex - renderPosition) < 0.34 && offset === 0;
        slotKey = `${offset}-${slotFloatIndex}`;
      }

      const app = apps[appIdx];
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta); // +1 front focal center, 0 edge, -1 back

      let x = 0;
      let y = 0;
      let rotateY = 0;
      let rotateX = 0;
      let normalizedDepth = (cosT + 1) / 2;
      let zScale = 1;
      let opacity = 1;

      if (wheelStyle === 'carousel') {
        // Alpha Hybrid Launcher Right-Curving Semi-Circular 3D Arc
        const maxDrawAngle = arcHalfSpanRad + angleStep * 0.9;
        if (!isSparseRing && Math.abs(theta) > maxDrawAngle) {
          continue;
        }
        const clampedCos = Math.max(0.05, cosT);
        const worldX = arcOriginRelX + clampedCos * arcRadiusX;
        const worldY = sinT * arcRadiusY;
        const worldZ = clampedCos * depthRadius * 0.85;

        const persp = focalLength / Math.max(140, focalLength - worldZ * 0.38);
        x = worldX;
        y = worldY * (0.94 + (persp - 0.9) * 0.25);

        normalizedDepth = Math.max(0, Math.min(1, clampedCos));
        const depthExponent = 0.9 + (depthFactor - 0.5) * 0.55;
        const minScale = Math.max(0.45, 0.72 - (depthFactor - 0.8) * 0.18);
        const maxBoost = 0.44 + depthFactor * 0.16;
        zScale = minScale + Math.pow(normalizedDepth, depthExponent) * maxBoost;

        rotateY = (1 - clampedCos) * 26;
        rotateX = -sinT * (14 + wheelTiltDegrees * 0.35);

        const edgeFade = isSparseRing
          ? 1
          : Math.max(0, Math.min(1, (maxDrawAngle - Math.abs(theta)) / (angleStep * 0.85)));
        opacity = edgeFade * Math.max(0.28, Math.min(1, 0.32 + Math.pow(normalizedDepth, 0.9) * 0.68));
      } else {
        let worldX = 0;
        let worldY = 0;
        let worldZ = 0;

        if (wheelStyle === 'sphere') {
          const sphereR = Math.min(radiusX * 1.02, Math.max(radiusY * 1.18, radiusX * 0.88));
          const frontLock = Math.pow(Math.max(0, cosT), 3.5);
          const rawLat = Math.sin(slotFloatIndex * 1.28) * 0.56;
          const lat = rawLat * (1 - frontLock);
          const cosLat = Math.cos(lat);
          const sinLat = Math.sin(lat);

          worldX = sinT * cosLat * sphereR * 1.06;
          worldY = sinLat * sphereR * 0.88 + cosT * 10 - (isCompactPhone ? 6 : 10);
          worldZ = cosT * cosLat * depthRadius;
          rotateY = -sinT * 46;
          rotateX = sinLat * 24 + (1 - cosT) * 8;
        } else if (wheelStyle === 'horizontal') {
          const arcRadiusHorizX = Math.min(stageSize.width * 0.46, radiusX * 1.18);
          worldX = sinT * arcRadiusHorizX;
          worldY = (1 - cosT) * -radiusY * 0.22 + (isCompactPhone ? 12 : 16);
          worldZ = cosT * depthRadius * 1.08;
          rotateY = -sinT * 58;
          rotateX = (1 - cosT) * 6;
        } else {
          // Vertical 3D drum
          const vertRadiusY = Math.min(stageSize.height * 0.37, radiusY * 1.24);
          worldX = (1 - cosT) * radiusX * 0.16;
          worldY = sinT * vertRadiusY - (isCompactPhone ? 6 : 10);
          worldZ = cosT * depthRadius;
          rotateY = (1 - cosT) * -14;
          rotateX = sinT * 46;
        }

        const persp = focalLength / Math.max(120, focalLength - worldZ * 0.52);
        x = worldX * persp;
        y = worldY * persp;

        const depthExponent = 1.0 + (depthFactor - 0.5) * 0.45;
        const minScale = Math.max(0.28, 0.48 - (depthFactor - 0.8) * 0.16);
        const maxBoost = 0.72 + depthFactor * 0.18;
        zScale =
          (minScale + Math.pow(normalizedDepth, depthExponent) * maxBoost) *
          (0.86 + (persp - 0.8) * 0.38);

        const seamFade = isSparseRing
          ? 1
          : Math.max(0, Math.min(1, (Math.PI - Math.abs(theta)) / (angleStep * 0.9)));
        opacity =
          seamFade *
          Math.max(0.18, Math.min(1, 0.22 + Math.pow(normalizedDepth, 1.3) * 0.78));
      }

      const zIndex = Math.round(normalizedDepth * 100);

      // Show crisp app labels cleanly on every visible Alpha arc slot, or front slots in other modes
      const showPodLabel =
        showWheelLabels &&
        (wheelStyle === 'carousel'
          ? opacity > 0.35
          : isCenter ||
            (wheelStyle === 'vertical'
              ? !isCompactPhone && Math.abs(theta) < 0.75 && cosT > 0.65
              : !isCompactPhone && Math.abs(theta) < 0.78 && cosT > 0.65));

      result.push({
        slotKey,
        app,
        appIdx,
        slotFloatIndex,
        x,
        y,
        zScale,
        opacity,
        rotateY,
        rotateX,
        zIndex,
        depth: cosT,
        normalizedDepth,
        isCenter,
        showPodLabel,
      });
    }

    return result.sort((a, b) => a.zIndex - b.zIndex);
  }, [
    apps,
    count,
    renderPosition,
    visibleSlots,
    isSparseRing,
    angleStep,
    arcHalfSpanRad,
    wheelStyle,
    arcOriginRelX,
    arcRadiusX,
    arcRadiusY,
    wheelTiltDegrees,
    radiusX,
    radiusY,
    depthRadius,
    depthFactor,
    focalLength,
    stageSize.width,
    stageSize.height,
    isCompactPhone,
    showWheelLabels,
  ]);

  if (count === 0) {
    return (
      <div
        ref={stageRef}
        className="w-full h-full flex items-center justify-center text-sm text-zinc-500 px-4 text-center"
      >
        No visible applications. Unhide apps in Settings.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden select-none">
      {/* 3D Carousel Stage */}
      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        onWheel={handleWheel}
        className="relative w-full flex-1 min-h-0 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
        aria-label="3D Circular App Carousel"
      >
        {/* Architectural 3D Track Hardware SVG adapting to selected WheelStyle */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="alphaTrackMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={`rgba(${trackRgb}, 0.1)`} />
              <stop offset="50%" stopColor={`rgba(${trackRgb}, 0.28)`} />
              <stop offset="100%" stopColor={`rgba(${trackRgb}, 0.72)`} />
            </linearGradient>
            <linearGradient id="alphaOuterArcGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={`rgba(${trackRgb}, 0)`} />
              <stop offset="22%" stopColor={`rgba(${trackRgb}, 0.44)`} />
              <stop offset="50%" stopColor={`rgba(${trackRgb}, 0.9)`} />
              <stop offset="78%" stopColor={`rgba(${trackRgb}, 0.44)`} />
              <stop offset="100%" stopColor={`rgba(${trackRgb}, 0)`} />
            </linearGradient>
            <linearGradient id="alphaBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={`rgba(${trackRgb}, 0.48)`} />
              <stop offset="65%" stopColor={`rgba(${trackRgb}, 0.18)`} />
              <stop offset="100%" stopColor={`rgba(${trackRgb}, 0.02)`} />
            </linearGradient>
            <radialGradient id="alphaLeftHubGlow" cx="32%" cy="50%" r="65%">
              <stop offset="0%" stopColor={`rgba(${trackRgb}, ${isLight ? '0.09' : '0.16'})`} />
              <stop offset="55%" stopColor={`rgba(${trackRgb}, 0.04)`} />
              <stop offset="100%" stopColor={`rgba(${trackRgb}, 0)`} />
            </radialGradient>
            <radialGradient id="alphaDeckFill" cx="50%" cy="62%" r="54%">
              <stop offset="0%" stopColor={`rgba(${trackRgb}, 0.03)`} />
              <stop offset="68%" stopColor={`rgba(${trackRgb}, 0.07)`} />
              <stop offset="92%" stopColor={`rgba(${trackRgb}, 0.02)`} />
              <stop offset="100%" stopColor={`rgba(${trackRgb}, 0)`} />
            </radialGradient>
            <radialGradient id="alphaFrontSpotlight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={`rgba(${trackRgb}, ${isLight ? '0.16' : '0.3'})`} />
              <stop offset="55%" stopColor={`rgba(${trackRgb}, 0.07)`} />
              <stop offset="100%" stopColor={`rgba(${trackRgb}, 0)`} />
            </radialGradient>
          </defs>

          {wheelStyle === 'carousel' && (
            <>
              {/* Subtle ambient glow anchoring the left Alpha control dial */}
              <circle
                cx={dialCenterX + innerSectorInnerR * 0.45}
                cy={stageCenterY}
                r={innerRimR * 1.45}
                fill="url(#alphaLeftHubGlow)"
              />

              {/* Faint sweeping outer orbital guide ellipse connecting visible 3D arc apps */}
              <ellipse
                cx={arcOriginPxX}
                cy={stageCenterY}
                rx={arcRadiusX}
                ry={arcRadiusY}
                fill="none"
                stroke={`rgba(${trackRgb}, 0.14)`}
                strokeDasharray="2 7"
                strokeWidth="1"
              />

              {/* Inner pocket ring housing the circular Home bezel */}
              <path
                d={describeArcLine(dialCenterX, stageCenterY, innerSectorInnerR - 4, -80, 80)}
                fill="none"
                stroke={`rgba(${trackRgb}, 0.2)`}
                strokeWidth="1"
              />

              {/* 3 Curved Radial Alpha Action Sectors */}
              {[
                { start: -52, end: -18, active: false },
                { start: -15, end: 15, active: false },
                { start: 18, end: 52, active: false },
              ].map((sec, idx) => {
                const isLit = hoveredSector === idx || sec.active;
                return (
                  <path
                    key={`sector-${idx}`}
                    d={describeArcSector(
                      dialCenterX,
                      stageCenterY,
                      innerSectorInnerR,
                      innerSectorOuterR,
                      sec.start,
                      sec.end
                    )}
                    fill={
                      sec.active
                        ? `rgba(${trackRgb}, 0.92)`
                        : isLit
                        ? `rgba(${trackRgb}, 0.22)`
                        : `rgba(${trackRgb}, ${isLight ? '0.08' : '0.09'})`
                    }
                    stroke={
                      sec.active
                        ? `rgba(${trackRgb}, 0.95)`
                        : isLit
                        ? `rgba(${trackRgb}, 0.58)`
                        : `rgba(${trackRgb}, 0.24)`
                    }
                    strokeWidth={isLit ? 1.2 : 0.9}
                  />
                );
              })}

              {/* Glowing outer crescent rim wrapping the radial sectors */}
              <path
                d={describeArcLine(dialCenterX, stageCenterY, innerRimR, -82, 82)}
                fill="none"
                stroke="url(#alphaOuterArcGlow)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d={describeArcLine(dialCenterX, stageCenterY, innerRimR + 10, -68, 68)}
                fill="none"
                stroke={`rgba(${trackRgb}, 0.14)`}
                strokeWidth="0.9"
              />

              {/* Subtle focal targeting beam & right-peak spotlight */}
              {centeredApp && (
                <>
                  <line
                    x1={dialCenterX + innerRimR}
                    y1={stageCenterY}
                    x2={Math.max(
                      dialCenterX + innerRimR + 24,
                      arcOriginPxX + arcRadiusX - iconBasePx * 0.95
                    )}
                    y2={stageCenterY}
                    stroke="url(#alphaBeamGrad)"
                    strokeDasharray="2 4"
                    strokeWidth="1.2"
                  />
                  <ellipse
                    cx={arcOriginPxX + arcRadiusX}
                    cy={stageCenterY}
                    rx={iconBasePx * 1.45}
                    ry={iconBasePx * 1.15}
                    fill="url(#alphaFrontSpotlight)"
                  />
                </>
              )}
            </>
          )}

          {wheelStyle === 'sphere' && (
            <>
              <circle
                cx={stageCenterX}
                cy={stageCenterY}
                r={Math.min(radiusX * 1.05, Math.max(radiusY * 1.2, radiusX * 0.92))}
                fill="url(#alphaDeckFill)"
                stroke={`rgba(${trackRgb}, 0.22)`}
                strokeWidth="1.2"
              />
              {/* Sphere latitude & longitude wireframe arcs */}
              <ellipse
                cx={stageCenterX}
                cy={stageCenterY}
                rx={radiusX * 0.98}
                ry={radiusY * 0.42}
                fill="none"
                stroke={`rgba(${trackRgb}, 0.18)`}
                strokeWidth="1"
              />
              <ellipse
                cx={stageCenterX}
                cy={stageCenterY}
                rx={radiusX * 0.42}
                ry={radiusY * 1.06}
                fill="none"
                stroke={`rgba(${trackRgb}, 0.14)`}
                strokeDasharray="3 5"
                strokeWidth="1"
              />
              <ellipse
                cx={stageCenterX}
                cy={stageCenterY}
                rx={radiusX * 0.76}
                ry={radiusY * 0.78}
                fill="none"
                stroke={`rgba(${trackRgb}, 0.11)`}
                strokeWidth="1"
              />
              <ellipse
                cx={stageCenterX}
                cy={stageCenterY + 8}
                rx={iconBasePx * 2.1}
                ry={iconBasePx * 0.95}
                fill="url(#alphaFrontSpotlight)"
              />
            </>
          )}

          {wheelStyle === 'horizontal' && (
            <>
              {/* Curved Horizontal Horizon Track */}
              <ellipse
                cx={stageCenterX}
                cy={stageCenterY + radiusY * 0.56}
                rx={radiusX * 1.15}
                ry={22}
                fill="none"
                stroke="url(#alphaTrackMetallic)"
                strokeWidth="1.2"
              />
              <line
                x1={Math.max(16, stageCenterX - radiusX * 1.12)}
                y1={stageCenterY + radiusY * 0.62}
                x2={Math.min(stageSize.width - 16, stageCenterX + radiusX * 1.12)}
                y2={stageCenterY + radiusY * 0.62}
                stroke={`rgba(${trackRgb}, 0.16)`}
                strokeWidth="1"
              />
              <ellipse
                cx={stageCenterX}
                cy={stageCenterY + radiusY * 0.46}
                rx={iconBasePx * 2.3}
                ry={iconBasePx * 0.72}
                fill="url(#alphaFrontSpotlight)"
              />
            </>
          )}

          {wheelStyle === 'vertical' && (
            <>
              {/* Vertical Drum Arc & Spine */}
              <ellipse
                cx={stageCenterX}
                cy={stageCenterY}
                rx={radiusX * 0.24}
                ry={radiusY * 1.16}
                fill="none"
                stroke="url(#alphaTrackMetallic)"
                strokeWidth="1.2"
              />
              <ellipse
                cx={stageCenterX}
                cy={stageCenterY}
                rx={iconBasePx * 1.9}
                ry={iconBasePx * 1.25}
                fill="url(#alphaFrontSpotlight)"
              />
            </>
          )}

          {/* Counter-Rotating Inner Alpha Dial Ticks */}
          {innerHudTicks.map((t) => (
            <line
              key={`inner-${t.key}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={`rgba(${trackRgb},${t.alpha})`}
              strokeWidth={t.strokeWidth}
              strokeLinecap="round"
            />
          ))}

          {/* Dynamically Rotating Outer Radial Precision Ticks */}
          {trackTicks.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={`rgba(${trackRgb},${t.alpha})`}
              strokeWidth={t.strokeWidth}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Alpha Hybrid Left-Anchored Semicircular Control Hub Interactive Layer */}
        {wheelStyle === 'carousel' && (
          <div className="pointer-events-none absolute inset-0 z-30">
            {/* Circular Metallic Home Bezel inside left pocket */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onReturnHome?.();
              }}
              aria-label="Return to Home Screen"
              title="Home Screen"
              style={{
                left: `${dialCenterX + (isCompactPhone ? 32 : innerSectorInnerR * 0.5)}px`,
                top: `${stageCenterY}px`,
                width: `${isCompactPhone ? 42 : 48}px`,
                height: `${isCompactPhone ? 42 : 48}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`pointer-events-auto absolute rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 ${
                isLight
                  ? 'border-zinc-900/25 bg-white/95 text-zinc-900 shadow-md hover:border-zinc-900/50 focus-visible:ring-zinc-900/50'
                  : 'border-white/45 bg-gradient-to-b from-zinc-800/90 via-zinc-950/95 to-black text-white shadow-[0_0_24px_rgba(255,255,255,0.16),inset_0_1px_0_rgba(255,255,255,0.4)] hover:border-white focus-visible:ring-white/70'
              }`}
            >
              <Home className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>

            {/* 3 Interactive Curved Radial Sector Action Buttons */}
            {[
              {
                midDeg: -35,
                label: 'Hide apps',
                active: false,
                icon: <EyeOff className="w-4 h-4" />,
                onPress: () => {
                  if (onOpenHiddenManager) {
                    onOpenHiddenManager();
                  } else if (centeredApp) {
                    onToggleHideApp?.(centeredApp.id);
                  }
                },
              },
              {
                midDeg: 0,
                label: centeredApp ? `App info & options for ${centeredApp.name}` : 'App options',
                active: false,
                icon: <Info className="w-4 h-4" />,
                onPress: () => centeredApp && onOpenOptions(centeredApp),
              },
              {
                midDeg: 35,
                label: 'Drag app here to delete',
                active: false,
                icon: <Trash2 className="w-4 h-4" />,
                onPress: () => {
                  // Deletion is strictly by dragging an app to this button
                },
              },
            ].map((item, idx) => {
              const midRad = (item.midDeg * Math.PI) / 180;
              const midR = (innerSectorInnerR + innerSectorOuterR) * 0.5;
              const bx = dialCenterX + Math.cos(midRad) * midR;
              const by = stageCenterY + Math.sin(midRad) * midR;
              const isHideBtn = idx === 0;
              const isDeleteBtn = idx === 2;

              return (
                <button
                  key={`sector-btn-${idx}`}
                  ref={isHideBtn ? wheelHideBtnRef : isDeleteBtn ? wheelDeleteBtnRef : undefined}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHoveredSector(idx)}
                  onMouseLeave={() => setHoveredSector((prev) => (prev === idx ? null : prev))}
                  onFocus={() => setHoveredSector(idx)}
                  onBlur={() => setHoveredSector((prev) => (prev === idx ? null : prev))}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onPress();
                  }}
                  onDragOver={isDeleteBtn || isHideBtn ? (e) => {
                    e.preventDefault();
                    if (isDeleteBtn) {
                      setIsOverWheelDelete(true);
                      isOverWheelDeleteRef.current = true;
                    }
                    if (isHideBtn) {
                      setIsOverWheelHide(true);
                      isOverWheelHideRef.current = true;
                    }
                  } : undefined}
                  onDragLeave={isDeleteBtn || isHideBtn ? () => {
                    if (isDeleteBtn) {
                      setIsOverWheelDelete(false);
                      isOverWheelDeleteRef.current = false;
                    }
                    if (isHideBtn) {
                      setIsOverWheelHide(false);
                      isOverWheelHideRef.current = false;
                    }
                  } : undefined}
                  onDrop={isDeleteBtn || isHideBtn ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const appTarget = activeDragAppRef.current || centeredApp;
                    if (appTarget) {
                      if (isDeleteBtn) {
                        if (onDeleteApp) {
                          onDeleteApp(appTarget);
                        } else if (appTarget.isCustom && onRemoveCustomApp) {
                          onRemoveCustomApp(appTarget.id);
                        } else if (isNativeAndroid && window.SkyAndroid?.uninstallApp) {
                          window.SkyAndroid.uninstallApp(appTarget.packageName);
                        }
                      } else if (isHideBtn) {
                        onToggleHideApp?.(appTarget.id);
                      }
                    }
                    setIsOverWheelDelete(false);
                    isOverWheelDeleteRef.current = false;
                    setIsOverWheelHide(false);
                    isOverWheelHideRef.current = false;
                    setLocalDraggingApp(null);
                    onEndDrag?.();
                  } : undefined}
                  aria-label={item.label}
                  title={item.label}
                  style={{
                    left: `${bx}px`,
                    top: `${by}px`,
                    width: `${isCompactPhone ? 38 : 44}px`,
                    height: `${isCompactPhone ? 38 : 44}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`pointer-events-auto absolute rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 ${
                    isDeleteBtn && isOverWheelDelete
                      ? 'bg-white text-black border-2 border-white scale-125 shadow-[0_0_30px_rgba(255,255,255,0.9)] ring-4 ring-white/40 z-40'
                      : isHideBtn && isOverWheelHide
                      ? 'bg-white text-black border-2 border-white scale-125 shadow-[0_0_30px_rgba(255,255,255,0.9)] ring-4 ring-white/40 z-40'
                      : item.active
                      ? 'text-black'
                      : isLight
                      ? 'text-zinc-800 hover:text-black focus-visible:ring-zinc-900/40'
                      : 'text-zinc-100 hover:text-white focus-visible:ring-white/80'
                  }`}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>
        )}

        {/* Compact Focal Counter Badge for Horizontal / Sphere / Vertical styles */}
        {centeredApp && wheelStyle !== 'carousel' && (
          <div
            aria-hidden="true"
            style={{
              left: `${stageCenterX}px`,
              top: `${Math.max(12, stageCenterY - radiusY * 0.92)}px`,
              transform: 'translate(-50%, 0)',
            }}
            className={`pointer-events-none absolute z-10 flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md ${
              isLight
                ? 'border-zinc-900/15 bg-white/85 shadow-sm'
                : 'border-white/15 bg-black/70'
            }`}
          >
            <span className={`text-[10px] font-mono-tabular ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {centeredIndex + 1} / {count}
            </span>
            <span className={isLight ? 'text-zinc-400' : 'text-zinc-600'}>·</span>
            <span className={`text-[11px] font-medium truncate max-w-[140px] ${isLight ? 'text-zinc-900' : 'text-zinc-200'}`}>
              {centeredApp.name}
            </span>
          </div>
        )}

        {/* 3D Orbital App Pods */}
        <div
          className="relative w-full h-full pointer-events-none"
          style={{ perspective: '1100px' }}
        >
          {slots.map((slot) => {
            const notif = notifications.get(slot.app.packageName);
            const isFav = favoritesSet.has(slot.app.id);
            const hideIcon = !showAppIcons || (textOnlySet?.has(slot.app.id) ?? false);
            const isDisabled = disabledSet?.has(slot.app.id) ?? false;
            const podPadding = hideIcon ? 0 : slot.isCenter ? 7 : 5;
            const showMirrorReflection = !hideIcon && wheelReflections && slot.normalizedDepth > 0.48;
            const depthShadowSpread = Math.round(12 + depthFactor * 18);

            return (
              <div
                key={slot.slotKey}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  zIndex: slot.zIndex < 50 ? 10 + slot.zIndex : 30 + slot.zIndex,
                  opacity:
                    (localDraggingApp?.id === slot.app.id ? slot.opacity * 0.4 : slot.opacity) *
                    (isDisabled ? 0.65 : 1),
                  transform: `translate3d(${slot.x}px, ${slot.y}px, 0) translate(-50%, -50%) scale(${slot.zScale}) rotateY(${slot.rotateY}deg) rotateX(${slot.rotateX}deg)`,
                  willChange: 'transform, opacity',
                }}
                className="flex flex-col items-center pointer-events-auto"
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    cancelLongPress();
                    longPressFiredRef.current = true;
                    isPodDraggingRef.current = true;
                    e.dataTransfer.setData('text/plain', slot.app.id);
                    onStartDrag?.(slot.app, e.clientX, e.clientY);
                  }}
                  onDrag={(e) => {
                    if (e.clientX !== 0 || e.clientY !== 0) {
                      onDragMove?.(e.clientX, e.clientY);
                    }
                  }}
                  onDragEnd={() => {
                    isPodDraggingRef.current = false;
                    onEndDrag?.();
                  }}
                  onPointerDown={(e) => {
                    startPodLongPress(slot.app, e.clientX, e.clientY);
                  }}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={() => {
                    if (!longPressFiredRef.current) {
                      cancelLongPress();
                    }
                  }}
                  onPointerCancel={cancelLongPress}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cancelLongPress();
                    onOpenOptions(slot.app);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (longPressFiredRef.current || totalDragDistanceRef.current > 8) {
                      longPressFiredRef.current = false;
                      return;
                    }
                    if (slot.isCenter) {
                      onLaunchApp(slot.app);
                    } else {
                      targetSnapRef.current = slot.slotFloatIndex;
                      velocityRef.current = 0;
                    }
                  }}
                  aria-label={`${slot.app.name}${isDisabled ? ' (turned off)' : ''}${
                    slot.isCenter ? ' — tap to launch' : ' — tap to rotate to front'
                  }`}
                  style={{
                    padding: hideIcon ? undefined : `${podPadding}px`,
                    boxShadow: isLight
                      ? slot.isCenter
                        ? `0 ${Math.round(depthShadowSpread * 0.45)}px ${depthShadowSpread}px rgba(15,23,42,0.18), 0 0 0 1px ${accentHex}`
                        : '0 4px 12px rgba(15,23,42,0.08)'
                      : slot.isCenter
                      ? `0 ${Math.round(depthShadowSpread * 0.55)}px ${depthShadowSpread}px rgba(0,0,0,0.92), 0 0 ${Math.round(
                          depthShadowSpread * 0.9
                        )}px rgba(${trackRgb}, 0.28), inset 0 1px 0 rgba(255,255,255,0.48)`
                      : slot.normalizedDepth > 0.55
                      ? `0 6px ${Math.round(depthShadowSpread * 0.7)}px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.18)`
                      : '0 4px 10px rgba(0,0,0,0.75)',
                  }}
                  className={`relative group rounded-2xl backdrop-blur-md transition-colors focus:outline-none focus-visible:ring-2 ${
                    hideIcon
                      ? slot.isCenter
                        ? 'px-4 py-2.5 min-w-[84px] max-w-[164px]'
                        : 'px-3 py-1.5 min-w-[68px] max-w-[136px]'
                      : ''
                  } ${
                    isLight
                      ? slot.isCenter
                        ? 'bg-white border border-zinc-900/35 focus-visible:ring-zinc-900/40'
                        : slot.normalizedDepth > 0.55
                        ? 'bg-white/85 border border-zinc-900/15 focus-visible:ring-zinc-900/30'
                        : 'bg-white/65 border border-zinc-900/10 focus-visible:ring-zinc-900/30'
                      : slot.isCenter
                      ? 'bg-gradient-to-b from-white/22 via-zinc-900/90 to-black/95 border border-white/75 focus-visible:ring-white/60'
                      : isFav && slot.normalizedDepth > 0.5
                      ? 'bg-gradient-to-b from-zinc-800/80 to-zinc-950/95 border border-white/40 focus-visible:ring-white/60'
                      : slot.normalizedDepth > 0.55
                      ? 'bg-gradient-to-b from-zinc-800/70 to-zinc-950/90 border border-white/25 focus-visible:ring-white/60'
                      : 'bg-zinc-950/75 border border-white/10 focus-visible:ring-white/60'
                  }`}
                >
                  {hideIcon ? (
                    <div className="flex items-center justify-center gap-1.5 min-w-0">
                      <span
                        className={`sky-app-label whitespace-nowrap truncate ${
                          slot.isCenter
                            ? isLight
                              ? 'text-sm font-semibold text-zinc-950'
                              : 'text-sm font-semibold text-white'
                            : isLight
                            ? 'text-xs font-medium text-zinc-800'
                            : 'text-xs font-medium text-zinc-200'
                        }`}
                      >
                        {slot.app.name}
                      </span>
                      {isDisabled && (
                        <span
                          className={`font-mono-tabular text-[9px] uppercase px-1 py-0.5 rounded border shrink-0 ${
                            isLight
                              ? 'border-zinc-900/20 text-zinc-600'
                              : 'border-white/20 text-zinc-400'
                          }`}
                        >
                          Off
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={isDisabled ? 'grayscale opacity-45' : ''}>
                      <AppIconGlyph
                        app={slot.app}
                        pixelSize={iconBasePx}
                        shape={iconShape}
                        monochrome={iconMonochrome}
                        uniformMask={iconUniformMask}
                        highlighted={slot.isCenter}
                        isLight={isLight}
                      />
                    </div>
                  )}

                  {!isDisabled && showNotificationBadges && notif && notif.count > 0 && (
                    <span
                      style={{ backgroundColor: accentHex, color: accentFgHex }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full font-mono-tabular text-[10px] font-semibold flex items-center justify-center shadow-md"
                    >
                      {notif.count}
                    </span>
                  )}

                  {/* Special Favourite Pin Indicator */}
                  {!hideIcon && isFav && slot.depth > 0.35 && (
                    <span
                      aria-label="Pinned favourite"
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border flex items-center justify-center shadow-sm ${
                        isLight
                          ? 'bg-zinc-900 text-white border-white/60'
                          : 'bg-white text-black border-black/40 shadow-[0_0_8px_rgba(255,255,255,0.55)]'
                      }`}
                    >
                      <Pin className={`w-2.5 h-2.5 ${isLight ? 'fill-white' : 'fill-black'}`} />
                    </span>
                  )}
                </button>

                {/* Realistic App Icon Reflection & Floor Sheen */}
                {showMirrorReflection && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none flex flex-col items-center overflow-hidden"
                    style={{
                      height: `${Math.round(iconBasePx * (slot.isCenter ? 0.42 : 0.3))}px`,
                      marginTop: '2px',
                    }}
                  >
                    <div
                      style={{
                        transform: 'scaleY(-0.58)',
                        transformOrigin: 'top center',
                        opacity: slot.isCenter ? (isLight ? 0.22 : 0.36) : isLight ? 0.1 : 0.18,
                        filter: 'blur(0.7px) grayscale(100%)',
                        WebkitMaskImage:
                          'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 88%)',
                        maskImage:
                          'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 88%)',
                      }}
                    >
                      <AppIconGlyph
                        app={slot.app}
                        pixelSize={iconBasePx}
                        shape={iconShape}
                        monochrome
                        uniformMask={iconUniformMask}
                        highlighted={slot.isCenter}
                        isLight={isLight}
                      />
                    </div>
                  </div>
                )}

                {!showMirrorReflection && slot.normalizedDepth > 0.52 && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none mt-1 rounded-full"
                    style={{
                      width: `${iconBasePx * (slot.isCenter ? 0.95 : 0.65)}px`,
                      height: '4px',
                      background: slot.isCenter
                        ? `radial-gradient(ellipse at center, rgba(${trackRgb}, 0.42) 0%, transparent 75%)`
                        : `radial-gradient(ellipse at center, rgba(${trackRgb}, 0.16) 0%, transparent 75%)`,
                    }}
                  />
                )}

                {!hideIcon && slot.showPodLabel && (
                  <span
                    className={`mt-1 px-2 py-0.5 rounded-md text-center pointer-events-none whitespace-nowrap truncate sky-app-label ${
                      isLight
                        ? slot.isCenter
                          ? 'max-w-[144px] bg-white/95 border border-zinc-900/20 text-xs text-zinc-950 shadow-md'
                          : wheelStyle === 'carousel'
                          ? 'max-w-[96px] bg-white/85 border border-zinc-900/10 text-[10px] text-zinc-800'
                          : 'max-w-[72px] bg-white/80 border border-zinc-900/10 text-[10px] text-zinc-700'
                        : slot.isCenter
                        ? 'max-w-[144px] bg-black/90 border border-white/30 text-xs text-white shadow-lg'
                        : wheelStyle === 'carousel'
                        ? 'max-w-[96px] bg-black/80 border border-white/10 text-[10px] text-zinc-200'
                        : 'max-w-[72px] bg-black/75 border border-white/10 text-[10px] text-zinc-300'
                    }`}
                  >
                    {slot.app.name}
                    {isDisabled ? ' · Off' : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
};
