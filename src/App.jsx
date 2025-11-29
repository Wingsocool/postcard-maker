import React, { useState, useCallback } from 'react';
import { Upload, Download, Image, Type, FileImage, Layers, X, Check, ZoomIn, ArrowUpFromLine, ArrowUpDown } from 'lucide-react';
import Cropper from 'react-easy-crop';

// === 辅助函数：将裁剪后的区域转换为图片 ===
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.95);
  });
}

export default function PostcardGenerator() {
  const [frontImage, setFrontImage] = useState(null);
  const [contentMode, setContentMode] = useState('text');
  const [contentText, setContentText] = useState('');
  const [contentImage, setContentImage] = useState(null);
  const [recipientInfo, setRecipientInfo] = useState({
    name: '',
    address: ''
  });
  
  const [stamp, setStamp] = useState(null); 
  const [customStamp, setCustomStamp] = useState('https://flagcdn.com/w320/cn.png');
  const [postmarkDate, setPostmarkDate] = useState(new Date().toLocaleDateString('zh-CN'));
  const [postmarkLocation, setPostmarkLocation] = useState('Post Office');
  
  const [textStyle, setTextStyle] = useState({
    fontSize: 50,
    fontFamily: 'KaiTi',
    verticalAlign: 'top'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // === 裁剪相关状态 ===
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [croppingTarget, setCroppingTarget] = useState(null);

  const stampOptions = [
    { type: 'img', src: 'https://flagcdn.com/w320/cn.png', label: 'CN' },
    { type: 'img', src: 'https://flagcdn.com/w320/us.png', label: 'US' },
    { type: 'img', src: 'https://flagcdn.com/w320/eu.png', label: 'EU' },
    { type: 'img', src: 'https://flagcdn.com/w320/gb.png', label: 'GB' },
    { type: 'text', content: '🐉', label: 'Dragon' },
    { type: 'text', content: '🌸', label: 'Flower' },
    { type: 'text', content: '🏛️', label: 'Museum' },
    { type: 'text', content: '🌊', label: 'Wave' },
  ];

  const handleFileSelect = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result);
        setCroppingTarget(target);
        setIsCropping(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      
      if (croppingTarget === 'front') {
        setFrontImage(croppedImage);
      } else if (croppingTarget === 'content') {
        setContentImage(croppedImage);
      } else if (croppingTarget === 'stamp') {
        setCustomStamp(croppedImage);
        setStamp(null);
      }
      setIsCropping(false);
      setCropImageSrc(null);
    } catch (e) {
      console.error(e);
      alert('裁剪失败，请重试');
    }
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const getLines = (ctx, text, maxWidth) => {
    const lines = [];
    const paragraphs = text.split('\n');

    paragraphs.forEach(paragraph => {
      let line = '';
      const words = paragraph.split(''); 
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n];
        } else {
          line = testLine;
        }
      }
      lines.push(line);
    });
    return lines;
  };

  const generateCanvas = async (side) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 1500;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    if (side === 'front') {
      if (frontImage) {
        const img = await loadImage(frontImage);
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#999';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('请上传景点图片', width / 2, height / 2);
      }
    } else {
      // === 背面绘制 ===
      ctx.fillStyle = '#fff8dc';
      ctx.fillRect(0, 0, width, height);
      
      // 中线
      ctx.strokeStyle = '#d4a574';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2, 50);
      ctx.lineTo(width / 2, height - 50);
      ctx.stroke();
      
      // 左侧内容
      if (contentMode === 'text' && contentText) {
        ctx.fillStyle = '#333';
        ctx.font = `${textStyle.fontSize}px ${textStyle.fontFamily}, serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const maxWidth = (width / 2) - 120;
        const lineHeight = textStyle.fontSize * 1.4;
        const lines = getLines(ctx, contentText, maxWidth);
        
        const totalTextHeight = lines.length * lineHeight;
        const containerHeight = height - 160; 
        
        let startY = 80; 
        if (textStyle.verticalAlign === 'center') {
          startY = 80 + Math.max(0, (containerHeight - totalTextHeight) / 2);
        }

        lines.forEach((line, index) => {
          ctx.fillText(line, 60, startY + (index * lineHeight));
        });

      } else if (contentMode === 'image' && contentImage) {
        const img = await loadImage(contentImage);
        const contentWidth = width / 2 - 100;
        const contentHeight = height - 160;
        ctx.drawImage(img, 60, 80, contentWidth, contentHeight);
      }

      // === 右侧区域 ===
      const rightBaseX = width / 2;
      
      // 1. 邮编框
      const zipBoxY = 60;
      const zipBoxSize = 50;
      const zipBoxGap = 10;
      const zipStartX = rightBaseX + 60;
      
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.strokeRect(zipStartX + i * (zipBoxSize + zipBoxGap), zipBoxY, zipBoxSize, zipBoxSize);
      }

      // 2. 邮票
      const stampSize = 220;
      const stampX = width - stampSize - 60;
      const stampY = 60;
      
      ctx.fillStyle = '#fff';
      ctx.fillRect(stampX, stampY, stampSize, stampSize * 1.2); 
      
      if (customStamp) {
        const sImg = await loadImage(customStamp);
        
        // --- 核心修复：使用 Contain 模式，完整显示，不裁切 ---
        // 目标绘制区域（留5px边距）
        const targetX = stampX + 5;
        const targetY = stampY + 5;
        const targetW = stampSize - 10;
        const targetH = stampSize * 1.2 - 10;

        // 计算缩放比例：取宽比和高比中**较小**的那个（确保完整放入）
        const scale = Math.min(targetW / sImg.width, targetH / sImg.height);
        
        // 计算缩放后的实际宽高
        const drawW = sImg.width * scale;
        const drawH = sImg.height * scale;
        
        // 计算居中位置
        const drawX = targetX + (targetW - drawW) / 2;
        const drawY = targetY + (targetH - drawH) / 2;

        // 绘制
        ctx.drawImage(sImg, drawX, drawY, drawW, drawH);
        
      } else if (stamp) {
        ctx.fillStyle = '#333';
        ctx.font = '100px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stamp, stampX + stampSize / 2, stampY + (stampSize * 1.2) / 2);
      }

      // 邮票齿孔
      ctx.fillStyle = '#fff8dc';
      const holeR = 6;
      for(let i=0; i<=10; i++) {
         ctx.beginPath(); ctx.arc(stampX + i*(stampSize/10), stampY, holeR, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(stampX + i*(stampSize/10), stampY + stampSize * 1.2, holeR, 0, Math.PI*2); ctx.fill();
      }
      for(let i=0; i<=12; i++) {
         ctx.beginPath(); ctx.arc(stampX, stampY + i*(stampSize*1.2/12), holeR, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(stampX + stampSize, stampY + i*(stampSize*1.2/12), holeR, 0, Math.PI*2); ctx.fill();
      }

      // 3. 邮戳
      const markX = stampX - 20;
      const markY = stampY + stampSize + 20;
      const markRadius = 70;
      
      ctx.strokeStyle = 'rgba(180, 40, 40, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(markX, markY, markRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.save();
      ctx.translate(markX, markY);
      ctx.rotate(-Math.PI / 6);
      ctx.fillStyle = 'rgba(180, 40, 40, 0.8)';
      ctx.textAlign = 'center';
      
      ctx.font = 'bold 16px Arial';
      ctx.fillText(postmarkDate, 0, -10);
      
      ctx.font = '12px Arial';
      const locationText = (postmarkLocation || "POST OFFICE").toUpperCase();
      if (locationText.length > 15) ctx.font = '10px Arial';
      ctx.fillText(locationText, 0, 15);
      
      ctx.restore();

      // 4. 收件人信息
      const lineStartX = rightBaseX + 60;
      const lineEndX = width - 60;
      const nameLineEndX = markX - markRadius - 20; 
      
      let lineY = 280; 

      ctx.font = '32px "KaiTi", serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';

      if (recipientInfo.name) {
         ctx.fillText(`To: ${recipientInfo.name}`, lineStartX, lineY - 10);
      }
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineY);
      ctx.lineTo(nameLineEndX, lineY); 
      ctx.stroke();

      const addressLines = recipientInfo.address ? recipientInfo.address.split('\n') : [];
      const linesToDraw = addressLines.length > 0 ? addressLines : ['', ''];
      
      linesToDraw.forEach((line) => {
        lineY += 90;
        if (line) ctx.fillText(line, lineStartX, lineY - 10);
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineY);
        ctx.lineTo(lineEndX, lineY);
        ctx.stroke();
      });
    }

    return canvas;
  };

  const handleDownload = async (side) => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas(side);
      const link = document.createElement('a');
      link.download = `明信片-${side === 'front' ? '正面' : '背面'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('生成失败，请重试');
    }
    setIsGenerating(false);
  };

  const handleDownloadBoth = async () => {
    setIsGenerating(true);
    try {
      const frontCanvas = await generateCanvas('front');
      const backCanvas = await generateCanvas('back');
      
      const mergeCanvas = document.createElement('canvas');
      const gap = 40;
      mergeCanvas.width = 1500;
      mergeCanvas.height = 2000 + gap;
      
      const ctx = mergeCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, mergeCanvas.width, mergeCanvas.height);
      
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, 1000 + gap);
      
      const link = document.createElement('a');
      link.download = `明信片-双面合并.png`;
      link.href = mergeCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('生成失败，请重试');
    }
    setIsGenerating(false);
  };

  const handleStampSelect = (item) => {
    if (item.type === 'img') {
      setCustomStamp(item.src);
      setStamp(null);
    } else {
      setStamp(item.content);
      setCustomStamp(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 p-8 font-sans text-stone-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-amber-900 mb-2">旅行明信片工坊</h1>
          <p className="text-amber-700">记录此刻，寄给未来的自己</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧控制 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
              <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                正面：风景图片
              </h2>
              <div className="border-2 border-dashed border-amber-200 rounded-lg p-6 text-center hover:bg-amber-50 hover:border-amber-400 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'front')}
                  className="hidden"
                  id="front-upload"
                />
                <label htmlFor="front-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                  <span className="text-sm font-medium text-stone-600">点击上传并裁剪图片</span>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
              <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                <Type className="w-5 h-5" />
                背面：寄语与收件人
              </h2>
              
              <div className="flex bg-stone-100 p-1 rounded-lg mb-4">
                <button
                  onClick={() => setContentMode('text')}
                  className={`flex-1 py-1.5 text-sm rounded-md transition-all ${contentMode === 'text' ? 'bg-white shadow text-amber-900 font-medium' : 'text-stone-500'}`}
                >
                  文字排版
                </button>
                <button
                  onClick={() => setContentMode('image')}
                  className={`flex-1 py-1.5 text-sm rounded-md transition-all ${contentMode === 'image' ? 'bg-white shadow text-amber-900 font-medium' : 'text-stone-500'}`}
                >
                  手写图片
                </button>
              </div>

              {contentMode === 'text' ? (
                <div className="space-y-4">
                  <textarea
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    placeholder="写下你的心情..."
                    className="w-full h-32 p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
                  />
                  
                  {/* 字号、字体、对齐控制栏 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-stone-500 mb-1 block">字号 ({textStyle.fontSize}px)</label>
                        <input
                          type="range"
                          min="35"
                          max="120"
                          value={textStyle.fontSize}
                          onChange={(e) => setTextStyle({...textStyle, fontSize: parseInt(e.target.value)})}
                          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        />
                      </div>
                      <div className="w-32">
                        <label className="text-xs font-medium text-stone-500 mb-1 block">字体</label>
                        <select
                          value={textStyle.fontFamily}
                          onChange={(e) => setTextStyle({...textStyle, fontFamily: e.target.value})}
                          className="w-full p-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50"
                        >
                          <option value="KaiTi">楷体</option>
                          <option value="SimSun">宋体</option>
                          <option value="Microsoft YaHei">黑体</option>
                          <option value="cursive">手写风</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* 垂直对齐控制 */}
                    <div>
                      <label className="text-xs font-medium text-stone-500 mb-1 block">垂直对齐</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTextStyle({...textStyle, verticalAlign: 'top'})}
                          className={`flex-1 py-1.5 px-3 rounded text-sm flex items-center justify-center gap-2 border transition-all
                            ${textStyle.verticalAlign === 'top' 
                              ? 'bg-amber-100 border-amber-400 text-amber-900' 
                              : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'}`}
                        >
                          <ArrowUpFromLine className="w-4 h-4" />
                          顶端对齐
                        </button>
                        <button
                          onClick={() => setTextStyle({...textStyle, verticalAlign: 'center'})}
                          className={`flex-1 py-1.5 px-3 rounded text-sm flex items-center justify-center gap-2 border transition-all
                            ${textStyle.verticalAlign === 'center' 
                              ? 'bg-amber-100 border-amber-400 text-amber-900' 
                              : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'}`}
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          垂直居中
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-stone-200 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'content')}
                    className="hidden"
                    id="content-upload"
                  />
                  <label htmlFor="content-upload" className="cursor-pointer block">
                    <FileImage className="w-6 h-6 mx-auto text-stone-400 mb-1" />
                    <span className="text-xs text-stone-500">上传手写文字照片 (可裁剪)</span>
                  </label>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-stone-100 space-y-3">
                <input
                  type="text"
                  placeholder="收件人姓名"
                  value={recipientInfo.name}
                  onChange={(e) => setRecipientInfo({...recipientInfo, name: e.target.value})}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                />
                <textarea
                  placeholder="收件地址（自动分行）"
                  value={recipientInfo.address}
                  onChange={(e) => setRecipientInfo({...recipientInfo, address: e.target.value})}
                  className="w-full h-20 p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
              <h2 className="text-lg font-bold text-amber-900 mb-4">邮资与日期</h2>
              <div className="flex gap-4">
                <div className="flex-1">
                   <div className="grid grid-cols-4 gap-2 mb-2">
                    {stampOptions.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleStampSelect(item)}
                        className={`h-12 flex items-center justify-center rounded hover:bg-amber-50 border border-transparent transition-all overflow-hidden
                          ${(item.type === 'img' && customStamp === item.src) || (item.type === 'text' && stamp === item.content) 
                            ? 'bg-amber-100 border-amber-400' 
                            : ''}`}
                      >
                        {item.type === 'img' ? (
                          <img src={item.src} alt={item.label} className="w-8 h-auto" />
                        ) : (
                          <span className="text-2xl">{item.content}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <label className="block text-xs text-center text-amber-600 cursor-pointer hover:underline">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'stamp')} />
                    上传自定义邮票
                  </label>
                </div>
                <div className="w-1/3">
                  <input
                    type="text"
                    value={postmarkDate}
                    onChange={(e) => setPostmarkDate(e.target.value)}
                    className="w-full p-2 text-center border border-stone-200 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={postmarkLocation}
                    onChange={(e) => setPostmarkLocation(e.target.value)}
                    placeholder="地点"
                    className="w-full p-2 text-center border border-stone-200 rounded-lg text-sm mt-2"
                  />
                  <div className="text-xs text-center text-stone-400 mt-1">邮戳日期/地点</div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧预览 */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
              <div className="aspect-[3/2] bg-stone-200 rounded overflow-hidden relative group">
                {frontImage ? (
                  <img src={frontImage} alt="Front" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                    <span className="text-lg font-serif">正面预览区域</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleDownload('front')}
                disabled={!frontImage || isGenerating}
                className="w-full mt-3 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> 下载正面图
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
              <div className="aspect-[3/2] bg-[#fff8dc] rounded relative overflow-hidden text-stone-800 select-none">
                <div className="absolute left-1/2 top-8 bottom-8 w-px bg-[#d4a574]"></div>

                {/* 左侧内容预览 - 支持垂直居中 */}
                <div 
                  className="absolute left-8 top-12 bottom-12 right-[52%] overflow-hidden flex flex-col"
                  style={{
                    justifyContent: textStyle.verticalAlign === 'center' ? 'center' : 'flex-start'
                  }}
                >
                  {contentMode === 'text' ? (
                    <p style={{
                      fontSize: `${textStyle.fontSize * 0.4}px`,
                      fontFamily: textStyle.fontFamily,
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap'
                    }}>{contentText || '在此处预览文字内容...'}</p>
                  ) : contentImage ? (
                    <img src={contentImage} className="w-full h-full object-cover" alt="handwriting" />
                  ) : null}
                </div>

                <div className="absolute right-0 top-0 bottom-0 left-[50%] p-8">
                  {/* 邮编框 */}
                  <div className="absolute top-8 left-8 flex gap-2">
                    {[...Array(6)].map((_,i) => (
                      <div key={i} className="w-6 h-6 border border-red-700"></div>
                    ))}
                  </div>

                  {/* 邮票 - 修改：object-contain 完整显示 */}
                  <div className="absolute top-8 right-8 w-24 h-28 bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                     {customStamp ? (
                       <img src={customStamp} className="w-full h-full object-contain p-1" alt="stamp" />
                     ) : (
                       <span className="text-4xl">{stamp}</span>
                     )}
                  </div>

                  {/* 邮戳 */}
                  <div className="absolute top-28 right-24 w-16 h-16 rounded-full border-2 border-red-800/60 flex flex-col items-center justify-center rotate-[-15deg] bg-red-50/10">
                    <span className="text-[10px] text-red-800 font-bold leading-none mb-0.5">{postmarkDate}</span>
                    <span className="text-[8px] text-red-800 font-serif uppercase tracking-tighter leading-none">
                      {postmarkLocation || 'POST OFFICE'}
                    </span>
                  </div>

                  {/* 收件人预览区域 */}
                  <div className="absolute top-32 left-8 right-8">
                    <div className="border-b border-stone-400 pb-1 mb-4 text-sm font-serif min-h-[1.5rem] flex items-end w-1/2">
                       {recipientInfo.name ? `To: ${recipientInfo.name}` : ''}
                    </div>
                    {recipientInfo.address ? (
                      recipientInfo.address.split('\n').map((line, i) => (
                        <div key={i} className="border-b border-stone-400 pb-1 mb-4 text-sm font-serif min-h-[1.5rem] flex items-end">
                          {line}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="border-b border-stone-400 h-6 mb-4"></div>
                        <div className="border-b border-stone-400 h-6 mb-4"></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-3">
                <button 
                  onClick={() => handleDownload('back')}
                  disabled={isGenerating}
                  className="flex-1 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> 下载背面
                </button>
                <button 
                  onClick={handleDownloadBoth}
                  disabled={!frontImage || isGenerating}
                  className="flex-1 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4" /> 合并下载双面
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 裁剪弹窗 */}
        {isCropping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]">
              <div className="p-4 border-b flex justify-between items-center bg-stone-50">
                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                  <ZoomIn className="w-5 h-5" />
                  裁剪图片
                </h3>
                <button onClick={() => setIsCropping(false)} className="text-stone-500 hover:text-stone-800">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="relative flex-1 bg-stone-900">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={
                    croppingTarget === 'front' ? 3 / 2 : 
                    croppingTarget === 'content' ? 650 / 840 : 
                    // 修改：邮票裁剪比例锁定为 5:6 (即 1:1.2)
                    5 / 6
                  }
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="p-6 bg-white space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-stone-600">缩放</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>
                <button
                  onClick={handleCropConfirm}
                  className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  确认裁剪
                </button>
              </div>
            </div>
          </div>
        )}

{/* 👆 上面是裁剪弹窗代码的结束括号 */}

        {/* 👇 直接在这里接上页脚代码 👇 */}
        <footer className="mt-12 text-center text-stone-400 text-xs pb-4">
          <p className="mb-1">
            🔒 隐私安全声明：本工具为纯前端应用，所有图片与文字仅在您的设备本地处理。
          </p>
          <p>
            我们不会上传或存储您的任何个人信息，刷新页面即清除数据。
          </p>
          <p className="mt-2 opacity-60">
            © {new Date().getFullYear()} Travel Postcard Generator. Made by Wingsocool.
          </p>
        </footer>

      </div> {/* max-w-7xl 结束 */}
    </div> // 最外层 div 结束
  );
}