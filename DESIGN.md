---
name: Publer MCP Dashboard
description: AI-native social media command center — dark, craft-forward, Publer-orange
colors:
  publer-coral: "#f4632a"
  publer-coral-deep: "#d44d1a"
  surface-base: "#0f1117"
  surface-raised: "#181c27"
  surface-overlay: "#1f2433"
  surface-sidebar: "#0c0f18"
  text-primary: "#eef0f6"
  text-secondary: "#8b92a9"
  text-disabled: "#4a5068"
  border-subtle: "#252b3b"
  border-default: "#2f3650"
  platform-linkedin: "#0a66c2"
  platform-instagram: "#e1306c"
  platform-twitter: "#1d9bf0"
  platform-tiktok: "#ff0050"
  platform-facebook: "#1877f2"
  platform-youtube: "#ff0000"
  status-success: "#22c55e"
  status-warning: "#f59e0b"
  status-error: "#ef4444"
  publer-teal: "#00c896"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
  mono:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.publer-coral}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.publer-coral-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-overlay}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  metric-card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  sidebar-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  sidebar-item-active:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.publer-coral}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input-default:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  input-focus:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System: Publer MCP Dashboard

## 1. Overview

**Creative North Star: "The Publisher's Studio"**

A dark, craft-forward dashboard that treats content as the hero. Not a generic analytics tool — a serious publishing environment where the depth of a brand's social presence is made tangible. The palette is warm charcoal with Publer's coral accent: dark enough to make real-time data pop, warm enough to carry the social energy of the platform it represents. Every color decision earns its place; every surface exists because something needs to rest on it.

The system is built for a social media manager who has a dozen posts in flight, multiple platforms to track, and a Claude conversation handling the orchestration. The dashboard must be immediately legible under pressure — dense without being cluttered, alive without being noisy.

This system explicitly rejects: the default shadcn/ui palette (gray backgrounds, blue primary, white cards); the hero-metric template (big centered number, gradient stripe, supporting stats); sidebar-plus-white-background SaaS templates; and dark mode with purple gradients or glassmorphism. Those are the training-data reflex. This dashboard earns its darkness with purpose.

