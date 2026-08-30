import { act, fireEvent, render } from '@testing-library/react'
import React from 'react'

import { ResizableInput } from '../ResizableInput'
import { configureResizableInput } from '../ResizableInputConfig'

// The react-native / react-native-gesture-handler mocks stash the handlers ResizableInput
// registers directly onto the DOM nodes they render (jsdom has no real layout engine and
// can't fire gesture or content-size events on its own) -- these helpers find those nodes and
// give the stashed handlers a typed shape to call directly. See
// src/__mocks__/react-native.ts and src/__mocks__/react-native-gesture-handler.ts.
type LayoutNode = HTMLDivElement & {
  __onLayout?: (event: { nativeEvent: { layout: { height: number } } }) => void
}

type GestureNode = HTMLDivElement & {
  __gesture?: {
    onBegin: (event?: unknown) => void
    onUpdate: (event: { translationY: number }) => void
    onEnd: (event: { translationY: number }) => void
  }
}

type ContentSizeTextarea = HTMLTextAreaElement & {
  __onContentSizeChange?: (event: { nativeEvent: { contentSize: { height: number } } }) => void
}

const getLayoutNode = (container: HTMLElement): LayoutNode => {
  const node = Array.from(container.querySelectorAll('div')).find((div) => (div as LayoutNode).__onLayout)
  if (!node) throw new Error('Expected to find a View with a stashed __onLayout handler')
  return node as LayoutNode
}

const getGestureNode = (container: HTMLElement): GestureNode => {
  const node = Array.from(container.querySelectorAll('div')).find((div) => (div as GestureNode).__gesture)
  if (!node) throw new Error('Expected to find a View with a stashed __gesture handle')
  return node as GestureNode
}

const getTextarea = (container: HTMLElement): ContentSizeTextarea => {
  const node = container.querySelector('textarea')
  if (!node) throw new Error('Expected to find the mocked TextInput textarea')
  return node as ContentSizeTextarea
}

const layoutEvent = (height: number) => ({ nativeEvent: { layout: { height } } })
const contentSizeEvent = (height: number) => ({ nativeEvent: { contentSize: { height } } })

