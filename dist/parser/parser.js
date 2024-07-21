"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePage = void 0;
const parsePage = (page_1, _a) => __awaiter(void 0, [page_1, _a], void 0, function* (page, { text, from, to, lite, }) {
    // click clear button
    yield page.$eval("button[aria-label='Clear source text']", (btn) => btn.click());
    // switch source and target language
    yield page.evaluate((fromSelector, toSelector) => {
        const fromLangs = Array.from(document.querySelectorAll(fromSelector));
        const toLangs = Array.from(document.querySelectorAll(toSelector));
        const isInRecentScope = (el) => {
            var _a, _b;
            return ((_b = (_a = el.parentElement) === null || _a === void 0 ? void 0 : _a.firstChild) === null || _b === void 0 ? void 0 : _b.innerText) ===
                "Recent languages";
        };
        // (all)?   (all)?   ?   ?
        // from
        // (all)?   (all)?   ?   ?
        //          to
        let from = fromLangs[0];
        let to = toLangs[0];
        // check from
        if (isInRecentScope(from)) {
            // recent all
            //        from
            from = fromLangs[1];
        }
        // check to
        if (isInRecentScope(to)) {
            // recent all  ?   ?
            //             to
            to = toLangs[2];
            if (isInRecentScope(to)) {
                // recent all recent all
                //                   to
                to = toLangs[3];
            }
        }
        else {
            // all ?   ?   ?
            //     to
            to = toLangs[1];
            if (isInRecentScope(to)) {
                // all recent all \
                //            to
                to = toLangs[2];
            }
        }
        if (from.getAttribute("aria-selected") !== "true") {
            from.click();
        }
        if (to.getAttribute("aria-selected") !== "true") {
            to.click();
        }
    }, from === "auto"
        ? `button[data-language-code='auto']`
        : `div[data-language-code='${from}']`, `div[data-language-code='${to}']`);
    // type text
    const textareaSelector = "textarea[aria-label='Source text']";
    yield page.$eval(textareaSelector, (textarea, text) => (textarea.value = text), text);
    yield page.type(textareaSelector, " ");
    // translating...
    let result = "";
    let pronunciation = "";
    do {
        // const targetSelector = `span[data-language-for-alternatives=${to}]`;
        const targetSelector = `span[lang=${to}]`;
        const targetTextSelector = `span[lang=${to}] > span > span`;
        yield page.waitForSelector(targetSelector);
        // get translated text
        result += yield page.evaluate((targetSelector, targetTextSelector) => Array.from(document
            .querySelector(targetSelector)
            .querySelectorAll(targetTextSelector))
            .map((s) => s.innerText.replace(/[\u200B-\u200D\uFEFF]/g, ""))
            .join(""), // remove zero-width space
        targetSelector, targetTextSelector);
        // get pronunciation
        pronunciation +=
            (yield page.evaluate(() => {
                var _a, _b;
                return (_b = (_a = document
                    .querySelector('div[data-location="2"] > div')) === null || _a === void 0 ? void 0 : _a.innerText) === null || _b === void 0 ? void 0 : _b.replace(/[\u200B-\u200D\uFEFF]/g, "");
            })) || "";
        // get next page
        const shouldContinue = yield page.evaluate(() => {
            const next = document.querySelector('button[aria-label="Next"]');
            const pseudoNext = getComputedStyle(document.querySelector('button[aria-label="Next"] > div'), "::before");
            const hasNext = next && pseudoNext.width.endsWith("px") && pseudoNext.width !== "0px";
            const isLastPage = next === null || next === void 0 ? void 0 : next.hasAttribute("disabled");
            const shouldContinue = Boolean(hasNext && !isLastPage);
            return shouldContinue;
        });
        if (shouldContinue) {
            // await network idle first
            const xhr = page.waitForResponse((r) => {
                return r
                    .url()
                    .startsWith("https://translate.google.com/_/TranslateWebserverUi/data/batchexecute");
            });
            yield page.evaluate(() => {
                const next = document.querySelector('button[aria-label="Next"]');
                next.click();
            });
            yield xhr;
        }
        else {
            break;
        }
    } while (true);
    // get from
    // const fromISO = await page.evaluate(() =>
    // 	document
    // 		.querySelector<HTMLElement>("div[data-original-language]")!
    // 		.getAttribute("data-original-language")
    // );
    // get did you mean
    const fromDidYouMean = yield page.evaluate(() => {
        const didYouMeanBlock = document.querySelector("html-blob");
        const hasDidYouMean = ["Did you mean:", "Showing translation for"].some((t) => { var _a, _b; return (_b = (_a = didYouMeanBlock === null || didYouMeanBlock === void 0 ? void 0 : didYouMeanBlock.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.innerHTML.includes(t); });
        return hasDidYouMean ? didYouMeanBlock === null || didYouMeanBlock === void 0 ? void 0 : didYouMeanBlock.innerText : undefined;
    });
    // get suggestions
    const fromSuggestions = lite || from === "auto" // auto lang doesn't have suggestions
        ? undefined
        : yield page.evaluate(() => {
            const sgsBlocks = Array.from(document.querySelectorAll('ul[role="listbox"] > li'));
            return sgsBlocks.length === 0
                ? undefined
                : sgsBlocks.map((b) => {
                    return {
                        text: b.children[0].textContent.replace(/[\u200B-\u200D\uFEFF]/g, ""),
                        translation: b.children[1].textContent.replace(/[\u200B-\u200D\uFEFF]/g, ""),
                    };
                });
        });
    // get from pronunciation
    const fromPronunciation = (yield page.evaluate(() => {
        var _a, _b;
        return (_b = (_a = document
            .querySelector('div[data-location="1"] > div')) === null || _a === void 0 ? void 0 : _a.innerText) === null || _b === void 0 ? void 0 : _b.replace(/[\u200B-\u200D\uFEFF]/g, "");
    })) || undefined;
    const noDetails = yield page.evaluate(() => {
        var _a, _b;
        return (_b = (_a = document
            .querySelector("c-wiz[role='complementary'] > div > div")) === null || _a === void 0 ? void 0 : _a.innerText) === null || _b === void 0 ? void 0 : _b.startsWith("No details found for");
    });
    // get examples
    try {
        yield page.waitForSelector("html-blob", { timeout: 100 });
    }
    catch (_b) { }
    // get definitions
    const definitions = lite || noDetails
        ? undefined
        : yield page.evaluate(() => {
            var _a, _b;
            const ret = {};
            if (!((_a = document
                .querySelector("c-wiz[role='complementary'] > div > c-wiz > div > div:nth-child(3) > div > div > div")) === null || _a === void 0 ? void 0 : _a.innerText.includes("Definitions of"))) {
                return ret;
            }
            const definitionalBlocks = Array.from(document.querySelectorAll("c-wiz[role='complementary'] > div > c-wiz > div > div:nth-child(3) > div > div > div > div"));
            let blockClassName = undefined;
            for (let i = 0, currentPos = "unknown", currentLabels; i < definitionalBlocks.length; ++i) {
                const isHiddenBlock = definitionalBlocks[i].getAttribute("role") === "presentation";
                const block = isHiddenBlock
                    ? definitionalBlocks[i].children[0]
                    : definitionalBlocks[i];
                const isButtonBlock = block.children[0].tagName === "BUTTON"; // Show all button
                if (isButtonBlock) {
                    continue;
                }
                const isPosBlock = block.children[0].childElementCount === 0; // a text block
                if (isPosBlock) {
                    currentPos = block.children[0].textContent.toLowerCase();
                    if (currentPos.includes("expand")) {
                        continue;
                    }
                    ret[currentPos] = [];
                    currentLabels = undefined; // reset labels
                }
                else {
                    // parse definition block
                    let def = { definition: "" };
                    if (!blockClassName) {
                        blockClassName = block.className;
                    }
                    else if (block.className !== blockClassName) {
                        continue;
                    }
                    const leftBlock = block.children[0]; // its children should be number or nothing
                    const rightBlock = block.children[1]; // its children should be the definition div or label div
                    const isRightBlockLabel = leftBlock.childElementCount === 0;
                    if (isRightBlockLabel) {
                        currentLabels = [rightBlock.textContent.toLowerCase()]; // this label should be the following blocks' labels
                        continue;
                    }
                    else {
                        // definition block
                        // check the previous labels first
                        if (currentLabels) {
                            def.labels = currentLabels;
                        }
                        const blocks = Array.from(rightBlock.children);
                        // the leading block could be (local) labels
                        const hasLabels = blocks[0].childElementCount >= 1;
                        if (hasLabels) {
                            def.labels = Array.from(blocks[0].children).map((b) => b.textContent);
                            blocks.shift();
                        }
                        // there must be a definition
                        def.definition = blocks[0].textContent;
                        blocks.shift();
                        // there may be some blocks after the definition
                        // there may be an example
                        try {
                            const hasExample = blocks.length > 0 && ((_b = blocks[0].children[0]) === null || _b === void 0 ? void 0 : _b.tagName) === "Q";
                            if (hasExample) {
                                def.example = blocks[0].children[0].textContent;
                                blocks.shift();
                            }
                        }
                        catch (e) {
                            throw new Error(`Failed parsing definition's example: ${e.message}. ` +
                                JSON.stringify(def));
                        }
                        // there may be synonyms
                        const hasSynonyms = blocks.length > 0 && blocks[0].textContent === "Synonyms:";
                        if (hasSynonyms) {
                            blocks.shift();
                            def.synonyms = {};
                            while (blocks.length > 0) {
                                const words = Array.from(blocks[0].children);
                                const hasType = words[0].textContent.includes(":");
                                const type = hasType
                                    ? words[0].textContent.split(":")[0]
                                    : "common";
                                if (hasType) {
                                    words.shift();
                                }
                                def.synonyms[type] = words.map((w) => w.textContent.trim());
                                blocks.shift();
                            }
                        }
                        ret[currentPos].push(def);
                        // definition block end
                    }
                }
            }
            return ret;
        });
    const examples = lite || noDetails
        ? undefined
        : yield page.evaluate((from) => {
            const egBlocks = Array.from(document.querySelectorAll(`c-wiz[role='complementary'] > div > c-wiz > div > div > div > div:nth-child(2) > div > div div[lang=${from}]`));
            return egBlocks.map((el) => el.textContent);
        }, from);
    const translations = lite || noDetails
        ? undefined
        : yield page.evaluate(() => {
            const ret = {};
            Array.from(document.querySelectorAll("table > tbody")).forEach((tbody) => {
                const [tr0, ...trs] = Array.from(tbody.children);
                const [th0, ...tds] = Array.from(tr0.children);
                const PoS = th0.textContent.toLowerCase();
                if (PoS === "")
                    return;
                trs.push({ children: tds });
                ret[PoS] = trs.map(({ children }) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                    const [trans, reverseTranses, freq] = Array.from(children);
                    return {
                        translation: (_a = trans.textContent) === null || _a === void 0 ? void 0 : _a.trim(),
                        reversedTranslations: Array.from(reverseTranses.children[0].children)
                            .map((c) => c.textContent.replace(", ", "").split(", "))
                            .flat(),
                        frequency: (_g = (_f = (_e = (_d = (_c = (_b = freq.firstElementChild) === null || _b === void 0 ? void 0 : _b.firstElementChild) === null || _c === void 0 ? void 0 : _c.firstElementChild) === null || _d === void 0 ? void 0 : _d.firstElementChild) === null || _e === void 0 ? void 0 : _e.getAttribute("aria-label")) === null || _f === void 0 ? void 0 : _f.toLowerCase()) !== null && _g !== void 0 ? _g : (_o = (_m = (_l = (_k = (_j = (_h = freq.firstElementChild) === null || _h === void 0 ? void 0 : _h.firstElementChild) === null || _j === void 0 ? void 0 : _j.firstElementChild) === null || _k === void 0 ? void 0 : _k.firstElementChild) === null || _l === void 0 ? void 0 : _l.firstElementChild) === null || _m === void 0 ? void 0 : _m.getAttribute("aria-label")) === null || _o === void 0 ? void 0 : _o.toLowerCase(),
                    };
                });
            });
            return ret;
        });
    return {
        result,
        // fromISO,
        fromDidYouMean,
        fromSuggestions,
        fromPronunciation,
        pronunciation: pronunciation || undefined,
        examples,
        definitions,
        translations,
    };
});
exports.parsePage = parsePage;
//# sourceMappingURL=parser.js.map