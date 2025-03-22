const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// შევცვალოთ storage დირექტორია build და dev გარემოსთვის
const STORAGE_DIR = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '..', 'data', 'prod')
  : path.join(__dirname, '..', 'data', 'dev');

// მარკერების წაკითხვა
router.get('/markers/:filename', async (req, res) => {
  try {
    const filePath = path.join(STORAGE_DIR, req.params.filename);
    
    // შევქმნათ დირექტორია თუ არ არსებობს
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      if (error.code === 'ENOENT') {
        // თუ ფაილი არ არსებობს, შევქმნათ ცარიელი მასივით
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
        res.json([]);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error reading markers:', error);
    res.status(500).json({ error: 'Error reading markers' });
  }
});

// მარკერების შენახვა
router.post('/markers/:filename', async (req, res) => {
  try {
    const filePath = path.join(STORAGE_DIR, req.params.filename);
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving markers:', error);
    res.status(500).json({ error: 'Error saving markers' });
  }
});

module.exports = router;
