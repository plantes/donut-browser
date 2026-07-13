export interface ProxySettings {
  proxy_type: string; // "http", "https", "socks4", "socks5", or "ss" (Shadowsocks)
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface TableSortingSettings {
  column: string; // "name", "note", "status"
  direction: string; // "asc" or "desc"
}

export interface BrowserProfile {
  id: string; // UUID of the profile
  name: string;
  browser: string;
  version: string;
  proxy_id?: string; // Reference to stored proxy
  vpn_id?: string; // Reference to stored VPN config
  launch_hook?: string;
  process_id?: number;
  last_launch?: number;
  release_type: string;
  wayfern_config?: WayfernConfig; // Wayfern configuration
  group_id?: string; // Reference to profile group
  tags?: string[];
  note?: string; // User note
  window_color?: string; // Per-profile window frame color "#RRGGBB"; auto-derived from the id when unset
  sync_mode?: SyncMode;
  encryption_salt?: string;
  last_sync?: number; // Timestamp of last successful sync (epoch seconds)
  host_os?: string; // OS where profile was created ("macos", "windows", "linux")
  ephemeral?: boolean;
  extension_group_id?: string;
  proxy_bypass_rules?: string[];
  created_by_id?: string;
  created_by_email?: string;
  /** Profile creation timestamp (epoch seconds, UTC). Undefined for legacy
   * profiles created before this field existed. */
  created_at?: number;
  dns_blocklist?: string;
  password_protected?: boolean;
}

export interface Extension {
  id: string;
  name: string;
  file_name: string;
  file_type: string;
  browser_compatibility: string[];
  created_at: number;
  updated_at: number;
  sync_enabled?: boolean;
  last_sync?: number;
  version?: string;
  description?: string;
  author?: string;
  homepage_url?: string;
}

export interface ExtensionGroup {
  id: string;
  name: string;
  extension_ids: string[];
  created_at: number;
  updated_at: number;
  sync_enabled?: boolean;
  last_sync?: number;
}

export type SyncMode = "Disabled" | "Regular" | "Encrypted";

export type SyncStatus = "Disabled" | "Syncing" | "Synced" | "Error";

export interface SyncSettings {
  sync_server_url?: string;
  sync_token?: string;
}

export interface ProfileSyncStatusEvent {
  profile_id: string;
  status: "disabled" | "syncing" | "synced" | "error" | "pending";
}

export interface ProxyCheckResult {
  ip: string;
  city?: string;
  country?: string;
  country_code?: string;
  timestamp: number;
  is_valid: boolean;
}

export function isSyncEnabled(profile: BrowserProfile): boolean {
  return profile.sync_mode != null && profile.sync_mode !== "Disabled";
}

export interface StoredProxy {
  id: string;
  name: string;
  proxy_settings: ProxySettings;
  sync_enabled?: boolean;
  last_sync?: number;
  is_cloud_managed?: boolean;
  is_cloud_derived?: boolean;
}

export interface ProfileGroup {
  id: string;
  name: string;
  sync_enabled?: boolean;
  last_sync?: number;
}

export interface GroupWithCount {
  id: string;
  name: string;
  count: number;
  sync_enabled?: boolean;
  last_sync?: number;
}

export interface DetectedProfile {
  browser: string;
  name: string;
  path: string;
  description: string;
  mapped_browser: string;
}

export interface BrowserReleaseTypes {
  stable?: string;
}

export interface AppUpdateInfo {
  current_version: string;
  new_version: string;
  release_notes: string;
  download_url: string;
  is_nightly: boolean;
  published_at: string;
  manual_update_required: boolean;
  release_page_url?: string;
  repo_update: boolean;
  /** URL of the release's SHA256SUMS.txt; downloads are verified against it. */
  checksums_url?: string | null;
  /** GitHub-computed digest of the chosen asset ("sha256:<hex>"). */
  asset_digest?: string | null;
}

export interface AppUpdateProgress {
  stage: string; // "downloading", "extracting", "installing", "completed"
  percentage?: number;
  speed?: string; // MB/s
  eta?: string; // estimated time remaining
  message: string;
}

export type WayfernOS = "windows" | "macos" | "linux" | "android" | "ios";

export interface WayfernDisplayBaseline {
  physical_width?: number;
  physical_height?: number;
  screen_width: number;
  screen_height: number;
  screen_avail_width: number;
  screen_avail_height: number;
  screen_avail_left: number;
  screen_avail_top: number;
  device_pixel_ratio: number;
  screen_color_depth: number;
  screen_pixel_depth: number;
}

export interface WayfernConfig {
  proxy?: string;
  screen_max_width?: number;
  screen_max_height?: number;
  screen_min_width?: number;
  screen_min_height?: number;
  display_baseline?: WayfernDisplayBaseline;
  initial_window_maximized?: boolean;
  manual_display_fingerprint?: boolean;
  geoip?: string | boolean; // For compatibility with shared config form
  block_images?: boolean; // For compatibility with shared config form
  block_webrtc?: boolean;
  block_webgl?: boolean;
  executable_path?: string;
  fingerprint?: string; // JSON string of the complete fingerprint config
  randomize_fingerprint_on_launch?: boolean; // Generate new fingerprint on every launch
  os?: WayfernOS; // Operating system for fingerprint generation
  geo_proxy_signature?: string; // Internal: routing the fingerprint's location was computed for
}

// Wayfern fingerprint config - matches the C++ FingerprintData structure
export interface WayfernFingerprintConfig {
  // User agent and platform
  userAgent?: string;
  platform?: string;
  platformVersion?: string;
  brand?: string;
  brandVersion?: string;

  // Hardware
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  deviceMemory?: number;

  // Screen
  screenWidth?: number;
  screenHeight?: number;
  screenAvailWidth?: number;
  screenAvailHeight?: number;
  screenAvailLeft?: number;
  screenAvailTop?: number;
  screenColorDepth?: number;
  screenPixelDepth?: number;
  devicePixelRatio?: number;

  // Window
  windowOuterWidth?: number;
  windowOuterHeight?: number;
  windowInnerWidth?: number;
  windowInnerHeight?: number;
  screenX?: number;
  screenY?: number;

  // Language
  language?: string;
  languages?: string[];

  // Browser features
  doNotTrack?: string;
  cookieEnabled?: boolean;
  webdriver?: boolean;
  pdfViewerEnabled?: boolean;

  // WebGL
  webglVendor?: string;
  webglRenderer?: string;
  webglVersion?: string;
  webglShadingLanguageVersion?: string;
  webglParameters?: string; // JSON string
  webgl2Parameters?: string; // JSON string
  webglShaderPrecisionFormats?: string; // JSON string
  webgl2ShaderPrecisionFormats?: string; // JSON string

  // Timezone and geolocation
  timezone?: string;
  timezoneOffset?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;

  // Media queries / preferences
  prefersReducedMotion?: boolean;
  prefersDarkMode?: boolean;
  prefersContrast?: string;
  prefersReducedData?: boolean;

  // Color/HDR
  colorGamutSrgb?: boolean;
  colorGamutP3?: boolean;
  colorGamutRec2020?: boolean;
  hdrSupport?: boolean;

  // Audio
  audioSampleRate?: number;
  audioMaxChannelCount?: number;

  // Storage
  localStorage?: boolean;
  sessionStorage?: boolean;
  indexedDb?: boolean;

  // Canvas
  canvasNoiseSeed?: string;

  // Fonts, plugins, mime types (JSON strings)
  fonts?: string; // JSON array string
  plugins?: string; // JSON array string
  mimeTypes?: string; // JSON array string

  // Battery (optional)
  batteryCharging?: boolean;
  batteryChargingTime?: number;
  batteryDischargingTime?: number;
  batteryLevel?: number;

  // Voices
  voices?: string; // JSON array string

  // Vendor info
  vendor?: string;
  vendorSub?: string;
  productSub?: string;

  // Network (optional)
  connectionEffectiveType?: string;
  connectionDownlink?: number;
  connectionRtt?: number;

  // Performance
  performanceMemory?: number;
}

export interface WayfernLaunchResult {
  id: string;
  processId?: number;
  profilePath?: string;
  url?: string;
  cdp_port?: number;
}

// Synchronizer types
export interface SyncFollowerState {
  profile_id: string;
  profile_name: string;
  failed_at_url: string | null;
}

export interface SyncSessionInfo {
  id: string;
  leader_profile_id: string;
  leader_profile_name: string;
  followers: SyncFollowerState[];
}

// Traffic stats types
export interface BandwidthDataPoint {
  timestamp: number;
  bytes_sent: number;
  bytes_received: number;
}

export interface DomainAccess {
  domain: string;
  request_count: number;
  bytes_sent: number;
  bytes_received: number;
  first_access: number;
  last_access: number;
}

export interface TrafficStats {
  proxy_id: string;
  profile_id?: string;
  session_start: number;
  last_update: number;
  total_bytes_sent: number;
  total_bytes_received: number;
  total_requests: number;
  bandwidth_history: BandwidthDataPoint[];
  domains: Record<string, DomainAccess>;
  unique_ips: string[];
}

export interface TrafficSnapshot {
  profile_id?: string;
  session_start: number;
  last_update: number;
  total_bytes_sent: number;
  total_bytes_received: number;
  total_requests: number;
  current_bytes_sent: number;
  current_bytes_received: number;
  recent_bandwidth: BandwidthDataPoint[];
}

export interface FilteredTrafficStats {
  profile_id?: string;
  session_start: number;
  last_update: number;
  total_bytes_sent: number;
  total_bytes_received: number;
  total_requests: number;
  bandwidth_history: BandwidthDataPoint[];
  period_bytes_sent: number;
  period_bytes_received: number;
  period_requests: number;
  domains: Record<string, DomainAccess>;
  unique_ips: string[];
}

// Cookie copy types
export interface UnifiedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  is_secure: boolean;
  is_http_only: boolean;
  same_site: number;
  creation_time: number;
  last_accessed: number;
}

