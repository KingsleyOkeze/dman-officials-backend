const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Ensure uploads directory exists
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true }); // Create the directory if it doesn't exist
}

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Upload path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});


// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 10MB file size limit per file
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; // Allowed extensions
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images Only!')); // Reject invalid files
    }
  },
});

module.exports = upload.array('images', 4); // Accept up to 10 files with the field name 'images'

