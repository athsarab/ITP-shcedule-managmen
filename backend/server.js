const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

// Connect to MongoDB
mongoose.connect('mongodb+srv://athsarabim:athsara@cluster0.70a8ljs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const subuserSchema = new mongoose.Schema({
  name: String,
  detime:String,
  email: String,
  phone: String,
  profile: String,
});
// Create a Mongoose schema
const userSchema = new mongoose.Schema({
  name: String,
  detime:String,
  email: String,
  phone: String,
  profile: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bus',
    default: null,
  },
});

// Create a Mongoose model
const User = mongoose.model('bus', userSchema);

// Create an Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// GET all students
app.get('/bus', async (req, res) => {
  try {
    const students = await User.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET a specific user by ID
app.get('/bus/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new user
app.post('/bus', upload.single('profile'), async (req, res) => {
  try {
    const { name,detime, email, phone, parent } = req.body;
    let user = new User({
      parent,
      name,
      detime,
      email,
      phone,
      profile: req.file ? req.file.filename : '',
    });
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT/UPDATE an existing user by ID
app.put('/bus/:id', upload.single('profile'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name;
    user.detime = req.body.detime;
    user.email = req.body.email;
    user.phone = req.body.phone;

    if (req.file) {
      // Delete previous profile picture if it exists
      if (user.profile) {
        fs.unlinkSync(`uploads/${user.profile}`);
      }
      user.profile = req.file.filename;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function deleteMultipleFilesSync(filePaths) {
  // Loop through the array of file paths
  filePaths.forEach((filePath) => {
    try {
      fs.unlinkSync(filePath);
      console.log(`File deleted successfully: ${filePath}`);
    } catch (err) {
      console.error(`Error deleting file: ${filePath}`, err);
    }
  });
}

// DELETE a user by ID
app.delete('/bus/:id', async (req, res) => {
  try {
    // delete all sub trees
    console.log('first');
    let children = await User.find({ parent: req.params.id });
    children = children.map((el) => el.profile);
    children.forEach((el) => fs.unlinkSync(`uploads/${el}`));
    console.log(children);
    await User.deleteMany({ parent: req.params.id });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the profile picture if it exists
    if (user.profile) {
      fs.unlinkSync(`uploads/${user.profile}`);
    }

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
