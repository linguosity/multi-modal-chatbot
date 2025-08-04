import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface CrudOptions {
  tableName: string
  userIdField?: string
  selectFields?: string
}

export class BaseCrudService {
  constructor(
    private supabase: SupabaseClient,
    private user: User,
    private options: CrudOptions
  ) {}

  async findAll(filters: Record<string, any> = {}) {
    let query = this.supabase
      .from(this.options.tableName)
      .select(this.options.selectFields || '*')

    // Add user filter if specified
    if (this.options.userIdField) {
      query = query.eq(this.options.userIdField, this.user.id)
    }

    // Add additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching ${this.options.tableName}:`, error)
      throw new Error(`Failed to fetch ${this.options.tableName}`)
    }

    return data
  }

  async findById(id: string) {
    let query = this.supabase
      .from(this.options.tableName)
      .select(this.options.selectFields || '*')
      .eq('id', id)

    // Add user filter if specified
    if (this.options.userIdField) {
      query = query.eq(this.options.userIdField, this.user.id)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`${this.options.tableName} not found`)
      }
      console.error(`Error fetching ${this.options.tableName} by ID:`, error)
      throw new Error(`Failed to fetch ${this.options.tableName}`)
    }

    return data
  }

  async create(data: Record<string, any>) {
    const insertData = { ...data }
    
    // Add user ID if specified
    if (this.options.userIdField) {
      insertData[this.options.userIdField] = this.user.id
    }

    const { data: result, error } = await this.supabase
      .from(this.options.tableName)
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error(`Error creating ${this.options.tableName}:`, error)
      throw new Error(`Failed to create ${this.options.tableName}`)
    }

    return result
  }

  async update(id: string, data: Record<string, any>) {
    let query = this.supabase
      .from(this.options.tableName)
      .update(data)
      .eq('id', id)

    // Add user filter if specified
    if (this.options.userIdField) {
      query = query.eq(this.options.userIdField, this.user.id)
    }

    const { data: result, error } = await query
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`${this.options.tableName} not found`)
      }
      console.error(`Error updating ${this.options.tableName}:`, error)
      throw new Error(`Failed to update ${this.options.tableName}`)
    }

    return result
  }

  async delete(id: string) {
    let query = this.supabase
      .from(this.options.tableName)
      .delete()
      .eq('id', id)

    // Add user filter if specified
    if (this.options.userIdField) {
      query = query.eq(this.options.userIdField, this.user.id)
    }

    const { error } = await query

    if (error) {
      console.error(`Error deleting ${this.options.tableName}:`, error)
      throw new Error(`Failed to delete ${this.options.tableName}`)
    }

    return true
  }
}