import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FeedbackButton } from '@/components/ui/FeedbackButton'

describe('FeedbackButton', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('renders the feedback button', () => {
        render(<FeedbackButton />)
        expect(screen.getByRole('button', { name: /enviar feedback/i })).toBeInTheDocument()
    })

    it('opens the modal when the button is clicked', () => {
        render(<FeedbackButton />)
        fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Enviar Feedback')).toBeInTheDocument()
    })

    it('closes the modal when the X button is clicked', () => {
        render(<FeedbackButton />)
        fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
        fireEvent.click(screen.getByRole('button', { name: /fechar/i }))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('disables the submit button when the textarea is empty', () => {
        render(<FeedbackButton />)
        fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
        expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
    })

    it('enables the submit button when the textarea has content', () => {
        render(<FeedbackButton />)
        fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
        fireEvent.change(screen.getByLabelText(/mensagem de feedback/i), {
            target: { value: 'Great platform!' },
        })
        expect(screen.getByRole('button', { name: 'Enviar' })).not.toBeDisabled()
    })

    it('shows a success message after a successful submission', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
        render(<FeedbackButton />)
        fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
        fireEvent.change(screen.getByLabelText(/mensagem de feedback/i), {
            target: { value: 'Great platform!' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
        await waitFor(() => {
            expect(screen.getByText(/obrigado pelo seu feedback/i)).toBeInTheDocument()
        })
    })

    it('shows an error message when the submission fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
        render(<FeedbackButton />)
        fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
        fireEvent.change(screen.getByLabelText(/mensagem de feedback/i), {
            target: { value: 'Something went wrong' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument()
        })
    })

    it('sends the message to /api/feedback via POST', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true })
        vi.stubGlobal('fetch', mockFetch)
        render(<FeedbackButton />)
        fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
        fireEvent.change(screen.getByLabelText(/mensagem de feedback/i), {
            target: { value: 'My feedback' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ message: 'My feedback' }),
            }))
        })
    })
})
