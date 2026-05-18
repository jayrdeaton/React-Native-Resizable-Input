/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentProps, ComponentType, forwardRef, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutChangeEvent, StyleSheet, TextInput as RNTextInput, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useSharedValue } from 'react-native-reanimated'

let AutoPaperTextInput: ComponentType<any> | null = null
try {
  AutoPaperTextInput = require('react-native-paper').TextInput
} catch {}

export type ResizableInputProps = {
  autoGrow?: boolean
  handleColor?: string
  initialHeight?: number
  maxHeight?: number
  minHeight?: number
  mode?: 'flat' | 'outlined'
  onChangeText?: (text: string | null) => void
  onHeightChange?: (height: number) => void
  renderHandle?: () => ReactNode
  resizable?: boolean
  TextInputComponent?: ComponentType<any>
  value?: string | null
} & Omit<ComponentProps<typeof RNTextInput>, 'onChangeText' | 'value'>

const clampHeight = (value: number, minHeight: number, maxHeight: number) => Math.max(minHeight, Math.min(maxHeight, value))
const AUTO_GROW_DELTA = 2

export const ResizableInput = forwardRef<RNTextInput, ResizableInputProps>((props, ref) => {
  const { autoGrow = true, handleColor = '#9e9e9e', initialHeight, maxHeight, minHeight, mode, numberOfLines, onChangeText, onContentSizeChange, onHeightChange, renderHandle, resizable = true, style, TextInputComponent, value: valueProp, ...rest } = props

  const InputComponent = (TextInputComponent ?? AutoPaperTextInput ?? RNTextInput) as any
  const isPaper = InputComponent === AutoPaperTextInput || (AutoPaperTextInput !== null && TextInputComponent === AutoPaperTextInput)
  const resolvedMode = isPaper ? (mode ?? 'outlined') : undefined

  const usesNaturalBaseline = typeof initialHeight !== 'number' && typeof minHeight !== 'number'
  const resolvedMaxHeight = useMemo(() => (typeof maxHeight === 'number' ? maxHeight : Number.POSITIVE_INFINITY), [maxHeight])

  const [naturalMinHeight, setNaturalMinHeight] = useState<number | null>(null)
  const resolvedMinHeight = useMemo(() => {
    if (typeof minHeight === 'number') return minHeight
    return naturalMinHeight ?? 0
  }, [minHeight, naturalMinHeight])

  const [value, setValue] = useState<string>(valueProp ?? '')
  const [contentPadding, setContentPadding] = useState<number | null>(null)
  const [height, setHeight] = useState<number | null>(() => {
    if (typeof initialHeight === 'number') return initialHeight
    if (typeof minHeight === 'number') return minHeight
    return null
  })

  const liveHeight = useSharedValue(height ?? 0)
  const dragStartHeight = useSharedValue(height ?? 0)

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (typeof minHeight === 'number') return
      const measured = Math.round(event.nativeEvent.layout.height)
      if (measured <= 0) return
      setNaturalMinHeight((current) => current ?? measured)
    },
    [minHeight]
  )

  const updateHeight = useCallback(
    (nextHeight: number) => {
      const clamped = clampHeight(Math.round(nextHeight), resolvedMinHeight, resolvedMaxHeight)
      const resolved = usesNaturalBaseline && clamped <= resolvedMinHeight + AUTO_GROW_DELTA ? null : clamped
      setHeight((current) => {
        const currentEffective = current ?? resolvedMinHeight
        const nextEffective = resolved ?? resolvedMinHeight
        return currentEffective === nextEffective ? current : resolved
      })
    },
    [resolvedMaxHeight, resolvedMinHeight, usesNaturalBaseline]
  )

  useEffect(() => setValue(valueProp ?? ''), [valueProp])

  useEffect(() => {
    setContentPadding(null)
  }, [resolvedMinHeight])

  useEffect(() => {
    setHeight((current) => {
      if (current === null) return current
      return clampHeight(current, resolvedMinHeight, resolvedMaxHeight)
    })
  }, [resolvedMinHeight, resolvedMaxHeight])

  useEffect(() => {
    liveHeight.value = height ?? resolvedMinHeight
    if (height !== null) onHeightChange?.(height)
  }, [height, liveHeight, onHeightChange, resolvedMinHeight])

  const handleChange = useCallback(
    (next: string) => {
      setValue(next)
      onChangeText?.(next || null)
    },
    [onChangeText]
  )

  const handleContentResize: NonNullable<ComponentProps<typeof RNTextInput>['onContentSizeChange']> = useCallback(
    (event) => {
      onContentSizeChange?.(event)
      if (!autoGrow) return
      const contentHeight = event.nativeEvent.contentSize.height
      const inferredPadding = Math.max(0, Math.round((height ?? resolvedMinHeight) - contentHeight))
      const effectivePadding = contentPadding ?? inferredPadding
      if (contentPadding === null) setContentPadding(inferredPadding)
      setHeight((current) => {
        const base = current ?? resolvedMinHeight
        const next = clampHeight(Math.max(resolvedMinHeight, contentHeight + effectivePadding), resolvedMinHeight, resolvedMaxHeight)
        if (Math.abs(next - base) < AUTO_GROW_DELTA) return current
        if (usesNaturalBaseline && next <= resolvedMinHeight + AUTO_GROW_DELTA) return null
        return Math.round(next)
      })
    },
    [autoGrow, contentPadding, height, onContentSizeChange, resolvedMaxHeight, resolvedMinHeight, usesNaturalBaseline]
  )

  const resizeGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet'
      dragStartHeight.value = height ?? resolvedMinHeight
      liveHeight.value = dragStartHeight.value
    })
    .onUpdate((event) => {
      'worklet'
      const candidate = dragStartHeight.value + event.translationY
      const next = Math.max(resolvedMinHeight, Math.min(resolvedMaxHeight, candidate))
      if (Math.abs(next - liveHeight.value) < 1) return
      liveHeight.value = next
      runOnJS(updateHeight)(next)
    })
    .onEnd((event) => {
      'worklet'
      const candidate = dragStartHeight.value + event.translationY
      const next = Math.max(resolvedMinHeight, Math.min(resolvedMaxHeight, candidate))
      runOnJS(updateHeight)(next)
    })

  return (
    <View style={styles.container}>
      <View onLayout={handleLayout} style={[styles.inputWrapper, typeof height === 'number' ? { height } : null]}>
        <InputComponent ref={ref} dense mode={resolvedMode} multiline numberOfLines={numberOfLines ?? 1} {...rest} value={value} onChangeText={handleChange} onContentSizeChange={handleContentResize} style={[styles.input, style]} />
      </View>
      {resizable ? (
        <GestureDetector gesture={resizeGesture}>
          <View style={styles.handleTouch}>{renderHandle ? renderHandle() : <View style={[styles.handle, { backgroundColor: handleColor }]} />}</View>
        </GestureDetector>
      ) : null}
    </View>
  )
})

ResizableInput.displayName = 'ResizableInput'

const styles = StyleSheet.create({
  container: {
    position: 'relative'
  },
  handle: {
    borderRadius: 2,
    height: 4,
    width: 20
  },
  handleTouch: {
    alignItems: 'center',
    bottom: 8,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    width: 28,
    zIndex: 2
  },
  input: {
    flex: 1
  },
  inputWrapper: {
    margin: 2
  }
})
