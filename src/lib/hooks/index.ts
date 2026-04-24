// Common hooks for consistent state management patterns
export { useFormState } from './useFormState'
export { useAsyncOperation } from './useAsyncOperation'
export { useModal } from './useModal'

export type { FormState, FormActions } from './useFormState'
export type { AsyncOperationState, AsyncOperationResult as AsyncOperationActions } from './useAsyncOperation'
export type { ModalState, ModalActions } from './useModal'