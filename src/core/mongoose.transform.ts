import { Schema } from 'mongoose';

export function mongooseTransformPlugin(schema: Schema) {
  schema.set('toJSON', {
    virtuals: true, // Cho phép hiển thị virtual fields
    versionKey: false, // Xóa `__v`
    transform: (_, ret) => {
      ret.id = ret._id; // Đổi `_id` thành `id`
      ret.is_deleted = ret.isDeleted; // Đổi `isDeleted` thành `is_deleted`
      ret.deleted_at = ret.deletedAt; // Đổi `deletedAt` thành `deleted_at`
      ret.created_at = ret.createdAt; // Đổi `createdAt` thành `created_at`
      ret.updated_at = ret.updatedAt; // Đổi `updatedAt` thành `updated_at`

      // Xóa các trường cũ
      delete ret._id;
      delete ret.isDeleted;
      delete ret.deletedAt;
      delete ret.createdAt;
      delete ret.updatedAt;
    },
  });
}
