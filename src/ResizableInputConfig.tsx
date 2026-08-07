/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ComponentType, type ReactNode } from 'react'

export type ResizableInputConfig = {
  /** Default input component to render when a given `<ResizableInput>` doesn't pass its own `TextInputComponent` prop. Pass `import { TextInput as PaperInput } from 'react-native-paper'` (or any other input component); omit to keep React Native's own `TextInput`. */
  TextInputComponent?: ComponentType<any>
}

let config: ResizableInputConfig = {}

// Plain module-level config rather than React Context: this is one-time app setup, not
// per-render reactive state, so a Provider that has to exist just to thread a value through the
// tree is more ceremony than the problem needs. Call this directly, or mount
// <ResizableInputProvider> once near your app root (it just calls this for you). Not
// reactive: calling it again after components have already rendered won't retroactively update
// them, fine for one-time startup config, not for runtime toggling. The per-instance
// `TextInputComponent` prop on <ResizableInput> always overrides this default.
export const configureResizableInput = (next: ResizableInputConfig) => {
  config = { ...config, ...next }
}

export const getResizableInputConfig = (): ResizableInputConfig => config

export type ResizableInputProviderProps = ResizableInputConfig & { children: ReactNode }

// Thin wrapper around configureResizableInput() for consumers who'd rather mount a Provider
// than call a setup function directly: every @rific package wires up the same way this way.
// Calls configureResizableInput() synchronously during render (not in an effect), so the
// config is already set by the time any descendant <ResizableInput> renders. Effects run
// bottom-up after children have already rendered once, which would be one render too late here.
export const ResizableInputProvider = ({ children, TextInputComponent }: ResizableInputProviderProps) => {
  configureResizableInput({ TextInputComponent })
  return <>{children}</>
}
