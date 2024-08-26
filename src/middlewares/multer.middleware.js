//middelware: if you are going somewhere meet me and then go
import multer from "multer";
import { nanoid } from "nanoid/non-secure";

const id = nanoid();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cd) {
    cd(null, file.originalname + id);
    console.log(cd);
  },
});

export const upload = multer({
  storage,
});
