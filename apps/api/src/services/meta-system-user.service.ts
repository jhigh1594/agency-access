
import { env } from '../lib/env.js';

interface CreateSystemUserResponse {
  id: string; // App-scoped System User ID
}

interface SystemUser {
  id: string;
  name: string;
  role: string;
}

class MetaSystemUserService {
  private readonly META_GRAPH_VERSION = 'v21.0';
  private readonly META_GRAPH_URL = `https://graph.facebook.com/${this.META_GRAPH_VERSION}`;

  /**
   * Create a system user for an agency's Business Manager
   * 
   * @param businessId - Agency's Business Manager ID
   * @param accessToken - Admin user or admin system user access token
   * @param name - Name for the system user
   * @returns App-scoped System User ID
   */
  async createSystemUser(
    businessId: string,
    accessToken: string,
    name: string = 'Agency Platform System User'
  ): Promise<{ data: string | null; error: { code: string; message: string } | null }> {
    try {
      const url = `${this.META_GRAPH_URL}/${businessId}/system_users`;

      const formData = new URLSearchParams();
      formData.append('name', name);
      formData.append('role', 'EMPLOYEE'); // Use EMPLOYEE role (ADMIN requires special permissions)
      formData.append('access_token', accessToken);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData: any = await response.json();
        const errorMessage = errorData.error?.message || 'Failed to create system user';
        const errorCode = errorData.error?.code?.toString() || 'UNKNOWN_ERROR';
        
        return {
          data: null,
          error: {
            code: `SYSTEM_USER_CREATE_FAILED_${errorCode}`,
            message: errorMessage,
          },
        };
      }

      const data: CreateSystemUserResponse = await response.json() as CreateSystemUserResponse;
      return { data: data.id, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'SYSTEM_USER_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error creating system user',
        },
      };
    }
  }

  /**
   * Get existing system users for a Business Manager
   * 
   * @param businessId - Agency's Business Manager ID
   * @param accessToken - Admin user or admin system user access token
   * @returns List of system users with their app-scoped IDs
   */
  async getSystemUsers(
    businessId: string,
    accessToken: string
  ): Promise<{ data: SystemUser[] | null; error: { code: string; message: string } | null }> {
    try {
      const url = `${this.META_GRAPH_URL}/${businessId}/system_users?access_token=${accessToken}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData: any = await response.json();
        return {
          data: null,
          error: {
            code: 'SYSTEM_USER_LIST_FAILED',
            message: errorData.error?.message || 'Failed to list system users',
          },
        };
      }

      const data: any = await response.json();
      return { data: data.data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'SYSTEM_USER_LIST_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error listing system users',
        },
      };
    }
  }

  /**
   * Find or create a system user for the agency
   * 
   * @param businessId - Agency's Business Manager ID
   * @param accessToken - Admin user access token
   * @returns App-scoped System User ID
   */
  async getOrCreateSystemUser(
    businessId: string,
    accessToken: string
  ): Promise<{ data: string | null; error: { code: string; message: string } | null }> {
    const name = 'Agency Platform System User';
    
    // 1. Try to find existing system user
    const listResult = await this.getSystemUsers(businessId, accessToken);
    if (!listResult.error && listResult.data) {
      const existingUser = listResult.data.find(u => u.name === name);
      if (existingUser) {
        return { data: existingUser.id, error: null };
      }
    }

    // 2. If not found, create new one
    return this.createSystemUser(businessId, accessToken, name);
  }
}

export const metaSystemUserService = new MetaSystemUserService();

