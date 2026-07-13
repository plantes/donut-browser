# Donut 免费化、离线绿色版与显示指纹改造记录

日期：2026-07-13

## 目标与边界

本轮将 Donut 改为全局免费版本，移除 Donut 官方云账号和本地付费限制，同时保留本地安全认证、自托管同步认证以及 Wayfern 当前仍具备的底层能力边界。

明确保留：

- 本机 REST/MCP bearer token。
- 自托管 `donut-sync` 的服务器地址和访问 token。
- E2E 加密密码及本地加密资料。
- Wayfern 条款确认。
- 同当前操作系统的指纹创建、编辑和启动。

明确不开放：

- 跨操作系统 Wayfern 指纹创建、导入、修改和启动。Wayfern 源码不在本次工作范围内，已有跨系统资料保持只读且不可启动。
- 代理上游服务实际返回的欠费 `402`。这里只移除了 Donut 套餐造成的本地 `402`。

## 免费化与云账号移除

### 前端

- 删除云登录、设备码登录、套餐/账号信息、Entitlements、Pro 徽标、商业试用和团队锁入口。
- 侧栏原“账号”入口改为“同步”，页面只提供自托管 URL、token、连接测试、保存和断开。
- 欢迎流程不再包含商业许可步骤。
- 自动化、MCP、批量运行/停止、扩展、同步器、加密、Cookie 导入和同系统指纹编辑不再显示付费遮罩。
- 九种语言同步清理废弃的登录、套餐、Pro、团队和试用文案。

### Rust 后端

- 删除 `cloud_auth`、`commercial_license`、`team_lock` 模块和命令注册。
- 移除启动时云 token 刷新、官方云同步、Wayfern token、云代理刷新和团队锁运行链路。
- 删除自动化、MCP、同步器、指纹及扩展管理中的本地订阅校验。
- REST 路由和本机 bearer 鉴权保持兼容；OpenAPI 不再声明套餐相关 `402`，代理欠费 `402` 仍保留。

### 升级清理

`src-tauri/src/legacy_cleanup.rs` 执行幂等的本机清理：

- 删除旧云账号凭据文件。
- 删除云管理代理和云派生代理。
- 清除资料对这些代理的绑定。
- 不调用远端删除。
- 保留普通代理、VPN、本地资料、自托管同步配置、访问 token、E2E 密码和本地加密数据。

历史团队资料字段继续参与反序列化，以保证旧资料可读取；本地副本按普通资料处理。

## 自托管同步

- 同步可用性只由自托管 URL 和 token 决定。
- 所有用户均可使用 E2E 加密，不再检查套餐或团队角色。
- `donut-sync` 的认证机制继续保留。
- 前端同步配置统一通过 `src/components/sync-page.tsx` 和 `src/lib/sync-utils.ts` 处理。

## 离线绿色版

绿色版依靠可执行文件同目录的 `.portable` 标记，将数据和缓存定向到包内：

- 用户数据：`data/`
- 缓存：`cache/`
- Wayfern：`data/binaries/wayfern/<version>/`
- GeoIP：`cache/GeoLite2-City.mmdb`

离线包内置 Wayfern `149.0.7827.116` 和 GeoLite2 City 数据库，首次启动不需要下载浏览器或 GeoIP。

打包时必须从干净目录组装，不能直接压缩使用过的绿色目录。特别检查并排除：

- `data/profiles` 下的资料、Cookie 和网站数据。
- `cache/traffic_stats`。
- VPN 密钥和同步 token。
- Wayfern 运行生成的 `debug.log`。

当前验证包：

- 文件：`Donut-0.28.1-offline-portable-win-x64-display-fix.zip`
- ZIP SHA256：`9F60F4F9266F45FB3B8C67ACDBE1F142562635F69B0F421DE9B6BDED5EF107D8`
- EXE SHA256：`97AA3B6E598F27CB5387BC77222FEC96BAFD5EE5A2A51BB69280D271EC77AC38`
- ZIP 条目：2259
- Wayfern 条目：2247
- 用户资料文件：0

构建产物位于 `src-tauri/target/`，受 Git 忽略，不提交到仓库。

## 屏幕、窗口、DPR 与 100vh

### 真实系统基准

新建及自动模式启动时，从 Donut 主窗口所在显示器读取：

- 物理分辨率。
- Windows 缩放比例。
- CSS 逻辑屏幕尺寸。
- 可用工作区和坐标。
- `devicePixelRatio`。

换算规则：`CSS 逻辑像素 = 物理像素 / 缩放比例`。例如 `2560×1600 @ 125%` 应得到：

- `screen.width = 2048`
- `screen.height = 1280`
- `screen.availHeight = 1240`（以当前任务栏工作区为例）
- `devicePixelRatio = 1.25`

### 启动策略

- 不再传入固定 `--window-size`。
- 首次启动定位到目标显示器并最大化；之后由 Chromium 恢复上次窗口状态。
- Windows 自动模式动态传入 `--force-device-scale-factor=<系统缩放>`，让 Chromium UI、字体、合成器和网页布局使用同一真实 DPR。
- 最大化后通过 CDP 获取真实布局视口；`windowInnerWidth/Height` 以 `document.documentElement.clientWidth/Height` 为准，避免 Wayfern 旧指纹值污染 CSS `100vh`。
- 自动模式下，屏幕尺寸、可用工作区和 DPR 始终以系统显示器基准为准，只从实际窗口同步 outer/inner 和位置。

这一区分很重要：只修改 Wayfern 返回的 JavaScript 指纹值，不能改变 Chromium 的真实排版与合成缩放，会造成字体偏小、`100vh` 与可视区域不一致。

### 自动与手动模式

`WayfernConfig` 新增：

- `display_baseline`
- `initial_window_maximized`
- `manual_display_fingerprint`

自动模式会在启动时刷新显示器基准并修复旧的错误值。编辑屏幕、窗口、位置或 DPR 字段后进入手动模式，后端不再自动覆盖这些字段。重新生成/随机化指纹会恢复自动模式。

## 兼容与后续开发注意事项

- 不要重新引入 `wayfernToken` CLI/CDP 参数。本版本不宣称跨系统能力可用。
- Wayfern CDP 在应用指纹前也可能返回旧指纹包装的 `screen`/DPR 值；自动模式不能把这些值当作系统真值。
- 显示器切换或缩放变化时，自动模式要重新读取 Tauri monitor 信息。
- 如果未来取得 Wayfern 源码并开放跨系统能力，应单独设计能力开关，不能重新绑定到 Donut 付费 entitlement。
- 新增 Tauri 用户可见错误仍必须使用 JSON error code，并同步前端错误映射和九种语言。
- REST 端点变化必须同步更新 `ApiDoc`、`utoipa::path` 和 OpenAPI 回归测试。
- 离线资源不要提交进 Git；使用构建/组装流程注入。

## 验证结果

执行过：

```text
pnpm format
pnpm lint
pnpm test
cargo build --release --bin donutbrowser
```

结果：

- Rust lib：307 passed，0 failed。
- donut-proxy integration：14 passed，0 failed。
- VPN integration：15 passed，0 failed。
- sync E2E：15 passed，0 failed。
- Release 构建成功。
- 离线 ZIP 完整读取约 2.078 GB 未压缩数据，所有必需文件存在。

