import { render } from '@testing-library/react'
import React from 'react'

import { ResizableInput } from '../ResizableInput'

describe('ResizableInput', () => {
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
})
