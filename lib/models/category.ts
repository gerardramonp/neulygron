import {
  Schema,
  type Model,
  type InferSchemaType,
  models,
  model,
} from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

export type Category = InferSchemaType<typeof CategorySchema> & {
  _id: Schema.Types.ObjectId;
};

const CategoryModel: Model<Category> =
  models.Category || model<Category>("Category", CategorySchema);

export default CategoryModel;
