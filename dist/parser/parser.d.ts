import type { Page } from "puppeteer";
type IExamples = string[];
type IDefinitions = Record<string, {
    definition: string;
    example?: string;
    labels?: string[];
    synonyms?: Record<string, string[]>;
}[]>;
type ITranslations = Record<string, {
    translation: string;
    reversedTranslations: string[];
    frequency: string;
}[]>;
export declare const parsePage: (page: Page, { text, from, to, lite, }: {
    text: string;
    from: string;
    to: string;
    lite: boolean;
}) => Promise<{
    result: string;
    fromDidYouMean: string | undefined;
    fromSuggestions: {
        text: string;
        translation: string;
    }[] | undefined;
    fromPronunciation: string | undefined;
    pronunciation: string | undefined;
    examples: IExamples | undefined;
    definitions: IDefinitions | undefined;
    translations: ITranslations | undefined;
}>;
export {};
