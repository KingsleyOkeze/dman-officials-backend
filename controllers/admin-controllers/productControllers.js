const { cloudinary } = require('../../config/config');

const addProductFunction = async (req, res) => {

    // console.log('File path before upload:', req.file.path);
  
    
      if (!req.file) {
        return res.status(400).json({ error: "Please upload an image" });
      }
    
    try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        console.log('image url', result.secure_url)

        // Delete the uploaded file from local storage
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error(err);
        }
      });
  
      console.log("Event uploaded successfully");
      return res.status(201).json({ message: 'Event uploaded successfully' });
  
    } catch (error) {

    }
};




module.exports = {
    addProductFunction
};