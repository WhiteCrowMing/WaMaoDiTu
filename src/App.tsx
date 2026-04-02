import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Info, X, AlertCircle, RefreshCw, Map as MapIcon, ZoomIn, ZoomOut, Maximize, Edit3, Save, Plus, Trash2, Upload, Camera } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { regions as initialRegions, Region } from './constants';

export default function App() {
  const [regions, setRegions] = useState<Region[]>(initialRegions);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newRegionPos, setNewRegionPos] = useState<{x: number, y: number} | null>(null);
  const [editingRegion, setEditingRegion] = useState<Partial<Region> | null>(null);
  const [regionToDelete, setRegionToDelete] = useState<string | null>(null);
  const [draggingRegionId, setDraggingRegionId] = useState<string | null>(null);
  const dragHasMovedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 本地地图图片（请将图片上传至 public 文件夹并命名为 map.png）
  const MAP_URL = "/map.png";
  const FALLBACK_MAP_URL = "https://picsum.photos/seed/yunnan-map/1200/800";

  // 从 localStorage 加载保存的区域
  useEffect(() => {
    const saved = localStorage.getItem('yunnan_map_regions');
    if (saved) {
      try {
        setRegions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved regions");
      }
    }
  }, []);

  // 保存区域到 localStorage
  const saveRegions = (newRegions: Region[]) => {
    setRegions(newRegions);
    localStorage.setItem('yunnan_map_regions', JSON.stringify(newRegions));
  };

  const handleRegionClick = (region: Region) => {
    if (isEditMode) return;
    setSelectedRegion(region);
  };

  const handleBack = () => {
    setSelectedRegion(null);
  };

  const handlePointMouseDown = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setDraggingRegionId(id);
    dragHasMovedRef.current = false;
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isEditMode || !draggingRegionId) return;
    
    dragHasMovedRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(1000, ((clientX - rect.left) / rect.width) * 1000));
    const y = Math.max(0, Math.min(1000, ((clientY - rect.top) / rect.height) * 1000));
    
    setRegions(prev => prev.map(r => 
      r.id === draggingRegionId ? { ...r, center: { x, y } } : r
    ));
  };

  const handleMapMouseUp = () => {
    if (draggingRegionId) {
      setDraggingRegionId(null);
      setRegions(prev => {
        localStorage.setItem('yunnan_map_regions', JSON.stringify(prev));
        return prev;
      });
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    if (dragHasMovedRef.current) {
      dragHasMovedRef.current = false;
      return;
    }
    
    // 获取点击位置相对于地图容器的坐标 (0-1000 归一化)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;
    
    setNewRegionPos({ x, y });
    setEditingRegion({
      id: `region-${Date.now()}`,
      name: "",
      description: "",
      path: "" // 我们现在使用中心点而不是路径
    });
  };

  const handleSaveNewRegion = () => {
    if (editingRegion && editingRegion.name && newRegionPos) {
      const newRegion: Region = {
        id: editingRegion.id as string,
        name: editingRegion.name as string,
        description: editingRegion.description || "暂无详细描述",
        path: "", // 留空，使用 center 代替
        center: newRegionPos
      };
      saveRegions([...regions, newRegion]);
      setNewRegionPos(null);
      setEditingRegion(null);
    }
  };

  const handleDeleteRegion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRegionToDelete(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRegion) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1600;
        let { width, height } = img;

        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 压缩为 JPEG 以节省 localStorage 空间
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        const updatedRegion = { ...selectedRegion, imageUrl: compressedBase64 };
        setSelectedRegion(updatedRegion);
        saveRegions(regions.map(r => r.id === updatedRegion.id ? updatedRegion : r));
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f0] font-sans text-gray-900 overflow-hidden flex flex-col">
      {/* 顶部导航栏 */}
      <header className="p-4 sm:p-6 bg-white/90 backdrop-blur-md border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col"
          >
            <h1 className="text-xl sm:text-3xl font-black tracking-tighter text-gray-900 flex items-center gap-2 sm:gap-3">
              <div className="bg-red-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-red-100">
                <MapPin className="text-white w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              瓦猫地图
            </h1>
            <p className="text-gray-400 mt-1 text-[10px] sm:text-sm font-bold uppercase tracking-widest hidden sm:block">Interactive Wamao Map</p>
          </motion.div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={() => {
                setIsEditMode(!isEditMode);
                setNewRegionPos(null);
                setEditingRegion(null);
              }}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-base font-bold transition-all ${isEditMode ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isEditMode ? <Save className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" /> : <Edit3 className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
              <span className="hidden sm:inline">{isEditMode ? '退出编辑' : '编辑地图按键'}</span>
              <span className="sm:hidden">{isEditMode ? '完成' : '编辑'}</span>
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">当前状态</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${isEditMode ? 'text-red-500' : 'text-green-500'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isEditMode ? 'bg-red-500' : 'bg-green-500'}`} /> 
                {isEditMode ? '编辑模式' : '系统就绪'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-6">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full h-full max-w-[1600px] bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden border-[4px] sm:border-[8px] border-white group"
        >
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
            disabled={isEditMode} // 编辑模式下禁用拖拽，方便点击
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <div className="w-full h-full relative">
                {/* 缩放控制按钮 */}
                <div className="absolute right-6 bottom-6 z-40 flex flex-col gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-100">
                  <button onClick={() => zoomIn()} className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-700 active:scale-95" title="放大">
                    <ZoomIn size={20} />
                  </button>
                  <button onClick={() => zoomOut()} className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-700 active:scale-95" title="缩小">
                    <ZoomOut size={20} />
                  </button>
                  <button onClick={() => resetTransform()} className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-700 active:scale-95" title="重置视角">
                    <Maximize size={20} />
                  </button>
                </div>

                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
                  {/* 地图图片层 */}
                  <div 
                    className={`relative w-full h-full flex items-center justify-center bg-gray-50 ${isEditMode ? (draggingRegionId ? 'cursor-move' : 'cursor-crosshair') : ''}`}
                    onClick={handleMapClick}
                    onMouseMove={handleMapMouseMove}
                    onTouchMove={handleMapMouseMove}
                    onMouseUp={handleMapMouseUp}
                    onTouchEnd={handleMapMouseUp}
                    onMouseLeave={handleMapMouseUp}
                    onTouchCancel={handleMapMouseUp}
                  >
                    <img
                      src={imageError ? FALLBACK_MAP_URL : MAP_URL}
                      alt="云南地图"
                      className={`w-full h-full object-contain transition-all duration-1000 ${imageError ? 'opacity-50 grayscale' : ''}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                    />
                    
                    {imageError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm p-12 text-center z-20 pointer-events-none">
                        <div className="bg-white p-6 rounded-3xl shadow-xl mb-6">
                          <AlertCircle size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 mb-3">等待本地地图图片</h3>
                        <p className="max-w-md text-gray-500 font-medium leading-relaxed mb-8">
                          请将您的地图图片拖拽到左侧的文件资源管理器中，放入 <b>public</b> 文件夹并命名为 <b>map.png</b>。
                          <br/><br/>
                          上传完成后，点击下方按钮刷新即可显示本地地图。
                        </p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageError(false);
                            window.location.reload();
                          }}
                          className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95 pointer-events-auto"
                        >
                          <RefreshCw size={20} />
                          已上传，刷新地图
                        </button>
                      </div>
                    )}

                    {/* 旧版 SVG 交互层已移除，仅保留新版点位按键层 */}

                    {/* 新版点位按键层 */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-30">
                      {regions.filter(r => r.center).map((region) => (
                        <div
                          key={region.id}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${isEditMode ? 'pointer-events-auto cursor-move' : 'pointer-events-auto cursor-pointer group'}`}
                          style={{ left: `${region.center!.x / 10}%`, top: `${region.center!.y / 10}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isEditMode) handleRegionClick(region);
                          }}
                          onMouseDown={(e) => handlePointMouseDown(region.id, e)}
                          onTouchStart={(e) => handlePointMouseDown(region.id, e)}
                        >
                          <div className="relative flex items-center justify-center">
                            {/* 实体按键 (半透明白点，悬停时略微放大) */}
                            <div className="relative w-2.5 h-2.5 bg-white/30 rounded-full border border-white/40 shadow-sm group-hover:scale-125 transition-transform duration-300 backdrop-blur-sm" />

                            {/* 编辑模式下的删除按钮 */}
                            {isEditMode && (
                              <button 
                                onClick={(e) => handleDeleteRegion(region.id, e)}
                                className="absolute -top-6 -right-6 bg-white text-red-500 p-1 rounded-full shadow-md hover:bg-red-50"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* 正在添加的新点位 */}
                      {isEditMode && newRegionPos && (
                        <div
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-50"
                          style={{ left: `${newRegionPos.x / 10}%`, top: `${newRegionPos.y / 10}%` }}
                        >
                          <div className="relative flex items-center justify-center">
                            <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
                            <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
                            
                            {/* 输入弹窗 */}
                            <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 w-56 sm:w-64" onClick={e => e.stopPropagation()}>
                              <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Plus size={16} className="text-blue-500"/> 添加新区域</h4>
                              <input 
                                type="text" 
                                placeholder="区域名称 (如: 呈贡区)" 
                                className="w-full mb-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editingRegion?.name || ''}
                                onChange={e => setEditingRegion({...editingRegion, name: e.target.value})}
                                autoFocus
                              />
                              <textarea 
                                placeholder="区域描述..." 
                                className="w-full mb-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                                value={editingRegion?.description || ''}
                                onChange={e => setEditingRegion({...editingRegion, description: e.target.value})}
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={handleSaveNewRegion}
                                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                                >
                                  保存
                                </button>
                                <button 
                                  onClick={() => setNewRegionPos(null)}
                                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-200"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TransformComponent>
              </div>
            )}
          </TransformWrapper>

          {/* 引导提示 */}
          <AnimatePresence>
            {isEditMode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-8 left-8 z-20 pointer-events-none"
              >
                <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full animate-ping bg-blue-500" />
                  <span className="text-sm font-bold text-gray-700">
                    点击地图任意位置添加新的互动按键
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 详情窗口 (图片模态框) */}
        <AnimatePresence>
          {selectedRegion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col"
              onClick={handleBack}
            >
              {/* 顶部导航 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent gap-4 sm:gap-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 sm:gap-3 text-white/80 hover:text-white transition-colors group"
                >
                  <div className="p-2 sm:p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-base sm:text-lg font-bold tracking-widest">返回瓦猫地图</span>
                </button>
                <div className="text-left sm:text-center w-full sm:w-auto">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-widest">{selectedRegion.name}</h2>
                  <p className="text-white/50 text-xs sm:text-sm mt-1">{selectedRegion.description}</p>
                </div>
                <div className="hidden sm:block w-[120px]"></div> {/* 占位以居中标题 */}
              </div>

              {/* 图片展示区 */}
              <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden" onClick={e => e.stopPropagation()}>
                {selectedRegion.imageUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center group">
                    <TransformWrapper
                      initialScale={1}
                      minScale={0.5}
                      maxScale={8}
                      centerOnInit={true}
                    >
                      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img 
                          src={selectedRegion.imageUrl} 
                          alt={selectedRegion.name} 
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing"
                          draggable={false}
                        />
                      </TransformComponent>
                    </TransformWrapper>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full backdrop-blur-md transition-all sm:opacity-0 group-hover:opacity-100 shadow-xl border border-white/10 text-sm sm:text-base z-10"
                    >
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>更换图片</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full max-w-2xl aspect-video border-2 border-dashed border-white/20 rounded-2xl sm:rounded-3xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group p-4 text-center" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 sm:w-8 sm:h-8 text-white/80" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">上传区域图片</h3>
                    <p className="text-white/50 text-xs sm:text-base">点击选择本地图片，展示 {selectedRegion.name} 的风采</p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 页脚 */}
      <footer className="p-4 sm:p-8 text-center bg-white/50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 sm:gap-4">
          <div className="text-gray-400 text-[10px] sm:text-xs font-black tracking-widest uppercase">
            2024 云南大学大学生创新创业训练项目
          </div>
          <div className="flex gap-4 sm:gap-8">
            <span className="text-gray-300 text-[8px] sm:text-[10px] font-black tracking-widest uppercase">Privacy Policy</span>
            <span className="text-gray-300 text-[8px] sm:text-[10px] font-black tracking-widest uppercase">Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* 自定义删除确认弹窗 */}
      <AnimatePresence>
        {regionToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setRegionToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold text-gray-900">确认删除</h3>
              </div>
              <p className="text-gray-600 mb-6">您确定要删除这个互动区域吗？此操作无法撤销。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    saveRegions(regions.filter(r => r.id !== regionToDelete));
                    setRegionToDelete(null);
                  }}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  确定删除
                </button>
                <button
                  onClick={() => setRegionToDelete(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
