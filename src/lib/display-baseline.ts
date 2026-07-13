import { invoke } from "@tauri-apps/api/core";
import type { WayfernDisplayBaseline } from "@/types";

export async function captureWayfernDisplayBaseline(): Promise<
  WayfernDisplayBaseline | undefined
> {
  try {
    const nativeBaseline = await invoke<WayfernDisplayBaseline | null>(
      "get_current_display_baseline",
    );
    if (nativeBaseline) return nativeBaseline;
  } catch (error) {
    console.warn("Failed to read the native display baseline:", error);
  }

  if (typeof window === "undefined") return undefined;

  const screen = window.screen;
  const positionedScreen = screen as Screen & {
    availLeft?: number;
    availTop?: number;
  };
  const baseline: WayfernDisplayBaseline = {
    physical_width: Math.round(screen.width * (window.devicePixelRatio || 1)),
    physical_height: Math.round(screen.height * (window.devicePixelRatio || 1)),
    screen_width: Math.round(screen.width),
    screen_height: Math.round(screen.height),
    screen_avail_width: Math.round(screen.availWidth),
    screen_avail_height: Math.round(screen.availHeight),
    screen_avail_left: Math.round(positionedScreen.availLeft ?? 0),
    screen_avail_top: Math.round(positionedScreen.availTop ?? 0),
    device_pixel_ratio: window.devicePixelRatio || 1,
    screen_color_depth: Math.round(screen.colorDepth),
    screen_pixel_depth: Math.round(screen.pixelDepth),
  };

  if (
    baseline.screen_width <= 0 ||
    baseline.screen_height <= 0 ||
    baseline.screen_avail_width <= 0 ||
    baseline.screen_avail_height <= 0 ||
    !Number.isFinite(baseline.device_pixel_ratio) ||
    baseline.device_pixel_ratio <= 0
  ) {
    return undefined;
  }

  return baseline;
}
