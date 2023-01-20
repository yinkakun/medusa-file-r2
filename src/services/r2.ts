import fs from "fs";
import stream from "stream";
import S3 from "aws-sdk/clients/s3.js";
import { FileService } from "medusa-interfaces";

interface File {
  path: string;
  originalname: string;
}

interface FileData {
  ext: string;
  name: string;
  fileKey: string;
}

interface Options {
  bucket: string;
  account_id: string;
  access_key: string;
  secret_key: string;
  public_url: string;
}

class R2StorageService extends FileService {
  bucket: string;
  endpoint: string;
  account_id: string;
  access_key: string;
  secret_key: string;
  public_url: string;

  constructor({}, options: Options) {
    super();

    this.bucket = options.bucket;
    this.account_id = options.account_id;
    this.access_key = options.access_key;
    this.secret_key = options.secret_key;
    this.public_url = options.public_url;
    this.endpoint = `https://${this.account_id}.r2.cloudflarestorage.com`;
  }

  storageClient() {
    const client = new S3({
      region: "auto",
      signatureVersion: "v4",
      endpoint: this.endpoint,
      accessKeyId: this.access_key,
      secretAccessKey: this.secret_key,
    });

    return client;
  }

  async uploadFile(file: File) {
    const client = this.storageClient();

    const params = {
      Bucket: this.bucket,
      Key: file.originalname,
      Body: fs.createReadStream(file.path),
    };

    try {
      const data = await client.upload(params).promise();

      return {
        url: `${this.public_url}/${data.Key}`,
        key: data.Key,
      };
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred while uploading the file.");
    }
  }

  // @ts-ignore This interface type is incorrect
  async upload(file: File) {
    return this.uploadFile(file);
  }

  async uploadProtected(file: File) {
    return this.uploadFile(file);
  }

  // @ts-ignore This interface type is incorrect
  async delete(file: string) {
    const client = this.storageClient();

    const params = {
      Bucket: this.bucket,
      Key: `${file}`,
    };

    try {
      await client.deleteObject(params).promise();
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred while deleting the file.");
    }
  }

  async getDownloadStream(fileData: FileData) {
    const client = this.storageClient();

    const params = {
      Bucket: this.bucket,
      Key: fileData.fileKey,
    };

    try {
      return client.getObject(params).createReadStream();
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred while downloading the file.");
    }
  }

  async getPresignedDownloadUrl(fileData: FileData) {
    const client = this.storageClient();

    const params = {
      Bucket: this.bucket,
      Key: fileData.fileKey,
      Expires: 60 * 60, // 1 hour
    };

    try {
      return client.getSignedUrlPromise("getObject", params);
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred while downloading the file.");
    }
  }

  async getUploadStreamDescriptor(fileData: FileData) {
    const client = this.storageClient();
    const pass = new stream.PassThrough();
    const fileKey = `${fileData.name}.${fileData.ext}`;

    const params = {
      Body: pass,
      Key: fileKey,
      Bucket: this.bucket,
    };

    return {
      fileKey,
      writeStream: pass,
      promise: client.upload(params).promise(),
      url: `${this.endpoint}/${this.bucket}/${fileKey}`,
    };
  }
}

export default R2StorageService;
