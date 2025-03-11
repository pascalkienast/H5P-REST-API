import { IPermissionSystem, GeneralPermission, TemporaryFilePermission, ContentPermission, UserDataPermission } from '@lumieducation/h5p-server';
import ExampleUser from './ExampleUser';
export default class ExamplePermissionSystem implements IPermissionSystem<ExampleUser> {
    checkForUserData(actingUser: ExampleUser, permission: UserDataPermission, contentId: string, affectedUserId?: string): Promise<boolean>;
    checkForContent(actingUser: ExampleUser | undefined, permission: ContentPermission, contentId?: string): Promise<boolean>;
    checkForTemporaryFile(user: ExampleUser | undefined, permission: TemporaryFilePermission, filename?: string): Promise<boolean>;
    checkForGeneralAction(actingUser: ExampleUser | undefined, permission: GeneralPermission): Promise<boolean>;
}
