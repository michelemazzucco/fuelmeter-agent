export type Reading = {
  id: string
  recorded_at: string
  level_cm: number | null
  level_liters: number | null
  is_refill: boolean
  notes: string | null
  created_at: string
}

export type TankConfig = {
  id: string
  capacity_liters: number
  low_threshold_liters: number
  updated_at: string
}
