export interface Store {
  id: string
  name: string
}

export interface ChkEmployee {
  id: string
  store_id: string
  name: string
  active: boolean
  sort_order: number
  created_at: string
}

export interface ChkList {
  id: string
  store_id: string
  name: string
  active: boolean
  sort_order: number
  created_at: string
}

export interface ChkTask {
  id: string
  list_id: string
  text: string
  active: boolean
  sort_order: number
  day_of_week: string | null
}

export interface ChkSubmission {
  id: string
  store_id: string
  list_id: string
  list_name: string
  employee_id: string | null
  employee_name: string
  comment: string | null
  total_count: number
  done_count: number
  submitted_at: string
}

export interface ChkSubmissionItem {
  id: string
  submission_id: string
  text: string
  done: boolean
}

export interface ChkSetting {
  key: string
  value: string
}

// Tipo para o fill flow — task com estado de checked
export interface TaskWithCheck extends ChkTask {
  checked: boolean
}

// Tipo para submissão com itens expandidos (usado no relatório)
export interface SubmissionWithItems extends ChkSubmission {
  items: ChkSubmissionItem[]
  store?: Store
}

// Database type para o cliente Supabase tipado
export type Database = {
  public: {
    Tables: {
      stores: { Row: Store; Insert: Omit<Store, 'id'>; Update: Partial<Store> }
      chk_employees: { Row: ChkEmployee; Insert: Omit<ChkEmployee, 'id' | 'created_at'>; Update: Partial<ChkEmployee> }
      chk_lists: { Row: ChkList; Insert: Omit<ChkList, 'id' | 'created_at'>; Update: Partial<ChkList> }
      chk_tasks: { Row: ChkTask; Insert: Omit<ChkTask, 'id'>; Update: Partial<ChkTask> }
      chk_submissions: { Row: ChkSubmission; Insert: Omit<ChkSubmission, 'id' | 'submitted_at'>; Update: Partial<ChkSubmission> }
      chk_submission_items: { Row: ChkSubmissionItem; Insert: Omit<ChkSubmissionItem, 'id'>; Update: Partial<ChkSubmissionItem> }
      chk_settings: { Row: ChkSetting; Insert: ChkSetting; Update: Partial<ChkSetting> }
    }
  }
}
