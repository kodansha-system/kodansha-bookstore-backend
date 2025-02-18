export interface IUser {
  _doc: IUserBody;
}

export interface IUserBody {
  _id: string;
  name: string;
  email: string;
  facebook_id: string;
  role: {
    _id: string;
    name: string;
  };
  permissions: {
    _id: string;
    name: string;
    api_path: string;
    method: string;
    module: string;
  }[];
}

export interface IUserFacebook {
  id: string;
  email: string;
  name: string;
  image: string;
}

export enum AccType {
  NORMAL = 'normal',
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
}
