import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { username } = req.params;

  if (!username.trim()) {
    throw new ApiError(400, "Username is not found!!!");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "user",
        as: "videos",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "user",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "views",
        localField: "_id",
        foreignField: "user",
        as: "views",
      },
    },
    {
      $project: {
        _id: 0,
        totalVideos: { $size: "$videos" },
        totalSubscribers: { $size: "$subscribers" },
        totalLikes: { $size: "$likes" },
        totalViews: { $size: "$views" },
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found!!!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...channel[0] },
        "Channel stats fetched successfully"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { username } = req.params;

  if (!username.trim()) {
    throw new ApiError(400, "Username is not found!!!");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "user",
        as: "videos",
      },
    },
    {
      $project: {
        _id: 0,
        videos: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found!!!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos: channel[0].videos },
        "Channel videos fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
