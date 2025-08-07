// Type extensions for report types
import type { Json } from '@/lib/types/json'

declare module "@/lib/schemas/report" {
  interface Section {
    structured_data: Json;
    lastUpdated?: string;
    isGenerated?: boolean;
  }
}