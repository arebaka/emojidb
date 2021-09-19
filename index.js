const EmojiDb = require("emoji-db");

const db = new EmojiDb({ useDefaultDb: true });

let bySlug      = {};
let byChar      = {};
let byCode      = {};
let byTitle     = {};
let byShortcode = {};

let byAliases = {};
let byTags    = {};

class Emok
{
    constructor(list, components)
    {
        this.ZWJ        = '\u200d';
        this.list       = list;
        this.components = components;
        this.regexp     = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g;

        this.bySlug      = l => bySlug["" + l] || null;
        this.byChar      = l => byChar["" + l] || null;
        this.byCode      = l => byCode["" + l] || null;
        this.byShortcode = l => byShortcode["" + l] || null;
        this.byTitle     = t => byTitle[("" + t).toLowerCase()] || null;

        this.search = text => db.searchFromText({ input: text });

        this.ordered = [];

        const dbKeys = Object.keys(db.dbData);
        let   code;
        let   lower;

        for (let i in this.list) {
            for (let j in this.list[i]) {
                for (let emoji of this.list[i][j]) {
                    this.ordered.push(emoji.char);

                    code = dbKeys.find(k => db.dbData[k].emoji && db.dbData[k].emoji == emoji.char)

                    if (code) {
                        emoji.code       = db.dbData[code].code;
                        emoji.title      = db.dbData[code].title;
                        emoji.shortcodes = db.dbData[code].shortcodes.github || [];

                        for (let key of ["aliases", "tags", "codepoints"]) {
                            emoji[key] = db.dbData[code][key] || [];
                        }

                        bySlug[emoji.slug] = emoji;
                        byChar[emoji.char] = emoji;
                        byCode[emoji.code] = emoji;

                        byTitle[emoji.title.toLowerCase()] = emoji;

                        for (let sc of emoji.shortcodes) {
                            byShortcode[sc] = emoji;
                        }

                        for (let prop of [
                            ["aliases",    byAliases],
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

    get(litelal)
    {
        if (!litelal || typeof litelal != "string")
            return null;

        return bySlug[litelal]
            || byChar[litelal]
            || byShortcode[litelal]
            || byTitle[litelal.toLowerCase()]
            || null;
    }

    flagOf(code)
    {
        if (typeof code != "string" || !/^[a-zA-Z]{2}$/.test(code))
            return null;

        code = code.toLowerCase();

        return this.components.regional_indicators[
                "regional_indicator_symbol_letter_" + code[0]
            ] + this.components.regional_indicators[
                "regional_indicator_symbol_letter_" + code[1]
            ];
    }

    getByAliases(aliases)
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

    getByTags(tags)
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

    random()
    {
        return byChar[this.ordered[
            this.ordered.length * Math.random() << 0
        ]];
    }

    emojify(text)
    {
        if (!text || typeof text != "string")
            return text;

        let shortcodes = text.match(/\:[a-zA-Z_]+\:/g);
        if (!shortcodes)
            return text;

        for (let shortcode of shortcodes) {
            if (byShortcode[shortcode]) {
                text = text.replace(shortcode, byShortcode[shortcode].char);
            }
        }

        return text;
    }
}

module.exports = new Emok(
    require("./list.json"), require("./components.json")
);
