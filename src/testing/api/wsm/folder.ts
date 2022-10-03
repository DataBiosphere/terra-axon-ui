import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import {
  CreateFolderRequest,
  Folder,
  FolderApi,
  FolderList,
  ListFoldersRequest,
} from "../../../generated/workspacemanager";
import { apiError } from "../error";

export class FakeFolderApi extends FolderApi {
  private folders: Map<string, Folder[]> = new Map();

  constructor() {
    super();
  }

  async createFolder(request: CreateFolderRequest): Promise<Folder> {
    let list = this.folders.get(request.workspaceId);
    if (!list) {
      list = [];
      this.folders.set(request.workspaceId, list);
    }
    const folder: Folder = { id: uuidv4(), ...request.createFolderRequestBody };
    if (
      folder.parentFolderId !== undefined &&
      !list.find((f) => f.id === folder.parentFolderId)
    ) {
      throw apiError(
        StatusCodes.BAD_REQUEST,
        `parent folder ${folder.parentFolderId} does not exist`
      );
    }
    if (
      list.find(
        (f) =>
          f.displayName == folder.displayName &&
          f.parentFolderId == folder.parentFolderId
      )
    ) {
      throw apiError(
        StatusCodes.CONFLICT,
        `folder with name ${folder.displayName} already exists in parent ${folder.parentFolderId}`
      );
    }
    list.push(folder);
    return Promise.resolve(folder);
  }

  async listFolders(request: ListFoldersRequest): Promise<FolderList> {
    return Promise.resolve({
      folders: this.folders.get(request.workspaceId) || [],
    });
  }

  //async getFolder(request: GetFolderRequest): Promise<Folder> {}
}
