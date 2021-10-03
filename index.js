const EmojiDb = require("emoji-db");

const db = new EmojiDb({ useDefaultDb: true });




let bySlug      = {};
let byCode      = {};
let byTitle     = {};
let byShortcode = {};

let byAliases = {};
let byTags    = {};




class Emok
{
    constructor(list, tree, components, locales, locale="eng")
    {
        this.ZWJ    = '\u200d';
        this.regexp = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g;

        this.list       = list;
        this.tree       = tree;
        this.components = components;
        this.ordered    = Object.keys(list);
        this.locales    = locales;
        this.locale     = locales[locale];

        const dbKeys = Object.keys(db.dbData);

        let emoji;
        let code;
        let lower;

        for (let char in this.list) {
            emoji = list[char];
            code  = dbKeys.find(k => db.dbData[k].emoji == char);

            emoji.char = char;

            if (code) {
                emoji.category    = db.dbData[code].category;
                emoji.subcategory = db.dbData[code].sub_category;
                emoji.code        = db.dbData[code].code;
                emoji.title       = db.dbData[code].title;
                emoji.aliases     = db.dbData[code].aliases           || [];
                emoji.tags        = db.dbData[code].tags              || [];
                emoji.codepoints  = db.dbData[code].codepoints        || [];
                emoji.shortcodes  = db.dbData[code].shortcodes.github || [];

                bySlug[emoji.slug] = emoji;
                byCode[emoji.code] = emoji;

                byTitle[emoji.title.toLowerCase()] = emoji;

                for (let sc of emoji.shortcodes) {
                    byShortcode[sc] = emoji;
                }

                for (let alias of emoji.aliases) {
                    lower = alias.toLowerCase();

                    if (!byAliases[lower]) {
                        byAliases[lower] = [];
                    }

                    byAliases[lower].push(emoji);
                }
                for (let tag of emoji.tags) {
                    lower = tag.toLowerCase();

                    if (!byTags[lower]) {
                        byTags[lower] = [];
                    }

                    byTags[lower].push(emoji);
                }
            }
        }
    }

    bySlug(str)
    {
        if (typeof str != "string")
            return null;
        return bySlug[str.toLowerCase()] || null;
    }

    byCode(str)
    {
        if (typeof str != "string")
            return null;
        return byCode[str.toLowerCase()] || null;
    }

    byTitle(str)
    {
        if (typeof str != "string")
            return null;
        return byTitle[str.toLowerCase()] || null;
    }

    byShortcode(str)
    {
        if (typeof str != "string")
            return null;
        return byShortcode[str.toLowerCase()] || null;
    }

    getByKeyword(str)
    {
        if (typeof str != "string")
            return [];
        return this.locale.keywords[str.toLowerCase()] || [];
    }

    search(text)
    {
        if (typeof text != "string")
            return text;
        return db.searchFromText({ input: text });
    }

    get(str)
    {
        if (typeof str != "string")
            return null;

        return this.list[str]
            || bySlug[str]
            || byShortcode[str]
            || byTitle[str.toLowerCase()]
            || null;
    }

    flagOf(code)
    {
        if (typeof code != "string" || !/^[A-Za-z]{2}$/.test(code))
            return null;

        code = code.toLowerCase();

        const map    = this.components["regional_indicators"];
        const prefix = "regional_indicator_symbol_letter_";

        return map[prefix + code[0]] + map[prefix + code[1]];
    }

    getByAliases(aliases)
    {
        if (!Array.isArray(aliases)) {
            aliases = [aliases];
        }

        let res = [];
        let list;

        for (let alias of aliases) {
            alias = "" + alias;
            list  = byAliases[alias.toLowerCase()];

            if (list) {
                res = res.concat(list.map(e => e.char));
            }
        }

        return res;
    }

    getByTags(tags)
    {
        if (!Array.isArray(tags)) {
            tags = [tags];
        }

        let res = [];
        let list;

        for (let tag of tags) {
            tag  = "" + tag;
            list = byTags[tag.toLowerCase()];

            if (list) {
                res = res.concat(list.map(e => e.char))
            };
        }

        return res;
    }

    random()
    {
        return this.list[this.ordered[
            this.ordered.length * Math.random() << 0
        ]];
    }

    emojify(text)
    {
        if (typeof text != "string")
            return text;

        let shortcodes = text.match(/\:[a-zA-Z_]+\:/g);
        if (!shortcodes)
            return text;

        for (let sc of shortcodes) {
            if (byShortcode[sc]) {
                text = text.replace(sc, byShortcode[sc].char);
            }
        }

        return text;
    }

    findByKeywordStart(str, minLength=3)
    {
        if (typeof str != "string" || typeof minLength != "number")
            return null;

        let res = this.getByKeyword(str);

        if (str.length >= minLength) {
            let keywords = Object.keys(this.locale.keywords)
                .filter(k => k.startsWith(str));

            for (let k of keywords) {
                res = res.concat(this.locale.keywords[k]);
            }

            res = [...new Set(res)];
        }

        return res;
    }

    setLocale(code)
    {
        if (typeof code != "string")
            return;
        this.locale = this.locales[code] || this.locale;
    }
}




const list       = require("./data/list");
const tree       = require("./data/tree");
const components = require("./data/components");
const locales    = require("./locales");

module.exports = new Emok(list, tree, components, locales);
