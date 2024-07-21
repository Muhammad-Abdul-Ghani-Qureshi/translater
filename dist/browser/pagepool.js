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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagePool = void 0;
const puppeteer_1 = require("puppeteer");
const puppeteer_2 = __importDefault(require("./puppeteer"));
const { PUPPETEER_WS_ENDPOINT } = process.env;
class PagePool {
    constructor(pageCount = 5) {
        this.pageCount = pageCount;
        this._pages = [];
        this._pagesInUse = [];
        exports.pagePool = this;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._initBrowser();
            yield this._initPages();
            // refresh pages every 1 hour to keep alive
            this._resetInterval(60 * 60 * 1000);
        });
    }
    getPage() {
        const page = this._pages.pop();
        if (!page) {
            return undefined;
        }
        this._pagesInUse.push(page);
        return page;
    }
    releasePage(page) {
        const index = this._pagesInUse.indexOf(page);
        if (index === -1) {
            return;
        }
        this._pagesInUse.splice(index, 1);
        this._pages.push(page);
    }
    _initBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._browser = PUPPETEER_WS_ENDPOINT
                    ? yield puppeteer_2.default.connect({ browserWSEndpoint: PUPPETEER_WS_ENDPOINT })
                    : yield puppeteer_2.default.launch({
                        ignoreHTTPSErrors: true,
                        headless: process.env.DEBUG !== "true" ? true : false,
                        executablePath: (0, puppeteer_1.executablePath)(),
                        userDataDir: "/tmp/translateer-data",
                        args: ["--no-sandbox"],
                    });
                console.log("browser launched");
            }
            catch (error) {
                console.error("Failed to initialize browser", error);
                throw error;
            }
        });
    }
    _initPages() {
        return __awaiter(this, void 0, void 0, function* () {
            let created = 0;
            try {
                this._pages = yield Promise.all([...Array(this.pageCount)].map((_, i) => this._browser.newPage().then((page) => __awaiter(this, void 0, void 0, function* () {
                    yield page.setRequestInterception(true);
                    page.on("request", (req) => {
                        if (req.resourceType() === "image" ||
                            req.resourceType() === "stylesheet" ||
                            req.resourceType() === "font") {
                            req.abort();
                        }
                        else {
                            req.continue();
                        }
                    });
                    console.log(`page ${i} created`);
                    yield page.goto("https://translate.google.com/details", {
                        waitUntil: "networkidle2",
                    });
                    console.log(`page ${i} loaded`);
                    // privacy consent
                    try {
                        const btnSelector = 'button[aria-label="Reject all"]';
                        yield page.waitForSelector(btnSelector, { timeout: 1000 });
                        yield page.$eval(btnSelector, (btn) => {
                            btn.click();
                        });
                        console.log(`page ${i} privacy consent rejected`);
                    }
                    catch (_a) {
                        console.log(`page ${i} privacy consent not found`);
                    }
                    created++;
                    console.log(`page ${i} ready (${created}/${this.pageCount})`);
                    return page;
                }))));
            }
            catch (error) {
                console.error("Failed to initialize pages", error);
                throw error;
            }
        });
    }
    _resetInterval(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    this._pagesInUse = [];
                    this._pages = [];
                    yield Promise.all(this._pagesInUse.map(page => this.releasePage(page)));
                    yield this._browser.close();
                    yield this._initBrowser();
                    yield this._initPages();
                }
                catch (error) {
                    console.error("Failed to reset page pool", error);
                }
            }), ms);
        });
    }
}
exports.default = PagePool;
//# sourceMappingURL=pagepool.js.map