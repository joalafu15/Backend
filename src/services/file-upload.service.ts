import {
  BindingScope, config, ContextTags, injectable, Provider
} from '@loopback/core';
import multer from 'multer';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {FileUploadHandler} from '../types';

@injectable({
  scope: BindingScope.TRANSIENT,
  tags: {[ContextTags.KEY]: FILE_UPLOAD_SERVICE}
})
export class FileUploadService implements Provider<FileUploadHandler> {
  constructor(
    @config() private options: multer.Options = {}
  ) {
    if (!this.options.storage) {
      // Defaults to in-memory storage
      this.options.storage = multer.memoryStorage();
    }
  }

  value(): FileUploadHandler {
    return multer(this.options).any();
  }
}
