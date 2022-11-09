/** Provides allowed file types to pick */
type AllowedFileType = {
    /** An optional description of the category of files types allowed. */
    description: string;

    /** An Object with the keys set to the MIME type and the values an Array of file extensions (see below for an example). */
    accept?: object,
}
