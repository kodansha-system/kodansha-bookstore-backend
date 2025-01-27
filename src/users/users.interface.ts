export interface IUser {
  _doc: IUserBody;
}

export interface IUserBody {
  _id: string;
  name: string;
  email: string;
  role: string;
}
