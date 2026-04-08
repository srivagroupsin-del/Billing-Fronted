import { create } from 'zustand';

interface AccessState {
    selectedAccess: string[];
    addAccess: (access: string) => void;
    removeAccess: (access: string) => void;
    clearAccess: () => void;
}

export const useAccessStore = create<AccessState>((set) => ({
    selectedAccess: [],
    addAccess: (access) => set((state) => {
        if (state.selectedAccess.includes(access)) return state;
        return { selectedAccess: [...state.selectedAccess, access] };
    }),
    removeAccess: (access) => set((state) => ({
        selectedAccess: state.selectedAccess.filter((item) => item !== access)
    })),
    clearAccess: () => set({ selectedAccess: [] }),
}));
