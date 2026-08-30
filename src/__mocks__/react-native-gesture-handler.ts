import React from 'react'

export const GestureHandlerRootView = ({ children }: { children?: React.ReactNode }) => children ?? null

// GestureDetector's real job here is just to make the `gesture` prop reachable from a test
// that only has the rendered <ResizableInput> in hand. Its single child is always a plain
// element (a mocked `<View>`), and since React 19 lets a plain function component accept
// `ref` as an ordinary prop (see the react-native mock), cloning the child with a ref callback
// is enough to stash `gesture` directly on the DOM node that child renders -- no wrapper
// element needed, so ResizableInput's own DOM structure is unaffected. A test finds that node
// and calls `node.__gesture.onBegin()` / `.onUpdate({ translationY })` / `.onEnd({ translationY })`
// directly (see Gesture.Pan() below for why those same method names can both register and invoke).
export const GestureDetector = ({ children, gesture }: { children?: React.ReactElement; gesture?: unknown }) => {
  if (!children) return null
  const child = children
  const originalRef = (child.props as { ref?: unknown })?.ref

  return React.cloneElement(child, {
    ref: (node: unknown) => {
      if (node) (node as any).__gesture = gesture
      if (typeof originalRef === 'function') (originalRef as (n: unknown) => void)(node)
      else if (originalRef && typeof originalRef === 'object') (originalRef as React.RefObject<unknown>).current = node
    }
  } as Partial<unknown>)
}

// Each chain method (`onBegin`/`onUpdate`/`onEnd`) does double duty:
//   - called with a function (how ResizableInput.tsx builds the gesture:
//     `Gesture.Pan().onBegin(fn).onUpdate(fn).onEnd(fn)`) it registers that callback and
//     returns the same chainable gesture object.
//   - called with anything else (how a test drives it: `gesture.onUpdate({ translationY: 10 })`)
//     it invokes the previously-registered callback with that argument instead.
// This lets the exact same object serve as both the gesture builder AND, once stashed on a DOM
// node by GestureDetector above, the thing a test calls directly to fire onBegin/onUpdate/onEnd
// synchronously (reanimated's runOnJS mock is `(fn) => fn`, so these calls run updateHeight
// synchronously too).
type GestureCallback = (event?: unknown) => void

function createPanGesture() {
  let onBeginCallback: GestureCallback | undefined
  let onUpdateCallback: GestureCallback | undefined
  let onEndCallback: GestureCallback | undefined

  const gesture = {
    onBegin(arg?: GestureCallback | unknown) {
      if (typeof arg === 'function') {
        onBeginCallback = arg as GestureCallback
        return gesture
      }
      onBeginCallback?.(arg)
      return undefined
    },
    onUpdate(arg?: GestureCallback | unknown) {
      if (typeof arg === 'function') {
        onUpdateCallback = arg as GestureCallback
        return gesture
      }
      onUpdateCallback?.(arg)
      return undefined
    },
    onEnd(arg?: GestureCallback | unknown) {
      if (typeof arg === 'function') {
        onEndCallback = arg as GestureCallback
        return gesture
      }
      onEndCallback?.(arg)
      return undefined
    }
  }

  return gesture
}

export const Gesture = {
  Pan: createPanGesture
}
