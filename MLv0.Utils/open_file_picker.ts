
/** Provides options for showOpenFilePicker */
type OpenFilePickerOptions = {
    /** A boolean value that defaults to false.When set to true multiple files may be selected. */
    multiple?: boolean;

    /** A boolean value that defaults to false.By default, the picker should include an option to not apply any file type filters (instigated with the type option below). Setting this option to true means that option is not available. */
    excludeAcceptAllOption?: boolean;

    /** An Array of allowed file types to save.*/
    types?: Array<AllowedFileType>;
}

interface Window
{
    /** Shows a file picker that allows a user to select a file or multiple files and returns a handle for the file(s). */
    showOpenFilePicker(options?: OpenFilePickerOptions): Promise<Array<FileSystemFileHandle>>;
}
