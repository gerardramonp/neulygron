import {
  Schema,
  type Model,
  type InferSchemaType,
  models,
  model,
  Types,
} from "mongoose";

const ExpenseLineSchema = new Schema(
  {
    concept: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const CategorySnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    position: { type: Number, required: true },
    expenses: { type: [ExpenseLineSchema], default: [] },
  },
  { _id: false },
);

const MonthlyExpenseReportSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    yearMonth: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "yearMonth must be YYYY-MM"],
    },
    categories: {
      type: [CategorySnapshotSchema],
      default: [],
    },
  },
  { timestamps: true },
);

MonthlyExpenseReportSchema.index({ userId: 1, yearMonth: 1 }, { unique: true });

export type MonthlyExpenseReport = InferSchemaType<
  typeof MonthlyExpenseReportSchema
> & {
  _id: Types.ObjectId;
};

const MonthlyExpenseReportModel: Model<MonthlyExpenseReport> =
  models.MonthlyExpenseReport ||
  model<MonthlyExpenseReport>(
    "MonthlyExpenseReport",
    MonthlyExpenseReportSchema,
    "monthly_expense_reports",
  );

export default MonthlyExpenseReportModel;
