export interface IStaff {
  _doc: IStaffBody;
}

export interface IStaffBody {
  _id: string;
  id: string;
  name: string;
  email: string;
  facebook_id: string;
  role: {
    _id: string;
    id: string;
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

export interface IStaffFacebook {
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
