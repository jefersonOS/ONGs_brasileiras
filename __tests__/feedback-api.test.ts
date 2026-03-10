import { describe, it, expect } from 'vitest'
import { feedbackSchema } from '@/lib/feedback'

describe('feedbackSchema', () => {
    it('accepts a valid message', () => {
        expect(feedbackSchema.safeParse({ message: 'Great platform!' }).success).toBe(true)
    })

    it('rejects an empty message', () => {
        expect(feedbackSchema.safeParse({ message: '' }).success).toBe(false)
    })

    it('rejects a whitespace-only message', () => {
        expect(feedbackSchema.safeParse({ message: '   ' }).success).toBe(false)
    })

    it('rejects a message longer than 1000 characters', () => {
        expect(feedbackSchema.safeParse({ message: 'a'.repeat(1001) }).success).toBe(false)
    })

    it('accepts a message exactly 1000 characters long', () => {
        expect(feedbackSchema.safeParse({ message: 'a'.repeat(1000) }).success).toBe(true)
    })

    it('rejects when the message field is missing', () => {
        expect(feedbackSchema.safeParse({}).success).toBe(false)
    })

    it('trims leading/trailing whitespace before validating length', () => {
        const result = feedbackSchema.safeParse({ message: '  hello  ' })
        expect(result.success).toBe(true)
        if (result.success) expect(result.data.message).toBe('hello')
    })
})