describe('ResizableInput', () => {
  // configureResizableInput() mutates module-level singleton state (see
  // ResizableInputConfig.tsx) that otherwise leaks across tests within this file -- e.g. the
  // existing "prefers the per-instance TextInputComponent..." test below sets a global default
  // that renders no real DOM node, which would silently break every later test's DOM queries.
  // Reset it before each test so every test starts from the real (mocked) RNTextInput default.
  beforeEach(() => {
    configureResizableInput({ TextInputComponent: undefined })
  })

  it('renders without throwing', () => {
    expect(() => {
      render(<ResizableInput />)
    }).not.toThrow()
  })

  it('renders with a value', () => {
    expect(() => {
      render(<ResizableInput value='hello' />)
    }).not.toThrow()
  })

  it('renders with null value', () => {
    expect(() => {
      render(<ResizableInput value={null} />)
    }).not.toThrow()
  })

  it('renders with resizable disabled', () => {
    expect(() => {
      render(<ResizableInput resizable={false} />)
    }).not.toThrow()
  })

  it('renders with autoGrow disabled', () => {
    expect(() => {
      render(<ResizableInput autoGrow={false} />)
    }).not.toThrow()
  })

  it('renders with explicit height constraints', () => {
    expect(() => {
      render(<ResizableInput initialHeight={100} minHeight={60} maxHeight={300} />)
    }).not.toThrow()
  })

  it('accepts a custom renderHandle', () => {
    expect(() => {
      render(<ResizableInput renderHandle={() => <></>} />)
    }).not.toThrow()
  })

  it('accepts a custom TextInputComponent', () => {
    const CustomInput = (_props: object) => React.createElement('div', {})
    expect(() => {
      render(<ResizableInput TextInputComponent={CustomInput} />)
    }).not.toThrow()
  })

  it('calls onChangeText with null when cleared', () => {
    const onChangeText = jest.fn()
    render(<ResizableInput value='initial' onChangeText={onChangeText} />)
    expect(onChangeText).not.toHaveBeenCalled()
  })

  it('accepts handleColor prop without throwing', () => {
    expect(() => {
      render(<ResizableInput handleColor='#ff0000' />)
    }).not.toThrow()
  })

  it('prefers the per-instance TextInputComponent over the configured global default', () => {
    const GlobalInput = () => <>global</>
    const InstanceInput = () => <>instance</>
    configureResizableInput({ TextInputComponent: GlobalInput })

    const { container } = render(<ResizableInput TextInputComponent={InstanceInput} />)

    expect(container.textContent).toBe('instance')
  })

  describe('natural min-height layout (handleLayout)', () => {
    it('seeds the natural min height from the first positive onLayout measurement, used as the drag baseline', () => {
      const onHeightChange = jest.fn()
      const { container } = render(<ResizableInput onHeightChange={onHeightChange} />)

      act(() => getLayoutNode(container).__onLayout!(layoutEvent(40)))

      // Not directly observable via onHeightChange (height itself is still `null`/natural at
      // this point) -- observe the seeded value through the drag gesture's baseline instead:
      // onBegin seeds dragStartHeight from `height ?? resolvedMinHeight`, so a +10 drag lands
      // at 50 only if resolvedMinHeight was really seeded to 40.
      act(() => getGestureNode(container).__gesture!.onBegin())
      act(() => getGestureNode(container).__gesture!.onUpdate({ translationY: 10 }))

      expect(onHeightChange).toHaveBeenLastCalledWith(50)
    })

    it('does not reseed the natural min height on a later onLayout call (current ?? measured guard)', () => {
      const onHeightChange = jest.fn()
      const { container } = render(<ResizableInput onHeightChange={onHeightChange} />)

      act(() => getLayoutNode(container).__onLayout!(layoutEvent(40)))
      act(() => getLayoutNode(container).__onLayout!(layoutEvent(999)))

      act(() => getGestureNode(container).__gesture!.onBegin())
      act(() => getGestureNode(container).__gesture!.onUpdate({ translationY: 10 }))

      // Still 50 (40 + 10), not 1009 (999 + 10) -- the second measurement was ignored.
      expect(onHeightChange).toHaveBeenLastCalledWith(50)
    })

    it('ignores onLayout measurements of zero or negative height', () => {
      const onHeightChange = jest.fn()
      const { container } = render(<ResizableInput onHeightChange={onHeightChange} />)

      act(() => getLayoutNode(container).__onLayout!(layoutEvent(0)))
      act(() => getLayoutNode(container).__onLayout!(layoutEvent(-5)))

      act(() => getGestureNode(container).__gesture!.onBegin())
      act(() => getGestureNode(container).__gesture!.onUpdate({ translationY: 10 }))

      // resolvedMinHeight is still the unmeasured fallback of 0, so the drag lands at 10.
      expect(onHeightChange).toHaveBeenLastCalledWith(10)
    })

    it('does nothing on onLayout when an explicit minHeight prop is set', () => {
      const onHeightChange = jest.fn()
      const { container } = render(<ResizableInput minHeight={30} onHeightChange={onHeightChange} />)

      expect(onHeightChange).toHaveBeenNthCalledWith(1, 30)

      act(() => getLayoutNode(container).__onLayout!(layoutEvent(999)))

      act(() => getGestureNode(container).__gesture!.onBegin())
      act(() => getGestureNode(container).__gesture!.onUpdate({ translationY: 10 }))

      // Drag baseline is still the explicit minHeight (30), not the bogus 999 measurement.
      expect(onHeightChange).toHaveBeenLastCalledWith(40)
    })
  })

  describe('drag-resize via the pan gesture', () => {
    it('reports clamped drag positions through onHeightChange, clamping past both bounds', () => {
      const onHeightChange = jest.fn()
      const { container } = render(<ResizableInput initialHeight={100} minHeight={60} maxHeight={200} onHeightChange={onHeightChange} />)

      expect(onHeightChange).toHaveBeenNthCalledWith(1, 100)

      // The reanimated mock's useSharedValue doesn't persist a shared value's mutations
      // across re-renders (it just returns a fresh { value: init } every render) -- unlike the
      // real library, where a single pan gesture's onBegin/onUpdate/onEnd all read the same
      // fixed dragStartHeight regardless of any React re-render in between. To simulate one
      // continuous drag correctly against this mock, each block below re-fetches the gesture
      // ONCE (right before its onBegin) and reuses that same reference for the onUpdate/onEnd
      // that belong to the same drag, only re-fetching for the next drag's onBegin.
      let drag = getGestureNode(container).__gesture!
      act(() => drag.onBegin())
      act(() => drag.onUpdate({ translationY: 20 }))
      expect(onHeightChange).toHaveBeenNthCalledWith(2, 120)

      act(() => drag.onEnd({ translationY: 20 }))
      // onEnd lands on the same clamped value as the last onUpdate -- no extra call.
      expect(onHeightChange).toHaveBeenCalledTimes(2)

      drag = getGestureNode(container).__gesture!
      act(() => drag.onBegin())
      act(() => drag.onUpdate({ translationY: 500 }))
      expect(onHeightChange).toHaveBeenNthCalledWith(3, 200) // clamped to maxHeight

      drag = getGestureNode(container).__gesture!
      act(() => drag.onBegin())
      act(() => drag.onUpdate({ translationY: -1000 }))
      expect(onHeightChange).toHaveBeenNthCalledWith(4, 60) // clamped to minHeight
    })

    it('ignores onUpdate movements smaller than 1px and does not call onHeightChange again', () => {
      const onHeightChange = jest.fn()
      const { container } = render(<ResizableInput initialHeight={100} minHeight={60} maxHeight={200} onHeightChange={onHeightChange} />)
      onHeightChange.mockClear()

      act(() => getGestureNode(container).__gesture!.onBegin())
      act(() => getGestureNode(container).__gesture!.onUpdate({ translationY: 0.5 }))
      expect(onHeightChange).not.toHaveBeenCalled()

      // A real movement afterwards still works, proving the sub-1px update didn't corrupt
      // the live-height baseline (still measured from the 100 set at onBegin).
      act(() => getGestureNode(container).__gesture!.onUpdate({ translationY: 5 }))
      expect(onHeightChange).toHaveBeenLastCalledWith(105)
    })

    it('collapses back to natural height (null) when dragged back within AUTO_GROW_DELTA of the natural min', () => {
      const onHeightChange = jest.fn()
      const { container } = render(<ResizableInput onHeightChange={onHeightChange} />)

      act(() => getLayoutNode(container).__onLayout!(layoutEvent(40)))

      let drag = getGestureNode(container).__gesture!
      act(() => drag.onBegin())
      act(() => drag.onUpdate({ translationY: 20 }))
      expect(onHeightChange).toHaveBeenCalledTimes(1)
      expect(onHeightChange).toHaveBeenLastCalledWith(60)
      expect(getLayoutNode(container).style.height).toBe('60px')

      // Dragging back down to 41 (within AUTO_GROW_DELTA of the natural min of 40) collapses
      // the height to `null` -- the onHeightChange `height !== null` guard means this doesn't
      // fire another call, so the collapse is only observable via the wrapper's style.
      drag = getGestureNode(container).__gesture!
      act(() => drag.onBegin())
      act(() => drag.onUpdate({ translationY: -19 }))
      expect(onHeightChange).toHaveBeenCalledTimes(1)
      expect(getLayoutNode(container).style.height).toBe('')
    })
  })

  describe('controlled value prop sync', () => {
    it('resyncs the rendered input to a changed controlled value prop', () => {
      const { container, rerender } = render(<ResizableInput value='a' />)
      expect(getTextarea(container).value).toBe('a')

      rerender(<ResizableInput value='b' />)
      expect(getTextarea(container).value).toBe('b')

      // Falls back to '' (not 'null'/'undefined') when the controlled value is removed.
      rerender(<ResizableInput />)
      expect(getTextarea(container).value).toBe('')
    })
  })

  describe('handleChange', () => {
    it('calls onChangeText with the new text', () => {
      const onChangeText = jest.fn()
      const { container } = render(<ResizableInput onChangeText={onChangeText} />)

      fireEvent.change(getTextarea(container), { target: { value: 'hello' } })

      expect(onChangeText).toHaveBeenCalledWith('hello')
      expect(getTextarea(container).value).toBe('hello')
    })

    it('calls onChangeText with null (not an empty string) when the text is cleared', () => {
      const onChangeText = jest.fn()
      const { container } = render(<ResizableInput value='hi' onChangeText={onChangeText} />)

      fireEvent.change(getTextarea(container), { target: { value: '' } })

      expect(onChangeText).toHaveBeenCalledWith(null)
      expect(onChangeText).not.toHaveBeenCalledWith('')
    })
  })

  describe('min/max bounds change (prevBounds effect)', () => {
    it('re-clamps an existing height when a rerender lowers maxHeight below it', () => {
      const onHeightChange = jest.fn()
      const { container, rerender } = render(<ResizableInput initialHeight={150} minHeight={50} maxHeight={300} onHeightChange={onHeightChange} />)

      expect(onHeightChange).toHaveBeenNthCalledWith(1, 150)

      rerender(<ResizableInput initialHeight={150} minHeight={50} maxHeight={100} onHeightChange={onHeightChange} />)

      expect(onHeightChange).toHaveBeenLastCalledWith(100)
      expect(getLayoutNode(container).style.height).toBe('100px')
    })
  })

  describe('minHeight change resets content padding (prevResolvedMinHeightForPadding effect)', () => {
    it('re-infers content padding relative to the new min height instead of reusing the stale value', () => {
      const onHeightChange = jest.fn()
      const { container, rerender } = render(<ResizableInput onHeightChange={onHeightChange} />)

      // Seed a natural min height of 40, then lock in a content padding of 10 against it
      // (40 - 30). This step is a no-op for height/onHeightChange since it resolves back to
      // the same 40 baseline.
      act(() => getLayoutNode(container).__onLayout!(layoutEvent(40)))
      act(() => getTextarea(container).__onContentSizeChange!(contentSizeEvent(30)))
      expect(onHeightChange).not.toHaveBeenCalled()

      // Switching to an explicit minHeight changes resolvedMinHeight 40 -> 90, which should
      // reset the locked padding. `height` itself stays `null` here (the bounds-reclamp
      // effect only touches a non-null height), so it doesn't confound this on its own.
      rerender(<ResizableInput minHeight={90} onHeightChange={onHeightChange} />)
      expect(onHeightChange).not.toHaveBeenCalled()

      // First content-size call after any padding reset always neutrally re-anchors to the
      // new base (90) regardless of the reported content height -- this call re-locks padding
      // at 60 (90 - 30) and is itself a no-op.
      act(() => getTextarea(container).__onContentSizeChange!(contentSizeEvent(30)))
      expect(onHeightChange).not.toHaveBeenCalled()

      // Now a real content growth: with the re-inferred padding (60) this resolves to
      // 200 + 60 = 260. Had the reset not happened and the original padding (10) still been
      // in effect, this would instead resolve to 200 + 10 = 210.
      act(() => getTextarea(container).__onContentSizeChange!(contentSizeEvent(200)))
      expect(onHeightChange).toHaveBeenLastCalledWith(260)
    })
  })

  describe('handleContentResize / autoGrow', () => {
    it('grows past the natural min height, no-ops within AUTO_GROW_DELTA, then collapses back to natural height', () => {
      const onHeightChange = jest.fn()
      const { container } = render(<ResizableInput onHeightChange={onHeightChange} />)

      act(() => getLayoutNode(container).__onLayout!(layoutEvent(40)))

      // Lock in a content padding of 0 (40 - 40); resolves back to the natural 40 baseline, a
      // no-op.
      act(() => getTextarea(container).__onContentSizeChange!(contentSizeEvent(40)))
      expect(onHeightChange).not.toHaveBeenCalled()

      // Content grows to 80 (well past the min-plus-AUTO_GROW_DELTA threshold of 42) -> grows.
      act(() => getTextarea(container).__onContentSizeChange!(contentSizeEvent(80)))
      expect(onHeightChange).toHaveBeenLastCalledWith(80)
      expect(getLayoutNode(container).style.height).toBe('80px')

      // Only 1px different from the current height (80) -- below AUTO_GROW_DELTA, so no-op.
      act(() => getTextarea(container).__onContentSizeChange!(contentSizeEvent(81)))
      expect(onHeightChange).toHaveBeenCalledTimes(1)

      // Content shrinks back to 41, within AUTO_GROW_DELTA of the natural min (40) -> collapses
      // to `null`. onHeightChange's `height !== null` guard means it does NOT fire again here;
      // the collapse is only observable through the wrapper losing its explicit height style.
      act(() => getTextarea(container).__onContentSizeChange!(contentSizeEvent(41)))
      expect(onHeightChange).toHaveBeenCalledTimes(1)
      expect(getLayoutNode(container).style.height).toBe('')
    })

    it('skips its own autoGrow handling when autoGrow is false, but still calls the caller onContentSizeChange', () => {
      const onHeightChange = jest.fn()
      const onContentSizeChange = jest.fn()
      const { container } = render(<ResizableInput autoGrow={false} onContentSizeChange={onContentSizeChange} onHeightChange={onHeightChange} />)

      const event = contentSizeEvent(999)
      act(() => getTextarea(container).__onContentSizeChange!(event))

      expect(onContentSizeChange).toHaveBeenCalledWith(event)
      expect(onHeightChange).not.toHaveBeenCalled()
      expect(getLayoutNode(container).style.height).toBe('')
    })
  })
})
