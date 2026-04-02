export interface Region {
  id: string;
  name: string;
  description: string;
  path: string; // SVG 路径数据 (归一化 0-1000)
  center?: { x: number, y: number }; // 用于点位按键的中心坐标
  imageUrl?: string; // 用户上传的图片
}

export const regions: Region[] = [];
