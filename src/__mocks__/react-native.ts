import React from 'react'

const StyleSheet = {
  create: <T extends object>(styles: T): T => styles,
  flatten: (style: unknown) => style
}

const Platform = {
  OS: 'ios',
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default
}

export { Platform, StyleSheet }

// RN style arrays/objects don't map cleanly onto a DOM `style` attribute (arrays need
// flattening, some RN-only values aren't valid CSS) -- this keeps the mock's rendering
// quiet without needing a real StyleSheet resolution step. Not exercised by any assertion.
function flattenStyleForTest(style: unknown): React.CSSProperties | undefined {
  if (!style) return undefined
  const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style
  return flat as React.CSSProperties
}

// Drops remaining RN-only props (event handlers the DOM doesn't know, like onSubmitEditing,
// autoCorrect, etc.) before they land on a native element, so unknown-attribute console
// warnings stay minimal. Not load-bearing for correctness -- a few warnings wouldn't fail
// the suite either way.
const NON_DOM_PROP_PATTERN = /^(auto[A-Z]|on[A-Z])/
function pickDomProps(rest: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(rest)) {
    if (NON_DOM_PROP_PATTERN.test(key)) continue
    result[key] = rest[key]
  }
  return result
}

type MockRef<T> = ((instance: T | null) => void) | React.RefObject<T | null> | null | undefined

function applyRef<T>(ref: MockRef<T>, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

// Real <div> so ResizableInput's wrapping Views are queryable DOM nodes. `onLayout` isn't a
// real DOM attribute, so it's stashed directly on the rendered node (via a ref callback)
// instead -- a test finds the node and invokes `node.__onLayout({ nativeEvent: { layout } })`
// directly, since jsdom has no real layout engine to fire this naturally. React 19 lets a
// plain function component read `ref` as an ordinary prop (no forwardRef needed), which is
// also what lets react-native-gesture-handler's GestureDetector mock attach its own ref below.
export const View = ({ children, onLayout, ref, style, testID, ...rest }: any) => {
  const setRef = (node: HTMLDivElement | null) => {
    if (node) (node as any).__onLayout = onLayout
    applyRef(ref, node)
  }
  return React.createElement('div', { ref: setRef, 'data-testid': testID, style: flattenStyleForTest(style), ...pickDomProps(rest) }, children)
}

// Real <textarea> (ResizableInput always passes multiline) so `fireEvent.change` can drive
// `onChangeText` the normal RTL way. `onContentSizeChange` has no jsdom equivalent, so --
// like `onLayout` above -- it's stashed on the node for a test to call directly:
// `node.__onContentSizeChange({ nativeEvent: { contentSize } })`. The RN-only props
// ResizableInput always spreads (`dense`, `multiline`, `numberOfLines`) are destructured out
// so they don't spam React's unknown-DOM-attribute warnings.
export const TextInput = ({ dense: _dense, multiline: _multiline, numberOfLines: _numberOfLines, onChangeText, onContentSizeChange, ref, style, testID, value, ...rest }: any) => {
  const setRef = (node: HTMLTextAreaElement | null) => {
    if (node) (node as any).__onContentSizeChange = onContentSizeChange
    applyRef(ref, node)
  }
  return React.createElement('textarea', {
    ref: setRef,
    'data-testid': testID,
    value: value ?? '',
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChangeText?.(event.target.value),
    style: flattenStyleForTest(style),
    ...pickDomProps(rest)
  })
}

export const Text = ({ children, testID }: any) => React.createElement('span', { 'data-testid': testID }, children)
export const Pressable = ({ children, testID }: any) => React.createElement('div', { 'data-testid': testID }, children)
export const TouchableOpacity = ({ children, testID }: any) => React.createElement('div', { 'data-testid': testID }, children)
