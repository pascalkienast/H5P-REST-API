import { IUser } from '@lumieducation/h5p-server';

/**
 * Example user object
 */
export default class ExampleUser implements IUser {
    constructor(
        public id: string,
        public name: string,
        public email: string,
        // role is a custom property that is not required by the core; We can
        // use it in ExamplePermissionSystem to evaluate individual permission
        public role: 'anonymous' | 'teacher' | 'student' | 'admin'
    ) {
        this.type = 'local';
    }

    public type: 'local';
}

/**
 * Creates an ExampleUser from API key user information
 * @param apiKeyUser User information from the API key
 * @returns An ExampleUser instance
 */
export function createUserFromApiKey(apiKeyUser: { 
    userId: string; 
    name: string; 
    permissions?: string[];
}): ExampleUser {
    // Determine the user role based on permissions
    let role: 'anonymous' | 'teacher' | 'student' | 'admin' = 'anonymous';
    
    if (apiKeyUser.permissions) {
        if (apiKeyUser.permissions.includes('admin')) {
            role = 'admin';
        } else if (apiKeyUser.permissions.includes('write')) {
            role = 'teacher';
        } else if (apiKeyUser.permissions.includes('read')) {
            role = 'student';
        }
    }
    
    // Create a simple email based on the user ID
    const email = `${apiKeyUser.userId}@api.example.com`;
    
    return new ExampleUser(
        apiKeyUser.userId,
        apiKeyUser.name,
        email,
        role
    );
}
