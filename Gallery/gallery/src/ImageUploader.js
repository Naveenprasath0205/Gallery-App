import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ImageUploader.css';

const ImageUploader = ({handleLogout}) => {
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [serverFiles, setServerFiles] = useState([]);

  useEffect(() => {
    fetchUserImages();
  }, []); 

  const fetchUserImages = () => {
    axios.get('http://localhost:5000/user-images')
    .then(response => {
      setServerFiles(response.data.images);
      setImageUrls(response.data.images.map(filename => `http://localhost:5000/uploads/${filename}`));
    })
    .catch(error => {
      console.error('Error fetching images:', error);
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prevImages => [...prevImages, ...files]);

    const urls = files.map(file => URL.createObjectURL(file));
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
  };

  const handleImageUpload = () => {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('files', image);

    });

    axios.post('http://localhost:5000/upload', formData)
    .then(response => {
      console.log('Images uploaded successfully:', response.data);
      setServerFiles(response.data.filenames);
      toast.success('Images uploaded successfully!');
      fetchUserImages();
    })
    .catch(error => {
      console.error('Error uploading images:', error);
      toast.error('Error uploading images.');
    });
};

  const handleImageDelete = (index) => {
    const filename = serverFiles[index];

    if (!filename) {
      console.error('Filename is undefined');
      return;
    }
    axios.delete('http://localhost:5000/delete', { data: { filename } })
    .then(response => {
      console.log('Image deleted successfully:', response.data);
      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
      const updatedUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(updatedUrls);
      const updatedServerFiles = serverFiles.filter((_, i) => i !== index);
      setServerFiles(updatedServerFiles);
      toast.success('Image deleted successfully!');
    })
    .catch(error => {
      console.error('Error deleting image:', error);
      toast.error('Error deleting image.');
    });
};

return (
  <div>
    <h2>GUVI Gallery Application</h2>
    <button className ="logout-button" onClick={handleLogout}>Logout</button>
    <input type="file" multiple onChange={handleImageChange} />
    <button className ="upload-button" onClick={handleImageUpload}>Upload</button>
    <div className="image-container">
      {imageUrls.map((url, index) => (
        <div key={index} className="image-container">
          <img src={url} alt={`Uploaded file ${index}`} />
          <button
            className="delete-button"
            onClick={() => handleImageDelete(index)} 
          >
            X
          </button>
        </div>
      ))}
    </div>
    <ToastContainer />
  </div>
);
};
export default ImageUploader;
