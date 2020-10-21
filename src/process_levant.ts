import { v4 as uuidv4 } from 'uuid';

const re1 = /(?<=").*?\[\[.*\]\].*?(?=")/g  // replace levant within quotes
const re2 = /(?<==[ \t]*)\[\[.*\]\].*?/g    // replace levant to the right of assignment
const re3 = /\[\[.*?\]\]/g                  // replace levant standalone

const placeholder = '__fww_hclformat_placeholder__'

export function preprocess(levantContent: string) {
    let mapping = {}

    let content = levantContent;
    let phstring = undefined;

    // re1
    const matches1 = content.match(re1);
    if (matches1 != null && matches1 != undefined) {
        for (let match of matches1) {
            phstring = placeholder + uuidv4();
            mapping[phstring] = match
            content = content.replace(match, phstring)
        }
    }

    // re2
    const matches2 = content.match(re2);
    if (matches2 != null && matches2 != undefined) {
        for (let match of matches2) {
            phstring = '"' + placeholder + uuidv4() + '"';
            mapping[phstring] = match
            content = content.replace(match, phstring)
        }
    }
    // re3
    const matches3 = content.match(re3);
    if (matches3 != null && matches3 != undefined) {
        for (let match of matches3) {
            phstring = '// ' + placeholder + uuidv4();
            mapping[phstring] = match
            content = content.replace(match, phstring)
        }
    }

    return { mapping, content }
}

export function postprocess(mapping: object, levantContent: string) {
    let content = levantContent;
    for (let [mapped, original] of Object.entries(mapping)) {
        content = content.replace(mapped, original);
    }
    return content;
}