# Claude Code Guide

**Tech Stack:**
- React 19 + TypeScript
- Vite for bundling
- TailwindCSS for styling
- Chrome Extension APIs
- Jira.js for Jira integration
- IndexedDB for local storage

## Architecture Principles

### 1. **Feature-Based Organization**

Organize code by feature/page, not by file type. Each major feature has its own directory with all related code.

```
src/pages/
├── recordings/           # Recordings feature
│   ├── Recordings.tsx    # Main component
│   ├── RecordingCard.tsx # Child component
│   ├── hooks/            # Feature-specific hooks
│   │   ├── useRecordings.ts
│   │   ├── useVideoPlayer.ts
│   │   └── useTranscription.ts
│   └── utils/            # Feature-specific utilities
│       └── formatters.ts
│
└── settings/             # Settings feature
    ├── Settings.tsx      # Main component
    └── hooks/            # Feature-specific hooks
        ├── useJiraConnection.ts
        └── useJiraProjects.ts
```

**Why?** Keeps related code together, making it easier to find, maintain, and understand features in isolation.

### 2. **Component Hierarchy**

Components are organized in three tiers:

```
src/
├── components/           # Shared/global components
│   ├── Button.tsx
│   ├── SettingsCard.tsx
│   └── jira/            # Domain-specific shared components
│       ├── JiraProfile.tsx
│       ├── JiraConnect.tsx
│       └── JiraDropdown.tsx
│
└── pages/               # Page-level components
    └── [feature]/       # Feature-specific components
        └── ComponentName.tsx
```

**Guidelines:**
- Shared components go in `src/components/`
- Domain-specific shared components get their own subdirectory (e.g., `jira/`)
- Page/feature-specific components stay in their feature directory

### 3. **Centralized Type System**

All TypeScript types are centralized in `src/types/` for consistency and reusability.

```
src/types/
├── index.ts              # Barrel export - single import point
├── recording.ts          # Recording-related types
├── jiraSettings.ts       # Jira-related types
└── extensionSettings.ts  # Extension settings types
```

**Usage:**
```typescript
// Import from centralized location
import type { Recording, JiraTokens, ThemeOption } from "../../types";

// NOT from individual files
import type { Recording } from "../../types/recording"; // ❌ Don't do this
```

**Benefits:**
- Single source of truth for all types
- Easy to find and update type definitions
- Better IntelliSense across the codebase
- Reduced duplication

---

## Code Patterns & Practices

### Pattern 1: Custom Hooks for Business Logic

**Extract complex state management and side effects into custom hooks.**

**Example:** Settings.tsx refactoring

**Before (Anti-pattern):**
```typescript
const Settings = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // 50 lines of connection logic
  }, []);

  useEffect(() => {
    // 30 lines of project loading logic
  }, [isConnected]);

  const handleConnect = async () => {
    // 20 lines of auth logic
  };

  // 100+ more lines...
  return (/* JSX */);
};
```

**After (Good pattern):**
```typescript
// src/pages/settings/hooks/useJiraConnection.ts
export const useJiraConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  // All connection logic here
  return { isConnected, handleConnect, handleDisconnect };
};

// src/pages/settings/Settings.tsx
const Settings = () => {
  const { isConnected, handleConnect, handleDisconnect } = useJiraConnection();
  const { projects, loading, handleChange } = useJiraProjects(isConnected);

  return (/* Clean JSX focused on presentation */);
};
```

**Benefits:**
- Components focus on UI/presentation
- Logic is testable in isolation
- Hooks are reusable across components
- Easier to understand and maintain

### Pattern 2: Reusable Container Components

**Create reusable container components to reduce duplication.**

**Example:** SettingsCard component

**Before (Repetitive):**
```typescript
<section className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-6">
  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
    Application Settings
  </h2>
  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
    Description here...
  </p>
  {/* Content */}
</section>
```

**After (DRY):**
```typescript
// src/components/SettingsCard.tsx
<SettingsCard
  title="Application Settings"
  description="Description here..."
>
  {/* Content */}
</SettingsCard>
```

**When to create container components:**
- Pattern repeats 3+ times
- Styling is consistent across uses
- Reduces visual noise in parent components

### Pattern 3: Co-located Types and Re-exports

**Define types where they're used, but also centralize them.**

**Example:** themeManager.ts

```typescript
// src/utils/themeManager.ts
import type { ThemeOption, AppliedTheme } from "../types";

class ThemeManager {
  // Implementation using imported types
}

export const themeManager = new ThemeManager();

// Re-export types for convenience
export type { ThemeOption, AppliedTheme };
```

