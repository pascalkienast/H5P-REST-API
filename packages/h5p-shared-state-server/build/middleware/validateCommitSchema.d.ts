import ShareDB from 'sharedb';
import ValidatorRepository from '../ValidatorRepository';
declare const _default: (validatorRepository: ValidatorRepository) => (context: ShareDB.middleware.CommitContext, next: (err?: any) => void) => Promise<void>;
export default _default;
