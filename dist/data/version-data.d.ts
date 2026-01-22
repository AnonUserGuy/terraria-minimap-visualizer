export declare class VersionData {
    static versionStrings: [number, string][];
    static get latestRelease(): number;
    static getVersionString(release: number): string;
}