export interface DomainCookies {
  domain: string;
  cookies: UnifiedCookie[];
  cookie_count: number;
}

export interface CookieReadResult {
  profile_id: string;
  browser_type: string;
  domains: DomainCookies[];
  total_count: number;
}

export interface SelectedCookie {
  domain: string;
  name: string;
}

export interface CookieCopyRequest {
  source_profile_id: string;
  target_profile_ids: string[];
  selected_cookies: SelectedCookie[];
}

export interface CookieCopyResult {
  target_profile_id: string;
  cookies_copied: number;
  cookies_replaced: number;
  errors: string[];
}

// Proxy import/export types
export interface ProxyExportData {
  version: string;
  proxies: ExportedProxy[];
  exported_at: string;
  source: string;
}

export interface ExportedProxy {
  name: string;
  type: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface ProxyImportResult {
  imported_count: number;
  skipped_count: number;
  errors: string[];
  proxies: StoredProxy[];
}

export interface ParsedProxyLine {
  proxy_type: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  original_line: string;
}

export type ProxyParseResult =
  | ({ status: "parsed" } & ParsedProxyLine)
  | { status: "ambiguous"; line: string; possible_formats: string[] }
  | { status: "invalid"; line: string; reason: string };

// VPN types
export type VpnType = "WireGuard";

export interface VpnConfig {
  id: string;
  name: string;
  vpn_type: VpnType;
  config_data: string; // Raw config content (may be empty in list view)
  created_at: number;
  last_used?: number;
  sync_enabled?: boolean;
  last_sync?: number;
}

export interface VpnImportResult {
  success: boolean;
  vpn_id?: string;
  vpn_type?: VpnType;
  name: string;
  error?: string;
}

export interface VpnStatus {
  connected: boolean;
  vpn_id: string;
  connected_at?: number;
  bytes_sent?: number;
  bytes_received?: number;
  last_handshake?: number;
}
