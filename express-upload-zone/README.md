# express-upload-zone

Secure File Upload Middleware - An all-in-one file upload handler for Express with validation, storage, and virus scanning.

## Features

- Handles multipart/form-data with limits
- Supports local or S3 uploads
- Built-in file type/size checks
- Optional ClamAV integration for security
- Ideal for apps needing secure document or image uploads

## Installation

```bash
npm install @nish34/express-upload-zone
```

## Usage

### Basic Usage

```javascript
const express = require('express');
const uploadZone = require('@nish34/express-upload-zone');

const app = express();

// Create upload middleware
const upload = uploadZone({
  destination: './uploads',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3
  },
  allowedTypes: ['jpg', 'jpeg', 'png', 'pdf']
});

// Single file upload
app.post('/upload/single', ...upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  
  res.json({
    success: true,
    file: req.file
  });
});

// Multiple files upload
app.post('/upload/multiple', ...upload.array('files', 3), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  
  res.json({
    success: true,
    files: req.files
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Advanced Usage with S3 and Virus Scanning

```javascript
const express = require('express');
const uploadZone = require('@nish34/express-upload-zone');

const app = express();

// S3 storage with virus scanning
const upload = uploadZone({
  storage: 's3',
  accessKeyId: 'YOUR_AWS_ACCESS_KEY',
  secretAccessKey: 'YOUR_AWS_SECRET_KEY',
  region: 'us-east-1',
  bucket: 'your-bucket-name',
  keyPrefix: 'uploads',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  allowedTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
  scanVirus: true, // Enable virus scanning (requires ClamAV)
  preserveFilename: false // Generate unique filenames
});

// Multiple fields
app.post('/upload/profile', ...upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), (req, res) => {
  res.json({
    success: true,
    avatar: req.files.avatar,
    documents: req.files.documents
  });
});

// Custom error handling
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large'
    });
  }
  
  res.status(500).json({
    success: false,
    message: err.message
  });
});

app.listen(3000);
```

## Configuration Options

- `storage`: Storage type ('local' or 's3', default: 'local')
- `destination`: Local storage path (default: './uploads')
- `limits`: File limits object
  - `fileSize`: Maximum file size in bytes (default: 10MB)
  - `files`: Maximum number of files (default: 5)
- `allowedTypes`: Array of allowed file extensions (default: [])
- `preserveFilename`: Whether to keep original filenames (default: false)
- `scanVirus`: Enable virus scanning with ClamAV (default: false)
- `fileFilter`: Custom file validation function

### S3 Options (when storage is 's3')

- `accessKeyId`: AWS access key ID
- `secretAccessKey`: AWS secret access key
- `region`: AWS region
- `bucket`: S3 bucket name
- `keyPrefix`: Prefix for S3 object keys (optional)
- `acl`: S3 ACL (default: 'private')

### Virus Scanning Options (when scanVirus is true)

- `quarantineDir`: Directory to move infected files (optional)
- `socket`: ClamAV socket path (optional)
- `host`: ClamAV host (optional)
- `port`: ClamAV port (optional)

## License

MIT