**Key Characteristics:**
- Dark tonal layering (surface-base to raised to overlay) instead of shadows on neutral surfaces
- Publer coral (#f4632a) as the single saturated accent — used on at most 10% of any screen
- Platform-aware color coding: each social network has one color, used only in its three designated contexts
- Monospace type in the AI console, drawing a clear line between conversational and mechanical
- Display-weight numerics for primary KPIs only — one per screen, never inflated

## 2. Colors: The Coral Studio Palette

A warm charcoal base with a single energetic accent. Restraint is the strategy: when one color has the energy, it actually has it.

### Primary
- **Publer Coral** (#f4632a): The product's only saturated accent. CTAs, active sidebar indicators, live activity dots, progress bars, focus rings. Used on at most 10% of any given screen. Its rarity is the signal.
- **Coral Deep** (#d44d1a): Hover and pressed state for the coral. Never appears at rest — only as a state transition.

### Neutral
- **Surface Base** (#0f1117): The page background — the deepest layer. Nothing sits below this.
- **Surface Raised** (#181c27): Cards, sidebar body, metric containers, panel backgrounds. The primary work surface.
- **Surface Overlay** (#1f2433): Dropdowns, tooltips, modals, context menus. The topmost floating layer.
- **Surface Sidebar** (#0c0f18): The sidebar shell — one step darker than the base to frame the navigation as infrastructure.
- **Text Primary** (#eef0f6): Headings, metric values, active labels. Near-white with a cool undertone.
- **Text Secondary** (#8b92a9): Descriptions, timestamps, placeholder labels, inactive navigation items.
- **Text Disabled** (#4a5068): Disabled states, empty-state filler, uneditable placeholder text.
- **Border Subtle** (#252b3b): Section dividers, list separators.
- **Border Default** (#2f3650): Card outlines, input strokes, panel edges.

### Platform Colors (supporting role only)
- **LinkedIn** (#0a66c2), **Instagram** (#e1306c), **Twitter/X** (#1d9bf0), **TikTok** (#ff0050), **Facebook** (#1877f2), **YouTube** (#ff0000)

Used exclusively in platform chips, calendar event dots, and chart data series. Never as accent, background, or general text color.

### Semantic
- **Success** (#22c55e): Published confirmation, positive deltas, health indicators.
- **Warning** (#f59e0b): Queue retries, rate-limit warnings, unconfirmed scheduled states.
- **Error** (#ef4444): Failed jobs, API errors, validation failures.
- **Publer Teal** (#00c896): Reserved for AI-driven elements only — tool-call chips, generation labels, the active Claude indicator. Publer's secondary interactive accent; its contrast against dark surfaces signals machine action without departing from the brand.

### Named Rules
**The One Coral Rule.** Publer Coral is used on at most 10% of any given screen. One primary button, one active sidebar item, live activity dots. When everything is coral, nothing is.

**The Platform Color Rule.** Platform colors appear only in their three designated contexts: platform chips, calendar event dots, chart series. Never as accent, background, or text color elsewhere.

**The Publer Teal Rule.** Teal (#00c896) appears only where Claude is acting — tool calls, generation labels, the active assistant indicator. It is Publer's own secondary accent repurposed to mark machine action. If something is teal and not AI-related, it is wrong.

## 3. Typography

**Display Font:** Plus Jakarta Sans (with Inter, system-ui fallback)
**Body Font:** Inter
**Mono Font:** JetBrains Mono (AI console and tool execution logs only)

**Character:** Plus Jakarta Sans brings editorial confidence to dashboard headings — humanist enough to avoid mechanical stiffness, precise enough for data contexts. Inter handles body copy and data with exceptional small-size legibility. The monospace font in the AI console is a deliberate contrast signal: what Claude is doing is not conversation, it is execution.

### Hierarchy
- **Display** (700 weight, clamp(1.75rem, 3vw, 2.5rem), 1.1 line-height, -0.02em letter-spacing): Primary KPI values and top-level section headings. One per screen. The dashboard's loudest voice.
- **Headline** (600 weight, 1.25rem, 1.3 line-height, -0.01em letter-spacing): Card titles, panel headers, page section labels.
- **Title** (500 weight, 1rem, 1.4 line-height): Sub-section labels, table headers, modal titles. Quiet authority.
- **Body** (400 weight, 0.875rem, 1.6 line-height): Descriptions, feed entries, tooltips, AI responses. Cap at 65ch.
- **Label** (500 weight, 0.75rem, 1.4 line-height, 0.04em letter-spacing): Metadata tags, timestamps, status chips, navigation labels. Often uppercase in status contexts.
- **Mono** (400 weight, 0.8125rem, 1.7 line-height): AI console exclusively. Tool call JSON, MCP logs, generated content previews. Never used outside the console.

### Named Rules
**The Display Rule.** Display weight appears on exactly one element per screen: the primary KPI or the section title of the current view. Applying it to secondary metrics collapses the hierarchy into noise.

**The Mono Boundary Rule.** Monospace type signals machine output. It appears only in the AI console and tool log views — never in human-authored content or general UI labels.

## 4. Elevation

This system uses tonal layering, not shadows. On a dark base, raising a surface's lightness by 5 to 8% is more legible than box-shadows, which dissolve against dark backgrounds. Four named layers:

- **Layer 0 — Surface Base** (#0f1117): The page canvas. Nothing sits below this.
- **Layer 1 — Surface Raised** (#181c27): Cards, primary panels, metric containers, the sidebar body.
- **Layer 2 — Surface Overlay** (#1f2433): Dropdowns, tooltips, date pickers, modals.
- **Layer 3 — Surface Sidebar** (#0c0f18): The sidebar shell — the one surface intentionally darker than the base, to frame navigation as infrastructure.

The one exception: focused or hovered coral elements carry a single glow — `box-shadow: 0 0 0 3px rgba(244, 99, 42, 0.25)`. This is the system's only shadow. Reserved for the accent only. Never applied to neutral surfaces.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. No box-shadow on cards, panels, or containers. Depth is communicated through tonal layers. The coral focus glow is the only shadow in the system.

## 5. Components

### Buttons
Precise and confident. No inflated border-radius, no gradient fills, no shadow at rest.

- **Shape:** 8px radius (rounded.md). Never pill-shaped.
- **Primary:** Publer Coral (#f4632a) background, white text, 10px 20px padding. 0.875rem, 500 weight.
- **Hover / Focus:** Coral Deep (#d44d1a) background. Focus ring: `0 0 0 3px rgba(244, 99, 42, 0.25)`. Transition: 150ms ease-out.
- **Ghost:** Transparent background, Text Primary color, Border Default stroke (1px). Hover: Surface Overlay fill, border remains.
- **Disabled:** Text Disabled color, no border, no fill, cursor-not-allowed.

### Metric Cards
The four KPI cards on the overview. Not the hero-metric template — contained instruments, not billboards.

- **Background:** Surface Raised (#181c27), Border Default stroke (1px), 12px radius. No shadow.
- **Layout:** Icon (18px Lucide, Text Secondary color) and title in Label weight top-left. Value in Display weight below. Trend delta (small, success/error color with directional arrow) bottom-right. No gradient stripe. No background accent block.
- **Platform variant:** A 4px color dot beside the title for platform-specific metrics.

### Sidebar
The navigation spine. Surface Sidebar (#0c0f18) — the darkest layer, framing everything else.

- **Active item:** Surface Raised fill, Publer Coral text, 3px left-edge indicator in Publer Coral. The only permitted border-left in this system — state-driven, not decorative.
- **Inactive items:** Text Secondary color, transparent background. Hover: Surface Raised fill, Text Primary color. Transition: 100ms ease-out.
- **Section labels:** Label weight, Text Disabled color, uppercase, 0.65rem.
- **Icons:** Lucide, 18px, matched to text color.

### Platform Chips
Compact identifiers for social network context.

- **Background:** Platform color at 15% opacity
- **Text:** Platform color at 100% opacity
- **Shape:** 9999px (full pill), 4px 10px padding
- **Size:** Label weight (0.75rem), 500 weight

### Inputs / Fields
- **Style:** Surface Raised background, Border Default stroke (1px), 8px radius
- **Focus:** Border becomes Publer Coral (2px), coral glow ring `0 0 0 3px rgba(244, 99, 42, 0.2)`
- **Placeholder:** Text Disabled color
- **Error:** Border becomes status-error (#ef4444), no glow

### AI Console
A first-class screen. The deepest surface (Surface Base, #0f1117) — earns the most contrast because it is the most important tool.

- **Tool call entries:** Surface Raised card, mono font, 3px left-edge indicator in Publer Teal (#00c896)
- **User prompts:** Right-aligned, Surface Overlay background, body font
- **AI responses:** Left-aligned, no background fill — body text on Surface Base
- **Active generation:** Animated coral dot (3px, 1.5s ease-in-out pulse animation)
- **Tool call metadata:** Label weight, Text Secondary color, mono for values

### Live Activity Feed
Real-time event stream. No card chrome, no dismissal affordance.

- **Items:** Flat list on Surface Raised, Border Subtle dividers between entries
- **Event type indicator:** 6px dot, left-aligned: coral (scheduled), Publer Teal (AI-generated), status-success (published), status-error (failed)
- **Timestamps:** Label weight, Text Disabled color, right-aligned
- **Text:** Body weight, Text Secondary color. Event verb in Text Primary.

## 6. Do's and Don'ts

### Do:
- **Do** use Publer Coral on at most 10% of any screen. One primary CTA, one active sidebar item, live activity dots. Rarity is the signal.
- **Do** use tonal layering (Surface Base → Raised → Overlay) for depth. Never box-shadows on neutral surfaces.
- **Do** restrict platform colors to chips, calendar dots, and chart series only.
- **Do** use Plus Jakarta Sans for display and headline; Inter for title, body, and label; JetBrains Mono only in the AI console.
- **Do** cap body text at 65ch on dark high-contrast surfaces.
- **Do** design all interactive states before shipping any component: hover, focus-visible, active, disabled.
- **Do** reserve Publer Teal (#00c896) exclusively for machine-generated or AI-driven elements.
- **Do** give each data type its own card structure — metric cards, post previews, calendar cells, and activity entries are visually distinct.

### Don't:
- **Don't** use shadcn/ui defaults without customization. Gray backgrounds + blue primary + white cards is the anti-reference.
- **Don't** use the hero-metric template: large centered number, gradient stripe, supporting stats in a row. Explicitly prohibited.
- **Don't** use gradient text (`background-clip: text` with a gradient). Solid Publer Coral or Text Primary only.
- **Don't** use glassmorphism as decoration. Tonal layering handles depth without blur.
- **Don't** use `border-left` wider than 3px as a colored stripe on cards, callouts, or list items. The active sidebar indicator is the only exception and it is state-driven.
- **Don't** use purple gradients, violet, or neon accents. There is no violet in this palette. Publer Teal is the only non-coral, non-semantic accent — used only for AI-driven indicators.
- **Don't** repeat identical card structures across all data types. Identical card grids are explicitly rejected.
- **Don't** treat Surface Base (#0f1117) as generic dark gray. It is a specific, purposeful value.
