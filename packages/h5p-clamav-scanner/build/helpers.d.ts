/**
 * Remove undefined attributes from an object and empty objects.
 * Example:
 * ```json
 * {
 *   a: undefined,
 *   b: 'some string',
 *   c: {
 *     d: undefined
 *   }
 * }
 * ```
 *
 * will be transformed to:
 *
 * ```json
 * {
 *   b: 'some string'
 * }
 * ```
 * @param obj object, mutated
 * @returns
 */
export declare function removeUndefinedAttributesAndEmptyObjects<T>(obj: T): T;
