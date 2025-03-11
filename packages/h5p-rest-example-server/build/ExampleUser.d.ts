import { IUser } from '@lumieducation/h5p-server';
/**
 * Example user object
 */
export default class ExampleUser implements IUser {
    id: string;
    name: string;
    email: string;
    role: 'anonymous' | 'teacher' | 'student' | 'admin';
    constructor(id: string, name: string, email: string, role: 'anonymous' | 'teacher' | 'student' | 'admin');
    type: 'local';
}
/**
 * Creates an ExampleUser from API key user information
 * @param apiKeyUser User information from the API key
 * @returns An ExampleUser instance
 */
export declare function createUserFromApiKey(apiKeyUser: {
    userId: string;
    name: string;
    permissions?: string[];
}): ExampleUser;
