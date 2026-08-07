# @rific/resizable-input

Auto-growing, drag-resizable multiline text input for React Native.

## Installation

```sh
npm install @rific/resizable-input react-native-gesture-handler react-native-reanimated
```

## Usage

```tsx
import { ResizableInput } from '@rific/resizable-input'

// Auto-grows as you type; drag the handle to resize manually
<ResizableInput
  value={notes}
  onChangeText={setNotes}
  minHeight={80}
  maxHeight={400}
/>

// Disable auto-grow, keep manual resize only
<ResizableInput value={text} onChangeText={setText} autoGrow={false} />
```

### With react-native-paper

Pass `TextInputComponent` to use Paper's `TextInput`. The generic is inferred automatically, so Paper-specific props like `mode`, `dense`, and `label` are fully typed:

```tsx
import { TextInput as PaperInput } from 'react-native-paper'

<ResizableInput
  TextInputComponent={PaperInput}
  mode='outlined'
  dense
  label='Notes'
  value={text}
  onChangeText={setText}
/>
```

If every `ResizableInput` in your app should default to the same component, configure it once instead of passing `TextInputComponent` at every call site:

```tsx
import { configureResizableInput } from '@rific/resizable-input'
import { TextInput as PaperInput } from 'react-native-paper'

configureResizableInput({ TextInputComponent: PaperInput })
```

Or mount `ResizableInputProvider` near your app root: it's a thin wrapper that just calls `configureResizableInput()` for you, for consistency with how the other `@rific` packages configure their own optional integrations:

```tsx
import { ResizableInputProvider } from '@rific/resizable-input'
import { TextInput as PaperInput } from 'react-native-paper'

<ResizableInputProvider TextInputComponent={PaperInput}>
  {/* your app */}
</ResizableInputProvider>
```

Either way, this is one-time setup, not reactive state: call it once, before your first `ResizableInput` renders. A per-instance `TextInputComponent` prop always overrides the configured default.

### Custom handle

```tsx
<ResizableInput
  renderHandle={() => <MyHandleIcon />}
  value={text}
  onChangeText={setText}
/>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `autoGrow` | `boolean` | `true` | Expand height as content grows |
| `handleColor` | `string` | `'#9e9e9e'` | Color of the default drag handle |
| `initialHeight` | `number` | | Starting height in pixels |
| `maxHeight` | `number` | `Infinity` | Maximum height in pixels |
| `minHeight` | `number` | | Minimum height; defaults to natural single-line height |
| `onChangeText` | `(text: string \| null) => void` | | Called with `null` when field is cleared |
| `onHeightChange` | `(height: number) => void` | | Called when height changes |
| `renderHandle` | `() => ReactNode` | | Custom resize handle; replaces the default bar |
| `resizable` | `boolean` | `true` | Show drag handle for manual resize |
| `TextInputComponent` | `ComponentType<T>` | `TextInput` | Input component to render; all of its props are inferred and forwarded |
| `value` | `string \| null` | | Controlled value |

All other props are forwarded to the underlying input component.

## Peer dependencies

- `react >= 18.0.0`
- `react-native >= 0.76.0`
- `react-native-gesture-handler >= 2.0.0`
- `react-native-reanimated >= 3.0.0`

No dependency on `react-native-paper` or any other input library: `TextInputComponent` (see above) is the only integration point, and it works with any component that accepts `value`/`onChangeText`. Without it, `ResizableInput` renders React Native's own `TextInput`.
