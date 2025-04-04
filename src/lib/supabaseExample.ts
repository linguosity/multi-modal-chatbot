import { supabase } from './supabaseClient';
import type { Story } from '@/types/supabaseTypes';

/**
 * Example function that fetches stories from Supabase
 */
export async function getStories(): Promise<Story[]> {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

/**
 * Example function that creates a new story in Supabase
 */
export async function createStory(storyData: Omit<Story, 'id' | 'created_at' | 'updated_at'>): Promise<Story> {
  try {
    const { data, error } = await supabase
      .from('stories')
      .insert(storyData)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
}

/**
 * Example function that updates a story in Supabase
 */
export async function updateStory(id: string, storyData: Partial<Omit<Story, 'id' | 'created_at' | 'updated_at'>>): Promise<Story> {
  try {
    const { data, error } = await supabase
      .from('stories')
      .update(storyData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating story:', error);
    throw error;
  }
}

/**
 * Example function that deletes a story from Supabase
 */
export async function deleteStory(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
}