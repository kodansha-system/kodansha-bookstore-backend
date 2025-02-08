export interface IUser {
  _doc: IUserBody;
}

export interface IUserBody {
  _id: string;
  name: string;
  email: string;
  role: {
    _id: string;
    name: string;
  };
  permissions?: {
    _id: string;
    name: string;
    api_path: string;
    module: string;
  }[];
}
