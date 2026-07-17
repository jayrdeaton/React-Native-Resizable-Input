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

Optional:

- `react-native-paper >= 5.0.0` — when installed, the input defaults to Paper's `TextInput` (unless you pass `TextInputComponent`); without it, falls back to React Native's `TextInput`
