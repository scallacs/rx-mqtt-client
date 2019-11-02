export class TopicExplorer {

    /**
     * Create a topic explorer from a topic string and optionnaly a pattern
     * 
     * @param topic the mqtt topic
     * @param pattern the mqtt topic pattern (with wildcards '+' or '#')
     */
    public static fromString(topic: string, pattern?: string) {
        return new TopicExplorer(topic.split('/'), pattern || topic);
    }

    constructor(private _levels: string[], public pattern: string) {

    }

    /*
     * Return all mqtt topic sections (separated by a /) as an array of string 
     */
    get levels(): string[] {
        return this._levels;
    }

    /**
     * Return mqtt topic section by index (starting from 0)
     * For example: 
     * 
     * ```typescript
     * TopicHelper.fromString('/a/b/c').level(1) === 'b'
     * ```
     * @param index 
     */
    level(index: number): string | undefined {
        if (index > this._levels.length) {
            return undefined;
        }
        return this._levels[index];
    }

    /**
     * Returns corresponding wildcard '+' value by index (starting from 0)
     * 
     * ```typescript
     * topicHelper.wildcard(0, '/a/b/c', '/a/+/c') === 'b';
     * topicHelper.wildcard(0, '/a/b/c', '/a/b/+') === 'c';
     * ```
     * 
     */
    wildcard(index: number, template: string = this.pattern) {
        let templateLevels = template.split('/');
        let parameterIndex = -1;
        for (let i = 0; i < templateLevels.length && i < templateLevels.length; i++) {
            if (templateLevels[i] === '+') {
                parameterIndex++;
            }
            if (parameterIndex === index) {
                return this._levels[i];
            }
        }
        throw new Error(`Wildcard with index ${index} does not exist in pattern "${template}"`);
    }

    /**
     * returns topic
     */
    toString(): string {
        return this.levels.join('/');
    }

}

/**
 * 
 * @param topic mqtt topic string
 * @param pattern topic pattern. Single level '+' and multiple level '#' wildcards are supported
 *      Wildcards can only be used to denote a level or multi-levels i.e /house/# and not as part of the name to denote multiple characters e.g. hou# is not valid
 *      '#' can only be used as the last character in the topic string, and must be the only character in that level.
 * @returns true if topic match pattern
 */
export function topicMatch(topic: string, pattern: string) {
    const filterArray = pattern.split('/')
    const filterLength = filterArray.length
    const topicArray = topic.split('/')

    for (let i = 0; i < filterLength; ++i) {
        var left = filterArray[i]
        var right = topicArray[i]
        if (left === '#') {
            return topicArray.length >= filterLength - 1;
        }
        if (left !== '+' && left !== right) return false
    }

    return filterLength === topicArray.length
}