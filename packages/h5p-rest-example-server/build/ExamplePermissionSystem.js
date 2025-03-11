"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
class ExamplePermissionSystem {
    async checkForUserData(actingUser, permission, contentId, affectedUserId) {
        if (!actingUser) {
            return false;
        }
        if (actingUser.role === 'admin') {
            return true;
        }
        else if (actingUser.role === 'teacher') {
            switch (permission) {
                case h5p_server_1.UserDataPermission.DeleteFinished:
                case h5p_server_1.UserDataPermission.DeleteState:
                case h5p_server_1.UserDataPermission.EditFinished:
                case h5p_server_1.UserDataPermission.EditState:
                case h5p_server_1.UserDataPermission.ListStates:
                case h5p_server_1.UserDataPermission.ViewFinished:
                case h5p_server_1.UserDataPermission.ViewState:
                    return true;
                default:
                    return false;
            }
        }
        else if (actingUser.role === 'student') {
            switch (permission) {
                case h5p_server_1.UserDataPermission.EditFinished:
                case h5p_server_1.UserDataPermission.EditState:
                case h5p_server_1.UserDataPermission.ListStates:
                case h5p_server_1.UserDataPermission.ViewState:
                case h5p_server_1.UserDataPermission.ViewFinished:
                    if (affectedUserId === actingUser.id) {
                        return true;
                    }
                    return false;
                default:
                    return false;
            }
        }
        else {
            return false;
        }
    }
    async checkForContent(actingUser, permission, contentId) {
        if (!actingUser) {
            return false;
        }
        if (actingUser.role === 'admin') {
            return true;
        }
        else if (actingUser.role === 'teacher') {
            switch (permission) {
                case h5p_server_1.ContentPermission.Create:
                case h5p_server_1.ContentPermission.Delete:
                case h5p_server_1.ContentPermission.Download:
                case h5p_server_1.ContentPermission.Edit:
                case h5p_server_1.ContentPermission.Embed:
                case h5p_server_1.ContentPermission.List:
                case h5p_server_1.ContentPermission.View:
                    return true;
                default:
                    return false;
            }
        }
        else if (actingUser.role === 'student') {
            switch (permission) {
                case h5p_server_1.ContentPermission.List:
                case h5p_server_1.ContentPermission.View:
                    return true;
                default:
                    return false;
            }
        }
        else {
            return false;
        }
    }
    async checkForTemporaryFile(user, permission, filename) {
        if (!user || !user.role || user.role === 'anonymous') {
            return false;
        }
        return true;
    }
    async checkForGeneralAction(actingUser, permission) {
        if (!actingUser) {
            return false;
        }
        if (actingUser.role === 'admin') {
            switch (permission) {
                case h5p_server_1.GeneralPermission.InstallRecommended:
                case h5p_server_1.GeneralPermission.UpdateAndInstallLibraries:
                case h5p_server_1.GeneralPermission.CreateRestricted:
                    return true;
                default:
                    return false;
            }
        }
        else if (actingUser.role === 'teacher') {
            switch (permission) {
                case h5p_server_1.GeneralPermission.InstallRecommended:
                    return false;
                case h5p_server_1.GeneralPermission.UpdateAndInstallLibraries:
                    return false;
                case h5p_server_1.GeneralPermission.CreateRestricted:
                    return false;
                default:
                    return false;
            }
        }
        else if (actingUser.role === 'student') {
            switch (permission) {
                case h5p_server_1.GeneralPermission.InstallRecommended:
                    return false;
                case h5p_server_1.GeneralPermission.UpdateAndInstallLibraries:
                    return false;
                case h5p_server_1.GeneralPermission.CreateRestricted:
                    return false;
                default:
                    return false;
            }
        }
        else {
            // anonymous or completely unauthenticated
            return false;
        }
    }
}
exports.default = ExamplePermissionSystem;
//# sourceMappingURL=ExamplePermissionSystem.js.map