**Benefits:**
- Types are centralized in `/types` (source of truth)
- Utility/service files can re-export for convenience
- Consumers can import from either location
- Backward compatibility maintained

### Pattern 4: Smart Type Guards

**Use type guards for runtime type safety with Chrome APIs.**

**Example:** Storage value handling

```typescript
// ❌ Bad: Assumes type without checking
const newValue = changes.defaultJiraProject.newValue;
setDefaultProject(newValue); // TypeScript error - newValue is 'any'

// ✅ Good: Type guard ensures safety
const newValue = changes.defaultJiraProject.newValue;
setDefaultProject(typeof newValue === "string" ? newValue : "");
```

**When to use:**
- Chrome storage APIs (values are `any`)
- External API responses
- User input validation
- Dynamic data from browser APIs

---

## Styling Conventions

### TailwindCSS Usage

**Approach:** Utility-first with consistent patterns

**Dark Mode:**
```typescript
// Always provide both light and dark variants
className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"

// Common dark mode patterns:
// Backgrounds:     bg-white dark:bg-slate-800
// Text:            text-slate-900 dark:text-slate-100
// Borders:         border-slate-300 dark:border-slate-700
// Subtle text:     text-slate-600 dark:text-slate-400
```

**Component Styling Patterns:**
```typescript
// Cards/Containers
"bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-6"

// Buttons (handled by Button component)
<Button variant="primary">...</Button>

// Interactive elements
"hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"

// Loading states
"animate-pulse bg-slate-100 dark:bg-slate-700"
```

**Guidelines:**
- Use semantic color names (slate, blue, red) not arbitrary values
- Always include dark mode variants
- Use Tailwind's built-in utilities over custom CSS
- Group related utilities: layout → spacing → colors → typography

---

## State Management

### Chrome Storage

**Pattern for reading:**
```typescript
const result = await chrome.storage.local.get("key") as ExpectedType;
if (result.key) {
  // Use result.key with proper typing
}
```

**Pattern for writing:**
```typescript
await chrome.storage.local.set({ key: value });
```

**Pattern for listening:**
```typescript
useEffect(() => {
  const storageListener = (changes: {
    [key: string]: chrome.storage.StorageChange;
  }) => {
    if (changes.myKey) {
      const newValue = changes.myKey.newValue;
      // Type guard before using
      setMyValue(typeof newValue === "string" ? newValue : "");
    }
  };

  chrome.storage.local.onChanged.addListener(storageListener);

  return () => {
    chrome.storage.local.onChanged.removeListener(storageListener);
  };
}, []);
```

### React State

**Local state:** Use `useState` for component-specific state

**Derived state:** Compute from props/state, don't store separately
```typescript
// ✅ Good: Derived
const selectedProject = projects.find(p => p.key === defaultProject);

// ❌ Bad: Stored separately
const [selectedProject, setSelectedProject] = useState(null);
```

**Shared state:** Use hooks that manage Chrome storage

---

## Theme System

### How It Works

1. **ThemeManager** (`src/utils/themeManager.ts`)
   - Manages theme preference in Chrome storage
   - Applies/removes `dark` class on `<html>` element
   - Listens for system preference changes
   - Syncs across all extension pages

2. **Initialization** (Required in every page entry point)
   ```typescript
   // src/pages/[page]/index.tsx
   import { themeManager } from "../../utils/themeManager";

   themeManager.initialize();
   ```

3. **Hook for Settings** (`src/hooks/useTheme.ts`)
   ```typescript
   const { theme, setTheme, loading } = useTheme();
   ```

**Pages requiring theme initialization:**
- ✅ popup/index.tsx
- ✅ sidepanel/index.tsx
- ✅ recorder/index.tsx
- ✅ recordings/index.tsx

---

## Jira Integration

### Architecture

```
Components:
- JiraConnect.tsx      → Connection button
- JiraProfile.tsx      → User profile display
- JiraDropdown.tsx     → Custom dropdown for projects

Utilities:
- jiraAuth.ts          → OAuth authentication
- jiraService.ts       → Jira API operations

Hooks:
- useJiraConnection.ts → Connection state
- useJiraProjects.ts   → Projects management

Storage:
- jiraTokens           → OAuth tokens
- defaultJiraProject   → Selected default project
```

### Pattern for Jira Features

```typescript
// 1. Check if connected
const { isJiraConnected } = useJiraConnection();

// 2. Load projects if connected
const { projects, defaultProject } = useJiraProjects(isJiraConnected);

// 3. Conditional rendering
{isJiraConnected ? (
  <JiraProfile />
) : (
  <JiraConnect />
)}
```

