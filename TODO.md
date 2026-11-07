# TODO

## Move off gesture-handler's deprecated `Gesture` builder

Raised 2026-10-18: the peer range now allows `react-native-gesture-handler >=2.0.0 <4.0.0` so Expo SDK 58 apps (gesture-handler 3.3) can use it, but the code still uses the builder API (`Gesture.Pan()` on the resize handle in `src/ResizableInput.tsx`), which 3.x marks deprecated and says it will remove. Move to the 3.x hooks (`usePanGesture`) with `GestureDetector`; that makes 3.0 the peer floor, so release it as a minor once every consumer is on SDK 58.

## Check gestures on a device under gesture-handler 3

The tests mock `react-native-gesture-handler` (`src/__mocks__/react-native-gesture-handler.ts`), so they passed against 3.3 without running it. Before relying on it, try dragging the resize handle up and down to its min and max height, and typing past the first line so the input auto-grows, in Expo-Starter's resizable-input demo and Utility in an SDK 58 dev build.

## React Native 0.88 strict types

Checked 2026-10-18 with only the `react-native` condition: this package's own source has no strict-type errors, and neither has `@rific/core`'s source, which it also type-checks. Nothing to do here beyond dropping the deferral when `@infinitetoken/tsconfig` does.
