/* eslint-disable @typescript-eslint/no-explicit-any */
import { createModuleConfig } from '@rific/core'
import { type ComponentType, type ReactNode } from 'react'

export type ResizableInputConfig = {
  /** Default input component to render when a given `<ResizableInput>` doesn't pass its own `TextInputComponent` prop. Pass `import { TextInput as PaperInput } from 'react-native-paper'` (or any other input component); omit to keep React Native's own `TextInput`. */
  TextInputComponent?: ComponentType<any>
}

// @rific/core's createModuleConfig() supplies the module-level config singleton (configure/
// getConfig/Provider) every @rific package wires up the same way - see its own doc comment for
// why this is plain module state rather than React Context. The per-instance TextInputComponent
// prop on <ResizableInput> always overrides this default.
const resizableInputConfig = createModuleConfig<ResizableInputConfig>()

export const configureResizableInput = resizableInputConfig.configure
export const getResizableInputConfig = resizableInputConfig.getConfig
export const ResizableInputProvider = resizableInputConfig.Provider

export type ResizableInputProviderProps = ResizableInputConfig & { children: ReactNode }
