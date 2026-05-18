/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'

const stub = ({ children }: { children?: React.ReactNode }) => children ?? null

const noop = () => {}

const StyleSheet = {
  create: <T extends object>(styles: T): T => styles,
  flatten: (style: unknown) => style
}

const Platform = {
  OS: 'ios',
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default
}

export { Platform, StyleSheet }

export const TextInput = stub
export const View = stub
export const Text = stub
export const Pressable = stub
export const TouchableOpacity = stub
