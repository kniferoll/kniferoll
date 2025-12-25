export * from './database'

// App-specific types
export interface Kitchen {
  id: string
  name: string
  owner_id: string
  join_code: string
  shifts_config: ShiftConfig[]
  plan: 'free' | 'pro'
  created_at: string
  updated_at: string
}

export interface ShiftConfig {
  name: string
  start_time?: string
  end_time?: string
}

export interface Station {
  id: string
  kitchen_id: string
  name: string
  display_order: number
  created_at: string
}

export interface PrepItem {
  id: string
  station_id: string
  shift_date: string
  shift_name: string
  description: string
  quantity_raw: string
  quantity_parsed?: QuantityParsed
  recipe_id?: string
  completed: boolean
  completed_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface QuantityParsed {
  amount: number
  container?: string
  unit?: string
  item: string
  prep_style?: string
}

export interface SessionUser {
  id: string
  kitchen_id: string
  name: string
  station_id?: string
  device_token: string
  last_active: string
}
