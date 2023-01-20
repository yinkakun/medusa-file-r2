var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var r2_exports = {};
__export(r2_exports, {
  default: () => r2_default
});
module.exports = __toCommonJS(r2_exports);
var import_fs = __toESM(require("fs"));
var import_stream = __toESM(require("stream"));
var import_s3 = __toESM(require("aws-sdk/clients/s3.js"));
var import_medusa_interfaces = require("medusa-interfaces");
class R2StorageService extends import_medusa_interfaces.FileService {
  bucket;
  endpoint;
  account_id;
  access_key;
  secret_key;
  public_url;
  constructor({}, options) {
    super();
    this.bucket = options.bucket;
    this.account_id = options.account_id;
    this.access_key = options.access_key;
    this.secret_key = options.secret_key;
    this.public_url = options.public_url;
    this.endpoint = `https://${this.account_id}.r2.cloudflarestorage.com`;
  }
  storageClient() {
    const client = new import_s3.default({
      region: "auto",
      signatureVersion: "v4",
      endpoint: this.endpoint,
      accessKeyId: this.access_key,
      secretAccessKey: this.secret_key
    });
    return client;
  }
  async uploadFile(file) {
    const client = this.storageClient();
    const params = {
      Bucket: this.bucket,
      Key: file.originalname,
      Body: import_fs.default.createReadStream(file.path)
    };
    try {
      const data = await client.upload(params).promise();
      return {
        url: `${this.public_url}/${data.Key}`,
        key: data.Key
      };
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred while uploading the file.");
    }
  }
  // @ts-ignore This interface type is incorrect
  async upload(file) {
    return this.uploadFile(file);
  }
  async uploadProtected(file) {
    return this.uploadFile(file);
  }
  // @ts-ignore This interface type is incorrect
  async delete(file) {
    const client = this.storageClient();
    const params = {
      Bucket: this.bucket,
      Key: `${file}`
    };
    try {
      await client.deleteObject(params).promise();
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred while deleting the file.");
    }
  }
  async getDownloadStream(fileData) {
    const client = this.storageClient();
    const params = {
      Bucket: this.bucket,
      Key: fileData.fileKey
    };
    try {
      return client.getObject(params).createReadStream();
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred while downloading the file.");
    }
  }
  async getPresignedDownloadUrl(fileData) {
    const client = this.storageClient();
    const params = {
      Bucket: this.bucket,
      Key: fileData.fileKey,
      Expires: 60 * 60
      // 1 hour
    };
    try {
      return client.getSignedUrlPromise("getObject", params);
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred while downloading the file.");
    }
  }
  async getUploadStreamDescriptor(fileData) {
    const client = this.storageClient();
    const pass = new import_stream.default.PassThrough();
    const fileKey = `${fileData.name}.${fileData.ext}`;
    const params = {
      Body: pass,
      Key: fileKey,
      Bucket: this.bucket
    };
    return {
      fileKey,
      writeStream: pass,
      promise: client.upload(params).promise(),
      url: `${this.endpoint}/${this.bucket}/${fileKey}`
    };
  }
}
var r2_default = R2StorageService;
