import * as React from "react";
import { ToastActionElement, ToastProps } from "@radix-ui/react-toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 1;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

type ActionType = typeof actionTypes;

type Action = 
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] };

interface State {
  toasts: ToasterToast[];
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST:
      const { toastId } = action;

      // ! Side effects ! - This means all toasts will be dismissed
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId ? { ...t, open: false } : t
          ),
        };
      } else {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({ ...t, open: false })),
        };
      }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== action.toastId),
        };
      }
      return state;
  }
};

const listeners: ((action: Action) => void)[] = [];

const dispatch = (action: Action) => {
  listeners.forEach((listener) => listener(action));
};

type Toast = Omit<ToasterToast, "id">;

const createToast = ({ ...props }: Toast) => {
  const id = Math.random().toString(36).substring(2, 9);

  const dismiss = () => dispatch({
    type: actionTypes.DISMISS_TOAST,
    toastId: id
  });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
      ...props,
    },
  });

  return { id, dismiss };
};

const useToast = () => {
  const [state, localDispatch] = React.useReducer(reducer, { toasts: [] });

  React.useEffect(() => {
    listeners.push(localDispatch);
    return () => {
      const index = listeners.indexOf(localDispatch);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast: createToast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
};

export { useToast, createToast };