---

## Best Practices for AI Assistants

### When Making Changes

1. **Read Before Writing**
   - Always read existing files before editing
   - Understand current patterns before proposing changes
   - Check for similar implementations elsewhere

2. **Maintain Consistency**
   - Follow existing patterns (don't introduce new ones without reason)
   - Use the same naming conventions
   - Match the style of surrounding code

3. **Organize by Feature**
   - Keep related code together in feature directories
   - Create hooks under `[feature]/hooks/`
   - Put shared utilities in `[feature]/utils/`

4. **Type Everything**
   - Add new types to `src/types/`
   - Export from `src/types/index.ts`
   - Use proper TypeScript, avoid `any`

### When Creating New Features

1. **Plan the Structure**
   ```
   src/pages/[feature]/
   ├── [Feature].tsx       # Main component
   ├── [SubComponent].tsx  # Child components (if needed)
   ├── hooks/              # Feature hooks
   │   └── use[Feature].ts
   └── utils/              # Feature utilities
       └── helpers.ts
   ```

2. **Extract Complex Logic**
   - Business logic → Custom hooks
   - Repeated UI → Reusable components
   - Constants → Separate file
   - Types → `src/types/`

3. **Consider Reusability**
   - Will this be used in multiple places?
   - Should it be in `src/components/`?
   - Can it be a hook in `src/hooks/`?

### When Refactoring

**Signs code needs refactoring:**
- Component > 120 lines
- Repeated code blocks
- Complex useEffect chains
- Multiple responsibilities in one component

**Refactoring checklist:**
- [ ] Extract hooks for business logic
- [ ] Create container components for repeated UI
- [ ] Add proper TypeScript types
- [ ] Organize files by feature
- [ ] Update imports to use centralized types
- [ ] Test dark mode still works
- [ ] Verify no functionality lost

---

## Common Patterns Reference

### Custom Hook Pattern
```typescript
// src/pages/[feature]/hooks/use[Name].ts
export const use[Name] = (dependency?: any) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Logic here
  }, [dependency]);

  const handler = async () => {
    // Handler logic
  };

  return { state, handler };
};
```

### Container Component Pattern
```typescript
// src/components/[Name].tsx
interface [Name]Props {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const [Name]: React.FC<[Name]Props> = ({ title, description, children }) => {
  return (
    <section className="...">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </section>
  );
};

export default [Name];
```

### Type Definition Pattern
```typescript
// src/types/[domain].ts
export interface [Entity] {
  id: string;
  name: string;
  // ... other fields
}

export interface [Entity]Storage {
  [entities]?: [Entity][];
}

export interface [Entity]Settings {
  default[Entity]?: string;
  // ... settings
}
```

---

## File Structure Reference

```
QuickVideoRecord/
├── src/
│   ├── components/          # Shared components
│   │   ├── Button.tsx
│   │   ├── SettingsCard.tsx
│   │   └── jira/           # Domain-specific shared
│   │       ├── JiraConnect.tsx
│   │       ├── JiraProfile.tsx
│   │       └── JiraDropdown.tsx
│   │
│   ├── hooks/              # Global hooks
│   │   └── useTheme.ts
│   │
│   ├── pages/              # Extension pages
│   │   ├── popup/
│   │   ├── sidepanel/
│   │   ├── recorder/
│   │   ├── recordings/     # Example feature structure
│   │   │   ├── Recordings.tsx
│   │   │   ├── RecordingCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useRecordings.ts
│   │   │   │   └── useVideoPlayer.ts
│   │   │   └── utils/
│   │   │       └── formatters.ts
│   │   └── settings/       # Example feature structure
│   │       ├── Settings.tsx
│   │       └── hooks/
│   │           ├── useJiraConnection.ts
│   │           └── useJiraProjects.ts
│   │
│   ├── types/              # Centralized types
│   │   ├── index.ts        # Barrel export
│   │   ├── recording.ts
│   │   ├── jiraSettings.ts
│   │   └── extensionSettings.ts
│   │
│   └── utils/              # Global utilities
│       ├── themeManager.ts
│       ├── jiraAuth.ts
│       └── jiraService.ts
│
├── claude.md               # This file
└── README.md
```

---

## Summary

**Key Principles:**
1. Organize by feature, not file type
2. Extract logic into custom hooks
3. Create reusable container components
4. Centralize types in `/types`
5. Always support dark mode
6. Use TypeScript properly (no `any`)
7. Keep components focused on presentation

**When in doubt:**
- Look for similar patterns in the codebase
- Follow the existing structure
- Prioritize readability and maintainability
- Ask before introducing new patterns