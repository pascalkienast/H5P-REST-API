"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserFromApiKey = createUserFromApiKey;
/**
 * Example user object
 */
class ExampleUser {
    id;
    name;
    email;
    role;
    constructor(id, name, email, 
    // role is a custom property that is not required by the core; We can
    // use it in ExamplePermissionSystem to evaluate individual permission
    role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.type = 'local';
    }
    type;
}
exports.default = ExampleUser;
/**
 * Creates an ExampleUser from API key user information
 * @param apiKeyUser User information from the API key
 * @returns An ExampleUser instance
 */
function createUserFromApiKey(apiKeyUser) {
    // Determine the user role based on permissions
    let role = 'anonymous';
    if (apiKeyUser.permissions) {
        if (apiKeyUser.permissions.includes('admin')) {
            role = 'admin';
        }
        else if (apiKeyUser.permissions.includes('write')) {
            role = 'teacher';
        }
        else if (apiKeyUser.permissions.includes('read')) {
            role = 'student';
        }
    }
    // Create a simple email based on the user ID
    const email = `${apiKeyUser.userId}@api.example.com`;
    return new ExampleUser(apiKeyUser.userId, apiKeyUser.name, email, role);
}
//# sourceMappingURL=ExampleUser.js.map