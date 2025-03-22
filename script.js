document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const previewToggle = document.getElementById('previewToggle');
  const autoSaveToggle = document.getElementById('autoSaveToggle');
  const autoDownloadToggle = document.getElementById('autoDownloadToggle');
  const photoInput = document.getElementById('photoInput');
  const uploader = document.getElementById('uploader');
  const settingsPanel = document.getElementById('settingsPanel');
  const cropper = document.getElementById('cropper');
  const preview = document.getElementById('preview');
  const bgChoose = document.getElementById('bgChoose');
  const cropCanvas = new fabric.Canvas('cropCanvas', { width: 600, height: 600 });
  const previewCanvas = document.getElementById('previewCanvas');
  const cropButton = document.getElementById('cropButton');
  const autoCropButton = document.getElementById('autoCrop');
  const removeBgButton = document.getElementById('removeBg');
  const undoButton = document.getElementById('undo');
  const redoButton = document.getElementById('redo');
  const downloadJPG = document.getElementById('downloadJPG');
  const downloadPDF = document.getElementById('downloadPDF');
  const recropButton = document.getElementById('recrop');
  const applyPhotoBgButton = document.getElementById('applyPhotoBg');
  const changeBgAgainButton = document.getElementById('changeBgAgain');
  const autoDownloadButton = document.getElementById('autoDownload');
  const brightnessSlider = document.getElementById('brightness');
  const contrastSlider = document.getElementById('contrast');
  const saturationSlider = document.getElementById('saturation');
  const sharpeningSlider = document.getElementById('sharpening');
  const vignetteSlider = document.getElementById('vignette');
  const shadowSlider = document.getElementById('shadow');
  const flipHorizontalButton = document.getElementById('flipHorizontal');
  const flipVerticalButton = document.getElementById('flipVertical');

  let originalPhoto = null;
  let croppedPhoto = null;
  let history = [null];
  let historyIndex = 0;
  let settings = {
    whiteSpace: 0.2, // Adjusted for image spacing to fit 5x6 grid tightly
    border: 0.05,    // Adjusted for image border to match the image
    borderColor: 'black',
    dpi: 300,
    background: '#ffffff', // White background for A4 sheet
    photoBg: 'white',
    rotation: 0,
    zoom: 1,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpening: 0,
    vignette: 0,
    shadow: 0,
    flippedH: false,
    flippedV: false,
    rowsToPrint: 6,
  };
  let isPreviewOn = true;
  let autoSave = false;
  let autoDownload = false;

  // Load saved state from localStorage if auto-save is enabled
  if (localStorage.getItem('passportPhotoSettings')) {
    const savedSettings = JSON.parse(localStorage.getItem('passportPhotoSettings'));
    Object.assign(settings, savedSettings);
    if (savedSettings.croppedPhoto) croppedPhoto = savedSettings.croppedPhoto;
    renderPreview();
  }

  // Dark/Light Mode (Removed for dark-only theme matching the image)
  themeToggle.addEventListener('click', () => {
    // Removed dark/light toggle to match the dark theme in the image
    alert('Dark mode is the only option in this premium design.');
  });

  // Preview Toggle
  previewToggle.addEventListener('click', () => {
    isPreviewOn = !isPreviewOn;
    previewToggle.textContent = isPreviewOn ? '👁️ Preview' : '🙈 Hide Preview';
    preview.classList.toggle('hidden', !isPreviewOn);
    saveState();
  });

  // Auto-Save Toggle
  autoSaveToggle.addEventListener('click', () => {
    autoSave = !autoSave;
    autoSaveToggle.textContent = autoSave ? '💾 Auto-Save On' : '💾 Auto-Save Off';
    if (autoSave && croppedPhoto) saveState();
  });

  // Auto-Download Toggle
  autoDownloadToggle.addEventListener('click', () => {
    autoDownload = !autoDownload;
    autoDownloadToggle.textContent = autoDownload ? '📥 Auto-Download On' : '📥 Auto-Download Off';
    if (autoDownload && croppedPhoto) autoDownloadFiles();
  });

  autoDownloadButton.addEventListener('click', () => {
    autoDownloadFiles();
  });

  // Photo Upload
  uploader.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        originalPhoto = event.target.result;
        showCropper();
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file (JPG, PNG).');
    }
  });

  uploader.addEventListener('dragover', (e) => e.preventDefault());
  uploader.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        originalPhoto = event.target.result;
        showCropper();
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file (JPG, PNG).');
    }
  });

  // Cropper Logic (Simplified and Effective)
  function showCropper(photo = originalPhoto) {
    uploader.classList.add('hidden');
    cropper.classList.remove('hidden');
    cropCanvas.clear();
    fabric.Image.fromURL(photo, (img) => {
      const scale = Math.min(600 / img.width, 600 / img.height);
      img.scale(scale);
      cropCanvas.add(img);
      cropCanvas.centerObject(img);
      cropCanvas.setActiveObject(img);

      // Auto-detect face or center for cropping
      const rect = new fabric.Rect({
        width: 3.5 * 118.11, // 3.5 cm at 300 DPI
        height: 4.5 * 118.11, // 4.5 cm at 300 DPI
        fill: 'transparent',
        stroke: 'red',
        strokeWidth: 3,
        selectable: true,
        strokeDashArray: [5, 5],
        left: (cropCanvas.width - 3.5 * 118.11 * scale) / 2,
        top: (cropCanvas.height - 4.5 * 118.11 * scale) / 2,
      });
      cropCanvas.add(rect);
      cropCanvas.setActiveObject(rect);

      // Enable drag, resize, and rotate
      rect.setControlsVisibility({
        mt: true, // Top middle
        mb: true, // Bottom middle
        ml: true, // Left middle
        mr: true, // Right middle
        mtr: true, // Rotate
      });
    });
  }

  cropButton.addEventListener('click', () => {
    const activeObject = cropCanvas.getActiveObject();
    if (activeObject && activeObject.type === 'rect') {
      const cropped = cropCanvas.toDataURL({
        left: activeObject.left,
        top: activeObject.top,
        width: activeObject.width * activeObject.scaleX,
        height: activeObject.height * activeObject.scaleY,
      });
      updatePhoto(cropped);
      cropper.classList.add('hidden');
      settingsPanel.classList.remove('hidden');
      if (isPreviewOn) preview.classList.remove('hidden');
      renderPreview();
    } else {
      alert('Please adjust the cropping rectangle before proceeding.');
    }
  });

  // Auto-Crop (Simple Face Detection Placeholder)
  autoCropButton.addEventListener('click', () => {
    const img = cropCanvas.getObjects().find(obj => obj.type === 'image');
    if (img) {
      const scale = Math.min(600 / img.width, 600 / img.height);
      const rect = cropCanvas.getObjects().find(obj => obj.type === 'rect');
      if (rect) {
        // Center-based auto-crop (placeholder for face detection)
        rect.set({
          left: (cropCanvas.width - 3.5 * 118.11 * scale) / 2,
          top: (cropCanvas.height - 4.5 * 118.11 * scale) / 2,
          width: 3.5 * 118.11 * scale,
          height: 4.5 * 118.11 * scale,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
        });
        cropCanvas.renderAll();
      }
    }
  });

  // Recrop Option
  recropButton.addEventListener('click', () => {
    if (croppedPhoto) {
      settingsPanel.classList.add('hidden');
      if (isPreviewOn) preview.classList.add('hidden');
      showCropper(croppedPhoto);
    }
  });

  // Settings Updates
  document.getElementById('rowsToPrint').addEventListener('change', (e) => {
    settings.rowsToPrint = parseInt(e.target.value) || 6;
    renderPreview();
    saveState();
  });
  document.getElementById('whiteSpace').addEventListener('change', (e) => {
    settings.whiteSpace = parseFloat(e.target.value) || 0.2;
    if (settings.whiteSpace < 0) settings.whiteSpace = 0;
    renderPreview();
    saveState();
  });
  document.getElementById('border').addEventListener('change', (e) => {
    settings.border = parseFloat(e.target.value) || 0.05;
    if (settings.border < 0) settings.border = 0;
    renderPreview();
    saveState();
  });
  document.getElementById('borderColor').addEventListener('change', (e) => {
    settings.borderColor = e.target.value || 'black';
    renderPreview();
    saveState();
  });
  document.getElementById('dpi').addEventListener('change', (e) => {
    settings.dpi = parseInt(e.target.value) || 300;
    renderPreview();
    saveState();
  });
  document.getElementById('rotation').addEventListener('change', (e) => {
    settings.rotation = parseInt(e.target.value) || 0;
    renderPreview();
    saveState();
  });
  document.getElementById('zoom').addEventListener('change', (e) => {
    settings.zoom = parseFloat(e.target.value) || 1;
    if (settings.zoom < 0.5) settings.zoom = 0.5;
    if (settings.zoom > 2) settings.zoom = 2;
    renderPreview();
    saveState();
  });
  brightnessSlider.addEventListener('input', (e) => {
    settings.brightness = parseInt(e.target.value) || 0;
    renderPreview();
    saveState();
  });
  contrastSlider.addEventListener('input', (e) => {
    settings.contrast = parseInt(e.target.value) || 0;
    renderPreview();
    saveState();
  });
  saturationSlider.addEventListener('input', (e) => {
    settings.saturation = parseInt(e.target.value) || 0;
    renderPreview();
    saveState();
  });
  sharpeningSlider.addEventListener('input', (e) => {
    settings.sharpening = parseInt(e.target.value) || 0;
    renderPreview();
    saveState();
  });
  vignetteSlider.addEventListener('input', (e) => {
    settings.vignette = parseInt(e.target.value) || 0;
    renderPreview();
    saveState();
  });
  shadowSlider.addEventListener('input', (e) => {
    settings.shadow = parseInt(e.target.value) || 0;
    renderPreview();
    saveState();
  });
  flipHorizontalButton.addEventListener('click', () => {
    settings.flippedH = !settings.flippedH;
    renderPreview();
    saveState();
  });
  flipVerticalButton.addEventListener('click', () => {
    settings.flippedV = !settings.flippedV;
    renderPreview();
    saveState();
  });
  document.getElementById('photoBg').addEventListener('change', (e) => {
    settings.photoBg = e.target.value || 'white';
    renderPreview();
    saveState();
  });

  // Background Removal and Immediate Photo Background Color Selection
  removeBgButton.addEventListener('click', async () => {
  if (!croppedPhoto) return;
  removeBgButton.disabled = true;

  try {
    const response = await fetch(croppedPhoto);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('image_file', blob, 'photo.png');
    formData.append('size', 'auto');

    // 🔒 Use the environment variable directly
    const apiKey = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY;

    if (!apiKey) {
      throw new Error('Remove.bg API key is not defined. Please set NEXT_PUBLIC_REMOVE_BG_API_KEY in Vercel Environment Variables.');
    }

    const apiResponse = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: { 'X-Api-Key': apiKey.trim(), 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });

    const reader = new FileReader();
    reader.onloadend = () => {
      croppedPhoto = reader.result;
      updatePhoto(croppedPhoto);
      removeBgButton.disabled = false;
      settingsPanel.classList.add('hidden');
      if (isPreviewOn) preview.classList.add('hidden');
      bgChoose.classList.remove('hidden');
      renderPreview(); // Show transparent background initially
    };
    reader.readAsDataURL(apiResponse.data);
  } catch (error) {
    console.error('Error removing background:', error);
    alert('Failed to remove background. Check your API key in Vercel Environment Variables or your internet connection.');
    removeBgButton.disabled = false;
  }
});

  // Apply Photo Background and Fix on A4
  applyPhotoBgButton.addEventListener('click', () => {
    settings.photoBg = document.getElementById('photoBgTemp').value;
    bgChoose.classList.add('hidden');
    settingsPanel.classList.remove('hidden');
    if (isPreviewOn) preview.classList.remove('hidden');
    renderPreview();
  });

  // Change Background Continuously in Settings
  changeBgAgainButton.addEventListener('click', () => {
    bgChoose.classList.remove('hidden');
    settingsPanel.classList.add('hidden');
    if (isPreviewOn) preview.classList.add('hidden');
  });

  // Undo/Redo
  function updatePhoto(newPhoto) {
    history = [...history.slice(0, historyIndex + 1), newPhoto];
    historyIndex = history.length - 1;
    croppedPhoto = newPhoto;
    renderPreview();
    undoButton.disabled = historyIndex === 0;
    redoButton.disabled = historyIndex === history.length - 1;
    saveState();
  }

  undoButton.addEventListener('click', () => {
    if (historyIndex > 0) {
      historyIndex--;
      croppedPhoto = history[historyIndex];
      renderPreview();
      undoButton.disabled = historyIndex === 0;
      redoButton.disabled = false;
      saveState();
    }
  });

  redoButton.addEventListener('click', () => {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      croppedPhoto = history[historyIndex];
      renderPreview();
      redoButton.disabled = historyIndex === history.length - 1;
      undoButton.disabled = false;
      saveState();
    }
  });

  // Save State
  function saveState() {
    if (autoSave) {
      const state = {
        croppedPhoto,
        ...settings,
      };
      localStorage.setItem('passportPhotoSettings', JSON.stringify(state));
    }
  }

  // Auto-Download Files
  function autoDownloadFiles() {
    if (autoDownload && croppedPhoto) {
      downloadJPG.click();
      downloadPDF.click();
    }
  }

  // Preview and Download with Adjustments
  function renderPreview() {
    if (!isPreviewOn || !croppedPhoto) return;
    const ctx = previewCanvas.getContext('2d');
    const dpi = settings.dpi;
    const cmToPx = dpi / 2.54;

    const a4Width = 21 * cmToPx;
    const a4Height = 29.7 * cmToPx;
    previewCanvas.width = a4Width;
    previewCanvas.height = a4Height;

    ctx.fillStyle = settings.background; // White background for A4 sheet
    ctx.fillRect(0, 0, a4Width, a4Height);

    const img = new Image();
    img.src = croppedPhoto;
    img.crossOrigin = "Anonymous"; // Ensure CORS compatibility for images
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const tempCtx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);

      // Apply brightness, contrast, saturation, sharpening, vignette, and shadow
      const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Brightness
        data[i] = Math.min(255, Math.max(0, data[i] + settings.brightness * 2.55));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + settings.brightness * 2.55));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + settings.brightness * 2.55));
        // Contrast
        const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
        data[i] = contrastFactor * (data[i] - 128) + 128;
        data[i + 1] = contrastFactor * (data[i + 1] - 128) + 128;
        data[i + 2] = contrastFactor * (data[i + 2] - 128) + 128;
        // Saturation
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const satFactor = 1 + settings.saturation / 100;
        data[i] = gray + (r - gray) * satFactor;
        data[i + 1] = gray + (g - gray) * satFactor;
        data[i + 2] = gray + (b - gray) * satFactor;
        data[i] = Math.min(255, Math.max(0, data[i]));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
        // Sharpening (simple unsharp mask)
        if (settings.sharpening > 0) {
          const sharpenFactor = settings.sharpening / 100;
          if (i >= 4 && i < data.length - 4) {
            data[i] = data[i] + sharpenFactor * (data[i] - (data[i - 4] + data[i + 4]) / 2);
            data[i + 1] = data[i + 1] + sharpenFactor * (data[i + 1] - (data[i + 1 - 4] + data[i + 1 + 4]) / 2);
            data[i + 2] = data[i + 2] + sharpenFactor * (data[i + 2] - (data[i + 2 - 4] + data[i + 2 + 4]) / 2);
            data[i] = Math.min(255, Math.max(0, data[i]));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
          }
        }
      }
      tempCtx.putImageData(imageData, 0, 0);

      // Apply vignette effect
      if (settings.vignette > 0) {
        const vignetteFactor = settings.vignette / 100;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
            const vignette = 1 - (distance / maxDistance) * vignetteFactor;
            const pixelData = tempCtx.getImageData(x, y, 1, 1).data;
            pixelData[0] *= vignette;
            pixelData[1] *= vignette;
            pixelData[2] *= vignette;
            tempCtx.putImageData(new ImageData(pixelData, 1, 1), x, y);
          }
        }
      }

      // Apply flips
      const flippedCanvas = document.createElement('canvas');
      flippedCanvas.width = canvas.width;
      flippedCanvas.height = canvas.height;
      const flippedCtx = flippedCanvas.getContext('2d');
      flippedCtx.save();
      if (settings.flippedH) flippedCtx.scale(-1, 1);
      if (settings.flippedV) flippedCtx.scale(1, -1);
      flippedCtx.drawImage(canvas, settings.flippedH ? -canvas.width : 0, settings.flippedV ? -canvas.height : 0);
      flippedCtx.restore();

      // Apply shadow
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 3.5 * cmToPx;
      shadowCanvas.height = 4.5 * cmToPx;
      const shadowCtx = shadowCanvas.getContext('2d');
      shadowCtx.shadowBlur = settings.shadow * 2;
      shadowCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      shadowCtx.shadowOffsetX = settings.shadow;
      shadowCtx.shadowOffsetY = settings.shadow;

      // Apply photo background
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = 3.5 * cmToPx;
      bgCanvas.height = 4.5 * cmToPx;
      const bgCtx = bgCanvas.getContext('2d');
      bgCtx.fillStyle = settings.photoBg;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.drawImage(flippedCanvas, 0, 0, bgCanvas.width, bgCanvas.height);

      shadowCtx.drawImage(bgCanvas, 0, 0);

      // Adjust layout to eliminate white space on the right
      const photoWidth = 3.5 * cmToPx * settings.zoom;
      const photoHeight = 4.5 * cmToPx * settings.zoom;
      const whiteSpace = settings.whiteSpace * cmToPx;
      const border = settings.border * cmToPx;
      const totalWidth = 5 * (photoWidth + whiteSpace) + whiteSpace;
      const totalHeight = 6 * (photoHeight + whiteSpace) + whiteSpace;
      const rowsToPrint = settings.rowsToPrint;

      // Center the grid if it’s smaller than A4 width
      const xOffset = (a4Width - totalWidth) / 2;
      const yOffset = (a4Height - totalHeight) / 2;

      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 5; col++) {
          const x = xOffset + col * (photoWidth + whiteSpace) + whiteSpace;
          const y = yOffset + row * (photoHeight + whiteSpace) + whiteSpace;

          if (row < rowsToPrint) {
            ctx.save();
            ctx.translate(x + photoWidth / 2, y + photoHeight / 2);
            ctx.rotate((settings.rotation * Math.PI) / 180);
            ctx.drawImage(shadowCanvas, -photoWidth / 2, -photoHeight / 2, photoWidth, photoHeight);
            ctx.restore();

            ctx.lineWidth = border;
            ctx.strokeStyle = settings.borderColor;
            ctx.strokeRect(x, y, photoWidth, photoHeight);
          } else {
            ctx.fillStyle = settings.background; // White for unprinted areas
            ctx.fillRect(x, y, photoWidth, photoHeight);
          }
        }
      }
    };
  }

  // Ensure JPG and PDF downloads work reliably (Simplified, Fixed, and Aligned with test.html)
  downloadJPG.addEventListener('click', () => {
    if (!previewCanvas || !previewCanvas.toDataURL) {
      console.error('Preview canvas is not available or not initialized for JPG download.');
      alert('Failed to download JPG. Ensure a photo is previewed, check the console for details, and verify local script loading (fabric.js). If issues persist, ensure canvas is rendered with fabric.js and matches the test.html setup.');
      return;
    }
    try {
      // Verify canvas is rendered and has valid data
      if (!previewCanvas.getContext('2d')) {
        console.error('Preview canvas context is not available.');
        alert('Preview canvas context is missing. Check fabric.js initialization.');
        return;
      }
      const dataUrl = previewCanvas.toDataURL('image/jpeg', 1.0);
      if (!dataUrl || dataUrl === 'data:,') {
        console.error('Invalid or empty data URL for JPG download.');
        alert('No valid image data available for download. Ensure the preview is rendered correctly and matches the test.html setup.');
        return;
      }
      const link = document.createElement('a');
      link.download = 'passport-photos.jpg';
      link.href = dataUrl;
      // Ensure the link is added to the document and clicked
      document.body.appendChild(link);
      link.click();
      // Clean up by removing the link from the DOM
      document.body.removeChild(link);
      console.log('JPG download initiated successfully.');
    } catch (error) {
      console.error('JPG download failed:', error);
      alert('Failed to download JPG. Check browser permissions, ensure local scripts (fabric.js) are loaded, or use a local server for testing. Verify canvas initialization, script versions, and alignment with test.html.');
    }
  });

  downloadPDF.addEventListener('click', () => {
    if (!previewCanvas || !previewCanvas.toDataURL) {
      console.error('Preview canvas is not available or not initialized for PDF download.');
      alert('Failed to download PDF. Ensure a photo is previewed, check the console for details, and verify local script loading (html2canvas, jsPDF). If issues persist, ensure canvas is rendered with fabric.js and matches the test.html setup.');
      return;
    }
    try {
      // Verify canvas is rendered and has valid data
      if (!previewCanvas.getContext('2d')) {
        console.error('Preview canvas context is not available.');
        alert('Preview canvas context is missing. Check fabric.js initialization.');
        return;
      }
      html2canvas(previewCanvas, { 
        scale: settings.dpi / 96,
        useCORS: false, // Disable CORS since we’re using local files
        allowTaint: true,
        logging: true, // Enable logging for debugging
        onclone: (clonedDoc) => {
          const canvas = clonedDoc.querySelector('#previewCanvas');
          if (canvas) canvas.style.backgroundColor = settings.background;
        },
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        if (!imgData || imgData === 'data:,') {
          console.error('Invalid or empty image data for PDF download.');
          alert('No valid image data available for PDF download. Ensure the preview is rendered correctly and matches the test.html setup.');
          return;
        }
        const pdf = new jsPDF('p', 'mm', 'a4', null, { compress: true });
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        pdf.save('passport-photos.pdf');
        console.log('PDF download initiated successfully.');
      }).catch((error) => {
        console.error('PDF generation failed:', error);
        alert('Failed to download PDF. Check browser permissions, ensure local scripts (html2canvas, jsPDF) are loaded, or use a local server for testing. Verify canvas initialization, script versions, and alignment with test.html.');
      });
    } catch (error) {
      console.error('PDF download process failed:', error);
      alert('Failed to download PDF due to an unexpected error. Check console for details.');
    }
  });
});
