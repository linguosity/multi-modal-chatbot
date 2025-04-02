/**
 * MCP Text Editor Client
 * 
 * This module provides a client interface for the MCP Text Editor Server,
 * which allows for precise editing of text files via tool commands.
 */

interface McpToolCommand {
  name: string;
  args: Record<string, any>;
}

interface McpResponse {
  status: 'success' | 'error';
  result?: any;
  error?: {
    message: string;
    code?: string;
  };
}

// In-memory storage fallback for server-side execution
const inMemoryStorage: Record<string, string> = {};

// Check if localStorage is available (client-side only)
const isLocalStorageAvailable = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return typeof localStorage !== 'undefined';
  } catch (e) {
    return false;
  }
};

// Storage interface to abstract localStorage vs in-memory storage
const storage = {
  getItem: (key: string): string | null => {
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
    return inMemoryStorage[key] || null;
  },
  
  setItem: (key: string, value: string): void => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    } else {
      inMemoryStorage[key] = value;
    }
  },
  
  removeItem: (key: string): void => {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    } else {
      delete inMemoryStorage[key];
    }
  },
  
  getAllKeys: (): string[] => {
    if (isLocalStorageAvailable()) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } else {
      return Object.keys(inMemoryStorage);
    }
  }
};

/**
 * Execute an MCP command via the server
 */
export const executeMcpCommand = async (command: McpToolCommand): Promise<McpResponse> => {
  try {
    // In a real implementation, we would use a proper MCP client
    // For demonstration purposes, we'll simulate the MCP server behavior
    
    console.log(`[MCP Client] Executing command: ${command.name}`, command.args);
    
    // Simulate a delay to mimic server processing
    await new Promise(resolve => setTimeout(resolve, 200));
    
    switch (command.name) {
      case 'view': {
        // Simulate viewing a file
        const { path } = command.args;
        console.log(`[MCP Client] Viewing file: ${path}`);
        
        // Since we're dealing with in-memory "files" (report sections),
        // we'd retrieve the content from our storage
        const content = storage.getItem(`report:${path}`) || '';
        
        return {
          status: 'success',
          result: { content }
        };
      }
      
      case 'str_replace': {
        // Get command arguments
        const { path, old_str, new_str } = command.args;
        console.log(`[MCP Client] Replacing text in file: ${path}`);
        
        // Get current content
        const content = storage.getItem(`report:${path}`) || '';
        
        // Perform the replacement
        const updatedContent = content.replace(old_str, new_str);
        
        // Store the updated content
        storage.setItem(`report:${path}`, updatedContent);
        
        return {
          status: 'success',
          result: { content: updatedContent }
        };
      }
      
      case 'create': {
        // Get command arguments
        const { path, text } = command.args;
        console.log(`[MCP Client] Creating file: ${path}`);
        
        // Store the content
        storage.setItem(`report:${path}`, text);
        
        return {
          status: 'success',
          result: { path }
        };
      }
      
      case 'insert': {
        // Get command arguments
        const { path, position, text } = command.args;
        console.log(`[MCP Client] Inserting text in file: ${path}`);
        
        // Get current content
        const content = storage.getItem(`report:${path}`) || '';
        
        // Position could be 'start', 'end', or a numeric index
        let updatedContent = content;
        if (position === 'start') {
          updatedContent = text + content;
        } else if (position === 'end') {
          updatedContent = content + text;
        } else {
          const index = parseInt(position, 10);
          updatedContent = content.slice(0, index) + text + content.slice(index);
        }
        
        // Store the updated content
        storage.setItem(`report:${path}`, updatedContent);
        
        return {
          status: 'success',
          result: { content: updatedContent }
        };
      }
      
      case 'undo_edit': {
        // In a real implementation, we'd maintain an edit history
        // For simplicity, we'll just acknowledge the command
        console.log(`[MCP Client] Undo edit requested`);
        
        return {
          status: 'success',
          result: { message: 'Undo operation simulated' }
        };
      }
      
      default:
        return {
          status: 'error',
          error: {
            message: `Unknown command: ${command.name}`,
            code: 'UNKNOWN_COMMAND'
          }
        };
    }
  } catch (error) {
    console.error('[MCP Client] Error:', error);
    return {
      status: 'error',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXECUTION_ERROR'
      }
    };
  }
};

/**
 * Reset the MCP client's state (for testing)
 */
export const resetMcpState = (): void => {
  // Clear all report section data from storage
  const keysToRemove: string[] = [];
  
  // Get all keys that start with 'report:'
  const allKeys = storage.getAllKeys();
  allKeys.forEach(key => {
    if (key.startsWith('report:')) {
      keysToRemove.push(key);
    }
  });
  
  // Remove each key
  keysToRemove.forEach(key => storage.removeItem(key));
  
  console.log(`[MCP Client] State reset, removed ${keysToRemove.length} items`);
};