import {
  Schema,
  type Model,
  type InferSchemaType,
  models,
  model,
  Types,
} from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export type Category = InferSchemaType<typeof CategorySchema> & {
  _id: Types.ObjectId;
};

const CategoryModel: Model<Category> =
  models.Category || model<Category>("Category", CategorySchema);

export default CategoryModel;
