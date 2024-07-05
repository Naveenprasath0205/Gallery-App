const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect('mongodb://localhost:27017/imageuploaderDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  images: [String], // Array of image filenames
});

const User = mongoose.model('User', userSchema);

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send('Token is required.');

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send('Invalid token.');
    req.user = user;
    next();
  });
};

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('User already exists.');
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = new User({
      username,
      password: hashedPassword,
      images: [],
    });

    await newUser.save();
    res.send('User registered successfully.');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering user.');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('User not found.');
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send('Invalid password.');
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: 86400 });
    res.send({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in.');
  }
});

app.get('/user-images', authenticate, async (req, res) => {
  const username = req.user.username;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.send({ images: user.images });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Error fetching images.');
  }
});
const Storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  } ,
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.originalname );
    }
});

const uploadWithOriginalFilename = multer({ storage: Storage});

app.post('/upload', authenticate, uploadWithOriginalFilename.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded.');
  }

  const username = req.user.username;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found.');
    }

    req.files.forEach(file => {
      user.images.push(file.filename);
    });

    await user.save();

    res.send({ filenames: user.images });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).send('Error uploading images.');
  }
});

app.delete('/delete', authenticate, async (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).send('Filename is required.');
  }

  const username = req.user.username;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found.');
    }

    const fileIndex = user.images.indexOf(filename);
    if (fileIndex === -1) {
      return res.status(400).send('File not found.');
    }

    user.images.splice(fileIndex, 1);
    await user.save();

    const filePath = path.join(__dirname, 'uploads', filename);
    fs.unlink(filePath, err => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).send('Error deleting file.');
      }
      res.send({ message: 'Image deleted' });
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).send('Error deleting image.');
  }
});

app.listen(5000, () => {
  console.log('Server started on http://localhost:5000');
});

