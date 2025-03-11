import { ILogicalOperator, ILogicCheck } from './types';
/**
 * Check if all the checks apply to the object.
 */
export declare function checkLogic(obj: any, checks: (ILogicCheck | ILogicalOperator)[]): boolean;
