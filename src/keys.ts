import {BindingKey} from '@loopback/core';
import {FileUploadHandler} from './types';

/**
 * Binding key for the file upload service
 */
export const FILE_UPLOAD_SERVICE = BindingKey.create<FileUploadHandler>(
  'services.FileUpload',
);

/**
 * Binding key for the storage directory
 */
export const STORAGE_DIRECTORY = BindingKey.create<string>('storage.directory');

/**
 * Binding keys for the OTP service
 */
export const OTP_SECRET = BindingKey.create<string>('service.otp.secret');
export const OTP_STEP = BindingKey.create<number>('service.otp.step');
export const OTP_WINDOW = BindingKey.create<number>('service.otp.window');
