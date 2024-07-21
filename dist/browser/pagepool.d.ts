import { Page } from "puppeteer";
export declare let pagePool: PagePool;
export default class PagePool {
    private pageCount;
    private _pages;
    private _pagesInUse;
    private _browser;
    constructor(pageCount?: number);
    init(): Promise<void>;
    getPage(): Page | undefined;
    releasePage(page: Page): void;
    private _initBrowser;
    private _initPages;
    private _resetInterval;
}
