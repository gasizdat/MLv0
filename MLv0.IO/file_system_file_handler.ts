/** Interface of the File System Access API is a WritableStream object with additional convenience methods, which operates on a single file on disk. 
 * The interface is accessed through the FileSystemFileHandle.createWritable() method. */
interface FileSystemWritableFileStream extends WritableStream
{
    /** Writes content into the file the method is called on, at the current file cursor offset. */
    write(data: ArrayBuffer | DataView | Blob | String): Promise<void>;

    /** Experimental. Updates the current file cursor offset to the position(in bytes) specified. */
    seek(position: number): Promise<void>;

    /** Resizes the file associated with the stream to be the specified size in bytes. */
    truncate(size: number): Promise<void>;
}

/** Represents a handle to a file system entry. The interface is accessed through the window.showOpenFilePicker() and showSaveFilePicker methods. */
interface FileSystemFileHandle extends EventTarget
{
    /** Returns a Promise which resolves to a File object representing the state on disk of the entry represented by the handle. */
    getFile(): Promise<File>;

    /** Returns a Promise which resolves to a newly created FileSystemWritableFileStream object that can be used to write to a file. */
    createWritable(): Promise<FileSystemWritableFileStream>;
}
