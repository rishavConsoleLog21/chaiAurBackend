import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

//TODO: get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "asc",
    sortType = "_id",
    userId,
  } = req.query;
  const allVideos = await Video.find({ userId })
    .find({ title: { $regex: query, $options: "i" } })
    .sort({ [sortType]: sortBy === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("userId", "name email")
    .exec();

  if (!allVideos) {
    throw new ApiError(404, "No videos found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "All videos fetched successfully"));
});

// TODO: get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const videoLocalPath = req.files?.video[0].path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Please upload a video");
  }

  const uploadedVideo = await uploadOnCloudinary(videoLocalPath, "videos");

  const newVideo = new Video({
    title,
    description,
    videoUrl: uploadedVideo.secure_url,
    cloudinaryId: uploadedVideo.public_id,
    userId: req.user._id,
  });

  const savedVideo = await newVideo.save();

  if (!savedVideo) {
    throw new ApiError(400, "Video not saved");
  }

  const thumbnail = req.files.thumbnail;

  if (!thumbnail) {
    throw new ApiError(400, "Please upload a thumbnail");
  }

  const uploadedThumbnail = await uploadOnCloudinary(thumbnail, "image");

  savedVideo.thumbnail = uploadedThumbnail.secure_url;

  await savedVideo.save();

  if (!savedVideo) {
    throw new ApiError(400, "Thumbnail not saved");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, savedVideo, "Video published successfully"));
});

//TODO: get video by id
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!(videoId || isValidObjectId(videoId))) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  if(!video.length === 0){
    throw new ApiError(404, "Video not found");
  }
});

//TODO: update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId, thumbnail } = req.params;
  const { title, description } = req.body;

  if (!(videoId || isValidObjectId(videoId))) {
    throw new ApiError(400, "Invalid video id");
  }

  if(!thumbnail){
    throw new ApiError(400, "Please upload a thumbnail");
  }

  if(!title && !description){
    throw new ApiError(400, "Please provide title and description");
  }

  const video = await Video.findById(videoId);
  
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const uploadedThumbnail = await uploadOnCloudinary(thumbnail, "image");

  if(!uploadedThumbnail){
    throw new ApiError(400, "Thumbnail not uploaded");
  }

  const updatedVideo = await video.save({
    title,
    description,
    thumbnail: uploadedThumbnail.secure_url,
    validateBeforeSave: false,
  });

  if (!updatedVideo) {
    throw new ApiError(400, "Video not updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));

});

//TODO: delete video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await video.remove();

  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.isPublished = !video.isPublished;

  const updatedVideo = await video.save();

  if (!updatedVideo) {
    throw new ApiError(400, "Video not updated");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "Video publish status updated successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
