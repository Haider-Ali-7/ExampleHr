---
name: storybook
description: "Storybook Story Writing and CSF 3.0 Best Practice Skills. Use in the following situations: (1) when creating new story files (.stories.tsx, .stories.ts), (2) when modifying existing stories, (3) when setting Args, Decorators, and Parameters, (4) when working with Storybook configuration files (.storybook/), and (5) when working with keywords including 'story', 'stories', 'storybook', and 'CSF'."
license: MIT
metadata:
  author: DaleStudy
  version: '1.1.0'
---

# Storybook

## Best Practices

### 1. Use CSF 3.0 Format

Use the latest Component Story Format (CSF) 3.0. It is more concise and type-safe.

```tsx
// ❌ CSF 2.0 (Legacy)
export default {
  title: 'Components/Button',
  component: Button
};

export const Primary = () => <Button variant="primary">Click me</Button>;

// ✅ CSF 3.0 (Recommended)
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  component: Button,
  tags: ['autodocs'], // Automatic documentation generation
  args: {
    variant: 'primary',
    children: 'Click me'
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: 'secondary'
  }
};
```

### 2. Write Stories Using Args

Define component props as Args so they can be interactively manipulated in the Controls panel.

- **Declare default values in `args`** (❌ do not use `argTypes.defaultValue`). If defaults are placed in Meta-level `args`, the Controls panel will automatically select those values.
- **Declare args shared by multiple stories at the Meta (component) level**, and only override differences in individual stories.

```tsx
// ❌ Hardcoded Props
export const Disabled: Story = {
  render: () => <Button disabled>Disabled</Button>
};

// ❌ Duplicate the same args across multiple stories
export const Primary: Story = {
  args: { children: 'Click me', variant: 'primary' }
};
export const Secondary: Story = {
  args: { children: 'Click me', variant: 'secondary' }
};

// ✅ Declare shared args in Meta and override only differences in stories
const meta = {
  component: Button,
  args: {
    children: 'Click me',
    variant: 'primary'
  }
} satisfies Meta<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' }
};

export const Disabled: Story = {
  args: { disabled: true }
};
```

### 3. Omit title — Automatic File Path-Based Inference

Specifying `title` as a string is not type-safe and can easily get out of sync when component names or paths change. Storybook automatically infers the sidebar hierarchy from the file path, so omit `title`.

```tsx
// ❌ Explicit title — not type-safe and prone to synchronization issues
const meta = {
  title: 'Components/Button',
  component: Button
} satisfies Meta<typeof Button>;

// ✅ Omit title — automatically inferred from file path
const meta = {
  component: Button
} satisfies Meta<typeof Button>;
```

### 4. Define Meta in a Type-Safe Way

Use the `satisfies` keyword to benefit from both type checking and type inference.

```tsx
// ❌ No type inference
const meta: Meta<typeof Button> = {
  component: Button
};

// ✅ Both type checking and inference
const meta = {
  component: Button,
  args: {
    size: 'md',
    variant: 'primary'
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;
```

### 5. Provide Context with Decorators

Apply shared wrappers or providers using decorators.

```tsx
// Apply a decorator to an individual story
export const WithTheme: Story = {
  decorators: [
    Story => (
      <ThemeProvider theme="dark">
        <Story />
      </ThemeProvider>
    )
  ]
};

// Apply a decorator to all stories
const meta = {
  component: Button,
  decorators: [
    Story => (
      <div style={{ padding: '3rem' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Button>;
```

### 6. Customize Behavior with Parameters

```tsx
const meta = {
  component: Button,
  parameters: {
    layout: 'centered', // Center-align stories
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#000000' }
      ]
    }
  }
} satisfies Meta<typeof Button>;

// Override for an individual story
export const OnDark: Story = {
  parameters: {
    backgrounds: { default: 'dark' }
  }
};
```

### 7. ArgTypes — Prefer Automatic Inference, Minimize Manual Definitions

