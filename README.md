# @rific/resizable-input

Auto-growing, drag-resizable multiline text input for React Native. Automatically uses `react-native-paper`'s `TextInput` if installed, otherwise falls back to the built-in React Native `TextInput`.

## Installation

```sh
npm install @rific/resizable-input react-native-gesture-handler react-native-reanimated
```

With react-native-paper (optional):

```sh
npm install react-native-paper
```

## Usage

```tsx
import { ResizableInput } from '@rific/resizable-input'

// Auto-grows as you type; drag the handle to resize manually
<ResizableInput
  label='Notes'
  value={notes}
  onChangeText={setNotes}
  minHeight={80}
  maxHeight={400}
/>

// Disable auto-grow, keep manual resize only
<ResizableInput value={text} onChangeText={setText} autoGrow={false} />

// Bring your own input component
import { TextInput as PaperInput } from 'react-native-paper'
<ResizableInput TextInputComponent={PaperInput} mode='flat' value={text} onChangeText={setText} />
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `autoGrow` | `boolean` | `true` | Expand height as content grows |
| `handleColor` | `string` | `'#9e9e9e'` | Color of the drag handle indicator |
| `initialHeight` | `number` | | Starting height in pixels |
| `maxHeight` | `number` | `Infinity` | Maximum height in pixels |
| `minHeight` | `number` | | Minimum height; defaults to natural single-line height |
| `mode` | `'flat' \| 'outlined'` | `'outlined'` | react-native-paper mode (ignored when not using paper) |
| `onChangeText` | `(text: string \| null) => void` | | Called with `null` when field is cleared |
| `onHeightChange` | `(height: number) => void` | | Called when height changes |
| `renderHandle` | `() => ReactNode` | | Custom resize handle; replaces the default bar |
| `resizable` | `boolean` | `true` | Show drag handle for manual resize |
| `TextInputComponent` | `ComponentType` | auto | Override the input component; skips auto-detection |
| `value` | `string \| null` | | Controlled value |

All other props are forwarded to the underlying `TextInput`.

## Peer dependencies

Required:
- `react >= 17.0.0`
- `react-native >= 0.70.0`
- `react-native-gesture-handler >= 2.0.0`
- `react-native-reanimated >= 3.0.0`

Optional:
- `react-native-paper >= 5.0.0` — auto-detected; used as the default input if installed
