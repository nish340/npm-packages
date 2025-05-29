/**
 * express-upload-zone - Secure File Upload Middleware
 * An all-in-one file upload handler for Express with validation, storage, and virus scanning
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');

/**
 * Default file validation function
 * @param {Object} file - File object from multer
 * @param {Object} options - Validation options
 * @returns {Boolean|String} true if valid, error message if invalid
 */
function defaultValidator(file, options) {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    return `File too large. Maximum size is ${options.maxSize / (1024 * 1024)}MB`;
  }
  
  // Check file type
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    const mimeType = file.mimetype;
    
    const isValidExt = options.allowedTypes.some(type => type === fileExt);
    const isValidMime = options.allowedTypes.some(type => mimeType.includes(type));
    
    if (!isValidExt && !isValidMime) {
      return `Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}`;
    }
  }
  
  return true;
}

/**
 * Local storage handler
 * @param {Object} options - Storage options
 * @returns {Object} Storage engine for multer
 */
function createLocalStorage(options) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Create directory if it doesn't exist
      if (!fs.existsSync(options.destination)) {
        fs.mkdirSync(options.destination, { recursive: true });
      }
      cb(null, options.destination);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName = options.preserveFilename 
        ? file.originalname 
        : `${uuidv4()}${fileExt}`;
      cb(null, fileName);
    }
  });
}

/**
 * S3 storage handler
 * @param {Object} options - S3 options
 * @returns {Object} Storage engine for multer
 */
function createS3Storage(options) {
  try {
    // Only require aws-sdk if S3 storage is used
    const AWS = require('aws-sdk');
    const multerS3 = require('multer-s3');
    
    const s3 = new AWS.S3({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      region: options.region
    });
    
    return multerS3({
      s3: s3,
      bucket: options.bucket,
      acl: options.acl || 'private',
      key: (req, file, cb) => {
        const fileExt = path.extname(file.originalname);
        const fileName = options.preserveFilename 
          ? file.originalname 
          : `${uuidv4()}${fileExt}`;
        
        const key = options.keyPrefix 
          ? `${options.keyPrefix}/${fileName}`
          : fileName;
          
        cb(null, key);
      }
    });
  } catch (err) {
    throw new Error('S3 storage requires aws-sdk and multer-s3 packages');
  }
}

/**
 * Virus scanner using ClamAV
 * @param {Object} options - ClamAV options
 * @returns {Function} Virus scanning function
 */
async function scanFile(filePath, options) {
  try {
    // Only require clamscan if virus scanning is enabled
    const NodeClam = require('clamscan');
    
    const clamscan = await new NodeClam().init({
      removeInfected: true,
      quarantineInfected: options.quarantineDir || false,
      scanRecursive: false,
      clamdscan: {
        socket: options.socket || null,
        host: options.host || null,
        port: options.port || null,
        localFallback: true
      }
    });
    
    const { isInfected, file, viruses } = await clamscan.scanFile(filePath);
    
    return {
      isInfected,
      file,
      viruses
    };
  } catch (err) {
    throw new Error('Virus scanning requires clamscan package');
  }
}

/**
 * Main upload middleware factory
 * @param {Object} options - Configuration options
 * @returns {Object} Express middleware
 */
function uploadZone(options = {}) {
  const defaults = {
    storage: 'local',
    destination: path.join(process.cwd(), 'uploads'),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5
    },
    allowedTypes: [],
    preserveFilename: false,
    scanVirus: false,
    fileFilter: null
  };
  
  const config = { ...defaults, ...options };
  
  // Create storage engine
  let storage;
  if (config.storage === 'local') {
    storage = createLocalStorage(config);
  } else if (config.storage === 's3') {
    storage = createS3Storage(config);
  } else {
    throw new Error('Invalid storage type. Use "local" or "s3"');
  }
  
  // Create multer instance
  const upload = multer({
    storage,
    limits: config.limits,
    fileFilter: (req, file, cb) => {
      // Custom file filter
      if (config.fileFilter) {
        const result = config.fileFilter(file, config);
        if (result !== true) {
          return cb(new Error(result || 'File validation failed'), false);
        }
      } else {
        // Default file filter
        const result = defaultValidator(file, {
          maxSize: config.limits.fileSize,
          allowedTypes: config.allowedTypes
        });
        
        if (result !== true) {
          return cb(new Error(result), false);
        }
      }
      
      cb(null, true);
    }
  });
  
  // Create middleware functions
  const middleware = {
    // Single file upload
    single: (fieldName) => {
      return [
        upload.single(fieldName),
        async (req, res, next) => {
          try {
            if (!req.file) return next();
            
            // Virus scanning if enabled
            if (config.scanVirus && config.storage === 'local') {
              try {
                const scanResult = await scanFile(req.file.path, config);
                
                if (scanResult.isInfected) {
                  return res.status(400).json({
                    success: false,
                    message: 'Virus detected in uploaded file',
                    viruses: scanResult.viruses
                  });
                }
                
                req.file.scanResult = scanResult;
              } catch (err) {
                console.warn('Virus scanning failed:', err.message);
              }
            }
            
            next();
          } catch (err) {
            next(err);
          }
        }
      ];
    },
    
    // Multiple files upload
    array: (fieldName, maxCount) => {
      return [
        upload.array(fieldName, maxCount || config.limits.files),
        async (req, res, next) => {
          try {
            if (!req.files || req.files.length === 0) return next();
            
            // Virus scanning if enabled
            if (config.scanVirus && config.storage === 'local') {
              try {
                for (const file of req.files) {
                  const scanResult = await scanFile(file.path, config);
                  
                  if (scanResult.isInfected) {
                    return res.status(400).json({
                      success: false,
                      message: 'Virus detected in uploaded file',
                      file: file.originalname,
                      viruses: scanResult.viruses
                    });
                  }
                  
                  file.scanResult = scanResult;
                }
              } catch (err) {
                console.warn('Virus scanning failed:', err.message);
              }
            }
            
            next();
          } catch (err) {
            next(err);
          }
        }
      ];
    },
    
    // Fields upload
    fields: (fields) => {
      return [
        upload.fields(fields),
        async (req, res, next) => {
          try {
            if (!req.files) return next();
            
            // Virus scanning if enabled
            if (config.scanVirus && config.storage === 'local') {
              try {
                for (const fieldName in req.files) {
                  for (const file of req.files[fieldName]) {
                    const scanResult = await scanFile(file.path, config);
                    
                    if (scanResult.isInfected) {
                      return res.status(400).json({
                        success: false,
                        message: 'Virus detected in uploaded file',
                        file: file.originalname,
                        viruses: scanResult.viruses
                      });
                    }
                    
                    file.scanResult = scanResult;
                  }
                }
              } catch (err) {
                console.warn('Virus scanning failed:', err.message);
              }
            }
            
            next();
          } catch (err) {
            next(err);
          }
        }
      ];
    }
  };
  
  return middleware;
}

module.exports = uploadZone;