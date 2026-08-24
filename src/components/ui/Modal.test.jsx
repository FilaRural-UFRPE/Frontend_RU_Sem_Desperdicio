import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

function onClose() {}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    )
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })

  it('renders title and children when open', () => {
    render(
      <Modal open={true} onClose={onClose} title="Test Title">
        <p>Modal content</p>
      </Modal>
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('calls onClose when ESC is pressed', () => {
    const handleClose = vi.fn()
    render(
      <Modal open={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Modal open={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>
    )
    fireEvent.click(screen.getByTestId('modal-overlay'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Modal open={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('keeps keyboard focus inside the dialog', () => {
    render(
      <Modal open onClose={onClose} title="Test">
        <button>Action</button>
      </Modal>
    )
    const close = screen.getByRole('button', { name: 'Fechar' })
    const action = screen.getByRole('button', { name: 'Action' })
    close.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(action).toHaveFocus()
  })
})
