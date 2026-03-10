import { z } from 'zod'

export const feedbackSchema = z.object({
    message: z.string().trim().min(1, 'Mensagem obrigatória').max(1000, 'Máximo 1000 caracteres'),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>
