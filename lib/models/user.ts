import {
  Schema,
  type Model,
  type InferSchemaType,
  models,
  model,
} from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, trim: true, required: false },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: false, select: false },
    image: { type: String, required: false },
    provider: { type: String, required: true, default: "credentials" },
    emailVerified: { type: Date, required: false },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof UserSchema> & {
  _id: Schema.Types.ObjectId;
};

const UserModel: Model<User> = models.User || model<User>("User", UserSchema);

export default UserModel;
