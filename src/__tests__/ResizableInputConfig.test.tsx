import { render } from '@testing-library/react'
import React from 'react'

import { ResizableInput } from '../ResizableInput'
import { configureResizableInput, getResizableInputConfig, ResizableInputProvider } from '../ResizableInputConfig'

const FakeInput = (props: { value?: string | null }) => <>{`fake-input:${props.value ?? ''}`}</>

describe('configureResizableInput / getResizableInputConfig', () => {
  it('is readable via the bare function, without any Provider', () => {
    configureResizableInput({ TextInputComponent: FakeInput })
    expect(getResizableInputConfig().TextInputComponent).toBe(FakeInput)
  })

  it('is picked up by <ResizableInput> as the default TextInputComponent', () => {
    configureResizableInput({ TextInputComponent: FakeInput })
    const { container } = render(<ResizableInput value='hello' />)
    expect(container.textContent).toContain('fake-input:hello')
  })
})

describe('ResizableInputProvider', () => {
  it('calls configureResizableInput() synchronously during render, before children render', () => {
    let seenDuringChildRender: unknown
    const Probe = () => {
      seenDuringChildRender = getResizableInputConfig().TextInputComponent
      return null
    }

    render(
      <ResizableInputProvider TextInputComponent={FakeInput}>
        <Probe />
      </ResizableInputProvider>
    )

    expect(seenDuringChildRender).toBe(FakeInput)
  })
})
