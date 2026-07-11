export type AccountStatus = "onboarding" | "active" | "suspended";

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  timezone: string;
  account_status: AccountStatus;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
}
