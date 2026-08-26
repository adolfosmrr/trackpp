export type InvitationHousehold = {
    id: string
    name: string
    type: string
    currency: string
  }
  
  export type HouseholdInvitation = {
    id: string
    household_id: string
    invited_by: string
    email: string
    status: "pending" | "accepted" | "cancelled"
    created_at: string
  
    household: InvitationHousehold
  }