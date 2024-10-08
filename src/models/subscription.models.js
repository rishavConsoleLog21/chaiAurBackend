import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
    //NOTE: One who is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
        type: Schema.Types.ObjectId,
          ref: "User",
        },
  },
  { timestamps: true }
);

export const Subscription = mongoose.models("Subscription", subscriptionSchema);
