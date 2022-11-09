
/** Provides options for showSaveFilePicker */
type SaveFilePickerOptions = {
    /** A boolean value that defaults to false.By default, the picker should include an option to not apply any file type filters (instigated with the type option below). Setting this option to true means that option is not available. */
    excludeAcceptAllOption?: boolean;

    /** A String.The suggested file name. */
    suggestedName?: string;

    /** An Array of allowed file types to save.Each item is an object with the following options: */
    types?: Array<AllowedFileType>;
}

interface Window
{
    /** Shows a file picker that allows a user to save a file. Either by selecting an existing file, or entering a name for a new file. */
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
}