Storybook automatically applies the best argTypes based on the TypeScript types of component props. Manually overriding them creates maintenance overhead whenever component types change, so **do not define argTypes unless there is a valid reason**.

**Cases where manual definition is appropriate:**

- `ReactNode` type but text input is needed in Controls → `control: 'text'`
- Compound pattern (multiple exported components) → explicitly define argTypes
- Props that should always be fixed in a specific story → `control: false`

```tsx
// ❌ Unnecessary manual argTypes — can become out of sync when types change
const meta = {
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary']
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg']
    },
    disabled: {
      control: 'boolean'
    }
  }
} satisfies Meta<typeof Button>;

// ✅ Rely on automatic inference and manually define only when needed
const meta = {
  component: Button,
  argTypes: {
    // ReactNode type, but text input is desired
    children: { control: 'text' }
  }
} satisfies Meta<typeof Button>;

// ✅ Fix a prop in a specific story — control: false
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  argTypes: {
    orientation: { control: false } // Always horizontal in this story
  }
};
```

## Recommended Story Structure

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// 1. Define Meta — omit title, declare shared args, rely on automatic argType inference
const meta = {
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  args: {
    children: 'Button',
    size: 'md',
    variant: 'primary'
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 2. Default story — uses Meta args as-is
export const Primary: Story = {};

// 3. Variant stories — override only differences
export const Secondary: Story = {
  args: {
    variant: 'secondary'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};

// 4. Story requiring fixed props — use control: false
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  argTypes: {
    orientation: { control: false }
  }
};

// 5. When complex state or context is needed
export const WithCustomTheme: Story = {
  decorators: [
    Story => (
      <ThemeProvider theme="custom">
        <Story />
      </ThemeProvider>
    )
  ]
};
```

## Reference: Cases Where Manual ArgTypes Are Needed

> **Principle:** Most argTypes should be automatically inferred from component types. Use the examples below only when automatic inference is not suitable.
>
> **Declare default values in `args`, not in `argTypes.defaultValue`.**

```tsx
argTypes: {
  // ReactNode type, but text input is needed
  children: { control: 'text' },

  // Range slider (when automatic inference is not appropriate)
  opacity: {
    control: { type: 'range', min: 0, max: 1, step: 0.1 },
  },

  // Action logger (event handler)
  onClick: { action: 'clicked' },

  // Disable controls (fixed prop in a specific story)
  orientation: { control: false },
}
```

## Commonly Used Parameters

```tsx
parameters: {
  // Layout settings
  layout: 'centered' | 'fullscreen' | 'padded',

  // Background settings
  backgrounds: {
    default: 'light',
    values: [
      { name: 'light', value: '#ffffff' },
      { name: 'dark', value: '#333333' },
    ],
  },

  // Actions panel settings
  actions: {
    argTypesRegex: '^on[A-Z].*', // Automatically detect props starting with "on"
  },

  // Docs settings
  docs: {
    description: {
      component: 'Detailed description of the Button component',
    },
  },
}
```

## Decorator Patterns

```tsx
// 1. Style wrapper
(Story) => (
  <div style={{ padding: '3rem' }}>
    <Story />
  </div>
)

// 2. Theme Provider
(Story) => (
  <ThemeProvider theme="dark">
    <Story />
  </ThemeProvider>
)

// 3. Router Provider (when using React Router)
(Story) => (
  <MemoryRouter initialEntries={['/']}>
    <Story />
  </MemoryRouter>
)

// 4. Internationalization Provider
(Story) => (
  <I18nProvider locale="en">
    <Story />
  </I18nProvider>
)

// 5. Global State Provider
(Story) => (
  <Provider store={mockStore}>
    <Story />
  </Provider>
)
```

## File Naming Conventions

```text
Component.tsx           # Component implementation
Component.stories.tsx   # Story file (same directory)
Component.test.tsx      # Test file
```

## Storybook Configuration Files

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials', // Controls, Actions, Docs, etc.
    '@storybook/addon-interactions' // Play functions
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  }
};

export default config;
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  // Global decorators applied to all stories
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
```
