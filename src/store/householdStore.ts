import { create } from "zustand"

type HouseholdStore = {
  selectedHouseholdId: string | null
  setSelectedHouseholdId: (householdId: string) => void
  clearSelectedHouseholdId: () => void
}

export const useHouseholdStore = create<HouseholdStore>((set) => ({
  selectedHouseholdId: null,

  setSelectedHouseholdId: (householdId) =>
    set({
      selectedHouseholdId: householdId,
    }),

  clearSelectedHouseholdId: () =>
    set({
      selectedHouseholdId: null,
    }),
}))