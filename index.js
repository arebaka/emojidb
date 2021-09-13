const EmojiDb = require("emoji-db");

const list       = require("./list.json");
const components = require("./components.json");

const db = new EmojiDb({ useDefaultDb: true });

let bySlug  = {};
let byChar  = {};
let byCode  = {};
let byTitle = {};

let byAliases    = {};
let byShortcodes = {};
let byTags       = {};

function init()
{
    const dbKeys = Object.keys(db.dbData);
    let   code;
    let   lower;

    for (let i in list) {
        for (let j in list[i]) {
            for (let emoji of list[i][j]) {
                code = dbKeys.find(k => db.dbData[k].emoji && db.dbData[k].emoji == emoji.char)

                if (code) {
                    emoji.code  = db.dbData[code].code;
                    emoji.title = db.dbData[code].title;

                    for (let key of ["aliases", "shortcodes", "tags", "codepoints"]) {
                        emoji[key] = db.dbData[code][key] || [];
                    }

                    bySlug[emoji.slug] = emoji;
                    byChar[emoji.char] = emoji;
                    byCode[emoji.code] = emoji;

                    byTitle[emoji.title.toLowerCase()] = emoji;

                    for (let i = 0; i < emoji.shortcodes.length; i++) {
                        emoji.shortcodes[i] = emoji.shortcodes[i].slice(1, -1);
                    }

                    for (let prop of [
                        ["aliases",    byAliases],
                        ["shortcodes", byShortcodes],
                        ["tags",       byTags]
                    ]) {
                        for (let value of emoji[prop[0]]) {
                            lower = value.toLowerCase();

                            if (!prop[1][lower]) {
                                prop[1][lower] = [];
                            }

                            prop[1][lower].push(emoji);
                        }
                    }
                }
            }
        }
    }
}

function get(litelal)
{
    if (!litelal || typeof litelal != "string")
        return null;

    return bySlug[litelal]
        || byChar[litelal]
        || byTitle[litelal.toLowerCase()]
        || null;
}

function flagOf(code)
{
    if (typeof code != "string" || !/^[a-zA-Z]{2}$/.test(code))
        return null;

    code = code.toLowerCase();

    return components.regional_indicators[
            "regional_indicator_symbol_letter_" + code[0]
        ] + components.regional_indicators[
            "regional_indicator_symbol_letter_" + code[1]
        ];
}

function getByAliases(aliases)
{
    if (typeof aliases != "object" || !Array.isArray(aliases)) {
        aliases = [aliases];
    }

    let res = [];
    let key;

    for (let alias of aliases) {
        key = ("" + alias).toLowerCase();

        if (byAliases[key]) {
            res = res.concat(byAliases[key]);
        }
    }

    return res;
}

function getByShortcodes(shortcodes)
{
    if (typeof shortcodes != "object" || !Array.isArray(shortcodes)) {
        shortcodes = [shortcodes];
    }

    let res = [];
    let key;

    for (let sc of shortcodes) {
        key = ("" + sc).toLowerCase();

        if (byShortcodes[sc]) {
            res = res.concat(byShortcodes[sc]);
        }
    }

    return res;
}

function getByTags(tags)
{
    if (typeof tags != "object" || !Array.isArray(tags)) {
        tags = [tags];
    }

    let res = [];
    let key;

    for (let tag of tags) {
        key = ("" + tag).toLowerCase();

        if (byTags[tag]) {
            res = res.concat(byTags[tag]);
        }
    }

    return res;
}

function random()
{
    const slugs = Object.keys(bySlug);

    return bySlug[slugs[slugs.length * Math.random() << 0]];
}

function emojify(text)
{
    if (!text || typeof text != "string")
        return text;

    let shortcodes = text.match(/\:[a-zA-Z_]+\:/g);
    let shortcode;

    if (!shortcodes)
        return text;

    for (let sc of shortcodes) {
        shortcode = sc.slice(1, -1).toLowerCase();

        if (byShortcodes[shortcode] && byShortcodes[shortcode].length) {
            text = text.replace(sc, byShortcodes[shortcode][0].char);
        }
    }

    return text;
}

init();

module.exports = {
    list:       list,
    components: components,

    get:     get,
    flagOf:  flagOf,
    random:  random,
    emojify: emojify,

    getByAliases:    getByAliases,
    getByShortcodes: getByShortcodes,
    getByTags:       getByTags,

    bySlug: l => bySlug["" + l] || null,
    byChar: l => byChar["" + l] || null,
    byCode: l => byCode["" + l] || null,

    search: text => db.searchFromText({ input: text }),

    byTitle: l => byTitle[("" + l).toLowerCase()] || null
};
