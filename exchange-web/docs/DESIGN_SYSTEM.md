# 设计系统（Design System）

面向 Vue3 + TS 加密货币交易所前端，视觉基调：**专业暗黑金融终端**（对齐 Binance / OKX / Bybit 类信息密度与对比度）。

---

## 1. 令牌来源（SCSS）

| 文件 | 内容 |
|------|------|
| `src/styles/abstracts/_variables.scss` | **色板、字体、间距、圆角、边框、阴影、z-index、控件高度、动效** |
| `src/styles/abstracts/_mixins.scss` | 面板、焦点环、**字体层级 mixin**、过渡 |
| `src/styles/themes/_dark.scss` | 将核心令牌映射为 **`--ex-*` CSS 变量**（供运行时与组件库使用） |
| `src/styles/components/*.scss` | **按钮 / 输入 / Tab / 表格 / 卡片 / 标签** 的 BEM 参考实现（`.ex-*`） |
| `src/styles/base/_utilities.scss` | 轻量工具类（`.u-text-*`） |

入口：`src/styles/main.scss`。

---

## 2. 色板

- **背景层级**：`canvas/base` → `elevated`（面板）→ `surface`（控件）→ `hover`；另含 `muted`、`overlay`。
- **边框**：`subtle` / 默认 / `strong`；焦点强调 `border-focus`（品牌色）。
- **文本**：`primary` / `secondary` / `tertiary` / `disabled` / `inverse`（主按钮上文字）。
- **品牌**：金系 `#f0b90b`（可替换为自有品牌色）。
- **涨跌**：`rise` 绿 / `fall` 红，含 hover 与浅色背景、描边变体。
- **语义**：`info` / `warning` / `danger` / `success` / `neutral`，均配 `*-bg` 用于标签底。

CSS 变量示例：`var(--ex-brand)`、`var(--ex-rise)`、`var(--ex-bg-elevated)`。

---

## 3. 字体层级

| 角色 | SCSS 变量 / Mixin | 典型用途 |
|------|-------------------|----------|
| 行情大数 / 营销标题 | `$font-size-display` + `@mixin text-display` | 首页主标题 |
| 区块标题 | `$font-size-xxl` + `text-title-lg` | 页面 H1 |
| 卡片标题 | `$font-size-lg` + `text-title` | 卡片、面板标题 |
| 正文 | `$font-size-base` + `text-body` | 表单说明、段落 |
| 辅助说明 | `$font-size-sm` + `text-caption` | 标签、次要说明 |
| 表格/盘口数字 | `$font-family-mono` + `.ex-num` / `text-data` | 价格、数量 |

行高：`tight` / `snug` / `normal` / `relaxed`。

---

## 4. 间距系统

**4px 基准网格**：`$space-1` (4) … `$space-12` (48)。

规则：

- 组件内边距：多使用 `$space-3` / `$space-4`。
- 区块间距：`$space-4` ~ `$space-6`。
- 页面边距：`$space-6` ~ `$space-8`。

---

## 5. 圆角与边框

- **圆角**：`xs(2)` / `sm(4)` / `md(6)` / `lg(8)` / `xl(12)` / `full`。
- **控件**：按钮、输入框默认 `sm`；卡片、表格外壳 `md` ~ `lg`。
- **边框宽度**：`thin` 1px（默认）、`medium` 2px（Tab 下划线、焦点环）。

---

## 6. 组件规范摘要

### 按钮（`.ex-btn`）

- 尺寸：`--sm`（32）/ 默认（36）/ `--lg`（44）。
- 变体：`--primary`（品牌填充）、`--secondary`、`--ghost`、`--danger`；`--block` 全宽。
- 禁用：统一 `opacity: 0.5`。

### 输入框（`.ex-input`）

- 高度 40px（`$control-height-lg`），深色底 + 强边框，聚焦品牌色 + 内阴影环。
- 字段组合：`.ex-label` + `.ex-input` + `.ex-field-hint` / `.ex-field-error`。

### Tab（`.ex-tabs` / `.ex-tab`）

- 默认：底边线 + 激活下划线（品牌色）。
- 胶囊：`.ex-tabs-pill` + `.ex-tab-pill`，用于行情分类等。

### 表格（`.ex-table`）

- 表头：小号大写 + 字间距，粘性顶栏。
- 数字列：`.ex-num`；涨跌：`.ex-rise` / `.ex-fall`。
- 容器 `.ex-table-wrap` 可滚动并限制最大高度。

### 卡片（`.ex-card`）

- 默认抬升阴影；`--flat` 无阴影；`--compact` 更紧内边距。
- 可选 `.ex-card__header` / `__title` / `__sub` / `__body`。

### 状态标签（`.ex-tag`）

- 变体：`--neutral` / `--success` / `--warning` / `--danger` / `--info` / `--brand` / `--rise` / `--fall`。
- 状态点：`.ex-dot` + 语义修饰。

---

## 7. 使用约定

1. **新页面**：优先使用已有 `.ex-*` 类；若 Element Plus 与 `.ex-*` 并存，用主题变量覆盖 EP 的 CSS 变量（见 `styles/admin/_element-bridge.scss` 模式）。
2. **颜色**：禁止硬编码 `#hex` 于业务组件，应使用 SCSS 变量或 `var(--ex-*)`。
3. **暗黑**：默认主题即 `data-theme='dark'`，后续若加浅色，在 `themes/` 下新增并同步令牌。

---

## 8. 扩展清单

- [ ] 将 Element Plus 主题与 `--ex-*` 对齐（全局 `el-*` 覆盖）。
- [ ] Figma Tokens 导出与 `_variables.scss` 同步流程。
- [ ] Storybook / 文档站展示各 `.ex-*` 状态。
